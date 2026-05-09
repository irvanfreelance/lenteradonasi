'use client';

import { useEffect } from 'react';

/**
 * Invisible client component that captures the affiliate code.
 * The `affCode` is passed directly from the server page (via searchParams)
 * so we don't need useSearchParams() — no Suspense boundary needed.
 *
 * Session is stored **per campaign** under key `lenteradonasi_affiliate_{campaignId}`.
 * A new affCode for the same campaign always overwrites the old one.
 */
export default function AffiliateTracker({
  campaignId,
  affCode,
}: {
  campaignId: number;
  affCode: string | null;
}) {
  useEffect(() => {
    if (!affCode || !campaignId) return;

    const lsKey = `lenteradonasi_affiliate_${campaignId}`;

    fetch(`/api/affiliates/resolve?code=${encodeURIComponent(affCode)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.id) {
          // Always overwrite — newest affCode wins for this campaign
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
  // Only run when affCode or campaignId changes (i.e., on page load with a valid ?aff=)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affCode, campaignId]);

  return null;
}
