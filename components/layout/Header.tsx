'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, User, ChevronLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  isSearching?: boolean;
  onBackSearch?: () => void;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  ngoName?: string;
}

export default function Header({ isSearching, onBackSearch, title, subtitle, logoUrl, ngoName }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

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
          {logoUrl ? (
            <img src={logoUrl} alt={ngoName || 'Logo'} className="h-10 w-auto object-contain max-w-[120px]" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20">
              <Heart size={20} className="text-white fill-white" />
            </div>
          )}
          
          {(!logoUrl || title || subtitle) && (
            <div className="flex flex-col justify-center">
              {!logoUrl && (
                <span className="font-extrabold text-teal-700 text-lg leading-none tracking-tight font-sans">
                  {title || ngoName || <><span className="text-teal-700">Peduli</span><span className="text-teal-400">Sesama</span></>}
                </span>
              )}
              {(title && logoUrl) && (
                <span className="font-extrabold text-teal-700 text-lg leading-none tracking-tight font-sans">
                  {title}
                </span>
              )}
              {(subtitle || !title) && (
                <span className="text-gray-500 text-[11px] font-semibold mt-1">
                  {subtitle || "Selamat Pagi, Orang Baik 👋"}
                </span>
              )}
            </div>
          )}
        </div>
        <Link href={session ? "/profil" : "/login"} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 border border-gray-100 hover:bg-teal-50 hover:text-teal-600 transition-colors relative">
          <User size={20} />
          {session && (
             <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </Link>
      </div>
    </div>
  );
}
