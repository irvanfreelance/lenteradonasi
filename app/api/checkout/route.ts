import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
// Using generic fetch for midtrans and xendit to keep it lightweight on edge/serverless

import { createXenditPaymentRequest, XenditPaymentType } from '@/lib/xendit';

const checkoutSchema = z.object({
  campaignId: z.coerce.number(),
  amount: z.coerce.number().min(10000),
  donorName: z.string().min(1),
  donorEmail: z.string().optional().nullable(),
  donorPhone: z.string().optional().nullable(),
  isAnonymous: z.boolean(),
  doa: z.string().optional().nullable(),
  paymentMethodId: z.coerce.number(),
  paymentType: z.string(),
  qty: z.coerce.number().default(1),
  qurbanNames: z.array(z.string()).optional(),
  affiliateId: z.coerce.number().optional().nullable(),
  fbClickId: z.string().optional().nullable(),
  fbBrowserId: z.string().optional().nullable(),
  tiktokClickId: z.string().optional().nullable(),
  googleClickId: z.string().optional().nullable()
});


async function ensureMonthlyTables(suffix: string) {
  const invoiceTable = `invoices_${suffix}`;
  const transactionTable = `transactions_${suffix}`;
  const qurbanTable = `transaction_qurban_names_${suffix}`;

  // Check if invoice table exists
  const tableCheck = await query(`SELECT to_regclass($1) as exists`, [`public.${invoiceTable}`]);
  if (!tableCheck[0].exists) {
    console.log(`Creating dynamic tables for ${suffix}...`);
    
    // Create Invoices Partition-like table
    await query(`CREATE TABLE IF NOT EXISTS "public"."${invoiceTable}" (LIKE invoices INCLUDING ALL)`);
    
    // Create Transactions Partition-like table
    await query(`CREATE TABLE IF NOT EXISTS "public"."${transactionTable}" (LIKE transactions INCLUDING ALL)`);
    
    // Create Qurban Partition-like table
    await query(`CREATE TABLE IF NOT EXISTS "public"."${qurbanTable}" (LIKE transaction_qurban_names INCLUDING ALL)`);

    // Add Notification Flags & Fix Constraints
    try {
      await query(`
        ALTER TABLE "${invoiceTable}"
        ADD COLUMN IF NOT EXISTS "is_wa_checkout_sent" bool DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_wa_paid_sent" bool DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_email_checkout_sent" bool DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_email_paid_sent" bool DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_ads_sent" bool DEFAULT false;
      `);

      await query(`ALTER TABLE "${transactionTable}" DROP CONSTRAINT IF EXISTS "transactions_invoice_id_invoice_created_at_fkey"`);
      await query(`ALTER TABLE "${transactionTable}" ADD CONSTRAINT "${transactionTable}_invoice_fk" 
                   FOREIGN KEY (invoice_id, invoice_created_at) REFERENCES "${invoiceTable}"(id, created_at) ON DELETE CASCADE`);
      
      await query(`ALTER TABLE "${qurbanTable}" DROP CONSTRAINT IF EXISTS "transaction_qurban_names_transaction_id_transaction_creat_fkey1"`);
      await query(`ALTER TABLE "${qurbanTable}" ADD CONSTRAINT "${qurbanTable}_transaction_fk" 
                   FOREIGN KEY (transaction_id, transaction_created_at) REFERENCES "${transactionTable}"(id, created_at) ON DELETE CASCADE`);
    } catch (e) {
      console.error("Error setting up dynamic tables:", e);
    }
  }

  return { invoiceTable, transactionTable, qurbanTable };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.parse(body);

    const clientIpAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';
    const clientUserAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Prepare Dynamic Tables + Fetch Payment Method in parallel
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const suffix = `y${year}m${month}`;

    const [{ invoiceTable, transactionTable, qurbanTable }, pmResult] = await Promise.all([
      ensureMonthlyTables(suffix),
      query(`SELECT * FROM payment_methods WHERE id = $1`, [parsed.paymentMethodId]),
    ]);

    if (pmResult.length === 0) return NextResponse.json({ status: 'error', message: 'Invalid payment method' }, { status: 400 });
    const paymentMethod = pmResult[0];

    const adminFeeFlat = Number(paymentMethod.admin_fee_flat) || 0;
    const adminFeePct = Number(paymentMethod.admin_fee_pct) || 0;
    const adminFee = adminFeeFlat + (parsed.amount * (adminFeePct / 100));
    let totalAmount = parsed.amount + adminFee;

    let uniqueCode = 0;
    if (paymentMethod.type === 'manual' || paymentMethod.type === 'manual_transfer') {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 20) {
        uniqueCode = Math.floor(100 + Math.random() * 900); // 100 to 999
        const potentialTotal = totalAmount + uniqueCode;
        
        // Check uniqueness for today
        const checkResult = await query(`
          SELECT id FROM invoices 
          WHERE payment_method_id = $1 
          AND total_amount = $2 
          AND status = 'PENDING' 
          AND created_at::date = CURRENT_DATE
          LIMIT 1
        `, [paymentMethod.id, potentialTotal]);
        
        if (checkResult.length === 0) {
          isUnique = true;
          totalAmount = potentialTotal; // Apply unique code to total amount
        }
        attempts++;
      }
    }

    // 3. Generate Invoice Code
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    const invoiceCode = `INV-${dateStr}-${randomHex}`;

    // Extract Donor Information
    const phone = parsed.donorPhone?.trim() || null;
    const email = parsed.donorEmail?.trim() || null;
    const name = parsed.donorName.trim() || (parsed.isAnonymous ? 'Hamba Allah' : 'Anonim');
    const isAnonymousDefault = parsed.isAnonymous;

    // 4. Hit External Payment Gateways
    let paymentUrl = null;
    let externalVa = null;
    let xenditPaymentRequestId = null;
    let xenditResponseData = null;

    if (paymentMethod.provider === 'xendit') {
      let xenditType: XenditPaymentType = 'VIRTUAL_ACCOUNT';
      if (paymentMethod.type === 'e_wallet') xenditType = 'EWALLET';
      else if (paymentMethod.type === 'retail_outlet') xenditType = 'OVER_THE_COUNTER';
      else if (paymentMethod.type === 'qr_code') xenditType = 'QR_CODE';

      xenditResponseData = await createXenditPaymentRequest({
        externalId: invoiceCode,
        amount: Math.round(totalAmount),
        currency: 'IDR',
        type: xenditType,
        channelCode: paymentMethod.code,
        customerName: name,
        customerEmail: email || undefined,
        customerPhone: phone || undefined,
        successReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${invoiceCode}`
      });

      xenditPaymentRequestId = xenditResponseData.id;

      if (xenditType === 'VIRTUAL_ACCOUNT') {
        externalVa = xenditResponseData.payment_method.virtual_account.channel_properties.virtual_account_number;
      } else if (xenditType === 'EWALLET') {
        const action = xenditResponseData.actions.find((a: any) => a.url_type === 'DEEPLINK' || a.action === 'AUTH');
        paymentUrl = action?.url || null;
      } else if (xenditType === 'OVER_THE_COUNTER') {
        externalVa = xenditResponseData.payment_method.over_the_counter.channel_properties.payment_code;
      } else if (xenditType === 'QR_CODE') {
        paymentUrl = JSON.stringify({
          qr_string: xenditResponseData.payment_method.qr_code.channel_properties.qr_string,
          type: 'qr_code'
        });
      }
    }

    // 5. Donor Management (Upsert) — parallel phone + email lookups
    let donorId = null;

    if (phone || email) {
      try {
        let existingDonor: any[] = [];

        if (phone && email) {
          // Lookup both in parallel, take first match
          const [byPhone, byEmail] = await Promise.all([
            query(`SELECT id FROM donors WHERE phone = $1 LIMIT 1`, [phone]),
            query(`SELECT id FROM donors WHERE email = $1 LIMIT 1`, [email]),
          ]);
          existingDonor = byPhone.length > 0 ? byPhone : byEmail;
        } else if (phone) {
          existingDonor = await query(`SELECT id FROM donors WHERE phone = $1 LIMIT 1`, [phone]);
        } else if (email) {
          existingDonor = await query(`SELECT id FROM donors WHERE email = $1 LIMIT 1`, [email]);
        }

        if (existingDonor.length > 0) {
          donorId = existingDonor[0].id;
          // Fire-and-forget donor update — don't block invoice creation
          query(`UPDATE donors SET name = $1, is_anonymous_default = $2 WHERE id = $3`, [name, isAnonymousDefault, donorId]).catch(console.error);
        } else {
          const newDonor = await query(`
            INSERT INTO donors (name, email, phone, is_anonymous_default)
            VALUES ($1, $2, $3, $4) RETURNING id
          `, [name, email, phone, isAnonymousDefault]);
          donorId = newDonor[0].id;
        }
      } catch (err) {
        console.error("Donor upsert error:", err);
      }
    }

    // 6. Insert to Main DB Tables first to generate ID
    const insertInvoice = await query(`
      INSERT INTO invoices (
        invoice_code, payment_method_id, donor_id, donor_name_snapshot, donor_email, donor_phone, is_anonymous, doa,
        base_amount, admin_fee, total_amount, status, payment_url, va_number,
        xendit_payment_request_id,
        fb_click_id, fb_browser_id, tiktok_click_id, google_click_id, client_ip_address, client_user_agent,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id, created_at
    `, [
      invoiceCode, parsed.paymentMethodId, donorId, name, email, phone, parsed.isAnonymous, parsed.doa || null,
      parsed.amount, adminFee, totalAmount, 'PENDING', paymentUrl, externalVa,
      xenditPaymentRequestId,
      parsed.fbClickId || null, parsed.fbBrowserId || null, parsed.tiktokClickId || null, parsed.googleClickId || null, clientIpAddress, clientUserAgent,
      now
    ]);

    const invoiceId = insertInvoice[0].id;
    const invoiceCreatedAt = insertInvoice[0].created_at;

    // Duplicate to Partition Table
    await query(`
      INSERT INTO "${invoiceTable}" (
        id, invoice_code, payment_method_id, donor_id, donor_name_snapshot, donor_email, donor_phone, is_anonymous, doa,
        base_amount, admin_fee, total_amount, status, payment_url, va_number,
        xendit_payment_request_id,
        fb_click_id, fb_browser_id, tiktok_click_id, google_click_id, client_ip_address, client_user_agent,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `, [
      invoiceId, invoiceCode, parsed.paymentMethodId, donorId, name, email, phone, parsed.isAnonymous, parsed.doa || null,
      parsed.amount, adminFee, totalAmount, 'PENDING', paymentUrl, externalVa,
      xenditPaymentRequestId,
      parsed.fbClickId || null, parsed.fbBrowserId || null, parsed.tiktokClickId || null, parsed.googleClickId || null, clientIpAddress, clientUserAgent,
      invoiceCreatedAt
    ]);

    // Check if campaign is bundle
    const campaignResult = await query(`SELECT is_bundle FROM campaigns WHERE id = $1`, [parsed.campaignId]);
    const isBundle = campaignResult.length > 0 ? campaignResult[0].is_bundle : false;

    let transactionIdToUse = null;

    if (isBundle) {
      // Fetch bundle items
      const bundleItems = await query(`
        SELECT cb.item_campaign_id, cb.qty, COALESCE(cv.price, c.minimum_amount, 0) as unit_price
        FROM campaign_bundles cb
        JOIN campaigns c ON c.id = cb.item_campaign_id
        LEFT JOIN campaign_variants cv ON cv.campaign_id = c.id AND cv.is_active = true
        WHERE cb.bundle_campaign_id = $1
      `, [parsed.campaignId]);

      let totalCalculatedValue = 0;
      bundleItems.forEach((item: any) => {
        totalCalculatedValue += (item.qty * item.unit_price);
      });

      let remainingAmount = parsed.amount;

      for (let i = 0; i < bundleItems.length; i++) {
        const item = bundleItems[i];
        const itemQty = item.qty * parsed.qty;
        
        // Calculate apportioned amount
        let itemAmount = 0;
        if (i === bundleItems.length - 1) {
          itemAmount = remainingAmount;
        } else {
          itemAmount = Math.floor(parsed.amount * ((item.qty * item.unit_price) / (totalCalculatedValue || 1)));
          remainingAmount -= itemAmount;
        }

        const insertTransaction = await query(`
          INSERT INTO transactions (
            invoice_id, invoice_created_at, campaign_id, bundle_campaign_id, affiliate_id, qty, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [invoiceId, invoiceCreatedAt, item.item_campaign_id, parsed.campaignId, parsed.affiliateId || null, itemQty, itemAmount, now]);

        const transactionId = insertTransaction[0].id;
        if (i === 0) transactionIdToUse = transactionId;

        // Duplicate to Partition Table
        await query(`
          INSERT INTO "${transactionTable}" (
            id, invoice_id, invoice_created_at, campaign_id, bundle_campaign_id, affiliate_id, qty, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [transactionId, invoiceId, invoiceCreatedAt, item.item_campaign_id, parsed.campaignId, parsed.affiliateId || null, itemQty, itemAmount, now]);
      }
    } else {
      const insertTransaction = await query(`
        INSERT INTO transactions (
          invoice_id, invoice_created_at, campaign_id, affiliate_id, qty, amount, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [invoiceId, invoiceCreatedAt, parsed.campaignId, parsed.affiliateId || null, parsed.qty, parsed.amount, now]);

      transactionIdToUse = insertTransaction[0].id;

      // Duplicate to Partition Table
      await query(`
        INSERT INTO "${transactionTable}" (
          id, invoice_id, invoice_created_at, campaign_id, affiliate_id, qty, amount, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [transactionIdToUse, invoiceId, invoiceCreatedAt, parsed.campaignId, parsed.affiliateId || null, parsed.qty, parsed.amount, now]);
    }

    // Optional: Insert Qurban Names
    if (parsed.qurbanNames && parsed.qurbanNames.length > 0 && transactionIdToUse) {
      for (const qName of parsed.qurbanNames) {
        if (qName.trim()) {
          const insertQurban = await query(`
            INSERT INTO transaction_qurban_names (transaction_id, transaction_created_at, mudhohi_name, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [transactionIdToUse, invoiceCreatedAt, qName.trim(), now]);
          
          await query(`
            INSERT INTO "${qurbanTable}" (id, transaction_id, transaction_created_at, mudhohi_name, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [insertQurban[0].id, transactionIdToUse, invoiceCreatedAt, qName.trim(), now]);
        }
      }
    }

    // 7. Trigger QStash for WhatsApp Notification (Async)
    if (parsed.donorPhone && ['va', 'retail_outlet', 'manual'].includes(paymentMethod.type)) {
      try {
        const qstashUrl = process.env.QSTASH_URL;
        const qstashToken = process.env.QSTASH_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (qstashUrl && qstashToken && baseUrl) {
          await fetch(`${qstashUrl}/v2/publish/${baseUrl}/api/notifications/send-wa`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${qstashToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              invoiceCode,
              event: 'INVOICE_PENDING',
              targetTable: invoiceTable
            })
          });
        }
      } catch (err) {
        console.error("QStash trigger error:", err);
      }
    }

    const finalResponse = {
      status: 'success',
      message: 'Checkout initialized',
      data: {
        invoice_code: invoiceCode,
        payment_url: paymentUrl,
        va_number: externalVa
      }
    };

    // 8. Log the entire process asynchronously
    query(`
      INSERT INTO payment_logs (invoice_code, endpoint, request_payload, response_payload, http_status)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      invoiceCode, 
      '/api/checkout', 
      JSON.stringify(parsed), 
      JSON.stringify({ payment_gateway_response: xenditResponseData, client_response: finalResponse }), 
      200
    ]).catch(err => console.error("Async payment_logs insert error:", err));

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      data: null
    }, { status: 500 });
  }
}


