import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Standard Xendit payload format
    // VA: { external_id, status: 'COMPLETED' }
    // E-Wallet: { reference_id, data: { status: 'SUCCEEDED' } }
    
    const invoiceCode = payload.external_id || payload.data?.reference_id;
    const status = payload.status || payload.data?.status;
    
    if (!invoiceCode) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    let newStatus = 'PENDING';
    if (['COMPLETED', 'SUCCEEDED', 'PAID'].includes(status)) {
      newStatus = 'PAID';
    } else if (['FAILED', 'EXPIRED'].includes(status)) {
      newStatus = 'FAILED';
    }

    if (newStatus === 'PAID') {
      await query(`
        UPDATE invoices 
        SET status = $1, paid_at = CURRENT_TIMESTAMP 
        WHERE invoice_code = $2 AND status != 'PAID'
      `, [newStatus, invoiceCode]);
    } else {
       await query(`
        UPDATE invoices 
        SET status = $1
        WHERE invoice_code = $2 AND status != 'PAID'
      `, [newStatus, invoiceCode]);
    }

    // Log the payload
    await query(`
      INSERT INTO payment_logs (invoice_code, endpoint, request_payload, http_status)
      VALUES ($1, $2, $3, $4)
    `, [invoiceCode, '/api/webhooks/xendit', JSON.stringify(payload), 200]);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Xendit Webhook Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
