'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import DonorsTab from '@/components/DonorsTab';

type Tab = 'cerita' | 'info' | 'donatur';

interface Update {
  id: number;
  title: string;
  excerpt: string;
  created_at: string;
}

interface Props {
  slug: string;
  description: string;
  updates: Update[];
}

/**
 * CampaignTabs — instant client-side tab switcher.
 *
 * Key design decisions:
 * 1. Pure useState — zero URL navigation, zero server roundtrip on tab click.
 * 2. All three panels are always in the DOM (no conditional render).
 *    Hidden panels use `display:none` via Tailwind `hidden` class so they
 *    don't contribute to layout, but DonorsTab keeps its fetched state.
 * 3. Zero transition/animation classes — content appears synchronously.
 * 4. DonorsTab is always mounted from the first render so it starts
 *    prefetching in the background even before the user opens that tab.
 */
export default function CampaignTabs({ slug, description, updates }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cerita');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cerita', label: 'Cerita' },
    { key: 'info', label: 'Info Terbaru' },
    { key: 'donatur', label: 'Donatur' },
  ];

  return (
    <>
      {/* Tab Navigation — pure button, no Link, instant state update */}
      <div className="flex border-b border-gray-100 mb-5">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 flex-1 font-bold text-sm text-center relative ${
              activeTab === key ? 'text-teal-600' : 'text-gray-400'
            }`}
          >
            {label}
            {activeTab === key && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels — always mounted, toggle visibility only */}

      {/* Cerita */}
      <div className={activeTab === 'cerita' ? '' : 'hidden'}>
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Cerita Penggalangan Dana</h3>
        <p className="text-gray-600 text-sm leading-relaxed text-justify mb-6 whitespace-pre-line">
          {description}
          {'\n\n'}
          Donasi Anda sangat berarti. Mari kita bersama-sama mewujudkan kebaikan ini sekarang juga.
          Berapapun donasi Anda akan sangat membantu tujuan mulia ini.
        </p>
      </div>

      {/* Info Terbaru */}
      <div className={activeTab === 'info' ? '' : 'hidden'}>
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Kabar Penyaluran</h3>
        {updates.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-gray-100 mb-6">
            <p className="text-gray-500 text-sm font-medium">Belum ada info terbaru saat ini.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-teal-100 ml-3 pl-5 space-y-6 pb-6">
            {updates.map((update) => {
              const formattedDate = new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(update.created_at));
              return (
                <Link
                  href={`/news/${update.id}`}
                  key={update.id}
                  className="block relative bg-white border border-gray-100 shadow-sm rounded-xl p-4 hover:border-teal-200 active:scale-[0.98] transition-transform"
                >
                  <div className="absolute -left-[27px] top-4 w-4 h-4 bg-teal-500 rounded-full border-4 border-white shadow-sm" />
                  <p className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider">
                    {formattedDate}
                  </p>
                  <h4 className="font-bold text-gray-800 text-sm mb-2 leading-tight">{update.title}</h4>
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">{update.excerpt}</p>
                  <span className="text-teal-600 text-[11px] font-bold flex items-center gap-1">
                    Baca selengkapnya <ChevronRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Donatur — always mounted so it prefetches immediately */}
      <div className={activeTab === 'donatur' ? '' : 'hidden'}>
        <DonorsTab slug={slug} />
      </div>
    </>
  );
}
