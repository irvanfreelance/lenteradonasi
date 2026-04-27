'use client';

import { useState, useEffect, useRef } from 'react';
import { formatIDR } from '@/lib/utils';

interface Donor {
  id: number;
  name: string;
  amount: number;
  date: string;
  message: string | null;
}

/**
 * DonorsTab — zero-delay variant.
 * - No mount animation
 * - Fetches once on first render, keeps state even when hidden
 * - IntersectionObserver for infinite scroll (still works when tab is visible)
 */
export default function DonorsTab({ slug }: { slug: string }) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  // Prevent double-fetch in StrictMode / concurrent renders
  const fetchingRef = useRef(false);

  const fetchDonors = async (cursor?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const url = `/api/campaigns/${slug}/donors?limit=10${cursor ? `&cursor=${cursor}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setDonors((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const filtered = (json.data as Donor[]).filter((d) => !existingIds.has(d.id));
          return [...prev, ...filtered];
        });
        setNextCursor(json.nextCursor ?? null);
        setHasMore(!!json.nextCursor);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      setInitialLoaded(true);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    if (!initialLoaded) fetchDonors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetchingRef.current && initialLoaded) {
          fetchDonors(nextCursor ?? undefined);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, nextCursor, initialLoaded]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  if (!initialLoaded) {
    // Instant skeleton — no spinner delay
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b border-gray-100 pb-4">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-100 rounded" />
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-3.5 w-20 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">Belum ada donatur untuk kampanye ini.</p>
        <p className="text-gray-400 text-xs mt-1">Jadilah yang pertama berbagi kebaikan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donors.map((donor, index) => (
        <div key={`${donor.id}-${index}`} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex justify-between items-start mb-1.5">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{donor.name}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(donor.date)}</p>
            </div>
            <p className="font-bold text-teal-600 text-sm shrink-0 ml-2">{formatIDR(donor.amount)}</p>
          </div>
          {donor.message && (
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 mt-1.5">
              {donor.message}
            </p>
          )}
        </div>
      ))}

      <div ref={observerTarget} className="py-3 text-center">
        {loading && hasMore && (
          <span className="text-xs text-gray-400">Memuat...</span>
        )}
        {!hasMore && donors.length > 0 && (
          <p className="text-xs text-gray-400 italic">Semua donatur telah ditampilkan</p>
        )}
      </div>
    </div>
  );
}
