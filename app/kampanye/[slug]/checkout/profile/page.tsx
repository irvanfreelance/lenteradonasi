import { notFound } from "next/navigation";
import CheckoutProfile from "@/components/CheckoutProfile";

export const revalidate = 0;

async function getCampaignData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/campaigns/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.data) return null;
  return { campaign: json.data, variants: json.data.variants || [] };
}

export default async function ProfilePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await getCampaignData(params.slug);
  if (!data) notFound();

  return (
    <CheckoutProfile 
      campaign={data.campaign} 
      variants={data.variants} 
    />
  );
}
