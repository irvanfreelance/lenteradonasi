import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import InvoiceInteractive from '@/components/InvoiceInteractive';

export const revalidate = 0; // Don't cache invoice pages

async function getInvoice(invoiceCode: string) {
  // Simualtion check
  if (invoiceCode.startsWith('SIM-')) {
    const isManual = invoiceCode.includes('MANUAL');
    return { 
      total_amount: Number(invoiceCode.split('-').pop()) || 0,
      va_number: isManual ? '7123456789' : '8077 0812 3456 7890',
      status: 'PENDING',
      payment_method_name: isManual ? 'Transfer Manual BSI' : 'BCA Virtual Account',
      instructions: [
        {
          title: 'Pembayaran via m-BCA',
          content: '<ol class="list-decimal pl-4 space-y-2 text-sm text-gray-600"><li>Buka aplikasi BCA Mobile dan login.</li><li>Pilih menu <strong>m-Transfer</strong> > <strong>BCA Virtual Account</strong>.</li><li>Masukkan nomor Virtual Account yang tertera di atas dan klik <strong>Send</strong>.</li></ol>'
        },
        isManual ? {
          title: 'Transfer ATM / M-Banking',
          content: '<ol class="list-decimal pl-4 space-y-2 text-sm text-gray-600"><li>Buka aplikasi BSI Mobile / Datangi ATM.</li><li>Pilih <strong>Transfer</strong> > <strong>Antar BSI</strong>.</li><li>Masukkan rekening: <strong>7123456789</strong>.</li><li>Pastikan a/n Yayasan Peduli Sesama.</li><li>Selesaikan dan simpan resi / screenshot.</li></ol>'
        } : {
          title: 'Pembayaran via ATM BCA',
          content: '<ol class="list-decimal pl-4 space-y-2 text-sm text-gray-600"><li>Masukkan kartu ATM dan PIN Anda.</li><li>Pilih menu <strong>Transaksi Lainnya</strong> > <strong>Transfer</strong> > <strong>Ke Rek BCA Virtual Account</strong>.</li></ol>'
        }
      ]
    };
  }

  const invoices = await query(`
    SELECT i.total_amount, i.va_number, i.status, pm.name as payment_method_name 
    FROM invoices i
    LEFT JOIN payment_methods pm ON i.payment_method_id = pm.id
    WHERE i.invoice_code = $1
  `, [invoiceCode]);
  
  if (invoices.length === 0) return null;
  const invoice = invoices[0];

  return { ...invoice, instructions: [] };
}

export default async function InvoicePage(props: { params: Promise<{ invoiceCode: string }> }) {
  const params = await props.params;
  const invoice = await getInvoice(params.invoiceCode);
  
  if (!invoice) notFound();

  return <InvoiceInteractive invoice={invoice} invoiceCode={params.invoiceCode} />;
}
