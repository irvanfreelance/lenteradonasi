import { Redis } from '@upstash/redis';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL (or equivalent) and token must be set in .env.local');
}

// Ensure you configure this with the correct variables based on your .env.local
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
