import { serve } from "@upstash/workflow/nextjs";
import { query } from "@/lib/db";

/**
 * Upstash Workflow: Affiliate Commission
 *
 * Triggered by the Xendit webhook AFTER a payment is confirmed as PAID.
 *
 * Step 1 — write-affiliate-commission
 *   • Looks up the commission rule in affiliate_commissions
 *   • Calculates the commission amount (PERCENTAGE or flat AMOUNT)
 *   • Writes affiliate_commission to every matching transactions row
 *     (uses the invoice composite PK so it works with native partitions)
 *   • Credits the affiliate balance
 *
 * Step 2 — refresh-affiliate-stats
 *   • Re-aggregates converted_donors, raised_amount, commission_earned
 *     from the DB (source of truth — always accurate after step 1)
 *   • Upserts into affiliate_campaign_stats
 */
export const { POST } = serve<{
  invoiceCode: string;
  campaignId: number;
  affiliateId: number;
  baseAmount: number; // donation base_amount (pre-admin-fee)
  invoiceId: number;
  invoiceCreatedAt: string; // ISO string — used as partition key for UPDATE
}>(async (context) => {
  const { invoiceCode, campaignId, affiliateId, baseAmount, invoiceId, invoiceCreatedAt } =
    context.requestPayload;

  // ─── Step 1: Calculate & write affiliate_commission ──────────────────────────
  await context.run("write-affiliate-commission", async () => {
    // Look up the commission rule
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

    if (commissionAmount <= 0) return; // no rule configured — nothing to do

    // Use the composite PK (invoice_id + invoice_created_at) so the UPDATE
    // hits the exact partition row. With native partitioning, Postgres routes
    // the UPDATE to the correct child table automatically.
    await query(
      `UPDATE transactions
         SET affiliate_commission = $1
       WHERE invoice_id = $2
         AND invoice_created_at = $3
         AND affiliate_id = $4`,
      [commissionAmount, invoiceId, invoiceCreatedAt, affiliateId]
    );

    // Credit affiliate balance atomically
    await query(
      `UPDATE affiliates SET balance = balance + $1 WHERE id = $2`,
      [commissionAmount, affiliateId]
    );
  });

  // ─── Step 2: Re-aggregate affiliate_campaign_stats ───────────────────────────
  await context.run("refresh-affiliate-stats", async () => {
    // Sum all PAID invoices for this affiliate × campaign.
    // We query the parent partitioned tables — Postgres will fan-out to all
    // relevant child partitions automatically.
    const statsRows = await query(
      `SELECT
         COUNT(DISTINCT i.id)::int               AS converted_donors,
         COALESCE(SUM(i.base_amount), 0)::bigint  AS raised_amount,
         COALESCE(SUM(t.affiliate_commission), 0)::bigint AS commission_earned
       FROM invoices i
       JOIN transactions t
         ON t.invoice_id         = i.id
        AND t.invoice_created_at = i.created_at
       WHERE i.status        = 'PAID'
         AND t.affiliate_id  = $1
         AND t.campaign_id   = $2`,
      [affiliateId, campaignId]
    );

    const { converted_donors, raised_amount, commission_earned } = statsRows[0];

    // Upsert — always overwrite with fresh aggregates
    await query(
      `INSERT INTO affiliate_campaign_stats
         (affiliate_id, campaign_id, converted_donors, raised_amount, commission_earned, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (affiliate_id, campaign_id)
       DO UPDATE SET
         converted_donors  = EXCLUDED.converted_donors,
         raised_amount     = EXCLUDED.raised_amount,
         commission_earned = EXCLUDED.commission_earned,
         updated_at        = CURRENT_TIMESTAMP`,
      [affiliateId, campaignId, converted_donors, raised_amount, commission_earned]
    );
  });
});
