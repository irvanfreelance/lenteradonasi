import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendWhatsApp } from '@/lib/fonnte';
import { formatIDR } from '@/lib/utils';

/**
 * Internal API endpoint called by QStash to send WhatsApp notifications asynchronously.
 * 
 * Payload: { invoiceCode, event, targetTable }
 * - event: 'INVOICE_PENDING' | 'DONATION_SUCCESS'
 * - targetTable: the dynamic invoice table name (e.g. invoices_y2026m04)
 */
export async function POST(req: Request) {
  try {
    // Verify QStash signature (optional but recommended)
    const body = await req.json();
    const { invoiceCode, event, targetTable } = body;

    if (!invoiceCode || !event) {
      return NextResponse.json({ status: 'error', message: 'Missing invoiceCode or event' }, { status: 400 });
    }

    const table = targetTable || 'invoices';

    // 1. Fetch invoice data
    const invoices = await query(`
      SELECT 
        i.invoice_code, i.donor_name_snapshot, i.donor_phone, i.donor_email,
        i.total_amount, i.va_number, i.status,
        i.is_wa_checkout_sent, i.is_wa_paid_sent,
        pm.name as payment_method_name, pm.type as payment_method_type
      FROM "${table}" i
      LEFT JOIN payment_methods pm ON i.payment_method_id = pm.id
      WHERE i.invoice_code = $1
    `, [invoiceCode]);

    if (invoices.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // 2. Check if already sent
    if (event === 'INVOICE_PENDING' && invoice.is_wa_checkout_sent) {
      return NextResponse.json({ status: 'skipped', message: 'WA checkout already sent' });
    }
    if (event === 'DONATION_SUCCESS' && invoice.is_wa_paid_sent) {
      return NextResponse.json({ status: 'skipped', message: 'WA paid already sent' });
    }

    // 3. Determine recipient
    const recipient = invoice.donor_phone;
    if (!recipient) {
      return NextResponse.json({ status: 'skipped', message: 'No phone number available' });
    }

    // 4. Fetch template
    const eventTrigger = event === 'INVOICE_PENDING' ? 'INVOICE_PENDING' : 'DONATION_SUCCESS';
    const templates = await query(`
      SELECT id, message_content FROM notification_templates 
      WHERE event_trigger = $1 AND channel = 'WHATSAPP' AND is_active = true
    `, [eventTrigger]);

    if (templates.length === 0) {
      return NextResponse.json({ status: 'error', message: `No active template for ${eventTrigger}` }, { status: 404 });
    }

    const template = templates[0];

    // 5. Replace template variables
    let message = template.message_content;
    message = message.replace(/{nama}/g, invoice.donor_name_snapshot || 'Donatur');
    message = message.replace(/{nominal}/g, formatIDR(Number(invoice.total_amount)));
    message = message.replace(/{metode}/g, invoice.payment_method_name || '-');
    message = message.replace(/{va_number}/g, invoice.va_number || '-');

    // 6. Send via Fonnte
    const requestPayload = {
      target: recipient,
      message,
      countryCode: '62'
    };

    const fonnteResponse = await sendWhatsApp(requestPayload);

    const status = fonnteResponse.status ? 'SUCCESS' : 'FAILED';

    // 7. Log to notification_logs
    await query(`
      INSERT INTO notification_logs (template_id, invoice_code, recipient, channel, request_payload, response_payload, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      template.id,
      invoiceCode,
      recipient,
      'WHATSAPP',
      JSON.stringify(requestPayload),
      JSON.stringify(fonnteResponse),
      status
    ]);

    // 8. Update flag on invoice
    if (fonnteResponse.status) {
      const flagColumn = event === 'INVOICE_PENDING' ? 'is_wa_checkout_sent' : 'is_wa_paid_sent';
      await query(`UPDATE "${table}" SET ${flagColumn} = true WHERE invoice_code = $1`, [invoiceCode]);
    }

    return NextResponse.json({ status: 'success', detail: fonnteResponse.detail || 'sent' });

  } catch (error: any) {
    console.error('Send WA Error:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Internal Error' }, { status: 500 });
  }
}
