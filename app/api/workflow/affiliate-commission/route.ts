import { serve } from "@upstash/workflow/nextjs";
import { query } from "@/lib/db";

/**
 * Upstash Workflow: Affiliate Commission
 *
 * Triggered by the Xendit (or any payment gateway) webhook AFTER a payment is
 * confirmed as PAID.  It does two things atomically:
 *
 * 1. Calculates the commission for the affiliate based on `affiliate_commissions`
 *    rules (PERCENTAGE or AMOUNT) and writes it to `transactions.affiliate_commission`.
 *
 * 2. Refreshes `affiliate_campaign_stats` with up-to-date aggregates pulled
 *    straight from the DB (sum of paid invoices joined with transactions where
 *    affiliate_id IS NOT NULL).  This keeps the stats table always consistent
 *    with the source of truth.
 */
export const { POST } = serve<{
  invoiceCode: string;
  campaignId: number;
  affiliateId: number;
  baseAmount: number; // the donation base_amount (pre-admin-fee)
}>(async (context) => {
  const { invoiceCode, campaignId, affiliateId, baseAmount } = context.requestPayload;

  // ─── Step 1: Calculate & write affiliate_commission on transactions ─────────
  await context.run("write-affiliate-commission", async () => {
    // Look up the commission rule for this affiliate + campaign
    const commRows = await query(
      `SELECT commission_type, commission_value
       FROM affiliate_commissions
       WHERE affiliate_id = $1 AND campaign_id = $2
       LIMIT 1`,
      [affiliateId, campaignId]
    );

    let commissionAmount = 0;

    if (commRows.length > 0) {
      const { commission_type, commission_value } = commRows[0];
      const value = Number(commission_value);

      if (commission_type === "PERCENTAGE") {
        commissionAmount = Math.floor(baseAmount * (value / 100));
      } else if (commission_type === "AMOUNT") {
        commissionAmount = Math.floor(value);
      }
    }

    if (commissionAmount > 0) {
      // Update transactions — both main and any matching partition table
      const dateMatch = invoiceCode.match(/INV-(\d{4})(\d{2})\d{2}-/);
      const suffix = dateMatch ? `y${dateMatch[1]}m${dateMatch[2]}` : null;

      await query(
        `UPDATE transactions
         SET affiliate_commission = $1
         WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_code = $2 LIMIT 1)
           AND affiliate_id = $3`,
        [commissionAmount, invoiceCode, affiliateId]
      );

      if (suffix) {
        const partitionTable = `transactions_${suffix}`;
        const tableCheck = await query(
          `SELECT to_regclass($1) as exists`,
          [`public.${partitionTable}`]
        );
        if (tableCheck[0].exists) {
          await query(
            `UPDATE "${partitionTable}"
             SET affiliate_commission = $1
             WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_code = $2 LIMIT 1)
               AND affiliate_id = $3`,
            [commissionAmount, invoiceCode, affiliateId]
          );
        }
      }

      // Add commission to affiliate balance
      await query(
        `UPDATE affiliates SET balance = balance + $1 WHERE id = $2`,
        [commissionAmount, affiliateId]
      );
    }
  });

  // ─── Step 2: Refresh affiliate_campaign_stats (converted_donors + raised_amount) ─
  await context.run("refresh-affiliate-stats", async () => {
    /**
     * Aggregate query:
     *   - Join invoices (status = PAID) with transactions where affiliate_id = X and campaign_id = Y
     *   - SUM base_amount (not total_amount, we credit pre-fee donation)
     *   - COUNT distinct invoices = converted_donors
     *
     * We intentionally keep click_count untouched (as instructed — only
     * converted_donors and raised_amount are managed here).
     */
    const statsRows = await query(
      `SELECT
         COUNT(DISTINCT i.id)::int              AS converted_donors,
         COALESCE(SUM(i.base_amount), 0)::bigint AS raised_amount,
         COALESCE(SUM(t.affiliate_commission), 0)::bigint AS commission_earned
       FROM invoices i
       JOIN transactions t
         ON t.invoice_id = i.id
        AND t.invoice_created_at = i.created_at
       WHERE i.status = 'PAID'
         AND t.affiliate_id = $1
         AND t.campaign_id = $2`,
      [affiliateId, campaignId]
    );

    const { converted_donors, raised_amount, commission_earned } = statsRows[0];

    // Upsert into affiliate_campaign_stats
    await query(
      `INSERT INTO affiliate_campaign_stats
         (affiliate_id, campaign_id, converted_donors, raised_amount, commission_earned, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (affiliate_id, campaign_id)
       DO UPDATE SET
         converted_donors   = EXCLUDED.converted_donors,
         raised_amount      = EXCLUDED.raised_amount,
         commission_earned  = EXCLUDED.commission_earned,
         updated_at         = CURRENT_TIMESTAMP`,
      [affiliateId, campaignId, converted_donors, raised_amount, commission_earned]
    );
  });
});
