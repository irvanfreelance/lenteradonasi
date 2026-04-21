import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'andi@email.com';
    
    const cacheKey = `api:user:profile:${email}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const stats = await query(`
      SELECT 
        SUM(total_amount) as total_donated,
        COUNT(DISTINCT t.campaign_id) as campaigns_supported
      FROM invoices i
      LEFT JOIN transactions t ON i.id = t.invoice_id
      WHERE i.donor_email = $1 AND i.status = 'PAID'
    `, [email]);

    const data = {
      email,
      name: 'Andi Dermawan',
      totalDonated: stats[0]?.total_donated || 0,
      campaignsSupported: stats[0]?.campaigns_supported || 0,
      level: Number(stats[0]?.total_donated) > 1000000 ? 'Donatur Prioritas' : 'Orang Baik'
    };

    const response = { status: 'success', data };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 60 });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API User Profile Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
