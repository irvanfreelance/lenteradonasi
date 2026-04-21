import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'andi@email.com'; // Mock user id
    
    const cacheKey = `api:user:transactions:${email}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const invoices = await query(`
      SELECT i.*, t.campaign_id, c.title as campaign_title
      FROM invoices i
      LEFT JOIN transactions t ON i.id = t.invoice_id
      LEFT JOIN campaigns c ON t.campaign_id = c.id
      WHERE i.donor_email = $1 OR i.donor_email IS NULL
      ORDER BY i.created_at DESC
      LIMIT 20
    `, [email]);

    const response = { status: 'success', data: invoices };
    await redis.set(cacheKey, JSON.stringify(response), { ex: 30 }); // cache 30s
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API User Transactions Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch' }, { status: 500 });
  }
}
