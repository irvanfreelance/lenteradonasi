import { query } from './db';

export async function getActivePaymentMethods() {
  const pm = await query(`
    SELECT * FROM payment_methods WHERE is_active = true ORDER BY sort_order ASC, id ASC
  `);
  return pm;
}
