'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Banknote, Check } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import CampaignSummaryCard from './CampaignSummaryCard';

const LS_KEY = 'lenteradonasi_checkout_data';

const typeLabels: Record<string, string> = {
  'va': 'Virtual Account',
  'e_wallet': 'E-Wallet',
  'retail_outlet': 'Gerai Retail',
  'qr_code': 'QR Code / QRIS',
  'manual': 'Transfer Manual'
};

export default function CheckoutPayment({ campaign, paymentMethods }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>({});
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  // Fire InitiateCheckout ad event on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'InitiateCheckout');
      if ((window as any).ttq) (window as any).ttq.track('InitiateCheckout');
      if ((window as any).gtag) (window as any).gtag('event', 'begin_checkout', { value: checkoutData.amount, currency: 'IDR' });
    }
  }, [checkoutData.amount]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCheckoutData(parsed);
        const donorSaved = localStorage.getItem('lenteradonasi_donor_data');
        if (donorSaved) {
          const donorParsed = JSON.parse(donorSaved);
          if (donorParsed.paymentMethodId && paymentMethods) {
            const found = paymentMethods.find((pm: any) => pm.id === donorParsed.paymentMethodId);
            if (found) {
              setSelectedPayment(found);
              setActiveCategory(found.type);
              // Has a previous selection: start in compact mode
              setIsChangingPayment(false);
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse checkout data', e);
      }
    }
    setLoaded(true);
  }, [paymentMethods]);

  // Redirect if no checkout data
  useEffect(() => {
    if (loaded && !checkoutData.donorName) {
      router.replace(`/kampanye/${campaign.slug}/checkout`);
    }
  }, [loaded, checkoutData, campaign.slug, router]);

  const groupedArray: { type: string; methods: any[] }[] = [];
  const groupedMap = new Map();

  paymentMethods?.forEach((pm: any) => {
    if (!groupedMap.has(pm.type)) {
      const groupObj = { type: pm.type, methods: [] };
      groupedMap.set(pm.type, groupObj);
      groupedArray.push(groupObj);
    }
    groupedMap.get(pm.type).methods.push(pm);
  });

  useEffect(() => {
    if (groupedArray.length > 0 && !activeCategory && !selectedPayment) {
      setActiveCategory(groupedArray[0].type);
      setIsChangingPayment(true);
    }
  }, [groupedArray.length, activeCategory, selectedPayment]);

  const typeInfo: Record<string, { title: string, subtitle: string }> = {
    'qr_code': { title: 'QRIS', subtitle: '(Minimal Transaksi 1.000) *Dicek Otomatis' },
    'va': { title: 'Bank Transfer Otomatis', subtitle: '(Minimal Transaksi 10.000) *Dicek Otomatis' },
    'e_wallet': { title: 'eWallet', subtitle: '(Minimal Transaksi 1.000) *Dicek Otomatis' },
    'retail_outlet': { title: 'Gerai Retail / Minimarket', subtitle: '(Minimal Transaksi 10.000) *Dicek Otomatis' },
    'manual_transfer': { title: 'Transfer Manual', subtitle: '(Minimal Transaksi 10.000) *Dicek Manual' },
    'manual': { title: 'Transfer Manual', subtitle: '(Minimal Transaksi 10.000) *Dicek Manual' }
  };

  const currentTotalAmount = checkoutData.amount || 0;

  // Calculate Admin Fee dynamically
  const adminFeeFlat = selectedPayment ? Number(selectedPayment.admin_fee_flat || 0) : 0;
  const adminFeePct = selectedPayment ? Number(selectedPayment.admin_fee_pct || 0) : 0;
  const adminFee = adminFeeFlat + (currentTotalAmount * (adminFeePct / 100));
  const finalTotalAmount = currentTotalAmount + adminFee;

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  const submitDonation = async () => {
    if (!selectedPayment) return;
    setLoading(true);

    try {
      const payload = {
        campaignId: checkoutData.campaignId,
        amount: currentTotalAmount,
        donorName: checkoutData.donorName,
        donorEmail: checkoutData.donorEmail || null,
        donorPhone: checkoutData.donorPhone || null,
        isAnonymous: checkoutData.isAnonymous,
        paymentMethodId: selectedPayment.id,
        paymentType: selectedPayment.code,
        qty: checkoutData.donationMode === 'package' ? checkoutData.packageQty : 1,
        qurbanNames: checkoutData.qurbanNames || [],
        fbClickId: getCookie('fbclid') || null,
        fbBrowserId: getCookie('_fbp') || null,
        tiktokClickId: getCookie('ttclid') || null,
        googleClickId: getCookie('gclid') || null
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === 'success') {
        // Save selected payment to donor data for future use
        const donorSaved = localStorage.getItem('lenteradonasi_donor_data');
        if (donorSaved) {
          const donorParsed = JSON.parse(donorSaved);
          donorParsed.paymentMethodId = selectedPayment.id;
          localStorage.setItem('lenteradonasi_donor_data', JSON.stringify(donorParsed));
        }
        // Clear checkout data
        localStorage.removeItem(LS_KEY);
        router.push(`/invoice/${data.data.invoice_code}`);
      } else {
        alert(data.message || 'Gagal membuat invoice');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
      setLoading(false);
    }
  };

  if (!loaded || !checkoutData.donorName) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Metode Pembayaran</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
          <CampaignSummaryCard campaign={campaign} />
          {/* Rincian Pembayaran */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Rincian Pembayaran</h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
               <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-gray-200">
                 {campaign.bundleItems && checkoutData.donationMode === 'package' ? (
                   campaign.bundleItems.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center">
                       <span className="text-gray-600 text-[13px] font-medium">{item.name} (x{item.qty * checkoutData.packageQty})</span>
                       <span className="text-gray-800 font-bold text-[13px]">{formatIDR(item.unit_price * item.qty * checkoutData.packageQty)}</span>
                     </div>
                   ))
                 ) : (
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600 text-[13px] font-medium">{checkoutData.variantName || checkoutData.campaignTitle} (x{checkoutData.donationMode === 'package' ? checkoutData.packageQty : 1})</span>
                     <span className="text-gray-800 font-bold text-[13px]">{formatIDR(currentTotalAmount)}</span>
                   </div>
                 )}
                 {adminFee > 0 && (
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600 text-[13px] font-medium">Biaya Admin</span>
                     <span className="text-gray-800 font-bold text-[13px]">{formatIDR(adminFee)}</span>
                   </div>
                 )}
               </div>
               <div className="flex justify-between items-center pt-3">
                 <span className="text-gray-800 font-bold text-sm">Total Tagihan</span>
                 <span className="text-teal-600 font-extrabold text-base">{formatIDR(finalTotalAmount)}</span>
               </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Pilih Metode Pembayaran</h3>
          
          {selectedPayment && !isChangingPayment ? (
            <div className="bg-white border-2 border-teal-500 rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                  {selectedPayment.logo_url ? (
                    <img src={selectedPayment.logo_url} className="w-10 h-10 object-contain" alt={selectedPayment.name} />
                  ) : (
                    <Banknote className="text-teal-600" size={24} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedPayment.name}</p>
                  <p className="text-xs text-gray-500">Metode pilihan Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChangingPayment(true)}
                className="text-teal-600 font-bold text-sm px-4 py-2 border border-teal-100 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {groupedArray.map((group, idx) => {
                const info = typeInfo[group.type] || { title: group.type, subtitle: '' };
                const previewText = group.methods.map((m: any) => m.name).join(', ');
                const isActive = activeCategory === group.type;
                const isLeftCol = idx % 2 === 0;
                return (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => setActiveCategory(isActive ? '' : group.type)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'bg-teal-50/60 border-teal-400 shadow-sm ring-1 ring-teal-300' 
                          : 'bg-white border-gray-100 shadow-sm hover:bg-gray-50'
                      }`}
                    >
                      <h3 className={`font-bold text-[13px] leading-snug ${isActive ? 'text-teal-800' : 'text-gray-900'}`}>{info.title}</h3>
                      {info.subtitle && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{info.subtitle}</p>}
                      <p className="text-[10px] text-orange-500 font-medium truncate mt-1.5 leading-tight">
                        {previewText}
                      </p>
                    </button>
                    {/* Right-col placeholder when left tab is active, so expanded list spans next full row */}
                    {isActive && isLeftCol && <div />}
                    {/* Expanded payment list — col-span-2, always inline directly below its row */}
                    {isActive && (
                      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-teal-200 overflow-hidden mt-1 mb-2">
                        {group.methods.map((m: any, mIdx: number, arr: any[]) => {
                          const isSelected = selectedPayment?.id === m.id;
                          return (
                            <div 
                              key={m.id} 
                              onClick={() => {
                                setSelectedPayment(m);
                                setIsChangingPayment(false);
                                // Save to donor data immediately
                                const donorSaved = localStorage.getItem('lenteradonasi_donor_data');
                                if (donorSaved) {
                                  const donorParsed = JSON.parse(donorSaved);
                                  donorParsed.paymentMethodId = m.id;
                                  localStorage.setItem('lenteradonasi_donor_data', JSON.stringify(donorParsed));
                                }
                              }} 
                              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${mIdx !== arr.length - 1 ? 'border-b border-gray-100' : ''} bg-white hover:bg-teal-50/30`}
                            >
                              <div className="flex items-center gap-3">
                                {m.logo_url ? <img src={m.logo_url} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"><Banknote size={16} className="text-gray-400" /></div>}
                                <div className="flex flex-col">
                                  <span className="font-bold text-[13px] text-gray-800">{m.name}</span>
                                  {(Number(m.admin_fee_flat) > 0 || Number(m.admin_fee_pct) > 0) && (
                                    <span className="text-[11px] text-gray-500 mt-0.5">Admin: {formatIDR(Number(m.admin_fee_flat) + (currentTotalAmount * (Number(m.admin_fee_pct) / 100)))}</span>
                                  )}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                                {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <div className="mb-6" />


          {/* NGO Note */}
          <div className="bg-gray-100/70 p-4 rounded-xl border border-gray-200 mt-6 mb-4">
            <span className="text-[12px] font-bold text-gray-800 mb-1.5 block">Note :</span>
            <p className="text-[11px] text-gray-600 leading-relaxed text-justify">
              Dana yang didonasikan melalui <span className="font-bold">{campaign.ngoName || 'Lembaga Kami'}</span> bukan bersumber dari dana yang tidak halal dan bukan untuk tujuan pencucian uang (money laundry), termasuk terorisme maupun tindak kejahatan lainnya serta donasi yang Sahabat titipkan sudah termasuk donasi operasional <span className="font-bold">{campaign.ngoName || 'Lembaga Kami'}</span>.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
           <button onClick={submitDonation} disabled={!selectedPayment || loading} className={`w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 rounded-xl active:scale-[0.98] transition-transform ${(!selectedPayment || loading) ? 'bg-gray-300' : 'bg-teal-600'}`}>
             {loading ? <><Banknote className="animate-pulse" size={20} /> Memproses...</> : "Bayar Sekarang"}
           </button>
        </div>
    </div>
  );
}
