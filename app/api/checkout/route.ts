import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
// Using generic fetch for midtrans and xendit to keep it lightweight on edge/serverless

const checkoutSchema = z.object({
  campaignId: z.number(),
  amount: z.number().min(10000),
  donorName: z.string().min(1),
  donorEmail: z.string().optional().nullable(),
  isAnonymous: z.boolean(),
  paymentMethodId: z.number(),
  paymentType: z.string(),
  qty: z.number().default(1),
  qurbanNames: z.array(z.string()).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.parse(body);

    // 1. Fetch Payment Method for admin fee calculations
    const pmResult = await query(`SELECT * FROM payment_methods WHERE id = $1`, [parsed.paymentMethodId]);
    if (pmResult.length === 0) return NextResponse.json({ status: 'error', message: 'Invalid payment method' }, { status: 400 });
    const paymentMethod = pmResult[0];

    const adminFeeFlat = Number(paymentMethod.admin_fee_flat) || 0;
    const adminFeePct = Number(paymentMethod.admin_fee_pct) || 0;
    const adminFee = adminFeeFlat + (parsed.amount * (adminFeePct / 100));
    const totalAmount = parsed.amount + adminFee;

    // 2. Decrement Stock atomically in Redis (if needed, simulating for High-traffic Qurban)
    const stockKey = `campaign_stock:${parsed.campaignId}`;
    const currentStockStr = await redis.get(stockKey);
    if (currentStockStr && Number(currentStockStr) > 0) {
      const leftover = await redis.decrby(stockKey, parsed.qty);
      if (leftover < 0) {
        // Revert since we oversold
        await redis.incrby(stockKey, parsed.qty);
        return NextResponse.json({ status: 'error', message: 'Stock exhausted for this campaign variants.' }, { status: 400 });
      }
    }

    // 3. Generate Invoice Code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    const invoiceCode = `INV-${dateStr}-${randomHex}`;

    // 4. Hit External Payment Gateways
    let paymentUrl = null;
    let externalVa = null;

    if (paymentMethod.provider === 'Midtrans') {
      // Mocking Midtrans Hit
      // In real scenario you would hit api.midtrans.com/v2/charge or use snapshot
      // Let's assume we return a mock URL for this demo phase
      paymentUrl = `https://simulator.sandbox.midtrans.com/payment/${invoiceCode}`;
    } else if (paymentMethod.provider === 'Xendit') {
      // Mocking Xendit Hit
      externalVa = '8077' + Math.floor(Math.random() * 10000000000).toString();
      paymentUrl = null;
    }

    // 5. Insert to DB (Note: In pure production, use transaction BEGIN; COMMIT;)
    // We insert `invoice` then `transaction`
    const insertInvoice = await query(`
      INSERT INTO invoices (
        invoice_code, payment_method_id, donor_name_snapshot, donor_email, is_anonymous, 
        base_amount, admin_fee, total_amount, status, payment_url, va_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, created_at
    `, [
      invoiceCode, parsed.paymentMethodId, parsed.donorName, parsed.donorEmail || null, parsed.isAnonymous,
      parsed.amount, adminFee, totalAmount, 'PENDING', paymentUrl, externalVa
    ]);

    const invoiceId = insertInvoice[0].id;
    const invoiceCreatedAt = insertInvoice[0].created_at;

    const insertTransaction = await query(`
      INSERT INTO transactions (
        invoice_id, invoice_created_at, campaign_id, qty, amount
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [invoiceId, invoiceCreatedAt, parsed.campaignId, parsed.qty, parsed.amount]);

    const transactionId = insertTransaction[0].id;

    // Optional: Insert Qurban Names
    if (parsed.qurbanNames && parsed.qurbanNames.length > 0) {
      for (const name of parsed.qurbanNames) {
        if (name.trim()) {
          await query(`
            INSERT INTO transaction_qurban_names (transaction_id, transaction_created_at, mudhohi_name)
            VALUES ($1, $2, $3)
          `, [transactionId, invoiceCreatedAt, name.trim()]);
        }
      }
    }

    // Return exact format from PRD
    return NextResponse.json({
      status: 'success',
      message: 'Checkout initialized',
      data: {
        invoice_code: invoiceCode,
        payment_url: paymentUrl,
        va_number: externalVa
      }
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Internal Server Error',
      data: null
    }, { status: 500 });
  }
}
