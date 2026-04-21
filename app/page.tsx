import Image from "next/image";
import Link from "next/link";
import { Heart, Clock, User, Globe, Mail, MessageCircle, ChevronLeft } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import SearchInput from "@/components/SearchInput";
import CampaignCard from "@/components/CampaignCard";
import CategoryGrid from "@/components/CategoryGrid";
import Header from "@/components/layout/Header";
import AutoCarousel from "@/components/AutoCarousel";

export const dynamic = 'force-dynamic';

async function getData(searchQ?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const [campRes, catRes] = await Promise.all([
    fetch(`${baseUrl}/api/campaigns${searchQ ? `?q=${encodeURIComponent(searchQ)}` : ''}`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}/api/categories`, { next: { revalidate: 120 } })
  ]);

  if (!campRes.ok || !catRes.ok) {
    throw new Error('Failed to fetch data');
  }

  const campaignsData = await campRes.json();
  const categoriesData = await catRes.json();

  return { campaigns: campaignsData.data, categories: categoriesData.data };
}

export default async function Home(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const isSearching = !!q;
  
  const { campaigns: allCampaigns, categories } = await getData(q);
  const urgentCampaigns = allCampaigns.filter((c: any) => c.is_urgent && !isSearching);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/60 to-slate-50 relative pb-24">
      {/* Header */}
      <Header isSearching={isSearching} />

      <SearchInput />

      {!isSearching && (
        <>
          {/* Banners Carousel */}
          <AutoCarousel campaigns={allCampaigns.slice(0, 5)} />

          {/* Categories */}
          <div className="px-5 mt-6 mb-8">
            <h2 className="font-bold text-gray-800 text-base mb-4">Kategori Pilihan</h2>
            <CategoryGrid categories={categories} />
          </div>

          {/* Urgent Highlight */}
          {urgentCampaigns.length > 0 && (
            <div className="mt-2 mb-8 bg-gradient-to-b from-rose-50/80 to-transparent py-5 border-t border-rose-100/50">
              <div className="px-5 flex items-center gap-2 mb-4">
                <div className="bg-rose-100 p-1.5 rounded-lg"><Clock size={18} className="text-rose-500" /></div>
                <h2 className="font-bold text-gray-800 text-base">Bantuan Mendesak</h2>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-5 pb-4 no-scrollbar">
                {urgentCampaigns.map((camp: any) => (
                  <CampaignCard key={camp.id} camp={camp} variant="urgent" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Campaign List */}
      <div className="px-5 pb-6">
        <h2 className="font-bold text-gray-800 text-base mb-4">
          {isSearching ? `Hasil Pencarian (${allCampaigns.length})` : "Rekomendasi Kebaikan"}
        </h2>

        {allCampaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Tidak ada kampanye yang sesuai dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {allCampaigns.map((camp: any) => (
              <CampaignCard key={camp.id} camp={camp} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info Lembaga */}
      {!isSearching && (
        <div className="px-5 py-8 bg-slate-100 border-t border-gray-200 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-sm">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-extrabold text-teal-700 text-base leading-none tracking-tight">Peduli<span className="text-teal-400">Sesama</span></span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4 text-justify">
            Lembaga filantropi independen yang berdedikasi untuk menyalurkan kebaikan donatur secara transparan, profesional, dan tepat sasaran.
          </p>
          <div className="text-xs text-gray-500 mb-5">
            <p className="font-bold text-gray-700 mb-1">Alamat Kantor Pusat</p>
            <p>Jl. Kebaikan Bangsa No. 99, Gedung Amal Lt. 2, Jakarta Selatan</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors"><Mail size={14} /></a>
            <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors"><Globe size={14} /></a>
            <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors"><MessageCircle size={14} /></a>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400">© 2026 Yayasan Peduli Sesama. All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  );
}
