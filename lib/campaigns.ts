import { query } from './db';
import { redis } from './redis';

export async function getCampaignBySlug(slug: string) {
  const campaigns = await query(`
    SELECT c.*, cat.name as category_name, 
           COALESCE(cs.collected_amount, 0) as collected, 
           COALESCE(cs.donor_count, 0) as donors
    FROM campaigns c
    LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.slug = $1 AND c.status = 'ACTIVE'
  `, [slug]);
  
  if (campaigns.length === 0) return null;
  
  const c = campaigns[0];
  
  // Fetch Real-time Stats from Redis
  const statsKey = `campaign:${c.id}:stats`;
  const rtStats = await redis.hgetall(statsKey) as Record<string, string> | null;
  
  // SAFE MERGE: Pick the higher value between DB and Redis to handle out-of-sync states
  const collected = rtStats?.collected_amount 
    ? Math.max(Number(rtStats.collected_amount), Number(c.collected)) 
    : Number(c.collected);
    
  const donors = rtStats?.donor_count 
    ? Math.max(Number(rtStats.donor_count), Number(c.donors)) 
    : Number(c.donors);

  let daysLeft = 0;
  if (c.end_date) {
    const diff = new Date(c.end_date).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  const updates = await query(`SELECT * FROM campaign_updates WHERE campaign_id = $1 ORDER BY created_at DESC`, [c.id]);
  
  let variants = [];
  if (c.is_fixed_amount) {
    variants = await query(`SELECT * FROM campaign_variants WHERE campaign_id = $1 AND is_active = true`, [c.id]);
  }

  let bundleItems = [];
  if (c.is_bundle) {
    bundleItems = await query(`
      SELECT cb.qty, c2.title as name, COALESCE(cv.price, c2.minimum_amount, 0) as unit_price
      FROM campaign_bundles cb
      JOIN campaigns c2 ON c2.id = cb.item_campaign_id
      LEFT JOIN campaign_variants cv ON cv.campaign_id = c2.id AND cv.is_active = true
      WHERE cb.bundle_campaign_id = $1
    `, [c.id]);
  }

  const ngoConfigs = await query(`SELECT ngo_name FROM ngo_configs LIMIT 1`);
  const ngoName = ngoConfigs.length > 0 ? ngoConfigs[0].ngo_name : 'Lembaga Kami';

  return {
    ...c,
    collected,
    donors,
    daysLeft,
    progress: c.has_no_target ? 0 : Math.min(100, Math.round(((collected || 0) / (Number(c.target_amount) || 1)) * 100)),
    updates,
    variants,
    bundleItems,
    ngoName
  };
}

export async function getAllCampaigns(searchQ?: string | null) {
  let text = `
    SELECT c.*, 
           cat.name as category_name,
           COALESCE(cs.collected_amount, 0) as collected, 
           COALESCE(cs.donor_count, 0) as donors
    FROM campaigns c
    LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.status = 'ACTIVE'
  `;
  const params: any[] = [];
  
  if (searchQ) {
    text += ` AND (c.title ILIKE $1 OR cat.name ILIKE $1)`;
    params.push(`%${searchQ}%`);
  }
  
  text += ` ORDER BY c.sort ASC, c.created_at DESC`;
  
  const rawCampaigns = await query(text, params);
  
  const campaigns = await mergeRedisStats(rawCampaigns);

  return campaigns;
}

export async function getCarouselCampaigns() {
  const rawCampaigns = await query(`
    SELECT c.*, 
           cat.name as category_name,
           COALESCE(cs.collected_amount, 0) as collected, 
           COALESCE(cs.donor_count, 0) as donors
    FROM campaigns c
    LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.status = 'ACTIVE' AND c.is_carousel = true
    ORDER BY c.sort ASC
  `);

  return mergeRedisStats(rawCampaigns);
}

/**
 * Shared logic to merge real-time Redis stats into campaign data
 */
async function mergeRedisStats(rawCampaigns: any[]) {
  return await Promise.all(rawCampaigns.map(async (c) => {
    const statsKey = `campaign:${c.id}:stats`;
    const rtStats = await redis.hgetall(statsKey) as Record<string, string> | null;
    
    const collected = rtStats?.collected_amount 
      ? Math.max(Number(rtStats.collected_amount), Number(c.collected)) 
      : Number(c.collected);
      
    const donors = rtStats?.donor_count 
      ? Math.max(Number(rtStats.donor_count), Number(c.donors)) 
      : Number(c.donors);

    let daysLeft = 0;
    if (c.end_date) {
      const diff = new Date(c.end_date).getTime() - new Date().getTime();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    }
    
    return {
      ...c,
      collected,
      donors,
      daysLeft,
      progress: c.has_no_target ? 0 : Math.min(100, Math.round(((collected || 0) / (Number(c.target_amount) || 1)) * 100))
    };
  }));
}
