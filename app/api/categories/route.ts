import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const cacheKey = `api:categories:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const categories = await query(`
      SELECT * FROM categories WHERE is_active = true ORDER BY id ASC
    `);

    const response = { status: 'success', data: categories };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 120 }); // cache 2 mins
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API Categories Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
