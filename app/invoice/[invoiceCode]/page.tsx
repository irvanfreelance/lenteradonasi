import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import InvoiceInteractive from '@/components/InvoiceInteractive';

export const revalidate = 0; // Don't cache invoice pages

async function getInvoice(invoiceCode: string) {
  // Simulation check
  if (invoiceCode.startsWith('SIM-')) {
    const isManual = invoiceCode.includes('MANUAL');
    return { 
      total_amount: Number(invoiceCode.split('-').pop()) || 0,
      va_number: isManual ? '7123456789' : '8077 0812 3456 7890',
      status: 'PENDING',
      payment_method_name: isManual ? 'Transfer Manual BSI' : 'BCA Virtual Account',
      payment_method_type: isManual ? 'manual' : 'va',
      payment_method_code: isManual ? 'BSI' : 'BCA',
      payment_url: null,
      instructions: [
        {
          title: 'Pembayaran via m-BCA',
          content: '<ol class="list-decimal pl-4 space-y-2 text-sm text-gray-600"><li>Buka aplikasi BCA Mobile dan login.</li><li>Pilih menu <strong>m-Transfer</strong> > <strong>BCA Virtual Account</strong>.</li><li>Masukkan nomor Virtual Account yang tertera di atas dan klik <strong>Send</strong>.</li></ol>'
        }
      ]
    };
  }

  // Determine table name from invoice code (INV-YYYYMMDD-...)
  let targetTable = 'invoices';
  const dateMatch = invoiceCode.match(/INV-(\d{4})(\d{2})\d{2}-/);
  if (dateMatch) {
    const suffix = `y${dateMatch[1]}m${dateMatch[2]}`;
    const tableName = `invoices_${suffix}`;
    // Check if table exists
    const tableCheck = await query(`SELECT to_regclass($1) as exists`, [`public.${tableName}`]);
    if (tableCheck[0].exists) targetTable = tableName;
  }

  const invoices = await query(`
    SELECT 
      i.id,
      i.invoice_code,
      i.base_amount,
      i.admin_fee,
      i.total_amount, 
      i.va_number, 
      i.status, 
      i.payment_url,
      i.created_at,
      pm.id as payment_method_id,
      pm.name as payment_method_name,
      pm.type as payment_method_type,
      pm.code as payment_method_code,
      pm.provider as payment_provider
    FROM "${targetTable}" i
    LEFT JOIN payment_methods pm ON i.payment_method_id = pm.id
    WHERE i.invoice_code = $1
  `, [invoiceCode]);

  
  if (invoices.length === 0) return null;
  const invoice = invoices[0];

  // Fetch instructions
  const instructions = await query(`
    SELECT title, content 
    FROM payment_instructions 
    WHERE payment_method_id = $1 
    ORDER BY sort_order ASC
  `, [invoice.payment_method_id]);

  // Determine transaction table
  let transactionTable = 'transactions';
  if (dateMatch) {
    const suffix = `y${dateMatch[1]}m${dateMatch[2]}`;
    const tableName = `transactions_${suffix}`;
    const tableCheck = await query(`SELECT to_regclass($1) as exists`, [`public.${tableName}`]);
    if (tableCheck[0].exists) transactionTable = tableName;
  }

  // Fetch line items
  const lineItems = await query(`
    SELECT t.qty, t.amount, c.title, cv.name as variant_name
    FROM "${transactionTable}" t
    JOIN campaigns c ON c.id = t.campaign_id
    LEFT JOIN campaign_variants cv ON cv.id = t.variant_id
    WHERE t.invoice_id = $1
  `, [invoice.id]);

  // Fetch NGO Configs
  const ngoConfigs = await query(`SELECT ngo_name FROM ngo_configs LIMIT 1`);
  const ngoName = ngoConfigs.length > 0 ? ngoConfigs[0].ngo_name : 'Lembaga Kami';

  return { ...invoice, instructions, lineItems, ngoName };
}


export default async function InvoicePage(props: { params: Promise<{ invoiceCode: string }> }) {
  const params = await props.params;
  const invoice = await getInvoice(params.invoiceCode);
  
  if (!invoice) notFound();

  return <InvoiceInteractive invoice={invoice} invoiceCode={params.invoiceCode} />;
}
