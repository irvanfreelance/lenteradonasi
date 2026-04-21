import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const cacheKey = `api:news:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const updates = await query(`
      SELECT cu.*, c.title as campaign_title, c.slug as campaign_slug, cat.name as category_name
      FROM campaign_updates cu
      JOIN campaigns c ON cu.campaign_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY cu.created_at DESC
    `);

    const response = { status: 'success', data: updates };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API News Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
