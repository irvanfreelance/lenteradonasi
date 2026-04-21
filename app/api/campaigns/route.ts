import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQ = searchParams.get('q');
    
    const cacheKey = searchQ ? `api:campaigns:search:${searchQ.toLowerCase()}` : `api:campaigns:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

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
    
    const campaigns = rawCampaigns.map(c => {
      let daysLeft = 0;
      if (c.end_date) {
        const diff = new Date(c.end_date).getTime() - new Date().getTime();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
      }
      return {
        ...c,
        daysLeft,
        progress: c.has_no_target ? 0 : Math.min(100, Math.round(((Number(c.collected) || 0) / (Number(c.target_amount) || 1)) * 100))
      };
    });

    const response = { status: 'success', data: campaigns };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 }); // 60s cache
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Campaigns GET Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
