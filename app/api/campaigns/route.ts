import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getAllCampaigns } from '@/lib/campaigns';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQ = searchParams.get('q');
    
    const cacheKey = searchQ ? `api:campaigns:search:${searchQ.toLowerCase()}` : `api:campaigns:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const campaigns = await getAllCampaigns(searchQ);

    const response = { status: 'success', data: campaigns };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 }); // 60s cache
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Campaigns GET Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
