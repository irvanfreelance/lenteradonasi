import { query } from "@/lib/db";
import { redis } from "@/lib/redis";
import LoginClient from "./LoginClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/profil");
  }

  let configs = null;
  try {
    const cacheKey = 'ngo:configs:global_v3';
    const cached = await redis.get(cacheKey);
    if (cached) {
      configs = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } else {
      const res = await query('SELECT ngo_name, logo_url, primary_color FROM ngo_configs LIMIT 1');
      if (res.length > 0) {
        configs = res[0];
      }
    }
  } catch (e) {
    console.error("Failed to fetch ngo_configs for login", e);
  }

  return <LoginClient configs={configs} />;
}
