import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getCampaignBySlug } from '@/lib/campaigns';

export async function GET(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const params = await props.params;
    const { slug } = params;
    
    const cacheKey = `api:campaigns:detail:${slug}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      // Note: getCampaignBySlug internally merges real-time Redis stats
      // If we want absolute real-time even on cached API responses, 
      // we could re-merge here, but 60s cache is usually acceptable.
      return NextResponse.json(data);
    }

    const data = await getCampaignBySlug(slug);
    
    if (!data) {
      return NextResponse.json({ status: 'error', message: 'Not found' }, { status: 404 });
    }

    const response = { status: 'success', data };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Campaign Detail Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
