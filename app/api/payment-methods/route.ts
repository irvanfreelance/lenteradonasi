import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getActivePaymentMethods } from '@/lib/payments';

export async function GET() {
  try {
    const cacheKey = `api:payment_methods:all`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const pm = await getActivePaymentMethods();

    const response = { status: 'success', data: pm };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 300 }); // Cache 5 mins
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API PaymentMethods Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
