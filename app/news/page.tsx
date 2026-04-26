import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import Header from "@/components/layout/Header";

export const dynamic = 'force-dynamic';

async function getUpdates() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/news`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export default async function NewsPage() {
  const updates = await getUpdates();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header subtitle="Kabar Berita Terbaru" />
      
      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Newspaper size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada kabar terbaru saat ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {updates.map((update: any) => {
              const dateObj = new Date(update.created_at);
              const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
              return (
                <Link
                  key={update.id}
                  href={`/news/${update.id}`}
                  prefetch={true}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden block"
                >
                  {update.image_url && (
                    <div className="h-40 w-full bg-gray-100 relative">
                      <Image src={update.image_url} alt={update.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{update.category_name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{formattedDate}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base leading-snug mb-2">{update.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{update.excerpt?.replace(/\\n/g, '\n')}</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400">Dari kampanye:</span>
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-1">{update.campaign_title}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
