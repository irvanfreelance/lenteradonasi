import { notFound } from "next/navigation";
import CheckoutAmount from "@/components/CheckoutAmount";

// ISR: cache for 60 seconds — campaign data changes slowly
export const revalidate = 60;

async function getCampaignData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  // Use ISR cache — Redis already caches the underlying API, so this is fast
  const res = await fetch(`${baseUrl}/api/campaigns/${slug}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.data) return null;
  return { campaign: json.data, variants: json.data.variants || [] };
}

export default async function CheckoutPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await getCampaignData(params.slug);
  if (!data) notFound();

  return (
    <CheckoutAmount
      campaign={data.campaign}
      variants={data.variants}
    />
  );
}
