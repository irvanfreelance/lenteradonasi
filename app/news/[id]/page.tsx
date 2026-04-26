import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ShareButton";

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
      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100 shadow-sm z-20 sticky top-0">
        <div className="flex items-center">
          <Link href="/news" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Detail Berita</h2>
        </div>
        <ShareButton 
          url={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/news/${update.id}`} 
          title={update.title} 
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 no-scrollbar">
        <p className="text-[11px] text-teal-600 font-bold mb-2 uppercase tracking-wider">{formattedDate}</p>
        <h1 className="text-xl font-bold text-gray-800 leading-snug mb-5">{update.title}</h1>

        {update.image_url && (
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100 relative">
            <Image src={update.image_url} alt={update.title} fill className="object-cover" />
          </div>
        )}

        <div 
          className="news-content text-gray-700 text-sm leading-relaxed text-justify bg-slate-50 p-6 rounded-2xl border border-gray-100 mb-8 shadow-inner"
          dangerouslySetInnerHTML={{ __html: update.content?.replace(/\\n/g, '<br/>') }}
        />

        {/* Refined CTA Card */}
        <div className="mb-12 mt-4">
          <Link 
            href={`/kampanye/${update.campaign_slug}`} 
            prefetch={true} 
            className="flex flex-col bg-white rounded-2xl border border-teal-100/50 overflow-hidden group transition-all duration-300 active:scale-[0.99] shadow-sm hover:shadow-md hover:border-teal-200"
          >
            <div className="flex p-4 gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative shadow-sm border border-gray-100 bg-teal-50 flex items-center justify-center">
                {update.campaign_image ? (
                  <Image 
                    src={update.campaign_image} 
                    alt={update.campaign_title || 'Kampanye Terkait'} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    sizes="96px"
                  />
                ) : (
                  <Heart size={32} className="text-teal-200 fill-teal-100" />
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest mb-1.5 opacity-80">Terus Berbagi Kebaikan</p>
                <h4 className="font-bold text-gray-800 text-[15px] leading-tight line-clamp-2 mb-2 group-hover:text-teal-700 transition-colors">
                  {update.campaign_title || "Mari terus dukung kampanye ini"}
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 italic">
                  "Kabar terbaru ini terwujud atas izin Allah & bantuan Anda. Mari lanjutkan dukungan kita."
                </p>
              </div>
            </div>
            
            <div className="bg-teal-50/30 py-3.5 px-5 flex justify-between items-center border-t border-teal-50">
              <span className="text-[11px] font-bold text-teal-700 group-hover:text-teal-800">Donasi lagi klik disini untuk bantu perjuangan mereka</span>
              <div className="bg-teal-600 text-white p-1.5 rounded-full group-hover:translate-x-1 transition-transform shadow-sm">
                <ChevronLeft size={14} className="rotate-180" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 z-30 pb-safe rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.08)]">
        <Link
          href={`/kampanye/${update.campaign_slug}/checkout`}
          prefetch={true}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex justify-center items-center gap-2"
        >
          <Heart size={20} className="fill-white" />
          Donasi Sekarang
        </Link>
      </div>
    </div>
  );
}
