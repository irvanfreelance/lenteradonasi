import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const { slug } = params;
    
    const cacheKey = `api:campaigns:detail:${slug}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const campaigns = await query(`
      SELECT c.*, cat.name as category_name, 
             COALESCE(cs.collected_amount, 0) as collected, 
             COALESCE(cs.donor_count, 0) as donors
      FROM campaigns c
      LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.slug = $1 AND c.status = 'ACTIVE'
    `, [slug]);
    
    if (campaigns.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 });
    }
    
    const c = campaigns[0];
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

    const data = {
      ...c,
      daysLeft,
      progress: c.has_no_target ? 0 : Math.min(100, Math.round(((Number(c.collected) || 0) / (Number(c.target_amount) || 1)) * 100)),
      updates,
      variants,
      bundleItems,
      ngoName
    };

    const response = { status: 'success', data };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Campaign Detail Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
