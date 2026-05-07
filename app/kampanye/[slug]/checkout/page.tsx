import { notFound } from "next/navigation";
import CheckoutAmount from "@/components/CheckoutAmount";
import { getCampaignBySlug } from "@/lib/campaigns";

// ISR: cache for 60 seconds — campaign data changes slowly
export const revalidate = 60;

async function getCampaignData(slug: string) {
  try {
    // DIRECT SERVICE CALL: Instant loading, bypasses HTTP overhead
    const campaign = await getCampaignBySlug(slug);
    if (!campaign) return null;
    return { campaign: campaign, variants: campaign.variants || [] };
  } catch (error) {
    console.error(`getCampaignData error for ${slug}:`, error);
    return null;
  }
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
