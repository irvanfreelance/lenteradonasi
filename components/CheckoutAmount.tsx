'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import CampaignSummaryCard from './CampaignSummaryCard';

const GOLD_PRICE_PER_GRAM = 1250000;
const NISAB_MAAL = 85 * GOLD_PRICE_PER_GRAM;
const NISAB_PROFESI = Math.floor(NISAB_MAAL / 12);
const quickAmounts = [10000, 25000, 50000, 100000, 200000, 500000];

const LS_KEY = 'lenteradonasi_checkout_data';

export default function CheckoutAmount({ campaign, variants }: any) {
  const router = useRouter();

  const [donationMode, setDonationMode] = useState(campaign.is_fixed_amount ? 'package' : 'open');
  const [packageQty, setPackageQty] = useState(1);
  const [zakatMode, setZakatMode] = useState('calculator');
  const [zakatCalcType, setZakatCalcType] = useState('profesi');
  const [zakatInput, setZakatInput] = useState('');
  const [zakatResult, setZakatResult] = useState<number | null>(null);
  const [amount, setAmount] = useState(campaign.is_fixed_amount && variants && variants.length > 0 ? variants[0].price : 0);
  const [customAmount, setCustomAmount] = useState('');

  // Fire ViewContent ad event on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'ViewContent', { content_name: campaign.title });
      if ((window as any).ttq) (window as any).ttq.track('ViewContent', { content_name: campaign.title });
      if ((window as any).gtag) (window as any).gtag('event', 'view_item', { items: [{ item_name: campaign.title }] });
    }
  }, [campaign.title]);

  const calculateZakat = () => {
    const income = parseInt(zakatInput) || 0;
    let zakatAmount = 0;
    if (zakatCalcType === 'profesi') {
      if (income >= NISAB_PROFESI) zakatAmount = income * 0.025;
      else { alert(`Pendapatan belum mencapai Nisab profesi bulanan (${formatIDR(NISAB_PROFESI)}).`); setZakatResult(0); return; }
    } else {
      if (income >= NISAB_MAAL) zakatAmount = income * 0.025;
      else { alert(`Harta tersimpan belum mencapai Nisab maal tahunan (${formatIDR(NISAB_MAAL)}).`); setZakatResult(0); return; }
    }
    if (zakatAmount > 0) {
      setAmount(zakatAmount);
      setCustomAmount(zakatAmount.toString());
      setZakatResult(zakatAmount);
    }
  };

  const currentTotalAmount = (donationMode === 'package' && variants && variants.length > 0) 
    ? variants[0].price * packageQty 
    : amount;

  const goNext = () => {
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const data = {
      ...existing,
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      campaignImageUrl: campaign.image_url,
      campaignCategoryName: campaign.category_name,
      campaignIsZakat: campaign.is_zakat,
      campaignIsQurban: campaign.is_qurban,
      campaignIsFixedAmount: campaign.is_fixed_amount,
      amount: currentTotalAmount,
      donationMode,
      packageQty,
      variantName: variants?.[0]?.name,
      variantPrice: variants?.[0]?.price,
      variantNamesPerQty: variants?.[0]?.names_per_qty || 1,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    router.push(`/kampanye/${campaign.slug}/checkout/profile`);
  };

  const goBackUrl = `/kampanye/${campaign.slug}`;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <button onClick={() => router.push(goBackUrl)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="font-bold text-lg text-gray-800 ml-2">Pilih Nominal</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <CampaignSummaryCard campaign={campaign} />

        {/* Toggle Donasi Paket vs Donasi Bebas for fixed_amount campaigns */}
        {campaign.is_fixed_amount && !campaign.is_zakat && (
          <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
             <button onClick={() => setDonationMode('package')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${donationMode === 'package' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Paket</button>
             <button onClick={() => setDonationMode('open')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${donationMode === 'open' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Bebas</button>
          </div>
        )}

        {campaign.is_zakat && (
          <>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-6 shadow-sm">
               <p className="text-xl font-extrabold text-emerald-800">{formatIDR(GOLD_PRICE_PER_GRAM)} <span className="text-sm font-medium">/ gram (Harga Emas)</span></p>
            </div>
            <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
               <button onClick={() => setZakatMode('calculator')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${zakatMode === 'calculator'?'bg-white text-teal-600 border border-gray-100':'text-gray-500'}`}>Kalkulator</button>
               <button onClick={() => setZakatMode('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${zakatMode === 'manual'?'bg-white text-teal-600 border border-gray-100':'text-gray-500'}`}>Input Manual</button>
            </div>
            {zakatMode === 'calculator' ? (
              <div className="bg-white border border-teal-100 rounded-2xl p-5 mb-6">
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setZakatCalcType('profesi')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'profesi'?'bg-teal-50 text-teal-700':'border-gray-200 text-gray-500'}`}>Profesi</button>
                  <button onClick={() => setZakatCalcType('maal')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'maal'?'bg-teal-50 text-teal-700':'border-gray-200 text-gray-500'}`}>Maal</button>
                </div>
                <input type="number" placeholder="Total (Rp)" value={zakatInput} onChange={e => setZakatInput(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 mb-4 outline-teal-500" />
                <button onClick={calculateZakat} className="w-full bg-teal-100 text-teal-700 font-bold py-3 rounded-xl mb-4">Hitung Zakat</button>
                {zakatResult && (
                  <div className="mt-4"><p className="text-2xl font-bold text-emerald-600">{formatIDR(zakatResult)}</p></div>
                )}
              </div>
            ) : (
              <input type="number" placeholder="Nominal Zakat" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setAmount(parseInt(e.target.value) || 0); }} className="w-full bg-white border border-gray-300 rounded-xl py-4 px-4 text-lg font-bold outline-teal-500 shadow-sm" />
            )}
          </>
        )}

        {(!campaign.is_zakat && donationMode === 'open') && (
          <>
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Pilih Nominal Cepat</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map(amt => (
                  <button key={amt} onClick={() => { setAmount(amt); setCustomAmount(amt.toString()); }} className={`py-4 rounded-xl border text-center font-bold text-sm ${amount === amt ? 'bg-teal-50 border-teal-600 text-teal-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    {formatIDR(amt)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Atau Masukkan Nominal Lain</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">Rp</span>
                </div>
                <input type="number" placeholder="50000" value={customAmount} onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  setCustomAmount(e.target.value);
                  setAmount(val);
                }} className="w-full bg-white border border-gray-300 rounded-xl py-4 pl-12 pr-4 text-lg font-bold outline-teal-500" />
              </div>
              <p className="text-gray-400 text-[10px] mt-2">Minimum nominal Rp 10.000</p>
            </div>
          </>
        )}

        {(donationMode === 'package' && variants && variants.length > 0) && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tentukan Kuantitas</h3>
            <div className="bg-white border border-teal-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(20,184,166,0.08)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-extrabold text-gray-800">{variants[0].name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{formatIDR(variants[0].price)} / pkt</p>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                  <button onClick={() => setPackageQty(Math.max(1, packageQty-1))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-all"><Minus size={16} /></button>
                  <span className="w-10 text-center font-bold text-lg text-gray-800">{packageQty}</span>
                  <button onClick={() => setPackageQty(packageQty+1)} className="w-10 h-10 flex items-center justify-center text-teal-600 hover:text-teal-700 rounded-lg transition-all"><Plus size={16} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map(q => (
                  <button key={q} onClick={() => setPackageQty(q)} className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${packageQty === q ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>{q} Qty</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
         <div className="flex justify-between items-center mb-4">
           <span className="text-gray-500 font-bold text-sm">Total Tagihan</span>
           <span className="text-2xl font-extrabold text-teal-600">{formatIDR(currentTotalAmount)}</span>
         </div>
         <button onClick={goNext} disabled={(donationMode === 'open' && amount < 10000)} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">Lanjutkan</button>
      </div>
    </div>
  );
}
