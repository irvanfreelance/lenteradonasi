'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calculator, Minus, Plus, Banknote, Check } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import Image from 'next/image';

const GOLD_PRICE_PER_GRAM = 1250000;
const NISAB_MAAL = 85 * GOLD_PRICE_PER_GRAM;
const NISAB_PROFESI = Math.floor(NISAB_MAAL / 12);
const quickAmounts = [10000, 25000, 50000, 100000, 200000, 500000];

export default function CheckoutFlow({ campaign, variants, paymentMethods }: any) {
  const router = useRouter();
  const [step, setStep] = useState<'amount' | 'profile' | 'payment'>('amount');
  const [loading, setLoading] = useState(false);

  // States
  const [donationMode, setDonationMode] = useState(campaign.is_fixed_amount ? 'package' : 'open');
  const [packageQty, setPackageQty] = useState(1);
  const [zakatMode, setZakatMode] = useState('calculator');
  const [zakatCalcType, setZakatCalcType] = useState('profesi');
  const [zakatInput, setZakatInput] = useState('');
  const [zakatResult, setZakatResult] = useState<number | null>(null);

  const [donationData, setDonationData] = useState({
    amount: campaign.is_fixed_amount && variants && variants.length > 0 ? variants[0].price : 0,
    customAmount: '',
    name: '',
    email: '',
    phone: '',
    isAnonymous: false,
    paymentMethod: null as any,
    qurbanNames: [] as string[]
  });

  // Load from LocalStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('lenteradonasi_donor_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDonationData(prev => {
          const newData = {
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            phone: parsed.phone || prev.phone,
            isAnonymous: typeof parsed.isAnonymous === 'boolean' ? parsed.isAnonymous : prev.isAnonymous,
          };

          // Restore payment method if exists
          if (parsed.paymentMethodId && paymentMethods) {
            const found = paymentMethods.find((pm: any) => pm.id === parsed.paymentMethodId);
            if (found) newData.paymentMethod = found;
          }

          return newData;
        });
      } catch (e) {
        console.error('Failed to parse saved donor data', e);
      }
    }
  }, [paymentMethods]);

  // Save to LocalStorage
  React.useEffect(() => {
    const dataToSave = {
      name: donationData.name,
      email: donationData.email,
      phone: donationData.phone,
      isAnonymous: donationData.isAnonymous,
      paymentMethodId: donationData.paymentMethod?.id
    };
    localStorage.setItem('lenteradonasi_donor_data', JSON.stringify(dataToSave));
  }, [donationData.name, donationData.email, donationData.phone, donationData.isAnonymous, donationData.paymentMethod]);

  const goBackUrl = `/kampanye/${campaign.slug}`;


  // Validasi Profile
  const isValidEmail = donationData.email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email);
  const isValidPhone = donationData.phone === '' || /^[0-9+\-\s]+$/.test(donationData.phone);
  const isProfileComplete = (donationData.name.trim() !== '' || donationData.isAnonymous) &&
    isValidEmail &&
    isValidPhone &&
    (donationData.email !== '' || donationData.phone !== '');

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
      setDonationData(prev => ({ ...prev, amount: zakatAmount, customAmount: zakatAmount.toString() }));
      setZakatResult(zakatAmount);
    }
  };

  const submitDonation = async () => {
    setLoading(true);

    // Tracking Event
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'InitiateCheckout');
      if ((window as any).ttq) (window as any).ttq.track('InitiateCheckout');
      if ((window as any).gtag) (window as any).gtag('event', 'begin_checkout', { value: currentTotalAmount, currency: 'IDR' });
    }

    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };

      const payload = {
        campaignId: campaign.id,
        amount: currentTotalAmount,
        donorName: donationData.name.trim() || (donationData.isAnonymous ? 'Hamba Allah' : 'Anonim'),
        donorEmail: donationData.email || null,
        donorPhone: donationData.phone || null,
        isAnonymous: donationData.isAnonymous,
        paymentMethodId: donationData.paymentMethod.id,
        paymentType: donationData.paymentMethod.code,
        qty: donationMode === 'package' ? packageQty : 1,
        qurbanNames: donationData.qurbanNames,
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

  const CampaignSummaryCard = () => (
    <div className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6">
      {campaign.image_url && <img src={campaign.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
      <div className="ml-3">
        <p className="text-[10px] text-gray-500 font-semibold">{campaign.is_zakat ? "Zakat untuk:" : "Mendonasikan untuk:"}</p>
        <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug">{campaign.title}</p>
      </div>
    </div>
  );

  const currentTotalAmount = (donationMode === 'package' && variants && variants.length > 0)
    ? variants[0].price * packageQty
    : donationData.amount;

  if (step === 'amount') {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => router.push(goBackUrl)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Pilih Nominal</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-32">
          <CampaignSummaryCard />

          {/* Toggle Donasi Paket vs Donasi Bebas for fixed_amount campaigns */}
          {campaign.is_fixed_amount && !campaign.is_zakat && (
            <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
              <button onClick={() => setDonationMode('package')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${donationMode === 'package' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Paket</button>
              <button onClick={() => setDonationMode('open')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${donationMode === 'open' ? 'bg-white text-teal-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Bebas</button>
            </div>
          )}

          {campaign.is_zakat && (
            <>
              {/* Zakat Form Simplified */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-6 shadow-sm">
                <p className="text-xl font-extrabold text-emerald-800">{formatIDR(GOLD_PRICE_PER_GRAM)} <span className="text-sm font-medium">/ gram (Harga Emas)</span></p>
              </div>
              <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
                <button onClick={() => setZakatMode('calculator')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${zakatMode === 'calculator' ? 'bg-white text-teal-600 border border-gray-100' : 'text-gray-500'}`}>Kalkulator</button>
                <button onClick={() => setZakatMode('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${zakatMode === 'manual' ? 'bg-white text-teal-600 border border-gray-100' : 'text-gray-500'}`}>Input Manual</button>
              </div>
              {zakatMode === 'calculator' ? (
                <div className="bg-white border border-teal-100 rounded-2xl p-5 mb-6">
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setZakatCalcType('profesi')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'profesi' ? 'bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}>Profesi</button>
                    <button onClick={() => setZakatCalcType('maal')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'maal' ? 'bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}>Maal</button>
                  </div>
                  <input type="number" placeholder="Total (Rp)" value={zakatInput} onChange={e => setZakatInput(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 mb-4 outline-teal-500" />
                  <button onClick={calculateZakat} className="w-full bg-teal-100 text-teal-700 font-bold py-3 rounded-xl mb-4">Hitung Zakat</button>
                  {zakatResult && (
                    <div className="mt-4"><p className="text-2xl font-bold text-emerald-600">{formatIDR(zakatResult)}</p></div>
                  )}
                </div>
              ) : (
                <input type="number" placeholder="Nominal Zakat" value={donationData.customAmount} onChange={e => setDonationData({ ...donationData, customAmount: e.target.value, amount: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-gray-300 rounded-xl py-4 px-4 text-lg font-bold outline-teal-500 shadow-sm" />
              )}
            </>
          )}

          {(!campaign.is_zakat && donationMode === 'open') && (
            <>
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Pilih Nominal Cepat</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickAmounts.map(amt => (
                    <button key={amt} onClick={() => setDonationData({ ...donationData, amount: amt, customAmount: amt.toString() })} className={`py-4 rounded-xl border text-center font-bold text-sm ${donationData.amount === amt ? 'bg-teal-50 border-teal-600 text-teal-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
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
                  <input type="number" placeholder="50000" value={donationData.customAmount} onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setDonationData({ ...donationData, customAmount: e.target.value, amount: val });
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
                    <button onClick={() => setPackageQty(Math.max(1, packageQty - 1))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-all"><Minus size={16} /></button>
                    <span className="w-10 text-center font-bold text-lg text-gray-800">{packageQty}</span>
                    <button onClick={() => setPackageQty(packageQty + 1)} className="w-10 h-10 flex items-center justify-center text-teal-600 hover:text-teal-700 rounded-lg transition-all"><Plus size={16} /></button>
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
          <button onClick={() => {
            if (donationMode === 'package' && variants && variants.length > 0) {
              setDonationData({ ...donationData, amount: variants[0].price * packageQty });
            }
            setStep('profile');
          }} disabled={(donationMode === 'open' && donationData.amount < 10000)} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">Lanjutkan</button>
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative pb-24">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => setStep('amount')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Lengkapi Data</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-32">
          <CampaignSummaryCard />

          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-gray-500 text-[11px] font-bold mb-1 uppercase tracking-wider">Total Donasi</p>
              <p className="text-teal-600 font-extrabold text-2xl">{formatIDR(currentTotalAmount)}</p>
            </div>
            {campaign.category_name && (
              <span className="bg-teal-50 text-teal-700 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm border border-teal-100 uppercase tracking-wider">{campaign.category_name}</span>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider">Profil Donatur</h3>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" placeholder="" value={donationData.name} onChange={e => setDonationData({ ...donationData, name: e.target.value })} className="w-full bg-white border border-gray-200 py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors" />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Alamat Email</label>
                <input type="email" placeholder="contoh@gmail.com" value={donationData.email} onChange={e => setDonationData({ ...donationData, email: e.target.value })} className={`w-full bg-white border ${donationData.email && !isValidEmail ? 'border-red-500' : 'border-gray-200'} py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors`} />
                {donationData.email && !isValidEmail && <p className="text-red-500 text-[10px] mt-1">Format email tidak valid</p>}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor WhatsApp <span className="text-gray-400 font-medium">(Opsional)</span></label>
                <input type="tel" placeholder="081234xxxx" value={donationData.phone} onChange={e => setDonationData({ ...donationData, phone: e.target.value })} className={`w-full bg-white border ${donationData.phone && !isValidPhone ? 'border-red-500' : 'border-gray-200'} py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors`} />
                {donationData.phone && !isValidPhone && <p className="text-red-500 text-[10px] mt-1">Format telepon tidak valid</p>}
                <p className="text-[10px] text-gray-500 mt-2">Masukan nomor darurat bisa kami hubungi.</p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">Sembunyikan nama saya</p>
                  <p className="text-[10px] text-gray-500">Tampil sebagai Hamba Allah</p>
                </div>
                <div onClick={() => setDonationData({ ...donationData, isAnonymous: !donationData.isAnonymous })} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${donationData.isAnonymous ? 'bg-teal-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${donationData.isAnonymous ? 'translate-x-6' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Qurban Mudhohi Form section */}
          {campaign.is_qurban && donationMode === 'package' && variants && variants.length > 0 && (() => {
            const namesAllowed = packageQty * (variants[0].names_per_qty || 1);
            return (
              <div className="mb-6">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">ATAS NAMA (MUDHOHI)</h3>
                  <span className="text-teal-600 font-bold text-[10px] bg-teal-50 px-2 py-1 rounded">{namesAllowed} Pequrban</span>
                </div>

                <div className="bg-[#FFFCEB] border border-[#FDEB96] p-4 rounded-xl mb-4 text-center">
                  <p className="text-xs text-[#8A6A00] leading-relaxed">
                    Anda memilih <strong className="font-exrabold">{packageQty} Qty ({variants[0].name})</strong>. Sesuai ketentuan, ini mencakup slot <strong>{namesAllowed} Mudhohi/Pequrban</strong>. Silakan isi nama yang diniatkan untuk berqurban (opsional jika untuk diri sendiri).
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-6">
                  {[...Array(namesAllowed)].map((_, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-gray-700 mb-2">Nama Mudhohi ke-{i + 1}</label>
                      <input type="text" placeholder={`Nama lengkap Mudhohi ke-${i + 1}`} value={donationData.qurbanNames[i] || ''} onChange={e => {
                        const newNames = [...donationData.qurbanNames];
                        newNames[i] = e.target.value;
                        setDonationData({ ...donationData, qurbanNames: newNames });
                      }} className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-gray-200 py-3 px-4 rounded-xl outline-teal-500 text-sm transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
          <button onClick={() => setStep('payment')} disabled={!isProfileComplete} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">Pilih Metode Pembayaran</button>
        </div>
      </div>
    );
  }

  // Payment Selection
  const groupPayments = paymentMethods?.reduce((acc: any, curr: any) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    'va': 'Virtual Account',
    'e_wallet': 'E-Wallet',
    'retail_outlet': 'Gerai Retail',
    'qr_code': 'QR Code / QRIS',
    'manual': 'Transfer Manual'
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <button onClick={() => setStep('profile')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="font-bold text-lg text-gray-800 ml-2">Metode Pembayaran</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <CampaignSummaryCard />

        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 mb-8 flex justify-between items-center shadow-sm">
          <p className="text-teal-800 font-bold text-sm">Total Tagihan:</p>
          <p className="text-teal-800 font-extrabold text-lg">{formatIDR(currentTotalAmount)}</p>
        </div>

        {Object.entries(groupPayments || {}).map(([type, methods]: any, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="font-bold text-[11px] text-gray-800 mb-3 uppercase tracking-wider">{typeLabels[type] || type}</h3>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {methods.map((m: any, mIdx: number) => {
                const isSelected = donationData.paymentMethod?.id === m.id;
                return (
                  <div key={m.id} onClick={() => setDonationData({ ...donationData, paymentMethod: m })} className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${mIdx !== methods.length - 1 ? 'border-b border-gray-100' : ''} bg-white hover:bg-slate-50`}>
                    <div className="flex items-center gap-4">
                      {m.logo_url ? <img src={m.logo_url} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center"><Banknote size={16} className="text-gray-400" /></div>}
                      <span className="font-bold text-sm text-gray-800">{m.name}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                      {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
        <button onClick={submitDonation} disabled={!donationData.paymentMethod || loading} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">
          {loading ? "Memproses..." : "Bayar Sekarang"}
        </button>
      </div>
    </div>
  );
}
