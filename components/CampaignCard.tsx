import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatIDR } from '@/lib/utils';
import { Clock } from 'lucide-react';

export default function CampaignCard({ camp, variant = 'default' }: { camp: any, variant?: 'default' | 'urgent' }) {
  if (variant === 'urgent') {
    return (
      <Link href={`/kampanye/${camp.slug}`} className="min-w-[75%] bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden cursor-pointer active:scale-95 snap-center block">
        <div className="h-32 w-full relative">
          <Image src={camp.image_url || '/placeholder.jpg'} alt={camp.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Clock size={10} /> Sisa {camp.daysLeft} Hari
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-800 leading-tight mb-3 text-sm line-clamp-2">{camp.title}</h3>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-1.5 rounded-full" style={{ width: `${camp.progress}%` }}></div>
          </div>
          <div className="flex justify-between items-end">
            <p className="font-bold text-rose-500 text-sm">{formatIDR(Number(camp.collected))}</p>
            <p className="text-[10px] text-gray-400 font-semibold">{camp.progress}%</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/kampanye/${camp.slug}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4 hover:border-teal-100 active:scale-[0.98] transition-transform">
      <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative shadow-sm">
        <Image src={camp.image_url || '/placeholder.jpg'} alt={camp.title} fill sizes="(max-width: 768px) 112px, 112px" className="object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <p className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider bg-teal-50 w-fit px-1.5 py-0.5 rounded">{camp.category_name}</p>
          <h3 className="font-bold text-gray-800 leading-tight text-sm line-clamp-2 mb-1.5">{camp.title}</h3>
        </div>
        <div>
          {!camp.has_no_target && (
            <div className="w-full bg-gray-100 rounded-full h-1 mb-1.5 mt-2">
              <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${camp.progress}%` }}></div>
            </div>
          )}
          <div className="flex justify-between items-center mt-2">
            <p className="font-bold text-teal-600 text-xs">{formatIDR(Number(camp.collected))}</p>
            {!camp.has_no_target && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold">{camp.progress}%</span>}
            {camp.has_no_target && !camp.has_no_time_limit && <span className="text-[10px] text-gray-500">{camp.daysLeft} Hari</span>}
            {camp.has_no_target && camp.has_no_time_limit && <span className="text-[10px] text-gray-500 font-medium">Tanpa Batas</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
