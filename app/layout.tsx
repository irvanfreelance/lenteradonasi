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

export async function generateMetadata(): Promise<Metadata> {
  let title = "PeduliSesama - Publik Donasi";
  let favicon = "/favicon.ico";
  let siteName = "PeduliSesama";
  try {
    const cached = await redis.get('ngo:configs:global_v3');
    let configs: any = null;
    
    if (cached) {
      configs = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } else {
      const res = await query('SELECT ngo_name, logo_url, primary_color, favicon_url, meta_pixel_id, tiktok_pixel_id, google_ads_id, google_analytic_id FROM ngo_configs LIMIT 1');
      if (res.length > 0) {
        configs = res[0];
        redis.set('ngo:configs:global_v3', JSON.stringify(configs), { ex: 3600 }).catch(() => {});
      }
    }

    if (configs?.ngo_name) {
      title = `${configs.ngo_name} - Publik Donasi`;
      siteName = configs.ngo_name;
    }
    if (configs?.favicon_url) {
      favicon = configs.favicon_url;
    }
  } catch (e) {
    console.error("Failed to generate metadata", e);
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    title: {
      default: title,
      template: `%s | ${siteName}`
    },
    description: `Platform Donasi Publik ${siteName}`,
    icons: {
      icon: favicon
    },
    openGraph: {
      title: title,
      description: `Platform Donasi Publik ${siteName}`,
      url: '/',
      siteName: siteName,
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: `Platform Donasi Publik ${siteName}`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let configs = null;
  try {
    // Cache ngo_configs in Redis – avoid DB hit on every render
    const cacheKey = 'ngo:configs:global_v3';
    const cached = await redis.get(cacheKey);
    if (cached) {
      configs = typeof cached === 'string' ? JSON.parse(cached) : cached;
    } else {
      const res = await query('SELECT ngo_name, logo_url, primary_color, favicon_url, meta_pixel_id, tiktok_pixel_id, google_ads_id, google_analytic_id FROM ngo_configs LIMIT 1');
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
        {configs?.primary_color && (
          <style dangerouslySetInnerHTML={{ __html: `
            :root {
              --color-teal-50: ${configs.primary_color}10;
              --color-teal-100: ${configs.primary_color}20;
              --color-teal-200: ${configs.primary_color}30;
              --color-teal-300: ${configs.primary_color}50;
              --color-teal-400: ${configs.primary_color}80;
              --color-teal-500: ${configs.primary_color};
              --color-teal-600: ${configs.primary_color};
              --color-teal-700: ${configs.primary_color};
              --color-teal-800: ${configs.primary_color};
              --color-teal-900: ${configs.primary_color};
            }
          ` }} />
        )}
      </head>
      <body className="h-full flex flex-col bg-slate-50 font-sans">
        {configs && (
          <TrackingScripts 
            metaPixelId={configs.meta_pixel_id} 
            tiktokPixelId={configs.tiktok_pixel_id} 
            googleAdsId={configs.google_ads_id}
            googleAnalyticId={configs.google_analytic_id}
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
