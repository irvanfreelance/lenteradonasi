import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const cursor = searchParams.get('cursor'); // This will be the offset or a timestamp

    // First, find the campaign ID from the slug
    const campaigns = await query(`SELECT id FROM campaigns WHERE slug = $1`, [slug]);
    if (campaigns.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Campaign not found' }, { status: 404 });
    }
    const campaignId = campaigns[0].id;

    // Strategy: 
    // 1. If cursor is null (first page), try to get from Redis List
    // 2. Otherwise, or if Redis is empty, fetch from DB.
    
    let donors = [];
    const redisKey = `campaign:${campaignId}:donors`;

    if (!cursor) {
      const cachedDonors = await redis.lrange(redisKey, 0, limit - 1);
      if (cachedDonors && cachedDonors.length > 0) {
        donors = cachedDonors.map(d => typeof d === 'string' ? JSON.parse(d) : d);
      }
    }

    // If no donors from Redis or we need more (beyond first page)
    if (donors.length === 0 || cursor) {
      const offset = cursor ? parseInt(cursor) : 0;
      
      // SQL query to get paid donors
      // Joining transactions with invoices to get the donor info and amount
      const dbDonors = await query(`
        SELECT 
          i.id,
          i.donor_name_snapshot,
          i.is_anonymous,
          i.paid_at,
          i.total_amount,
          i.doa,
          t.amount as transaction_amount
        FROM transactions t
        JOIN invoices i ON t.invoice_id = i.id AND t.invoice_created_at = i.created_at
        WHERE t.campaign_id = $1 AND i.status = 'PAID'
        ORDER BY i.paid_at DESC
        LIMIT $2 OFFSET $3
      `, [campaignId, limit, offset]);

      donors = dbDonors.map(d => ({
        id: d.id,
        name: d.is_anonymous ? 'Hamba Allah' : d.donor_name_snapshot,
        amount: Number(d.transaction_amount || d.total_amount),
        date: d.paid_at,
        message: d.doa
      }));
    }

    const nextCursor = donors.length === limit ? (cursor ? parseInt(cursor) + limit : limit).toString() : null;

    return NextResponse.json({
      status: 'success',
      data: donors,
      nextCursor
    });
  } catch (error) {
    console.error('API Campaign Donors Error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch donors' }, { status: 500 });
  }
}
