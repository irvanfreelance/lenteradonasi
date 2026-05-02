import React from 'react';
import { History, Award, Receipt } from 'lucide-react';
import Header from '@/components/layout/Header';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Dynamic for history

async function getHistory(donorId: string) {
  try {
    const res = await query(
      `SELECT i.id, i.total_amount, i.status, i.created_at, c.title as campaign_title 
       FROM invoices i 
       LEFT JOIN campaigns c ON i.campaign_id = c.id 
       WHERE i.donor_id = $1 
       ORDER BY i.created_at DESC`,
      [donorId]
    );
    return res;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export default async function DonasiSayaPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/login');
  }

  const donorId = (session.user as any).id;
  const history = await getHistory(donorId);

  // Calculate totals
  const totalAmount = history.filter(h => h.status === 'PAID').reduce((sum, h) => sum + Number(h.total_amount), 0);
  const paidCount = history.filter(h => h.status === 'PAID').length;
  
  let level = "Orang Baik";
  if (paidCount > 10 || totalAmount > 1000000) level = "Pahlawan Kebaikan";

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header subtitle="Riwayat Donasi Kebaikan" />
      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-400 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/30 mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <p className="text-teal-50 text-sm font-semibold mb-1">Total Kebaikanmu</p>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Level: {level}</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex items-center text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="font-medium mr-1.5">Total:</span>
                <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="font-medium mr-1.5">Donasi Berhasil:</span>
                <span className="font-bold">{paidCount}x</span>
              </div>
            </div>
            <div className="flex items-center text-[10px] text-teal-100 mt-2">
              <Award size={12} className="mr-1 text-yellow-300 fill-yellow-300" />
              <span>Teruslah menebar manfaat untuk sesama</span>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 text-base mb-4">Riwayat Terbaru</h3>
        {history.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl flex flex-col items-center">
            <History size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Belum ada riwayat donasi.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item: any, i: number) => {
              const dateObj = new Date(item.created_at);
              const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
              const statusColors = item.status === 'PAID' ? 'text-green-600 bg-green-100' : item.status === 'PENDING' ? 'text-amber-600 bg-amber-100' : 'text-gray-600 bg-gray-100';

              return (
                <div key={item.id || i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 border border-teal-100">
                    <Receipt size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{formattedDate}</p>
                    <h4 className="font-bold text-gray-800 text-sm truncate mb-1" title={item.campaign_title || 'Donasi Umum'}>
                      {item.campaign_title || 'Donasi Umum'}
                    </h4>
                    <p className="font-bold text-teal-600 text-sm">Rp {Number(item.total_amount).toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`${statusColors} text-[10px] font-bold px-2 py-1 rounded-md shrink-0`}>
                    {item.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
