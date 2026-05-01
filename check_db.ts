import { query } from './lib/db';

async function main() {
  try {
    const partitions = await query(`
      SELECT
          nmsp_parent.nspname AS parent_schema,
          parent.relname      AS parent_table,
          nmsp_child.nspname  AS child_schema,
          child.relname       AS child_table
      FROM pg_inherits
          JOIN pg_class parent            ON pg_inherits.inhparent = parent.oid
          JOIN pg_class child             ON pg_inherits.inhrelid   = child.oid
          JOIN pg_namespace nmsp_parent   ON nmsp_parent.oid  = parent.relnamespace
          JOIN pg_namespace nmsp_child    ON nmsp_child.oid   = child.relnamespace
      WHERE parent.relname = 'invoices';
    `);
    console.log('Partitions of invoices:', JSON.stringify(partitions, null, 2));

    const donorSeq = await query(`
      SELECT last_value, is_called FROM donors_id_seq;
    `).catch(() => 'No sequence found');
    console.log('Donor sequence status:', JSON.stringify(donorSeq, null, 2));

    const donorCount = await query(`SELECT count(*) FROM donors`);
    console.log('Donor count:', donorCount[0].count);
    
    const sampleDonor = await query(`SELECT id FROM donors LIMIT 5`);
    console.log('Sample donor IDs:', JSON.stringify(sampleDonor, null, 2));

  } catch (e) {
    console.error(e);
  }
}

main();
