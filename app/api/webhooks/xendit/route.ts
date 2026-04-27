import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
import { Client } from "@upstash/workflow";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Payment Request API format: { event: 'payment.succeeded', data: { reference_id, status, ... } }
    // Legacy format: { external_id, status, ... }
    
    const event = payload.event;
    const data = payload.data || payload;
    const invoiceCode = data.reference_id || data.external_id;
    const xenditStatus = data.status;
    
    if (!invoiceCode) {
      return NextResponse.json({ message: "Invalid payload: no reference_id or external_id found" }, { status: 400 });
    }

    let newStatus = 'PENDING';
    
    // Mapping Xendit status to internal status
    if (['SUCCEEDED', 'COMPLETED', 'PAID'].includes(xenditStatus)) {
      newStatus = 'PAID';
    } else if (['FAILED', 'EXPIRED', 'CANCELED'].includes(xenditStatus)) {
      newStatus = 'FAILED';
    }

    // Determine table name from invoice code (INV-YYYYMMDD-...)
    let targetTable = 'invoices';
    const dateMatch = invoiceCode.match(/INV-(\d{4})(\d{2})\d{2}-/);
    if (dateMatch) {
      const suffix = `y${dateMatch[1]}m${dateMatch[2]}`;
      const tableName = `invoices_${suffix}`;
      const tableCheck = await query(`SELECT to_regclass($1) as exists`, [`public.${tableName}`]);
      if (tableCheck[0].exists) targetTable = tableName;
    }

    if (newStatus === 'PAID') {
      const q = `SET status = $1, paid_at = CURRENT_TIMESTAMP WHERE invoice_code = $2 AND status != 'PAID'`;
      await query(`UPDATE "${targetTable}" ${q}`, [newStatus, invoiceCode]);
      if (targetTable !== 'invoices') {
        await query(`UPDATE invoices ${q}`, [newStatus, invoiceCode]);
      }
    } else if (newStatus === 'FAILED') {
      const q = `SET status = $1 WHERE invoice_code = $2 AND status != 'PAID'`;
      await query(`UPDATE "${targetTable}" ${q}`, [newStatus, invoiceCode]);
      if (targetTable !== 'invoices') {
        await query(`UPDATE invoices ${q}`, [newStatus, invoiceCode]);
      }
    }


    // Log the payload with event info
    const responsePayload = { status: 'success' };
    await query(`
      INSERT INTO payment_logs (invoice_code, endpoint, request_payload, response_payload, http_status)
      VALUES ($1, $2, $3, $4, $5)
    `, [invoiceCode, `/api/webhooks/xendit${event ? `:${event}` : ''}`, JSON.stringify(payload), JSON.stringify(responsePayload), 200]);

    // REAL-TIME UPDATES & WORKFLOW
    if (newStatus === 'PAID') {
      try {
        // 1. Fetch details for Redis & Workflow
        const invoiceDetails = await query(`
          SELECT i.id, i.base_amount, i.total_amount, i.donor_name_snapshot, i.is_anonymous, i.doa,
                 t.campaign_id, t.affiliate_id,
                 c.slug
          FROM invoices i
          JOIN transactions t ON i.id = t.invoice_id AND i.created_at = t.invoice_created_at
          JOIN campaigns c ON t.campaign_id = c.id
          WHERE i.invoice_code = $1
          LIMIT 1
        `, [invoiceCode]);

        if (invoiceDetails.length > 0) {
          const detail = invoiceDetails[0];
          const { campaign_id, affiliate_id, base_amount, total_amount, donor_name_snapshot, is_anonymous, doa, slug } = detail;

          // 2. Immediate Redis Update (Stats)
          const statsKey = `campaign:${campaign_id}:stats`;
          await redis.hincrby(statsKey, 'collected_amount', Math.round(Number(total_amount)));
          await redis.hincrby(statsKey, 'donor_count', 1);

          // 3. Immediate Redis Update (Donor List)
          const donorListKey = `campaign:${campaign_id}:donors`;
          const donorData = JSON.stringify({
            id: detail.id,
            name: is_anonymous ? 'Hamba Allah' : donor_name_snapshot,
            amount: Number(total_amount),
            date: new Date().toISOString(),
            message: doa
          });
          await redis.lpush(donorListKey, donorData);
          await redis.ltrim(donorListKey, 0, 99); // Keep last 100

          // 4. Trigger Upstash Workflow for DB Sync (campaign stats)
          const workflowClient = new Client({ token: process.env.QSTASH_TOKEN! });
          await workflowClient.trigger({
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/workflow/payment-success`,
            body: {
              campaignId: campaign_id,
              amount: Number(total_amount),
              invoiceCode,
              slug
            },
          });

          // 5. If this transaction has an affiliate, trigger commission workflow
          if (affiliate_id) {
            await workflowClient.trigger({
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/workflow/affiliate-commission`,
              body: {
                invoiceCode,
                campaignId: campaign_id,
                affiliateId: affiliate_id,
                baseAmount: Number(base_amount),
              },
            });
          }
        }
      } catch (redisErr) {
        console.error("Redis/Workflow update error:", redisErr);
      }

      // Existing QStash logic for WA (optional, kept for compatibility)
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
              event: 'DONATION_SUCCESS',
              targetTable
            })
          });
        }
      } catch (err) {
        console.error("QStash Paid Notification trigger error:", err);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Xendit Webhook Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

