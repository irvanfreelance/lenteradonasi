'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Copy, Clock, ChevronDown, Upload, Image as ImageIcon, CheckCircle, RefreshCcw, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import { formatIDR } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function InvoiceInteractive({ invoice, invoiceCode }: { invoice: any, invoiceCode?: string }) {
  const router = useRouter();
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: '23', m: '59', s: '59' });
  const [isExpired, setIsExpired] = useState(false);
  const [expireDateStr, setExpireDateStr] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManual = invoice.payment_method_name?.toLowerCase().includes('manual') || invoice.va_number === '7123456789';

  // Realtime countdown based on expire_at or created_at + 24h
  useEffect(() => {
    if (!invoice.created_at && !invoice.invoice_code?.startsWith('SIM-')) return;
    
    const createdAt = new Date(invoice.created_at || new Date());
    
    // Expire time is the minimum of 6 hours from now or end of today (23:59:59)
    const target6Hours = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
    const endOfDay = new Date(createdAt);
    endOfDay.setHours(23, 59, 59, 999);
    
    const expireTime = target6Hours < endOfDay ? target6Hours : endOfDay;

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = expireTime;
    const dateStr = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()].toLowerCase()} ${d.getFullYear()} Pukul ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    setExpireDateStr(dateStr);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expireTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        setIsExpired(true);
        clearInterval(interval);
        return;
      }
      
      const h = Math.floor((diff / (1000 * 60 * 60))).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      
      setTimeLeft({ h, m, s });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [invoice.created_at, invoice.invoice_code]);

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

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('pdf-template');
      if (!element) return;
      
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_code || 'Invoice'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal mendownload PDF. Pastikan koneksi stabil.');
    } finally {
      setIsDownloadingPdf(false);
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

      <div className="p-5 pb-40 flex-1 w-full" id="invoice-content">
        <div className="bg-[#FFFCEB] border border-[#FDEB96] rounded-2xl p-6 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Clock size={80} />
          </div>
          
          <div className="flex flex-col items-center text-center mb-5">
            <div className="flex items-center gap-1.5 text-[#854d0e] mb-1">
              <Clock size={14} className="animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Batas Waktu Pembayaran</span>
            </div>
            <h3 className="font-medium text-[#713f12] text-base leading-tight">
              {expireDateStr}
            </h3>
          </div>
          
          <div className="flex justify-center items-center gap-3">
             <div className="flex flex-col items-center gap-1">
               <div className="bg-white border border-[#fef08a] rounded-xl w-14 h-14 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-black text-[#713f12]">{timeLeft.h}</span>
               </div>
               <span className="text-[10px] font-bold text-[#a16207] uppercase">Jam</span>
             </div>
             <span className="text-2xl font-bold text-[#fef08a] mb-5">:</span>
             <div className="flex flex-col items-center gap-1">
               <div className="bg-white border border-[#fef08a] rounded-xl w-14 h-14 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-black text-[#713f12]">{timeLeft.m}</span>
               </div>
               <span className="text-[10px] font-bold text-[#a16207] uppercase">Menit</span>
             </div>
             <span className="text-2xl font-bold text-[#fef08a] mb-5">:</span>
             <div className="flex flex-col items-center gap-1">
               <div className="bg-white border border-[#fef08a] rounded-xl w-14 h-14 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-black text-[#713f12]">{timeLeft.s}</span>
               </div>
               <span className="text-[10px] font-bold text-[#a16207] uppercase">Detik</span>
             </div>
          </div>
          
            {isExpired && (
            <div className="mt-4 pt-4 border-t border-yellow-200/50 w-full">
              <p className="text-red-600 font-bold text-sm text-center">Waktu pembayaran telah habis.</p>
            </div>
          )}
        </div>

        {invoice.doa && (
          <div className="bg-white border border-teal-100 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-teal-50 p-1.5 rounded-lg">
                <CheckCircle size={16} className="text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Doa / Pesan Kebaikan</h3>
            </div>
            <p className="text-gray-700 text-sm italic leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              "{invoice.doa}"
            </p>
          </div>
        )}

        <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
           <p className="text-gray-500 text-sm font-semibold mb-1">Total Tagihan</p>
           
           <div className="flex flex-col items-center justify-center mb-6">
             {isManual ? (() => {
               const amtStr = Number(invoice.total_amount).toString();
               const last3 = amtStr.length >= 3 ? amtStr.slice(-3) : amtStr;
               const rest = amtStr.length >= 3 ? amtStr.slice(0, -3) : '';
               const formattedRest = rest ? formatIDR(Number(rest)) : 'Rp ';
               return (
                 <div className="w-full flex flex-col items-center">
                   <div className="flex items-center justify-center gap-3 mb-2 w-full border border-gray-200 p-4 rounded-xl">
                     <h1 className="text-3xl font-extrabold text-gray-700">
                       {formattedRest.replace(',00', '')}.<span className="bg-yellow-300 text-gray-800 px-1 rounded">{last3}</span>
                     </h1>
                     <button onClick={handleCopyAmount} className="text-blue-600 border border-blue-600 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 font-bold text-sm transition-colors active:scale-95" title="Salin Nominal">
                       Salin
                     </button>
                   </div>
                   <div className="w-full bg-[#FFFCEB] border border-[#FDEB96] p-3 rounded-lg flex items-center gap-2 mb-2">
                     <div className="w-5 h-5 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">!</div>
                     <p className="text-sm font-semibold text-gray-800">Pastikan nominal sesuai hingga 3 digit terakhir</p>
                   </div>
                   <p className="text-xs text-gray-500 italic text-left w-full">* 3 Angka terakhir atau kode unik akan didonasikan</p>
                 </div>
               );
             })() : (
               <div className="flex items-center justify-center gap-3 w-full">
                 <h1 className="text-3xl font-extrabold text-teal-600">{formatIDR(Number(invoice.total_amount))}</h1>
                 <button onClick={handleCopyAmount} className="text-teal-600 bg-teal-50 p-1.5 rounded-lg hover:bg-teal-100 transition-colors active:scale-95" title="Salin Nominal">
                   <Copy size={16} />
                 </button>
               </div>
             )}
           </div>
           
           {(() => {
            const pmType = invoice.payment_method_type?.toLowerCase() || '';
            const isVA = pmType.includes('va') || pmType.includes('bank') || pmType.includes('transfer');
            const isManualLocal = pmType.includes('manual') || isManual;

            return isVA || isManualLocal ? (
              <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-gray-300 relative text-left">
                <p className="text-xs text-gray-500 mb-1 font-semibold">{isManualLocal ? 'Nomor Rekening' : 'Nomor Virtual Account'} ({invoice.payment_method_name})</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold tracking-wider text-gray-800">{invoice.va_number || 'Tidak tersedia'}</span>
                    {isManualLocal && <span className="text-xs text-gray-500 font-medium mt-1">a/n Yayasan Peduli Sesama</span>}
                  </div>
                  <button onClick={handleCopyVa} className="text-teal-600 bg-teal-50 p-2 shrink-0 rounded-lg hover:bg-teal-100 transition-colors active:scale-95" title="Salin">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            ) : (pmType.includes('retail') || pmType.includes('outlet') || pmType.includes('over_the_counter')) ? (
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
            ) : (pmType.includes('e_wallet') || pmType.includes('ewallet') || pmType.includes('e-wallet')) ? (
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
            ) : (pmType.includes('qr') || pmType === 'qr_code') ? (
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
            ) : null;
           })()}
        </div>

        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-gray-800 text-lg">Cara Pembayaran</h3>
          <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="flex items-center gap-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
            {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </button>
        </div>
        
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

      {/* Hidden PDF Template - Rendered off-screen, captured by html-to-image */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
        <div id="pdf-template" style={{ width: '794px', background: 'white', color: '#1a1a1a', padding: '48px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>L</div>
              <span style={{ fontWeight: '800', fontSize: '20px', color: '#0f766e' }}>{invoice.ngoName || 'Lembaga Kami'}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '700', fontSize: '15px' }}>ID Donasi : {invoice.invoice_code}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Created: {invoice.created_at ? new Date(invoice.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}</p>
            </div>
          </div>
          <p style={{ fontWeight: '900', fontSize: '20px', fontStyle: 'italic', marginBottom: '24px' }}>{invoice.payment_method_name}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>Dear <strong>{invoice.donor_name}</strong>,</p>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>Silakan Selesaikan Donasi Anda :</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Total Donasi</p>
              <p style={{ fontWeight: '900', fontSize: '28px' }}>{formatIDR(Number(invoice.total_amount))}</p>
            </div>
          </div>
          <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>Rincian Donasi</p>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px', fontSize: '13px', marginBottom: '20px' }}>
            <div style={{ color: '#6b7280', fontWeight: '600' }}>{invoice.payment_method_type?.includes('qr') ? 'QRIS String' : 'Kode Pembayaran'}</div>
            <div style={{ fontWeight: '700' }}>{invoice.va_number || (isManual ? 'Lihat rekening di instruksi' : '-')}</div>
            <div style={{ color: '#6b7280', fontWeight: '600' }}>Batas Pembayaran</div>
            <div>{expireDateStr || (invoice.created_at ? new Date(new Date(invoice.created_at).getTime() + 6*60*60*1000).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-')}</div>
          </div>

          {/* QR Code in PDF if applicable */}
          {(invoice.payment_method_type?.includes('qr')) && (
            <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px', fontWeight: '700' }}>SCAN QRIS DI BAWAH INI</p>
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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`} 
                    alt="QR Code"
                    style={{ width: '180px', height: '180px', margin: '0 auto' }}
                  />
                ) : null;
              })()}
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '12px' }}>Dapat di-scan menggunakan DANA, OVO, GoPay, ShopeePay, atau LinkAja.</p>
            </div>
          )}
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: '700', color: '#6b7280' }}>Deskripsi</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: '700', color: '#6b7280' }}>Nominal Donasi</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems?.length > 0 ? (
                invoice.lineItems.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 12px' }}>{item.title || item.variant_name} (x{item.qty})</td>
                    <td style={{ textAlign: 'right', padding: '8px 12px' }}>{formatIDR(Number(item.amount))}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 12px' }}>Donasi</td>
                  <td style={{ textAlign: 'right', padding: '8px 12px' }}>{formatIDR(Number(invoice.base_amount || invoice.total_amount))}</td>
                </tr>
              )}
              {Number(invoice.admin_fee) > 0 && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 12px' }}>Biaya Admin</td>
                  <td style={{ textAlign: 'right', padding: '8px 12px' }}>{formatIDR(Number(invoice.admin_fee))}</td>
                </tr>
              )}
              <tr style={{ fontWeight: '700', background: '#f9fafb' }}>
                <td style={{ padding: '10px 12px' }}>TOTAL</td>
                <td style={{ textAlign: 'right', padding: '10px 12px' }}>{formatIDR(Number(invoice.total_amount))}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginBottom: '28px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
            <p style={{ fontWeight: '700', marginBottom: '4px' }}>PERHATIAN!</p>
            <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>Mohon selesaikan pembayaran donasi Anda sebelum {expireDateStr || (invoice.created_at ? new Date(new Date(invoice.created_at).getTime() + 6*60*60*1000).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-')}. Apabila melewati batas waktu, donasi Anda akan otomatis dibatalkan.</p>
          </div>

          {/* Manual transfer unique code box in PDF */}
          {isManual && invoice.total_amount && (() => {
            const amtStr = Number(invoice.total_amount).toString();
            const last3 = amtStr.length >= 3 ? amtStr.slice(-3) : amtStr;
            return (
              <div style={{ marginBottom: '24px', padding: '12px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px', color: '#c2410c' }}>⚠ Pastikan Transfer Sesuai Nominal Termasuk 3 Digit Terakhir</p>
                  <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Nominal yang harus ditransfer (termasuk kode unik):</p>
                  <p style={{ fontWeight: '900', fontSize: '20px', color: '#1a1a1a', letterSpacing: '1px' }}>
                    {Number(invoice.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    <span style={{ background: '#fbbf24', padding: '0 4px', borderRadius: '4px', marginLeft: '8px', fontSize: '18px' }}>{last3}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>* 3 angka terakhir ({last3}) adalah kode unik yang membantu kami mengidentifikasi pembayaran Anda secara otomatis.</p>
                </div>
              </div>
            );
          })()}
          {invoice.instructions?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '12px' }}>
              {invoice.instructions.map((inst: any, idx: number) => (
                <div key={idx}>
                  <p style={{ fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>{inst.title}</p>
                  <div
                    style={{ color: '#4b5563', lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{
                      __html: inst.content
                        .replace(/<ol[^>]*>/gi, '<ol style="margin:0;padding-left:18px;list-style-type:decimal">')
                        .replace(/<ul[^>]*>/gi, '<ul style="margin:0;padding-left:18px;list-style-type:disc">')
                        .replace(/<li[^>]*>/gi, '<li style="margin-bottom:4px">')
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

