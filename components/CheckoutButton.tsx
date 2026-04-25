'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CheckoutButton({ href, label }: { href: string, label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex justify-center items-center gap-2 text-center text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform block ${loading ? 'bg-teal-500 shadow-none cursor-not-allowed' : 'bg-teal-600 shadow-teal-600/20 active:scale-[0.98]'}`}
    >
      {loading ? (
        <><Loader2 className="animate-spin" size={20} /> Memproses...</>
      ) : label}
    </button>
  );
}
