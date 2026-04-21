import React from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Wallet, History, ChevronRight, LogOut } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

export const revalidate = 0;

async function getProfile() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/user/profile?email=andi@email.com`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default async function ProfilPage() {
  const isLoggedIn = true;
  const profile = await getProfile();

  if (!isLoggedIn || !profile) {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative pb-24">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Masuk Akun</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-6 shadow-inner">
            <User size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pantau Jejak Kebaikanmu</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 pt-10 pb-20 px-5 rounded-b-[2.5rem] relative shadow-lg">
        <div className="absolute top-5 left-5 z-20">
          <Link href="/" className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <h1 className="text-xl font-bold text-white mb-6 text-center relative z-10">Profil Akun</h1>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white rounded-full p-1 shadow-md">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Andi&backgroundColor=e2e8f0" alt="Avatar" className="w-full h-full rounded-full bg-gray-100" />
          </div>
          <div className="text-white">
            <h2 className="font-bold text-lg mb-0.5">{profile.name}</h2>
            <p className="text-teal-100 text-xs mb-1.5">{profile.email}</p>
            <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm font-medium">{profile.campaignsSupported} Kampanye didukung</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 px-5 -mt-8 relative z-20 no-scrollbar">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mb-5">
          {[{ icon: User, label: `Total Donasi: ${formatIDR(Number(profile.totalDonated))}`, color: 'text-blue-500', bg: 'bg-blue-50' }, 
            { icon: Wallet, label: `Level: ${profile.level}`, color: 'text-purple-500', bg: 'bg-purple-50' }, 
            { icon: History, label: 'Riwayat Transaksi Lengkap', color: 'text-teal-500', bg: 'bg-teal-50', link: '/donasi' }
          ].map((item, i) => {
            const content = (
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}><item.icon size={20} /></div>
                <span className="font-semibold text-gray-700 text-sm">{item.label}</span>
              </div>
            );
            
            return item.link ? (
               <Link href={item.link} key={i} className={`flex items-center justify-between p-4 ${i !== 2 ? 'border-b border-gray-50' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}>
                  {content}
                  <ChevronRight size={18} className="text-gray-300" />
               </Link>
            ) : (
              <div key={i} className={`flex items-center justify-between p-4 ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                {content}
              </div>
            );
          })}
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-500 font-bold py-4 rounded-2xl">
          <LogOut size={20} />Keluar Akun
        </button>
      </div>
    </div>
  );
}
