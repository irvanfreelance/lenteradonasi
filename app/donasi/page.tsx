import React from 'react';
import Link from 'next/link';
import { History, Award, Receipt } from 'lucide-react';
import Header from '@/components/layout/Header';

export const revalidate = 0; // Dynamic for history

async function getHistory() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  // Mock logged in user email
  const res = await fetch(`${baseUrl}/api/user/transactions?email=andi@email.com`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export default async function DonasiSayaPage() {
  const history = await getHistory();
  const isLoggedIn = true; // Still true for phase demo

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header subtitle="Riwayat Donasi Kebaikan" />
      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <History size={40} />
            </div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Belum Ada Riwayat</h2>
            <p className="text-gray-500 text-sm mb-6">Silakan masuk ke akun Anda untuk melihat semua riwayat dan laporan donasi kebaikanmu.</p>
            <Link href="/profil" className="w-full text-center bg-teal-600 text-white font-bold text-base py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform block">
              Masuk Sekarang
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-400 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/30 mb-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <p className="text-teal-50 text-sm font-semibold mb-1">Total Kebaikanmu</p>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Level: Orang Baik</h2>
                <div className="flex items-center text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Award size={14} className="mr-1.5 text-yellow-300 fill-yellow-300" />
                  <span className="font-medium">Teruslah menebar manfaat</span>
                </div>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-4">Riwayat Terbaru</h3>
            {history.length === 0 ? (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl">
                 <p className="text-gray-500">Anda belum melakukan donasi.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((item: any, i: number) => {
                  const dateObj = new Date(item.created_at);
                  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
                  const statusColors = item.status === 'PAID' ? 'text-green-600 bg-green-100' : item.status === 'PENDING' ? 'text-amber-600 bg-amber-100' : 'text-gray-600 bg-gray-100';

                  return (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 border border-teal-100">
                        <Receipt size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{formattedDate}</p>
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{item.campaign_title || 'Donasi Umum'}</h4>
                        <p className="font-bold text-teal-600 text-sm">Rp {Number(item.total_amount).toLocaleString('id-ID')}</p>
                      </div>
                      <div className={`${statusColors} text-[10px] font-bold px-2 py-1 rounded-md`}>
                        {item.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
