import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/affiliates/resolve?code=KOHDENIS
 * Resolves an affiliate_code to its id + name for the frontend tracker.
 * Only returns ACTIVE affiliates.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json({ status: 'error', message: 'Missing code', data: null }, { status: 400 });
    }

    const rows = await query(
      `SELECT id, affiliate_code, name FROM affiliates WHERE affiliate_code = $1 AND status = 'ACTIVE' LIMIT 1`,
      [code]
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Affiliate not found', data: null }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', message: 'OK', data: rows[0] });
  } catch (error: any) {
    console.error('Affiliate resolve error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error', data: null }, { status: 500 });
  }
}
