// Payment step — payment methods prefetched in parallel with ISR cache (5 min)
// Campaign data comes from localStorage, NOT from a fresh server fetch
import CheckoutPayment from "@/components/CheckoutPayment";

export const revalidate = 300; // ISR: payment methods cached for 5 min

async function getPaymentMethods() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/payment-methods`, {
      next: { revalidate: 300 } // ISR cache
    });
    if (!res.ok) {
      console.error(`Failed to fetch payment methods: ${res.status}`);
      return [];
    }
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('getPaymentMethods error:', error);
    return [];
  }
}

export default async function PaymentPage() {
  const paymentMethods = await getPaymentMethods();

  return (
    <CheckoutPayment paymentMethods={paymentMethods} />
  );
}
