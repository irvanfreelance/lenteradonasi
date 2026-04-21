import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env.local');
}

// We use a singleton pattern for the Neon connection pool in Next.js to prevent connection exhaustion.
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const dbPool =
  globalForDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForDb.pool = dbPool;

/**
 * Utility function to execute a raw SQL query.
 * Usage: const rows = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await dbPool.query(text, params);
  return result.rows;
}
