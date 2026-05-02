'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { History, Loader2, Receipt, FileText } from 'lucide-react';

interface HistoryItem {
  id: number;
  invoice_code: string;
  total_amount: number;
  status: string;
  created_at: string;
  campaign_title: string | null;
}

interface Props {
  initialData: HistoryItem[];
  hasMoreInitial: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PAID:    { label: 'Berhasil',   cls: 'text-green-600 bg-green-100' },
    PENDING: { label: 'Menunggu',   cls: 'text-amber-600 bg-amber-100' },
    EXPIRED: { label: 'Kadaluarsa', cls: 'text-red-500 bg-red-100' },
    FAILED:  { label: 'Gagal',      cls: 'text-red-500 bg-red-100' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'text-gray-600 bg-gray-100' };
  return (
    <div className={`${cls} text-[10px] font-bold px-2 py-1 rounded-md shrink-0`}>
      {label}
    </div>
  );
}

function PdfButton({ invoiceCode, status }: { invoiceCode: string; status: string }) {
  const [loading, setLoading] = useState(false);

  if (status !== 'PAID') return null; // only show for paid invoices

  const handleClick = async () => {
    setLoading(true);
    try {
      // Open in a new tab — browser will render the PDF inline
      window.open(`/api/invoice/${invoiceCode}/pdf`, '_blank', 'noopener');
    } finally {
      // Small delay so spinner is visible
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Cetak Bukti Donasi (PDF)"
      className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <FileText size={13} />
      )}
      {loading ? 'Membuka...' : 'Bukti Donasi (PDF)'}
    </button>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(item.created_at));

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 border border-teal-100 mt-0.5">
        <Receipt size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{formattedDate}</p>
        <h4
          className="font-bold text-gray-800 text-sm truncate mb-1"
          title={item.campaign_title || 'Donasi Umum'}
        >
          {item.campaign_title || 'Donasi Umum'}
        </h4>
        <p className="font-bold text-teal-600 text-sm">
          Rp {Number(item.total_amount).toLocaleString('id-ID')}
        </p>
        {/* PDF button — only for PAID */}
        <PdfButton invoiceCode={item.invoice_code} status={item.status} />
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

export default function HistoryList({ initialData, hasMoreInitial }: Props) {
  const [items, setItems] = useState<HistoryItem[]>(initialData);
  const [page, setPage] = useState(1); // page 1 already loaded (SSR)
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/donasi/history?page=${nextPage}`);
      const json = await res.json();
      if (json.status === 'success') {
        setItems(prev => [...prev, ...json.data]);
        setPage(nextPage);
        setHasMore(json.hasMore);
      }
    } catch (err) {
      console.error('infinite scroll fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // IntersectionObserver – fires loadMore when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl flex flex-col items-center">
        <History size={32} className="text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Belum ada riwayat donasi.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <HistoryCard key={`${item.id}-${i}`} item={item} />
        ))}
      </div>

      {/* Sentinel – triggers infinite scroll */}
      <div ref={sentinelRef} className="h-4 mt-2" />

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 size={22} className="animate-spin text-teal-500" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-[11px] text-gray-400 py-4">
          Semua riwayat sudah ditampilkan 🎉
        </p>
      )}
    </>
  );
}
