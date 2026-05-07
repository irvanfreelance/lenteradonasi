// Payment step — payment methods prefetched in parallel with ISR cache (5 min)
// Campaign data comes from localStorage, NOT from a fresh server fetch
import CheckoutPayment from "@/components/CheckoutPayment";
import { getActivePaymentMethods } from "@/lib/payments";

export const revalidate = 300; // ISR: payment methods cached for 5 min

async function getPaymentMethods() {
  try {
    // DIRECT SERVICE CALL: Instant loading, bypasses HTTP overhead
    const pm = await getActivePaymentMethods();
    return pm || [];
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
