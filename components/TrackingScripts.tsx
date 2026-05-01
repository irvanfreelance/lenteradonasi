'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Script from 'next/script';

function TrackingLogic({ metaPixelId, tiktokPixelId, googleAdsId, googleAnalyticId }: { metaPixelId?: string, tiktokPixelId?: string, googleAdsId?: string, googleAnalyticId?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Capture URL Parameters
    const fbclid = searchParams.get('fbclid');
    const ttclid = searchParams.get('ttclid');
    const gclid = searchParams.get('gclid');

    // Save to cookies for 30 days
    const maxAge = 60 * 60 * 24 * 30;
    if (fbclid) document.cookie = `fbclid=${fbclid}; path=/; max-age=${maxAge}`;
    if (ttclid) document.cookie = `ttclid=${ttclid}; path=/; max-age=${maxAge}`;
    if (gclid) document.cookie = `gclid=${gclid}; path=/; max-age=${maxAge}`;

    // 2. Fire PageView Event on Route Change
    if (metaPixelId && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
    if (tiktokPixelId && typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.page();
    }
  }, [searchParams, pathname, metaPixelId, tiktokPixelId]);

  return null;
}

export default function TrackingScripts({
  metaPixelId,
  tiktokPixelId,
  googleAdsId,
  googleAnalyticId
}: {
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
  googleAdsId?: string | null;
  googleAnalyticId?: string | null;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <TrackingLogic 
          metaPixelId={metaPixelId || undefined} 
          tiktokPixelId={tiktokPixelId || undefined} 
          googleAdsId={googleAdsId || undefined} 
          googleAnalyticId={googleAnalyticId || undefined}
        />
      </Suspense>

      {/* Meta Pixel */}
      {metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
            `,
          }}
        />
      )}

      {/* TikTok Pixel */}
      {tiktokPixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${tiktokPixelId}');
              }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* Google Tags (Ads & Analytics) */}
      {(googleAdsId || googleAnalyticId) && (
        <>
          <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId || googleAnalyticId}`} />
          <Script
            id="google-tags"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
                ${googleAnalyticId ? `gtag('config', '${googleAnalyticId}');` : ''}
              `,
            }}
          />
        </>
      )}
    </>
  );
}
