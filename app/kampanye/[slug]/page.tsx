import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import type { Metadata } from "next";
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const campaign = await getCampaignDetail(params.slug);

  if (!campaign) {
    return {
      title: 'Kampanye Tidak Ditemukan',
    };
  }

  const title = campaign.title;
  const description = campaign.description || `Mari bersama wujudkan kebaikan melalui kampanye ${campaign.title}`;
  const imageUrl = campaign.image_url || '/placeholder.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
async function getCampaignDetail(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/campaigns/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch campaign detail');
  }
  const json = await res.json();
  return json.data;
}

export default async function CampaignDetail(props: { params: Promise<{ slug: string }>, searchParams?: Promise<{ tab?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const campaign = await getCampaignDetail(params.slug);
  
  if (!campaign) {
    notFound();
  }

  const detailTab = searchParams?.tab === 'info' ? 'info' : 'cerita';
  
  let btnLabel = "Donasi Sekarang";
  if (campaign.is_zakat) btnLabel = "Tunaikan Zakat";
  if (campaign.is_qurban) btnLabel = "Qurban Sekarang";

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="relative h-64 w-full shrink-0">
        <Image src={campaign.image_url || '/placeholder.jpg'} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" priority />
        <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <Link href="/" className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={24} />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-40 -mt-6 bg-white rounded-t-3xl relative z-10 no-scrollbar shadow-lg">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
        <div className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">{campaign.category_name}</div>
        <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{campaign.title}</h1>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-2xl font-bold text-teal-600 mb-1">{formatIDR(Number(campaign.collected))}</p>
          {!campaign.has_no_target && (
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${campaign.progress}%` }}></div>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span className="font-bold text-gray-800">{campaign.donors} Donatur</span>
            {campaign.has_no_time_limit ? (
              <span className="font-bold text-teal-600">Selalu Terbuka</span>
            ) : (
              <span className="font-bold text-gray-800">{campaign.daysLeft} Hari</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 mb-5">
          <Link href={`?tab=cerita`} replace scroll={false} className={`pb-3 flex-1 font-bold text-sm text-center transition-all relative ${detailTab === 'cerita' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Cerita
            {detailTab === 'cerita' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
          </Link>
          <Link href={`?tab=info`} replace scroll={false} className={`pb-3 flex-1 font-bold text-sm text-center transition-all relative ${detailTab === 'info' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
            Info Terbaru
            {detailTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
          </Link>
        </div>

        {/* Tab Content: Cerita */}
        {detailTab === 'cerita' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Cerita Penggalangan Dana</h3>
            <p className="text-gray-600 text-sm leading-relaxed text-justify mb-6 whitespace-pre-line">
              {campaign.description}
              <br /><br />
              Donasi Anda sangat berarti. Mari kita bersama-sama mewujudkan kebaikan ini sekarang juga. Berapapun donasi Anda akan sangat membantu tujuan mulia ini.
            </p>
          </div>
        )}

        {/* Tab Content: Info Terbaru (Timeline) */}
        {detailTab === 'info' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Kabar Penyaluran</h3>

            {campaign.updates.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-gray-100 mb-6">
                <p className="text-gray-500 text-sm font-medium">Belum ada info terbaru saat ini.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-teal-100 ml-3 pl-5 space-y-6 pb-6">
                {campaign.updates.map((update: any) => {
                  const dateObj = new Date(update.created_at);
                  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
                  return (
                    <Link
                      href={`/news/${update.id}`}
                      key={update.id}
                      className="block relative bg-white border border-gray-100 shadow-sm rounded-xl p-4 hover:border-teal-200 active:scale-[0.98] transition-all"
                    >
                      <div className="absolute -left-[27px] top-4 w-4 h-4 bg-teal-500 rounded-full border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider">{formattedDate}</p>
                      <h4 className="font-bold text-gray-800 text-sm mb-2 leading-tight">{update.title}</h4>
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">{update.excerpt}</p>
                      <span className="text-teal-600 text-[11px] font-bold flex items-center gap-1">Baca selengkapnya <ChevronRight size={12} /></span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-sm p-4 pb-6 border-t border-gray-100 z-30">
        <CheckoutButton href={`/kampanye/${campaign.slug}/checkout`} label={btnLabel} />
      </div>
    </div>
  );
}
