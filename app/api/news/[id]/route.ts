import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const cacheKey = `api:news:detail:${id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const updates = await query(`
      SELECT cu.*, c.slug as campaign_slug
      FROM campaign_updates cu
      JOIN campaigns c ON cu.campaign_id = c.id
      WHERE cu.id = $1
    `, [parseInt(id)]);
    
    if (updates.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 });
    }

    const response = { status: 'success', data: updates[0] };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API News Detail Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
