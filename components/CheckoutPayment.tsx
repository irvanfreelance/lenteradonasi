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
        // Restore selected payment from donor data
        const donorSaved = localStorage.getItem('lenteradonasi_donor_data');
        if (donorSaved) {
          const donorParsed = JSON.parse(donorSaved);
          if (donorParsed.paymentMethodId && paymentMethods) {
            const found = paymentMethods.find((pm: any) => pm.id === donorParsed.paymentMethodId);
            if (found) setSelectedPayment(found);
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

  const typeInfo: Record<string, { title: string, subtitle: string }> = {
    'qr_code': { title: 'QRIS', subtitle: '(Minimal Transaksi 1.000) *Dicek Otomatis' },
    'va': { title: 'Bank Transfer Otomatis', subtitle: '(Minimal Transaksi 10.000) *Dicek Otomatis' },
    'e_wallet': { title: 'eWallet', subtitle: '(Minimal Transaksi 1.000) *Dicek Otomatis' },
    'retail_outlet': { title: 'Gerai Retail / Minimarket', subtitle: '(Minimal Transaksi 10.000) *Dicek Otomatis' },
    'manual_transfer': { title: 'Transfer Manual', subtitle: '(Minimal Transaksi 10.000) *Dicek Manual' },
    'manual': { title: 'Transfer Manual', subtitle: '(Minimal Transaksi 10.000) *Dicek Manual' }
  };

  const currentTotalAmount = checkoutData.amount || 0;

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
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    } finally {
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
        <div className="flex-1 overflow-y-auto p-5 pb-32">
          <CampaignSummaryCard campaign={campaign} />
          
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 mb-8 flex justify-between items-center shadow-sm">
            <p className="text-teal-800 font-bold text-sm">Total Tagihan:</p>
            <p className="text-teal-800 font-extrabold text-lg">{formatIDR(currentTotalAmount)}</p>
          </div>

          {groupedArray.map((group: any, idx) => {
            const info = typeInfo[group.type] || { title: group.type, subtitle: '' };
            const previewText = group.methods.map((m: any) => m.name).join(', ');
            const hasSelectedMethod = group.methods.some((m: any) => m.id === selectedPayment?.id);
            
            return (
              <details 
                key={idx} 
                name="payment-accordion"
                className="group bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden" 
                open={hasSelectedMethod}
              >
                <summary className="p-3.5 cursor-pointer list-none flex justify-between items-center select-none bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col gap-0.5 pr-4">
                    <h3 className="font-bold text-[15px] text-gray-900 leading-tight">{info.title}</h3>
                    {info.subtitle && <p className="text-[11px] text-gray-500">{info.subtitle}</p>}
                    <p className="text-[11px] text-orange-600 font-medium truncate mt-0.5" style={{ maxWidth: '240px' }}>
                      {previewText}
                    </p>
                  </div>
                  <ChevronLeft size={18} className="text-gray-400 group-open:-rotate-90 rotate-180 transition-transform shrink-0" />
                </summary>

                <div className="border-t border-gray-100 bg-slate-50/50">
                  {group.methods.map((m: any, mIdx: number) => {
                    const isSelected = selectedPayment?.id === m.id;
                    return (
                      <div key={m.id} onClick={() => setSelectedPayment(m)} className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${mIdx !== group.methods.length - 1 ? 'border-b border-gray-100' : ''} bg-white hover:bg-teal-50/30`}>
                        <div className="flex items-center gap-3">
                          {m.logo_url ? <img src={m.logo_url} className="w-7 h-7 object-contain" /> : <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center"><Banknote size={14} className="text-gray-400" /></div>}
                          <span className="font-bold text-[13px] text-gray-800">{m.name}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                           {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
           <button onClick={submitDonation} disabled={!selectedPayment || loading} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">
             {loading ? "Memproses..." : "Bayar Sekarang"}
           </button>
        </div>
    </div>
  );
}
