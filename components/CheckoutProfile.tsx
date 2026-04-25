'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { formatIDR } from '@/lib/utils';
import CampaignSummaryCard from './CampaignSummaryCard';

const LS_KEY = 'lenteradonasi_checkout_data';

export default function CheckoutProfile({ campaign, variants }: any) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [qurbanNames, setQurbanNames] = useState<string[]>([]);
  const [checkoutData, setCheckoutData] = useState<any>({});

  // Fire AddToCart ad event on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).fbq) (window as any).fbq('track', 'AddToCart', { content_name: campaign.title });
      if ((window as any).ttq) (window as any).ttq.track('AddToCart', { content_name: campaign.title });
      if ((window as any).gtag) (window as any).gtag('event', 'add_to_cart', { items: [{ item_name: campaign.title }] });
    }
  }, [campaign.title]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCheckoutData(parsed);
        // Also load donor data from the donor-specific key
        const donorSaved = localStorage.getItem('lenteradonasi_donor_data');
        if (donorSaved) {
          const donorParsed = JSON.parse(donorSaved);
          setName(donorParsed.name || '');
          setEmail(donorParsed.email || '');
          setPhone(donorParsed.phone || '');
          setIsAnonymous(typeof donorParsed.isAnonymous === 'boolean' ? donorParsed.isAnonymous : false);
        }
      } catch (e) {
        console.error('Failed to parse checkout data', e);
      }
    }
    setLoaded(true);
  }, []);

  // Redirect if no checkout data
  useEffect(() => {
    if (loaded && !checkoutData.amount) {
      router.replace(`/kampanye/${campaign.slug}/checkout`);
    }
  }, [loaded, checkoutData, campaign.slug, router]);

  const isValidEmail = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone === '' || /^[0-9+\-\s]+$/.test(phone);
  const isProfileComplete = (name.trim() !== '' || isAnonymous) && 
                            isValidEmail && 
                            isValidPhone && 
                            (email !== '' || phone !== '');

  const currentTotalAmount = checkoutData.amount || 0;
  const donationMode = checkoutData.donationMode || 'open';
  const packageQty = checkoutData.packageQty || 1;

  const goNext = () => {
    // Save donor data
    localStorage.setItem('lenteradonasi_donor_data', JSON.stringify({
      name, email, phone, isAnonymous
    }));
    // Update checkout data with profile
    const updated = {
      ...checkoutData,
      donorName: name.trim() || (isAnonymous ? 'Hamba Allah' : 'Anonim'),
      donorEmail: email || null,
      donorPhone: phone || null,
      isAnonymous,
      qurbanNames
    };
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    router.push(`/kampanye/${campaign.slug}/checkout/payment`);
  };

  if (!loaded || !checkoutData.amount) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="font-bold text-lg text-gray-800 ml-2">Lengkapi Data</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <CampaignSummaryCard campaign={campaign} />

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
          <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider">Data Diri Pembayar</h3>
          
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="mb-4">
               <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Lengkap</label>
               <input type="text" placeholder="" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors" />
            </div>

            <div className="mb-4">
               <label className="block text-xs font-bold text-gray-700 mb-1.5">Alamat Email</label>
               <input type="email" placeholder="contoh@gmail.com" value={email} onChange={e => setEmail(e.target.value)} className={`w-full bg-white border ${email && !isValidEmail ? 'border-red-500' : 'border-gray-200'} py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors`} />
               {email && !isValidEmail && <p className="text-red-500 text-[10px] mt-1">Format email tidak valid</p>}
            </div>

            <div className="mb-5">
               <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor WhatsApp <span className="text-gray-400 font-medium">(Opsional)</span></label>
               <input type="tel" placeholder="081234xxxx" value={phone} onChange={e => setPhone(e.target.value)} className={`w-full bg-white border ${phone && !isValidPhone ? 'border-red-500' : 'border-gray-200'} py-3 px-4 rounded-xl outline-teal-500 text-sm focus:border-teal-500 transition-colors`} />
               {phone && !isValidPhone && <p className="text-red-500 text-[10px] mt-1">Format telepon tidak valid</p>}
               <p className="text-[10px] text-gray-500 mt-2">Masukan nomor darurat bisa kami hubungi.</p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
               <div>
                 <p className="text-sm font-bold text-gray-800">Sembunyikan nama saya</p>
                 <p className="text-[10px] text-gray-500">Tampil sebagai Hamba Allah</p>
               </div>
               <div onClick={() => setIsAnonymous(!isAnonymous)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isAnonymous ? 'bg-teal-500' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${isAnonymous ? 'translate-x-6' : ''}`}></div>
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
                      <label className="block text-xs font-bold text-gray-700 mb-2">Nama Mudhohi ke-{i+1}</label>
                      <input type="text" placeholder={`Nama lengkap Mudhohi ke-${i+1}`} value={qurbanNames[i] || ''} onChange={e => {
                        const newNames = [...qurbanNames];
                        newNames[i] = e.target.value;
                        setQurbanNames(newNames);
                      }} className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-gray-200 py-3 px-4 rounded-xl outline-teal-500 text-sm transition-colors" />
                    </div>
                  ))}
                </div>
             </div>
           );
        })()}

      </div>
      <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] text-center">
         <button onClick={goNext} disabled={!isProfileComplete} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl disabled:bg-gray-300 active:scale-[0.98] transition-transform">Pilih Metode Pembayaran</button>
      </div>
    </div>
  );
}
