'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Edit3, Check } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

const LS_KEY = 'lenteradonasi_checkout_data';
const DONOR_KEY = 'lenteradonasi_donor_data';

// Skeleton shown only while localStorage is being read (< 1 frame usually)
function Skeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-pulse">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="ml-3 w-32 h-5 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="h-14 bg-gray-100 rounded-2xl" />
        <div className="h-10 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

export default function CheckoutProfile() {
  const router = useRouter();

  // All sourced from localStorage — no server prop needed
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [doa, setDoa] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [qurbanNames, setQurbanNames] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Default to editing unless we find saved data
  const [hasSavedData, setHasSavedData] = useState(false);

  // Read localStorage synchronously on first paint to minimize flash
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // No checkout data — redirect back to start
      router.replace('/');
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.amount) {
      router.replace('/');
      return;
    }
    setCheckoutData(parsed);

    // Pre-fill donor profile from prior sessions
    const donorRaw = localStorage.getItem(DONOR_KEY);
    if (donorRaw) {
      const d = JSON.parse(donorRaw);
      setName(d.name || '');
      setEmail(d.email || '');
      setPhone(d.phone || '');
      setDoa(d.doa || '');
      setIsAnonymous(typeof d.isAnonymous === 'boolean' ? d.isAnonymous : false);

      if (d.name && d.phone) {
        setHasSavedData(true);
        setIsEditing(false);
      }
    }
  }, [router]);

  // Fire ad event once checkout data is ready
  useEffect(() => {
    if (!checkoutData) return;
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'AddToCart', { content_name: checkoutData.campaignTitle });
      if ((window as any).ttq) (window as any).ttq.track('AddToCart', { content_name: checkoutData.campaignTitle });
      if ((window as any).gtag) (window as any).gtag('event', 'add_to_cart', { items: [{ item_name: checkoutData.campaignTitle }] });
    }
  }, [checkoutData]);

  const isValidEmail = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone === '' || /^[0-9+\-\s]+$/.test(phone);
  const isProfileComplete =
    (name.trim() !== '' || isAnonymous) &&
    isValidEmail &&
    isValidPhone &&
    phone !== '';

  const goNext = useCallback(() => {
    setIsNavigating(true);
    // Merge donor data (preserving paymentMethodId from previous session)
    const existingDonor = localStorage.getItem(DONOR_KEY);
    const existingParsed = existingDonor ? JSON.parse(existingDonor) : {};
    localStorage.setItem(DONOR_KEY, JSON.stringify({ ...existingParsed, name, email, phone, doa, isAnonymous }));

    // Update checkout data with profile info
    const updated = {
      ...checkoutData,
      donorName: name.trim() || (isAnonymous ? 'Hamba Allah' : 'Anonim'),
      donorEmail: email || null,
      donorPhone: phone || null,
      isAnonymous,
      doa: doa.trim() || null,
      qurbanNames,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    router.push(`/kampanye/${checkoutData.campaignSlug}/checkout/payment`);
  }, [name, email, phone, doa, isAnonymous, qurbanNames, checkoutData, router]);

  if (!checkoutData) return <Skeleton />;

  const currentTotalAmount = checkoutData.amount || 0;
  const donationMode = checkoutData.donationMode || 'open';
  const packageQty = checkoutData.packageQty || 1;
  const namesAllowed = packageQty * (checkoutData.variantNamesPerQty || 1);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <button
          onClick={() => { setIsNavigating(true); router.back(); }}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-medium text-lg text-gray-800 ml-2">Lengkapi Data</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
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

        <div className="bg-white rounded-2xl p-3 border border-gray-100 mb-4 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-gray-500 text-[10px] font-bold mb-0.5 uppercase tracking-wider">Total Donasi</p>
            <p className="text-teal-600 font-extrabold text-xl">{formatIDR(currentTotalAmount)}</p>
          </div>
          {checkoutData.campaignCategoryName && (
            <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-2 py-1 rounded-lg shadow-sm border border-teal-100 uppercase tracking-wider">
              {checkoutData.campaignCategoryName}
            </span>
          )}
        </div>

        {/* Donor Profile Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="font-normal text-gray-800 text-[13px]">
              {isEditing ? 'Profil Donatur' : 'Lanjutkan dengan Data Berikut'}
            </h3>
            {hasSavedData && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-orange-500 font-bold text-xs flex items-center gap-1 border border-orange-200 bg-orange-50 px-3 py-1 rounded-lg hover:bg-orange-100 transition-colors"
              >
                Edit Data <Edit3 size={12} />
              </button>
            )}
          </div>

          {!isEditing ? (
            /* Quick Selection Card for Returning Donors */
            <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Decorative Stripe Header */}
              <div className="h-2 w-full flex">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full \${i % 3 === 0 ? 'bg-red-500' : i % 3 === 1 ? 'bg-blue-600' : 'bg-white'}`} />
                ))}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-medium text-gray-800 leading-tight">{name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Ditunaikan atas nama</p>
                  </div>
                  <div
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                  >
                    <span className="text-[11px] font-medium text-gray-600 text-right leading-tight max-w-[80px]">Tampilkan Sebagai Hamba Allah</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isAnonymous ? 'border-transparent' : 'bg-white border-gray-300 group-hover:border-gray-400'}`} style={{ backgroundColor: isAnonymous ? 'var(--color-teal-500, #0d9488)' : undefined }}>
                      {isAnonymous && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center text-sm font-normal text-gray-700">
                  <span className="tracking-wide">{phone}</span>
                  <span className="text-gray-400 font-medium lowercase overflow-hidden text-ellipsis max-w-[180px]">{email}</span>
                </div>
              </div>

              {/* Dynamic Primary Color Footer Bar */}
              <div className="py-2 px-4 text-center" style={{ backgroundColor: 'var(--color-teal-600, #0d9488)' }}>
                <p className="text-[10px] font-medium text-white tracking-tight">
                  *Notifikasi transaksi & penyaluran akan dikirim ke No.HP &/ Email yang aktif
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="mb-3">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  placeholder="081234xxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors"
                />
                {phone && !isValidPhone && <p className="text-red-500 text-[10px] mt-1">Format telepon tidak valid</p>}
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  placeholder="contoh@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 py-2.5 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors"
                />
                {email && !isValidEmail && <p className="text-red-500 text-[10px] mt-1">Format email tidak valid</p>}
                <p className="text-[9px] text-gray-400 mt-1.5 italic">Nomor WhatsApp dan Email diperlukan untuk pengiriman notifikasi.</p>
              </div>

              <label className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2 cursor-pointer group">
                <div>
                  <p className="text-[13px] font-bold text-gray-800">Sembunyikan nama saya</p>
                  <p className="text-[10px] text-gray-500 italic mt-0.5">Tampil sebagai Hamba Allah</p>
                </div>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isAnonymous ? 'border-transparent' : 'bg-white border-gray-300 group-hover:border-gray-400'}`} style={{ backgroundColor: isAnonymous ? 'var(--color-teal-500, #0d9488)' : undefined }}>
                  <input type="checkbox" className="sr-only" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  {isAnonymous && <Check size={16} className="text-white" strokeWidth={4} />}
                </div>
              </label>

              {hasSavedData && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full mt-5 py-3 text-[13px] font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Doa / Pesan */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2.5 text-[13px]">Doa / Pesan Kebaikan</h3>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <textarea
              rows={2}
              placeholder="Tuliskan doa Anda (opsional)..."
              value={doa}
              onChange={e => setDoa(e.target.value)}
              className="w-full bg-white border border-gray-200 py-2 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Qurban Names */}
        {checkoutData.campaignIsQurban && donationMode === 'package' && namesAllowed > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">ATAS NAMA (MUDHOHI)</h3>
              <span className="text-teal-600 font-bold text-[10px] bg-teal-50 px-2 py-1 rounded">{namesAllowed} Pequrban</span>
            </div>
            <div className="bg-[#FFFCEB] border border-[#FDEB96] p-4 rounded-xl mb-4 text-center">
              <p className="text-xs text-[#8A6A00] leading-relaxed">
                Anda memilih <strong>{packageQty} Qty ({checkoutData.variantName})</strong>. Sesuai ketentuan, ini mencakup slot <strong>{namesAllowed} Mudhohi/Pequrban</strong>. Silakan isi nama yang diniatkan untuk berqurban (opsional jika untuk diri sendiri).
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-6">
              {[...Array(namesAllowed)].map((_, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Nama Mudhohi ke-{i + 1}</label>
                  <input
                    type="text"
                    placeholder={`Nama lengkap Mudhohi ke-${i + 1}`}
                    value={qurbanNames[i] || ''}
                    onChange={e => {
                      const newNames = [...qurbanNames];
                      newNames[i] = e.target.value;
                      setQurbanNames(newNames);
                    }}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-gray-200 py-3 px-4 rounded-xl outline-teal-500 text-sm transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
        <button
          onClick={goNext}
          disabled={!isProfileComplete || isNavigating}
          className={`w-full flex items-center justify-center gap-2 text-white font-bold text-lg py-4 rounded-xl active:scale-[0.98] transition-transform ${(!isProfileComplete || isNavigating) ? 'bg-gray-300' : 'bg-teal-600'}`}
        >
          {isNavigating ? <><Loader2 className="animate-spin" size={20} /> Memproses...</> : 'Pilih Metode Pembayaran'}
        </button>
      </div>
    </div>
  );
}
