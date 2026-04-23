import Link from 'next/link';
import { Clock, CheckCircle2, ChevronRight, HelpCircle, HeartHandshake, Share2, ReceiptText } from 'lucide-react';
import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { formatIDR } from '@/lib/utils';

export const revalidate = 0;

async function getInvoiceStatus(invoiceCode: string) {
  if (invoiceCode.startsWith('SIM-')) {
    return { status: 'PENDING' };
  }

  const invoices = await query(`
    SELECT i.status, i.total_amount, i.invoice_code, i.created_at, pm.name as payment_method_name, c.title as campaign_title
    FROM invoices i
    LEFT JOIN transactions t ON i.id = t.invoice_id
    LEFT JOIN campaigns c ON t.campaign_id = c.id
    LEFT JOIN payment_methods pm ON i.payment_method_id = pm.id
    WHERE i.invoice_code = $1
  `, [invoiceCode]);
  if (invoices.length === 0) return null;
  return invoices[0];
}

export default async function StatusPage(props: { params: Promise<{ invoiceCode: string }> }) {
  const params = await props.params;
  const invoice = await getInvoiceStatus(params.invoiceCode);

  if (!invoice) notFound();

  // For simulation, we assume manual transfer means it is waiting for admin validation.
  // Real logic would also check if status === 'PENDING' vs 'PAID'.
  
  if (invoice.status === 'PAID') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Script
          id="purchase-event"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if (window.fbq) window.fbq('track', 'Purchase', { value: ${invoice.total_amount || 0}, currency: 'IDR' });
                if (window.ttq) window.ttq.track('CompletePayment', { value: ${invoice.total_amount || 0}, currency: 'IDR' });
                if (window.gtag) window.gtag('event', 'purchase', { transaction_id: '${invoice.invoice_code}', value: ${invoice.total_amount || 0}, currency: 'IDR' });
              }
            `
          }}
        />
        <div className="flex-1 flex flex-col items-center p-6 text-center w-full max-w-md mx-auto">
          {/* Header Celebration */}
          <div className="relative mb-6 mt-4">
            <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-20"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-teal-100 border-4 border-white shadow-xl rounded-full flex items-center justify-center relative z-10 mx-auto">
              <CheckCircle2 size={40} className="text-teal-600" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Alhamdulillah!</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Donasi Anda telah berhasil diverifikasi.
          </p>

          {/* Receipt Card */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 text-left relative">
             <div className="bg-teal-50/50 p-4 border-b border-teal-100/50 flex justify-between items-center">
               <span className="text-teal-800 font-bold text-sm flex items-center gap-2"><ReceiptText size={16}/> Bukti Donasi</span>
               <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-1 rounded-md uppercase">BERHASIL</span>
             </div>
             <div className="p-5 space-y-4">
               <div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Nominal Donasi</p>
                 <p className="text-2xl font-extrabold text-teal-600">{formatIDR(Number(invoice.total_amount))}</p>
               </div>
               
               <div className="w-full h-px bg-dashed bg-gray-200"></div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">ID Transaksi</p>
                   <p className="text-xs font-bold text-gray-800">{invoice.invoice_code}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Metode Bayar</p>
                   <p className="text-xs font-bold text-gray-800">{invoice.payment_method_name || 'E-Wallet / Transfer'}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Program Kebaikan</p>
                   <p className="text-xs font-bold text-gray-800 leading-snug">{invoice.campaign_title || 'Donasi Umum'}</p>
                 </div>
               </div>
             </div>
             {/* Zigzag bottom border effect */}
             <div className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x flex">
               {Array.from({ length: 20 }).map((_, i) => (
                 <div key={i} className="w-3 h-3 bg-slate-50 rotate-45 transform origin-bottom -mb-1.5 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]"></div>
               ))}
             </div>
          </div>

          <Link href="/" className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3">
            Selesai
          </Link>
          <button className="w-full bg-white text-teal-600 border border-teal-200 font-bold text-sm py-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Share2 size={16} /> Bagikan Kebaikan Ini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-50 to-yellow-100 border-4 border-white shadow-xl rounded-full flex items-center justify-center relative z-10">
            <Clock size={48} className="text-yellow-600 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-800 mb-3">Menunggu Konfirmasi</h1>
        
        <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[280px]">
          Laporan pembayaran dan bukti donasi Anda telah kami terima. Admin kami akan segera melakukan verifikasi maksimal <span className="font-bold text-gray-600">1x24 jam</span>.
        </p>

        {/* Info Card */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 text-left">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Langkah Selanjutnya</h3>
           
           <div className="flex gap-3 mb-4 relative">
             <div className="w-6 py-1 flex flex-col items-center">
               <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center relative z-10 shadow-sm border border-white">
                  <CheckCircle2 size={12} className="text-white" />
               </div>
               <div className="w-[1.5px] h-full bg-teal-100 absolute left-1/2 -translate-x-1/2 top-5 bottom-0"></div>
             </div>
             <div>
               <p className="text-sm font-bold text-gray-800">Pembayaran Dilaporkan</p>
               <p className="text-xs text-gray-500">Anda telah menekan 'Saya Sudah Bayar'</p>
             </div>
           </div>

           <div className="flex gap-3">
             <div className="w-6 py-1 flex flex-col items-center relative z-10">
               <div className="w-5 h-5 rounded-full bg-yellow-100 border-2 border-yellow-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
               </div>
             </div>
             <div>
               <p className="text-sm font-bold text-gray-800">Proses Verifikasi</p>
               <p className="text-xs text-gray-500">Sistem sedang mengecek mutasi masuk</p>
             </div>
           </div>
        </div>

        <Link href="/" className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          Kembali ke Beranda
        </Link>
        <Link href="/donasi" className="text-teal-600 font-bold text-sm py-4 block mt-1 hover:text-teal-700">
          Cek Riwayat Donasi
        </Link>
      </div>

      <div className="py-6 border-t border-gray-200 mt-auto bg-slate-100 flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700">
         <HelpCircle size={14} /> Butuh bantuan? Hubungi WhatsApp Admin
      </div>
    </div>
  );
}
