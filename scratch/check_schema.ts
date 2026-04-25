import { query } from '@/lib/db';

async function checkSchema() {
  try {
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoices'
    `);
    console.log('Invoices columns:', columns);

    const statsColumns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaign_stats'
    `);
    console.log('Campaign Stats columns:', statsColumns);

    const sampleInvoice = await query(`SELECT * FROM invoices LIMIT 1`);
    console.log('Sample Invoice:', sampleInvoice);
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
