import React from 'react';
import { Award } from 'lucide-react';
import Header from '@/components/layout/Header';
import { query } from '@/lib/db';
import { redis } from '@/lib/redis';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import HistoryList from './HistoryList';

export const revalidate = 0; // Always dynamic (personal data)

const LIMIT = 5;

async function getNgoConfig() {
  const cacheKey = `ngo:configs:global_v2`;
  let configsData: any = await redis.get(cacheKey);
  if (!configsData) {
    const confRes = await query('SELECT * FROM ngo_configs LIMIT 1', []);
    if (confRes.length > 0) {
      configsData = confRes[0];
      await redis.set(cacheKey, JSON.stringify(configsData), { ex: 3600 });
    } else {
      configsData = {};
    }
  } else if (typeof configsData === 'string') {
    configsData = JSON.parse(configsData);
  }
  return configsData;
}

async function getInitialHistory(donorId: string) {
  try {
    const [rows, countRes] = await Promise.all([
      query(
        `SELECT i.id, i.invoice_code, i.total_amount, i.status, i.created_at,
                c.title as campaign_title
         FROM invoices i
         LEFT JOIN transactions t ON t.invoice_id = i.id
         LEFT JOIN campaigns c ON c.id = t.campaign_id
         WHERE i.donor_id = $1
         ORDER BY i.created_at DESC
         LIMIT $2 OFFSET 0`,
        [donorId, LIMIT]
      ),
      query(
        `SELECT COUNT(*) as total FROM invoices WHERE donor_id = $1`,
        [donorId]
      ),
    ]);
    const total = parseInt(countRes[0]?.total ?? '0', 10);
    return { rows, hasMore: total > LIMIT, total };
  } catch (error) {
    console.error('Error fetching initial history:', error);
    return { rows: [], hasMore: false, total: 0 };
  }
}

async function getDonorStats(donorId: string) {
  try {
    const res = await query(
      `SELECT COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'PAID'), 0) as total_amount,
              COUNT(*) FILTER (WHERE i.status = 'PAID') as paid_count
       FROM invoices i
       WHERE i.donor_id = $1`,
      [donorId]
    );
    return {
      totalAmount: Number(res[0]?.total_amount ?? 0),
      paidCount: Number(res[0]?.paid_count ?? 0),
    };
  } catch {
    return { totalAmount: 0, paidCount: 0 };
  }
}

export default async function DonasiSayaPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/login');
  }

  const donorId = (session.user as any).id;

  const [{ rows: initialHistory, hasMore }, stats, configs] = await Promise.all([
    getInitialHistory(donorId),
    getDonorStats(donorId),
    getNgoConfig(),
  ]);

  const { totalAmount, paidCount } = stats;

  let level = 'Orang Baik';
  if (paidCount > 10 || totalAmount > 1_000_000) level = 'Pahlawan Kebaikan';
  if (paidCount > 50 || totalAmount > 10_000_000) level = 'Legenda Kebaikan';

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header
        subtitle="Riwayat Donasi Kebaikan"
        logoUrl={configs?.logo_url}
        ngoName={configs?.ngo_name}
      />

      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-400 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/30 mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
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

        {/* History Section */}
        <h3 className="font-bold text-gray-800 text-base mb-4">Riwayat Terbaru</h3>

        {/* Client component handles infinite scroll */}
        <HistoryList initialData={initialHistory} hasMoreInitial={hasMore} />
      </div>
    </div>
  );
}
