import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    // Trigger QStash for WhatsApp Paid Notification
    if (newStatus === 'PAID') {
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

