'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Clock, ChevronDown, Upload, Image as ImageIcon, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatIDR } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function InvoiceInteractive({ invoice, invoiceCode }: { invoice: any, invoiceCode?: string }) {
  const router = useRouter();
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState('23:59:59');
  
  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManual = invoice.payment_method_name?.toLowerCase().includes('manual') || invoice.va_number === '7123456789';

  // Simulated countdown
  useEffect(() => {
    let hours = 23, minutes = 59, seconds = 59;
    const interval = setInterval(() => {
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
      }
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyVa = () => {
    if (invoice.va_number) {
      const cleanVa = invoice.va_number.replace(/\s+/g, '');
      navigator.clipboard.writeText(cleanVa);
    }
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleCopyAmount = () => {
    const amountStr = Number(invoice.total_amount).toString();
    navigator.clipboard.writeText(amountStr);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // If not manual or no file selected, just simulate success redirect
    if (!isManual || !selectedFile) {
      router.push(`/status/${invoiceCode || 'SIM'}`);
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload file to our API (Vercel Blob)
      const form = new FormData();
      form.append('file', selectedFile);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: form
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.url;

      // 2. We skip updating the DB here for SIM-, but we could if we wanted
      if (invoice.invoice_code && !invoice.invoice_code.startsWith('SIM-')) {
        await fetch(`/api/invoice/${invoice.invoice_code}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proofUrl: fileUrl })
        });
      }

      // Upload success, go back to home or success
      router.push(`/status/${invoiceCode || 'SIM'}`);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunggah foto. Silakan coba lagi.');
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-32">
      {/* Toast VA */}
      {copiedVa && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-teal-400"></div> Nomor berhasil disalin
        </div>
      )}
      {/* Toast Amount */}
      {copiedAmount && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-teal-400"></div> Nominal berhasil disalin
        </div>
      )}

      <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0 justify-center">
        <h2 className="font-bold text-lg text-gray-800">Instruksi Pembayaran</h2>
      </div>

      <div className="p-5 pb-40 flex-1 w-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-yellow-800 text-sm mb-1">Selesaikan Pembayaran Sebelum</h3>
            <p className="text-yellow-700 text-xs font-bold font-mono bg-yellow-100 inline-block px-2 py-1 rounded">
              {timeLeft}
            </p>
          </div>
        </div>

        <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
           <p className="text-gray-500 text-sm font-semibold mb-1">Total Tagihan</p>
           
           <div className="flex items-center justify-center gap-3 mb-6">
             <h1 className="text-3xl font-extrabold text-teal-600">{formatIDR(Number(invoice.total_amount))}</h1>
             <button onClick={handleCopyAmount} className="text-teal-600 bg-teal-50 p-1.5 rounded-lg hover:bg-teal-100 transition-colors active:scale-95" title="Salin Nominal">
               <Copy size={16} />
             </button>
           </div>
           
           {/* Dynamic Payment Details */}
           {invoice.payment_method_type === 'va' || invoice.payment_method_type === 'manual' ? (
             <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-gray-300 relative text-left">
               <p className="text-xs text-gray-500 mb-1 font-semibold">{invoice.payment_method_type === 'manual' ? 'Nomor Rekening' : 'Nomor Virtual Account'} ({invoice.payment_method_name})</p>
               <div className="flex items-center justify-between gap-3">
                 <div className="flex flex-col">
                   <span className="text-2xl font-bold tracking-wider text-gray-800">{invoice.va_number || 'Tidak tersedia'}</span>
                   {invoice.payment_method_type === 'manual' && <span className="text-xs text-gray-500 font-medium mt-1">a/n Yayasan Peduli Sesama</span>}
                 </div>
                 <button onClick={handleCopyVa} className="text-teal-600 bg-teal-50 p-2 shrink-0 rounded-lg hover:bg-teal-100 transition-colors active:scale-95" title="Salin">
                   <Copy size={18} />
                 </button>
               </div>
             </div>
           ) : invoice.payment_method_type === 'retail_outlet' ? (
             <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-gray-300 relative text-center">
               <p className="text-xs text-gray-500 mb-3 font-semibold">Kode Pembayaran ({invoice.payment_method_name})</p>
               <h2 className="text-3xl font-black tracking-widest text-gray-800 mb-4">{invoice.va_number}</h2>
               <div className="bg-white p-3 rounded-lg border border-gray-200 inline-block mb-3">
                 <img 
                   src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${invoice.va_number}&scale=2&rotate=N&includetext`} 
                   alt="Barcode Pembayaran"
                   className="h-16 mx-auto"
                 />
               </div>
               <button onClick={handleCopyVa} className="w-full flex items-center justify-center gap-2 text-teal-600 bg-teal-50 py-2 rounded-lg font-bold text-sm">
                 <Copy size={16} /> Salin Kode
               </button>
             </div>
           ) : invoice.payment_method_type === 'e_wallet' ? (
             <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-gray-300 relative text-center">
               <p className="text-xs text-gray-500 mb-4 font-semibold">Bayar Menggunakan {invoice.payment_method_name}</p>
               {invoice.payment_url ? (
                 <a 
                   href={invoice.payment_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-[#6000D3] text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                   style={{ backgroundColor: invoice.payment_method_code === 'OVO' ? '#6000D3' : '#322E85' }}
                 >
                   Buka Aplikasi {invoice.payment_method_name}
                 </a>
               ) : (
                 <p className="text-red-500 text-xs">Link pembayaran tidak tersedia.</p>
               )}
               <p className="text-[10px] text-gray-400 mt-4 italic">*Anda akan diarahkan ke aplikasi {invoice.payment_method_name} untuk menyelesaikan pembayaran.</p>
             </div>
           ) : invoice.payment_method_type === 'qr_code' ? (
              <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-gray-300 relative text-center">
                <p className="text-xs text-gray-500 mb-4 font-semibold">Scan QR Code untuk Membayar</p>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block">
                  {(() => {
                    let qrString = '';
                    try {
                      const urlData = JSON.parse(invoice.payment_url || '{}');
                      qrString = urlData.qr_string || '';
                    } catch (e) {
                      qrString = invoice.payment_url || '';
                    }
                    return qrString ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`} 
                        alt="QR Code Pembayaran"
                        className="w-48 h-48 mx-auto"
                      />
                    ) : <p className="text-red-500 text-xs">QR Code tidak tersedia.</p>;
                  })()}
                </div>
                <p className="text-[10px] text-gray-400 mt-4 italic">*Bisa di-scan menggunakan DANA, OVO, GoPay, ShopeePay, atau LinkAja.</p>
              </div>
           ) : null}
        </div>


        <h3 className="font-bold text-gray-800 mb-4 px-1">Cara Pembayaran</h3>
        
        <div className="flex flex-col gap-3 mb-6">
          {invoice.instructions?.map((inst: any, idx: number) => (
            <details key={idx} className="group bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" open={idx === 0}>
              <summary className="font-bold text-sm text-gray-800 p-4 cursor-pointer list-none flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition-colors select-none">
                <span className="flex items-center gap-2.5">
                  <span className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                  {inst.title}
                </span>
                <ChevronDown size={18} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <div className="p-4 border-t border-gray-100 bg-white text-sm text-gray-700 leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2 [&_strong]:font-bold [&_strong]:text-gray-900" dangerouslySetInnerHTML={{ __html: inst.content }}></div>
            </details>
          ))}
        </div>

        {/* Upload Proof Area (Only for Manual Transfer) */}
        {isManual && (
          <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-gray-800 mb-2">Unggah Bukti Transfer</h3>
            <p className="text-gray-500 text-[11px] mb-4">Pastikan nominal dan nomor rekening tujuan terlihat jelas.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />

            {!previewUrl ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-teal-200 bg-teal-50/50 hover:bg-teal-50 transition-colors rounded-xl p-8"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Upload className="text-teal-500" size={24} />
                </div>
                <span className="font-semibold text-sm text-teal-700">Pilih Foto Bukti Transfer</span>
              </button>
            ) : (
              <div className="w-full border border-gray-200 rounded-xl overflow-hidden relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview Bukti" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white/90 text-gray-800 p-2 rounded-full hover:bg-white transition-colors" title="Ubah Foto">
                    <RefreshCcw size={20} />
                  </button>
                </div>
                <div className="bg-teal-50 border-t border-gray-100 p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold">
                    <CheckCircle size={14} className="text-teal-500" /> Foto siap diunggah
                  </div>
                  <button onClick={handleClearFile} className="text-gray-500 hover:text-red-500 text-xs font-medium">Batal</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe z-20">
        <button 
          onClick={handleSubmit}
          disabled={isUploading || (isManual && !selectedFile)}
          className={`w-full flex justify-center items-center gap-2 text-center text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-transform block ${isUploading || (isManual && !selectedFile) ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-teal-600 shadow-teal-600/20 active:scale-[0.98]'}`}
        >
          {isUploading ? (
            <><Loader2 className="animate-spin" size={20} /> Memproses...</>
          ) : isManual && !selectedFile ? 'Pilih Foto Dahulu' : 'Saya Sudah Bayar'}
        </button>
      </div>
    </div>
  );
}
