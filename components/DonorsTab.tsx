"use client";

import { useEffect, useState, useRef } from "react";
import { formatIDR } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Donor {
  id: number;
  name: string;
  amount: number;
  date: string;
  message: string | null;
}

export default function DonorsTab({ slug }: { slug: string }) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const observerTarget = useRef(null);

  const fetchDonors = async (cursor?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = `/api/campaigns/${slug}/donors?limit=5${cursor ? `&cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === "success") {
        const newDonors = json.data;
        setDonors((prev) => {
          // Filter out duplicates just in case
          const existingIds = new Set(prev.map(d => d.id));
          const filtered = newDonors.filter((d: Donor) => !existingIds.has(d.id));
          return [...prev, ...filtered];
        });
        setNextCursor(json.nextCursor);
        setHasMore(!!json.nextCursor);
      }
    } catch (error) {
      console.error("Failed to fetch donors:", error);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && initialLoaded) {
          fetchDonors(nextCursor || undefined);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, nextCursor, initialLoaded]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (!initialLoaded && loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (initialLoaded && donors.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">Belum ada donatur untuk kampanye ini.</p>
        <p className="text-gray-400 text-xs mt-1">Jadilah yang pertama berbagi kebaikan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">


      <div className="space-y-6">
        {donors.map((donor, index) => (
          <div key={`${donor.id}-${index}`} className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-gray-900 text-base">{donor.name}</h4>
                <p className="text-xs text-gray-500">{formatDate(donor.date)}</p>
              </div>
              <p className="font-bold text-gray-900 text-base">{formatIDR(donor.amount)}</p>
            </div>
            {donor.message && (
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {donor.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div ref={observerTarget} className="flex justify-center py-4">
        {loading && hasMore && <Loader2 className="w-6 h-6 animate-spin text-teal-600" />}
        {!hasMore && donors.length > 0 && (
          <p className="text-xs text-gray-400 font-medium italic">Semua donatur telah ditampilkan</p>
        )}
      </div>
    </div>
  );
}
