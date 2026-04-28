import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import ShareButton from "@/components/ShareButton";
import AffiliateTracker from "@/components/AffiliateTracker";
import CampaignTabs from "@/components/CampaignTabs";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const campaign = await getCampaignDetail(params.slug);

  if (!campaign) {
    return { title: 'Kampanye Tidak Ditemukan' };
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
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
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
  // ISR cache: Next.js dedupes concurrent RSC calls automatically
  const res = await fetch(`${baseUrl}/api/campaigns/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch campaign detail');
  }
  const json = await res.json();
  return json.data;
}

// Pre-generate the top 20 campaigns as static pages at build time
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/campaigns`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    const campaigns: any[] = json.data || [];
    return campaigns.slice(0, 20).map((c: any) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function CampaignDetail(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const campaign = await getCampaignDetail(params.slug);

  if (!campaign) notFound();

  let btnLabel = "Donasi Sekarang";
  if (campaign.is_zakat) btnLabel = "Tunaikan Zakat";
  if (campaign.is_qurban) btnLabel = "Qurban Sekarang";

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Capture ?aff= query param — invisible, no UI */}
      <Suspense fallback={null}>
        <AffiliateTracker campaignId={campaign.id} />
      </Suspense>

      <div className="relative h-64 w-full shrink-0">
        <Image
          src={campaign.image_url || '/placeholder.jpg'}
          alt={campaign.title}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          priority
          quality={85}
        />
        <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <Link href="/" className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={24} />
          </Link>
          <ShareButton
            url={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/kampanye/${campaign.slug}`}
            title={campaign.title}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white border-none hover:bg-white/40 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-40 -mt-6 bg-white rounded-t-3xl relative z-10 no-scrollbar shadow-lg">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
          {campaign.category_name}
        </div>
        <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{campaign.title}</h1>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-2xl font-bold text-teal-600 mb-1">{formatIDR(Number(campaign.collected))}</p>
          {!campaign.has_no_target && (
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${campaign.progress}%` }} />
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

        {/* Client-side instant tab switcher — no URL navigation, no animations */}
        <CampaignTabs
          slug={params.slug}
          description={campaign.description}
          updates={campaign.updates}
        />
      </div>

      <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-sm p-4 pb-6 border-t border-gray-100 z-30">
        <CheckoutButton href={`/kampanye/${campaign.slug}/checkout`} label={btnLabel} />
      </div>
    </div>
  );
}
