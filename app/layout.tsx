import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { query } from "@/lib/db";
import { redis } from "@/lib/redis";
import TrackingScripts from "@/components/TrackingScripts";

const sourceSansPro = Source_Sans_3({
  variable: "--font-source-sans-pro",
  subsets: ["latin"],
  weight: ['300', '400', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: "PeduliSesama - Publik Donasi",
    template: "%s | PeduliSesama"
  },
  description: "Platform Donasi Publik PeduliSesama",
  openGraph: {
    title: "PeduliSesama - Publik Donasi",
    description: "Platform Donasi Publik PeduliSesama",
    url: '/',
    siteName: 'PeduliSesama',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PeduliSesama - Publik Donasi",
    description: "Platform Donasi Publik PeduliSesama",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let configs = null;
  try {
    // Cache ngo_configs in Redis – avoid DB hit on every render
    const cacheKey = 'ngo:configs:tracking';
    const cached = await redis.get(cacheKey);
    if (cached) {
      configs = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } else {
      const res = await query('SELECT meta_pixel_id, tiktok_pixel_id, google_ads_id FROM ngo_configs LIMIT 1');
      if (res.length > 0) {
        configs = res[0];
        // Cache for 1 hour – changes to tracking IDs are rare
        redis.set(cacheKey, JSON.stringify(configs), { ex: 3600 }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("Failed to fetch ngo_configs for tracking", e);
  }

  return (
    <html lang="id" className={`${sourceSansPro.variable} h-full antialiased`}>
      <head>
        {/* Preconnect to Vercel Blob & Neon for faster cold starts */}
        <link rel="preconnect" href="https://public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://public.blob.vercel-storage.com" />
      </head>
      <body className="h-full flex flex-col bg-slate-50 font-sans">
        {configs && (
          <TrackingScripts 
            metaPixelId={configs.meta_pixel_id} 
            tiktokPixelId={configs.tiktok_pixel_id} 
            googleAdsId={configs.google_ads_id} 
          />
        )}
        <main className="flex-1 w-full max-w-md mx-auto relative overflow-hidden bg-white shadow-xl flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            {children}
          </div>
          <BottomNav />
        </main>
      </body>
    </html>
  );
}
