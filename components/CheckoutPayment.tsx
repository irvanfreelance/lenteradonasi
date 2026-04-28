'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Banknote, Check, Loader2 } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

const LS_KEY = 'lenteradonasi_checkout_data';
const DONOR_KEY = 'lenteradonasi_donor_data';

const typeLabels: Record<string, string> = {
  'va': 'Virtual Account',
  'e_wallet': 'E-Wallet',
  'retail_outlet': 'Gerai Retail',
  'qr_code': 'QR Code / QRIS',
  'manual': 'Transfer Manual',
  'manual_transfer': 'Transfer Manual',
};

const typeInfo: Record<string, { title: string; subtitle: string }> = {
  'qr_code': { title: 'QRIS', subtitle: '(Min. 1.000) *Dicek Otomatis' },
  'va': { title: 'Bank Transfer Otomatis', subtitle: '(Min. 10.000) *Dicek Otomatis' },
  'e_wallet': { title: 'eWallet', subtitle: '(Min. 1.000) *Dicek Otomatis' },
  'retail_outlet': { title: 'Gerai Retail / Minimarket', subtitle: '(Min. 10.000) *Dicek Otomatis' },
  'manual_transfer': { title: 'Transfer Manual', subtitle: '(Min. 10.000) *Dicek Manual' },
  'manual': { title: 'Transfer Manual', subtitle: '(Min. 10.000) *Dicek Manual' },
};

function Skeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-pulse">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="ml-3 w-40 h-5 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="h-14 bg-gray-100 rounded-2xl" />
        <div className="h-28 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPayment({ paymentMethods }: { paymentMethods: any[] }) {
  const router = useRouter();

  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isChangingPayment, setIsChangingPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read localStorage synchronously — instant, no render delay
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { router.replace('/'); return; }

    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { router.replace('/'); return; }

    if (!parsed.donorName) {
      // Profile step not completed — redirect back
      const slug = parsed.campaignSlug;
      router.replace(slug ? `/kampanye/${slug}/checkout/profile` : '/');
      return;
    }
    setCheckoutData(parsed);

    // Restore previously selected payment method
    const donorRaw = localStorage.getItem(DONOR_KEY);
    if (donorRaw && paymentMethods?.length > 0) {
      try {
        const donor = JSON.parse(donorRaw);
        if (donor.paymentMethodId) {
          const found = paymentMethods.find((pm: any) => pm.id === donor.paymentMethodId);
          if (found) {
            setSelectedPayment(found);
            setIsChangingPayment(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    // No previous selection — expand first category
    if (paymentMethods?.length > 0) {
      setActiveCategory(paymentMethods[0].type);
      setIsChangingPayment(true);
    }
  }, [paymentMethods, router]);

  // Fire ad event once data is ready
  useEffect(() => {
    if (!checkoutData) return;
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'InitiateCheckout');
      if ((window as any).ttq) (window as any).ttq.track('InitiateCheckout');
      if ((window as any).gtag) (window as any).gtag('event', 'begin_checkout', { value: checkoutData.amount, currency: 'IDR' });
    }
  }, [checkoutData]);

  // Build grouped payment list (preserve insertion order = sort_order from DB)
  const groupedArray: { type: string; methods: any[] }[] = [];
  const groupedMap = new Map<string, { type: string; methods: any[] }>();
  paymentMethods?.forEach((pm: any) => {
    if (!groupedMap.has(pm.type)) {
      const g = { type: pm.type, methods: [] };
      groupedMap.set(pm.type, g);
      groupedArray.push(g);
    }
    groupedMap.get(pm.type)!.methods.push(pm);
  });

  const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  const currentTotalAmount = checkoutData?.amount || 0;
  const adminFeeFlat = selectedPayment ? Number(selectedPayment.admin_fee_flat || 0) : 0;
  const adminFeePct = selectedPayment ? Number(selectedPayment.admin_fee_pct || 0) : 0;
  const adminFee = adminFeeFlat + (currentTotalAmount * (adminFeePct / 100));
  const finalTotalAmount = currentTotalAmount + adminFee;

  const selectPayment = useCallback((m: any) => {
    setSelectedPayment(m);
    setIsChangingPayment(false);
    // Persist immediately so next visit restores the choice
    const donorRaw = localStorage.getItem(DONOR_KEY);
    const donor = donorRaw ? JSON.parse(donorRaw) : {};
    donor.paymentMethodId = m.id;
    localStorage.setItem(DONOR_KEY, JSON.stringify(donor));
  }, []);

  const submitDonation = useCallback(async () => {
    if (!selectedPayment || !checkoutData) return;
    setLoading(true);

    try {
      const payload = {
        campaignId: checkoutData.campaignId,
        amount: currentTotalAmount,
        donorName: checkoutData.donorName,
        donorEmail: checkoutData.donorEmail || null,
        donorPhone: checkoutData.donorPhone || null,
        isAnonymous: checkoutData.isAnonymous,
        doa: checkoutData.doa || null,
        paymentMethodId: selectedPayment.id,
        paymentType: selectedPayment.code,
        qty: checkoutData.donationMode === 'package' ? checkoutData.packageQty : 1,
        qurbanNames: checkoutData.qurbanNames || [],
        affiliateId: checkoutData.affiliateId || null,
        fbClickId: getCookie('fbclid') || null,
        fbBrowserId: getCookie('_fbp') || null,
        tiktokClickId: getCookie('ttclid') || null,
        googleClickId: getCookie('gclid') || null,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === 'success') {
        // Persist payment method choice
        const donorRaw = localStorage.getItem(DONOR_KEY);
        if (donorRaw) {
          const donor = JSON.parse(donorRaw);
          donor.paymentMethodId = selectedPayment.id;
          localStorage.setItem(DONOR_KEY, JSON.stringify(donor));
        }
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
  }, [selectedPayment, checkoutData, currentTotalAmount, router]);

  if (!checkoutData) return <Skeleton />;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg text-gray-800 ml-2">Metode Pembayaran</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {/* Campaign Summary from localStorage */}
        <div className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
          {checkoutData.campaignImageUrl && (
            <img
              src={checkoutData.campaignImageUrl}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="ml-3">
            <p className="text-[10px] text-gray-500 font-semibold">
              {checkoutData.campaignIsZakat ? 'Zakat untuk:' : 'Mendonasikan untuk:'}
            </p>
            <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug">
              {checkoutData.campaignTitle}
            </p>
          </div>
        </div>

        {/* Rincian Pembayaran */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Rincian Pembayaran</h3>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-[13px] font-medium">
                  {checkoutData.variantName || checkoutData.campaignTitle}
                  {' '}(x{checkoutData.donationMode === 'package' ? checkoutData.packageQty : 1})
                </span>
                <span className="text-gray-800 font-bold text-[13px]">{formatIDR(currentTotalAmount)}</span>
              </div>
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
          /* Quick-confirm card for returning users — one tap to checkout */
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
          /* Category grid + expandable methods */
          <div className="grid grid-cols-2 gap-2.5">
            {groupedArray.map((group, idx) => {
              const info = typeInfo[group.type] || { title: typeLabels[group.type] || group.type, subtitle: '' };
              const previewText = group.methods.map((m: any) => m.name).join(', ');
              const isActive = activeCategory === group.type;
              const isLeftCol = idx % 2 === 0;
              return (
                <React.Fragment key={group.type}>
                  <button
                    onClick={() => setActiveCategory(isActive ? '' : group.type)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-teal-50/60 border-teal-400 shadow-sm ring-1 ring-teal-300'
                        : 'bg-white border-gray-100 shadow-sm hover:bg-gray-50'
                    }`}
                  >
                    <h3 className={`font-bold text-[13px] leading-snug ${isActive ? 'text-teal-800' : 'text-gray-900'}`}>
                      {info.title}
                    </h3>
                    {info.subtitle && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{info.subtitle}</p>}
                    <p className="text-[10px] text-orange-500 font-medium truncate mt-1.5 leading-tight">{previewText}</p>
                  </button>

                  {/* Spacer so expanded list starts on a new full row */}
                  {isActive && isLeftCol && <div />}

                  {isActive && (
                    <div className="col-span-2 bg-white rounded-xl shadow-sm border border-teal-200 overflow-hidden mt-1 mb-2">
                      {group.methods.map((m: any, mIdx: number, arr: any[]) => {
                        const isSelected = selectedPayment?.id === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => selectPayment(m)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${mIdx !== arr.length - 1 ? 'border-b border-gray-100' : ''} bg-white hover:bg-teal-50/30`}
                          >
                            <div className="flex items-center gap-3">
                              {m.logo_url
                                ? <img src={m.logo_url} className="w-8 h-8 object-contain" alt={m.name} />
                                : <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"><Banknote size={16} className="text-gray-400" /></div>
                              }
                              <div className="flex flex-col">
                                <span className="font-bold text-[13px] text-gray-800">{m.name}</span>
                                {(Number(m.admin_fee_flat) > 0 || Number(m.admin_fee_pct) > 0) && (
                                  <span className="text-[11px] text-gray-500 mt-0.5">
                                    Admin: {formatIDR(Number(m.admin_fee_flat) + (currentTotalAmount * (Number(m.admin_fee_pct) / 100)))}
                                  </span>
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

        {/* NGO Note */}
        <div className="bg-gray-100/70 p-4 rounded-xl border border-gray-200 mt-6 mb-4">
          <span className="text-[12px] font-bold text-gray-800 mb-1.5 block">Note :</span>
          <p className="text-[11px] text-gray-600 leading-relaxed text-justify">
            Dana yang didonasikan melalui <span className="font-bold">Lembaga Kami</span> bukan bersumber dari dana yang tidak halal dan bukan untuk tujuan pencucian uang (money laundry), termasuk terorisme maupun tindak kejahatan lainnya serta donasi yang Sahabat titipkan sudah termasuk donasi operasional <span className="font-bold">Lembaga Kami</span>.
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
        <button
          onClick={submitDonation}
          disabled={!selectedPayment || loading}
          className={`w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 rounded-xl active:scale-[0.98] transition-transform ${(!selectedPayment || loading) ? 'bg-gray-300' : 'bg-teal-600'}`}
        >
          {loading ? <><Loader2 className="animate-pulse" size={20} /> Memproses...</> : 'Bayar Sekarang'}
        </button>
      </div>
    </div>
  );
}
