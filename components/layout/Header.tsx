'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, User, ChevronLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  isSearching?: boolean;
  onBackSearch?: () => void;
  title?: string;
  subtitle?: string;
}

export default function Header({ isSearching, onBackSearch, title, subtitle }: HeaderProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white px-5 pt-8 pb-4 flex items-center sticky top-0 z-20 shadow-sm border-b border-gray-100">
      {isSearching && onBackSearch ? (
        <button onClick={onBackSearch} className="mr-3 p-1.5 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
      ) : isSearching && !onBackSearch ? (
        <Link href="/" className="mr-3 p-1.5 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
      ) : null}
      
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-teal-700 text-lg leading-none tracking-tight font-sans">Peduli<span className="text-teal-400">Sesama</span></span>
            <span className="text-gray-500 text-[11px] font-semibold mt-1">
              {subtitle || "Selamat Pagi, Orang Baik 👋"}
            </span>
          </div>
        </div>
        <Link href="/profil" className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 border border-gray-100 hover:bg-teal-50 hover:text-teal-600 transition-colors">
          <User size={20} />
        </Link>
      </div>
    </div>
  );
}
