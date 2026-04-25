import { serve } from "@upstash/workflow/nextjs";
import { query } from "@/lib/db";
import { redis } from "@/lib/redis";

export const { POST } = serve<{
  campaignId: number;
  amount: number;
  invoiceCode: string;
  slug: string;
}>(async (context) => {
  const { campaignId, amount, invoiceCode, slug } = context.requestPayload;

  // Step 1: Update PostgreSQL Database
  await context.run("update-db-stats", async () => {
    // Check if stats row exists first (upsert pattern)
    const stats = await query(`SELECT campaign_id FROM campaign_stats WHERE campaign_id = $1`, [campaignId]);
    
    if (stats.length === 0) {
      await query(`
        INSERT INTO campaign_stats (campaign_id, collected_amount, donor_count, updated_at)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
      `, [campaignId, amount]);
    } else {
      await query(`
        UPDATE campaign_stats 
        SET 
          collected_amount = collected_amount + $1, 
          donor_count = donor_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $2
      `, [amount, campaignId]);
    }
  });

  // Step 2: Ensure Redis Stats are in sync with DB (optional safety)
  // Since we already did HINCRBY in the webhook, we are mostly in sync.
  // But we can periodically refresh Redis from DB if needed.
  // For now, let's just clear the main campaign detail cache to be safe.
  await context.run("cleanup-cache", async () => {
    const cacheKey = `api:campaigns:detail:${slug}`;
    await redis.del(cacheKey);
  });
});
