import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const cacheKey = `api:payment_methods:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const pm = await query(`
      SELECT * FROM payment_methods WHERE is_active = true ORDER BY id ASC
    `);

    const response = { status: 'success', data: pm };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 300 }); // Cache 5 mins
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API PaymentMethods Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
