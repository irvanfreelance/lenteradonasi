'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) {
        router.push(`/?q=${encodeURIComponent(query)}`);
      } else {
        router.push(`/`);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, router]);

  return (
    <div className="px-5 mt-5 mb-6">
      <div className="relative shadow-sm rounded-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kampanye atau kategori..."
          className="w-full bg-white text-gray-800 rounded-full py-3.5 px-12 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-sans"
        />
        <Search size={18} className="absolute left-5 top-4 text-gray-400" />
      </div>
    </div>
  );
}
