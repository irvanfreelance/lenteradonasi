import { notFound } from "next/navigation";
import CheckoutFlow from "@/components/CheckoutFlow";

export const revalidate = 0;

async function getCheckoutData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const [campRes, pmRes] = await Promise.all([
    fetch(`${baseUrl}/api/campaigns/${slug}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/payment-methods`, { next: { revalidate: 300 } })
  ]);

  if (!campRes.ok || !pmRes.ok) return null;
  
  const campJson = await campRes.json();
  const pmJson = await pmRes.json();

  if (!campJson.data) return null;

  return { 
    campaign: campJson.data, 
    variants: campJson.data.variants || [], 
    paymentMethods: pmJson.data 
  };
}

export default async function CheckoutPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await getCheckoutData(params.slug);
  
  if (!data) notFound();

  return (
    <CheckoutFlow 
      campaign={data.campaign} 
      variants={data.variants} 
      paymentMethods={data.paymentMethods} 
    />
  );
}
