import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getUpdateDetail(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/news/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch news detail');
  }
  const json = await res.json();
  return json.data;
}

export default async function NewsDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const update = await getUpdateDetail(params.id);
  
  if (!update) {
    notFound();
  }

  const dateObj = new Date(update.created_at);
  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-20 sticky top-0">
        <Link href="/news" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h2 className="font-bold text-lg text-gray-800 ml-2">Detail Berita</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 no-scrollbar">
        <p className="text-[11px] text-teal-600 font-bold mb-2 uppercase tracking-wider">{formattedDate}</p>
        <h1 className="text-xl font-bold text-gray-800 leading-snug mb-5">{update.title}</h1>

        {update.image_url && (
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100 relative">
            <Image src={update.image_url} alt={update.title} fill className="object-cover" />
          </div>
        )}

        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line text-justify bg-slate-50 p-5 rounded-2xl border border-gray-100">
          {update.content}
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 z-30 pb-safe rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.08)]">
        <Link
          href={`/kampanye/${update.campaign_slug}/checkout`}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          <Heart size={20} className="fill-white" />
          Donasi Sekarang
        </Link>
      </div>
    </div>
  );
}
