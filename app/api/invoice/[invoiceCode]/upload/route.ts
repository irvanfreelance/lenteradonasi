import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request, props: { params: Promise<{ invoiceCode: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { proofUrl } = body;

    if (!proofUrl) {
      return NextResponse.json({ error: 'Missing proofUrl' }, { status: 400 });
    }

    // Only update if it's SIM- or a real TRX-
    if (!params.invoiceCode.startsWith('SIM-')) {
      const invoices = await query(`
        UPDATE invoices
        SET proof_transfer = $1
        WHERE invoice_code = $2
        RETURNING id
      `, [proofUrl, params.invoiceCode]);

      if (invoices.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, url: proofUrl });
  } catch (error: any) {
    console.error('Invoice Proof Update Error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
