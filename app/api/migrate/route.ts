import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const sqlPath = path.join(process.cwd(), 'refs', 'lenteradonasi2.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Split statements and execute, or try executing as one large text
    // Neon serverless driver usually allows multi-statement queries
    await query(sqlScript);

    return NextResponse.json({ message: 'Migration successful!' });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
