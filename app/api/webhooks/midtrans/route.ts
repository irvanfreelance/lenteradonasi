import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Standard Midtrans payload format extraction
    const { order_id, transaction_status } = payload;
    
    if (!order_id) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Determine status
    let newStatus = 'PENDING';
    if (['capture', 'settlement'].includes(transaction_status)) {
      newStatus = 'PAID';
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
      newStatus = 'FAILED';
    }

    if (newStatus === 'PAID') {
      await query(`
        UPDATE invoices 
        SET status = $1, paid_at = CURRENT_TIMESTAMP 
        WHERE invoice_code = $2 AND status != 'PAID'
      `, [newStatus, order_id]);
    } else {
      await query(`
        UPDATE invoices 
        SET status = $1
        WHERE invoice_code = $2 AND status != 'PAID'
      `, [newStatus, order_id]);
    }

    // Log the payload
    try {
      await query(`
        INSERT INTO payment_logs (invoice_code, endpoint, request_payload, http_status)
        VALUES ($1, $2, $3, $4)
      `, [order_id, '/api/webhooks/midtrans', JSON.stringify(payload), 200]);
    } catch (err: any) {
      console.error("payment_logs insert error:", err);
      if (err.code === '23505' && err.constraint === 'payment_logs_pkey') {
        query(`SELECT setval('payment_logs_id_seq', (SELECT MAX(id) FROM payment_logs))`).catch(() => {});
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Midtrans Webhook Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
