'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Invisible client component that captures the ?aff= query param.
 * Session is stored **per campaign** under key `lenteradonasi_affiliate_{campaignId}`,
 * so a new ?aff= on the same campaign always overwrites the previous affiliate,
 * while sessions for other campaigns are untouched.
 *
 * Usage: mount this on the campaign detail page (server component wraps it
 * in <Suspense> because useSearchParams requires it).
 */
export default function AffiliateTracker({ campaignId }: { campaignId: number }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const affCode = searchParams.get('aff');
    if (!affCode || !campaignId) return;

    const lsKey = `lenteradonasi_affiliate_${campaignId}`;

    // Resolve code → id
    fetch(`/api/affiliates/resolve?code=${encodeURIComponent(affCode)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.id) {
          // Always overwrite — newest ?aff= wins for this campaign
          localStorage.setItem(
            lsKey,
            JSON.stringify({
              affiliateId: json.data.id,
              affiliateCode: affCode,
              capturedAt: Date.now(),
            })
          );
        }
      })
      .catch(() => {/* silently ignore */});
  }, [searchParams, campaignId]);

  return null;
}
