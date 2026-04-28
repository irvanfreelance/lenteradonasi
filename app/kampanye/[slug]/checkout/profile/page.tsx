// Profile step — fully client-rendered from localStorage, zero server fetch
// Campaign data was already stored in localStorage from the /checkout step
import CheckoutProfile from "@/components/CheckoutProfile";

export default function ProfilePage() {
  return <CheckoutProfile />;
}
