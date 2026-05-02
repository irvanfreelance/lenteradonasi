import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

const LIMIT = 5;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const donorId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const offset = (page - 1) * LIMIT;

    const rows = await query(
      `SELECT i.id, i.invoice_code, i.total_amount, i.status, i.created_at,
              c.title as campaign_title
       FROM invoices i
       LEFT JOIN transactions t ON t.invoice_id = i.id
       LEFT JOIN campaigns c ON c.id = t.campaign_id
       WHERE i.donor_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [donorId, LIMIT, offset]
    );

    // Check if more pages exist
    const countRes = await query(
      `SELECT COUNT(*) as total FROM invoices WHERE donor_id = $1`,
      [donorId]
    );
    const total = parseInt(countRes[0]?.total ?? '0', 10);
    const hasMore = offset + LIMIT < total;

    return NextResponse.json({ status: 'success', data: rows, hasMore, total });
  } catch (error: any) {
    console.error('[donasi/history] error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
