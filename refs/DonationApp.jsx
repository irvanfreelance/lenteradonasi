"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Search,
  Heart,
  User,
  ChevronLeft,
  CheckCircle,
  Wallet,
  ShieldCheck,
  Share2,
  Clock,
  ChevronRight,
  Landmark,
  CreditCard,
  Check,
  Flame,
  Stethoscope,
  BookOpen,
  Building2,
  Settings,
  LogOut,
  HelpCircle,
  History,
  Award,
  Receipt,
  Plus,
  Minus,
  Calculator,
  Banknote,
  Gift,
  Newspaper,
  Instagram,
  Facebook,
  MessageCircle
} from 'lucide-react';

// --- MOCK DATA ---
const campaigns = [
  {
    id: 1,
    title: "Bantu Adik Rina Sembuh dari Gagal Ginjal",
    verified: true,
    urgent: true,
    target: 150000000,
    collected: 105000000,
    donors: 1245,
    daysLeft: 12,
    category: "Medis",
    image: "https://images.pexels.com/photos/3845125/pexels-photo-3845125.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Adik Rina (8 tahun) saat ini sedang berjuang melawan penyakit gagal ginjal kronis dan membutuhkan biaya untuk cuci darah rutin serta operasi transplantasi. Setiap bantuan Anda sangat berarti untuk kembalikan senyum Rina.",
    updates: [
      {
        id: 101,
        date: "15 Okt 2023",
        title: "Penyaluran Tahap 1: Biaya Cuci Darah",
        excerpt: "Dana sebesar Rp 15.000.000 telah disalurkan untuk biaya cuci darah Dik Rina...",
        content: "Terima kasih Orang Baik!\n\nDana sebesar Rp 15.000.000 telah disalurkan untuk biaya cuci darah Dik Rina selama 1 bulan ke depan. Kondisi Rina saat ini berangsur stabil namun masih membutuhkan perawatan intensif.\n\nDoakan Rina terus ya agar segera pulih sepenuhnya!",
        image: "https://images.pexels.com/photos/2324837/pexels-photo-2324837.jpeg?auto=compress&cs=tinysrgb&w=800"
      }
    ]
  },
  {
    id: 2,
    title: "Pembangunan Sekolah Darurat di Pelosok NTT",
    verified: true,
    urgent: false,
    target: 300000000,
    collected: 85000000,
    donors: 830,
    daysLeft: 45,
    category: "Pendidikan",
    image: "https://images.pexels.com/photos/8613322/pexels-photo-8613322.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Ratusan anak di desa terpencil NTT terpaksa belajar di bawah tenda terpal yang bocor saat hujan. Mari wujudkan bangunan sekolah yang layak agar mereka bisa meraih cita-citanya.",
    updates: [
      {
        id: 201,
        date: "10 Okt 2023",
        title: "Peletakan Batu Pertama Dimulai!",
        excerpt: "Alhamdulillah, proses pembangunan sekolah darurat mulai berjalan dengan antusiasme warga...",
        content: "Halo Kakak-kakak Baik!\n\nKabar gembira, berkat donasi Anda, peletakan batu pertama untuk sekolah darurat telah dilaksanakan. Warga sangat antusias bergotong royong membersihkan lahan.\n\nTerus dukung kami agar bangunan ini segera berdiri dan anak-anak bisa belajar dengan nyaman.",
        image: "https://images.pexels.com/photos/11844555/pexels-photo-11844555.jpeg?auto=compress&cs=tinysrgb&w=800"
      }
    ]
  },
  {
    id: 3,
    title: "Bantuan Pangan Korban Banjir Bandang",
    verified: true,
    urgent: true,
    target: 50000000,
    collected: 48000000,
    donors: 2100,
    daysLeft: 3,
    category: "Bencana",
    image: "https://images.pexels.com/photos/6994992/pexels-photo-6994992.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Banjir bandang telah menyapu bersih pemukiman warga. Saat ini kebutuhan paling mendesak adalah makanan siap saji, air bersih, dan selimut.",
    updates: []
  },
  {
    id: 4,
    title: "Sedekah Paket Berbuka Puasa untuk Pejuang Jalanan",
    verified: true,
    urgent: false,
    isFixedAmount: true,
    packagePrice: 35000,
    packageName: "Paket Berbuka",
    target: 70000000,
    collected: 24500000,
    donors: 700,
    daysLeft: 20,
    category: "Panti Asuhan",
    image: "https://images.pexels.com/photos/6995201/pexels-photo-6995201.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Banyak saudara kita yang berpuasa namun bingung akan berbuka dengan apa. Mari rutinkan sedekah paket berbuka puasa (Rp 35.000/paket) untuk disalurkan kepada para pekerja harian lepas, pemulung, dan anak jalanan.",
    updates: []
  },
  {
    id: 5,
    title: "Tunaikan Zakat Profesi & Maal Anda",
    verified: true,
    urgent: false,
    isZakat: true,
    target: 500000000,
    collected: 125000000,
    donors: 340,
    daysLeft: 365,
    category: "Zakat",
    image: "https://images.pexels.com/photos/4968636/pexels-photo-4968636.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Sucikan harta Anda dengan menunaikan zakat. Dana zakat akan disalurkan kepada 8 asnaf (golongan) yang berhak menerimanya sesuai dengan syariat Islam.",
    updates: []
  },
  {
    id: 6,
    title: "Qurban Pedalaman: Kambing Standar",
    verified: true,
    urgent: false,
    isFixedAmount: true,
    isQurban: true,
    packagePrice: 2500000,
    packageName: "Ekor Kambing",
    namesPerQty: 1,
    target: 200000000,
    collected: 45000000,
    donors: 18,
    daysLeft: 45,
    category: "Qurban",
    image: "https://images.pexels.com/photos/5698305/pexels-photo-5698305.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Qurban kambing (berat 23-25 kg) untuk disalurkan ke desa-desa terpencil yang jarang merasakan nikmatnya daging qurban.",
    updates: []
  },
  {
    id: 7,
    title: "Qurban Pedalaman: Patungan 1/7 Sapi",
    verified: true,
    urgent: false,
    isFixedAmount: true,
    isQurban: true,
    packagePrice: 3000000,
    packageName: "Bagian Sapi (1/7)",
    namesPerQty: 1,
    target: 315000000,
    collected: 126000000,
    donors: 42,
    daysLeft: 45,
    category: "Qurban",
    image: "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Ikut patungan 1/7 bagian sapi qurban. Sistem kami akan mengakumulasi hingga 7 bagian terkumpul untuk dikonversi menjadi 1 ekor sapi utuh di lapangan.",
    updates: []
  },
  {
    id: 8,
    title: "Qurban Pedalaman: 1 Ekor Sapi Utuh",
    verified: true,
    urgent: false,
    isFixedAmount: true,
    isQurban: true,
    packagePrice: 21000000,
    packageName: "Ekor Sapi",
    namesPerQty: 7,
    target: 420000000,
    collected: 63000000,
    donors: 3,
    daysLeft: 45,
    category: "Qurban",
    image: "https://images.pexels.com/photos/16399151/pexels-photo-16399151.jpeg?auto=compress&cs=tinysrgb&w=800",
    description: "Tunaikan qurban 1 ekor sapi utuh yang dapat diatasnamakan untuk 7 orang sekaligus (keluarga/kerabat). Daging akan di distribusikan kepada ratusan dhuafa.",
    updates: []
  },
  {
    id: 9,
    title: "Infaq Operasional & Pengembangan Dakwah",
    verified: true,
    urgent: false,
    hasNoTarget: true,
    hasNoTimeLimit: true,
    collected: 15450000,
    donors: 342,
    category: "Infaq",
    image: "https://images.pexels.com/photos/1310102/pexels-photo-1310102.jpeg?auto=compress&cs=tinysrgb&w=800", // Gambar Masjid yang megah
    description: "Salurkan infaq terbaik Anda untuk mendukung operasional harian yayasan dan perluasan program-program dakwah kebaikan yang menjangkau lebih banyak penerima manfaat. Kampanye ini tidak memiliki batas waktu maupun batas donasi.",
    updates: []
  },
  {
    id: 10,
    title: "Paket Basmalah (5 Buka Puasa + 8 Kado Yatim)",
    verified: true,
    urgent: false,
    isFixedAmount: true,
    isBundle: true,
    packagePrice: 415000,
    packageName: "Paket Basmalah",
    target: 500000000,
    collected: 83000000,
    donors: 200,
    daysLeft: 25,
    category: "Panti Asuhan",
    image: "https://images.pexels.com/photos/9127752/pexels-photo-9127752.jpeg?auto=compress&cs=tinysrgb&w=800", // Gambar hangat buka puasa bersama/berbagi
    description: "Maksimalkan pahala Anda dengan program Bundling Kebaikan! Dengan memilih Paket Basmalah, donasi Anda akan otomatis disalurkan untuk:\n\n• 5 Porsi Buka Puasa untuk Pejuang Jalanan\n• 8 Paket Kado Lebaran untuk Anak Yatim\n\nSatu kali transaksi untuk melipatgandakan senyuman mereka di bulan yang penuh berkah ini.",
    bundleItems: [
      { name: "Porsi Buka Puasa", baseQty: 5 },
      { name: "Paket Kado Yatim", baseQty: 8 }
    ],
    updates: []
  }
];

const mockHistory = [
  { id: 'INV-1', title: 'Bantu Adik Rina Sembuh dari Gagal Ginjal', date: '12 Okt 2023', amount: 100000, status: 'Berhasil', color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'INV-2', title: 'Tunaikan Zakat Profesi & Maal Anda', date: '05 Okt 2023', amount: 500000, status: 'Berhasil', color: 'text-green-600', bg: 'bg-green-100' },
];

const quickAmounts = [10000, 25000, 50000, 100000, 200000, 500000];

const categoryList = [
  { id: 'zakat', name: 'Zakat', icon: Banknote, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'qurban', name: 'Qurban', icon: Gift, color: 'bg-amber-100 text-amber-600' },
  { id: 'medis', name: 'Medis', icon: Stethoscope, color: 'bg-rose-100 text-rose-500' },
  { id: 'panti', name: 'Panti Asuhan', icon: Building2, color: 'bg-teal-100 text-teal-500' },
];

const paymentMethods = [
  { id: 'gopay', name: 'GoPay', type: 'E-Wallet', icon: Wallet, color: 'text-blue-500' },
  { id: 'bca', name: 'BCA Virtual Account', type: 'Transfer Bank', icon: Landmark, color: 'text-blue-700' },
  { id: 'mandiri', name: 'Mandiri Virtual Account', type: 'Transfer Bank', icon: Landmark, color: 'text-yellow-600' },
];

// --- HELPER FORMATTER ---
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [screen, setScreen] = useState('home');
  const [previousScreen, setPreviousScreen] = useState('home'); // Untuk tombol back
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [detailTab, setDetailTab] = useState('cerita'); // Diperbaiki: Menambahkan kembali state detailTab yang hilang

  const [searchQuery, setSearchQuery] = useState(''); // State Search

  const [donationMode, setDonationMode] = useState('open');
  const [packageQty, setPackageQty] = useState(1);
  const [zakatMode, setZakatMode] = useState('calculator');
  const [zakatCalcType, setZakatCalcType] = useState('profesi');
  const [zakatInput, setZakatInput] = useState('');
  const [zakatResult, setZakatResult] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const bannerRef = useRef(null);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [donationData, setDonationData] = useState({
    amount: 0,
    customAmount: '',
    name: '',
    email: '',
    isAnonymous: false,
    paymentMethod: null,
    qurbanNames: []
  });

  // Harga Emas Real-time (Simulasi API)
  const GOLD_PRICE_PER_GRAM = 1250000;
  const NISAB_MAAL = 85 * GOLD_PRICE_PER_GRAM;
  const NISAB_PROFESI = Math.floor(NISAB_MAAL / 12);

  // --- COMPONENT DID MOUNT ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (screen !== 'home' || searchQuery.length > 0) return;
    const interval = setInterval(() => {
      if (bannerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = bannerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          bannerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          bannerRef.current.scrollBy({ left: clientWidth * 0.85, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [screen, searchQuery]);

  // --- NAVIGATION HANDLERS ---
  const goTo = (targetScreen, campaign = null) => {
    setPreviousScreen(screen); // Simpan layar sebelumnya
    let currentCamp = campaign || selectedCampaign;
    if (campaign) setSelectedCampaign(campaign);

    // Reset tab kembali ke cerita setiap kali membuka halaman detail
    if (targetScreen === 'detail') {
      setDetailTab('cerita');
    }

    if (targetScreen === 'amount') {
      if (currentCamp?.isFixedAmount) {
        setDonationMode('package');
        setPackageQty(1);
        setDonationData(prev => ({ ...prev, amount: currentCamp.packagePrice, customAmount: '', qurbanNames: [] }));
      } else if (currentCamp?.isZakat) {
        setDonationMode('open');
        setZakatMode('calculator');
        setDonationData(prev => ({ ...prev, amount: 0, customAmount: '' }));
        setZakatInput('');
        setZakatResult(null);
      } else {
        setDonationMode('open');
        setDonationData(prev => ({ ...prev, amount: 0, customAmount: '' }));
      }
    }

    setScreen(targetScreen);
    window.scrollTo(0, 0);
  };

  const handleBack = (targetScreen) => {
    setScreen(targetScreen);
  };

  // --- LOGIC HANDLERS ---
  const toggleDonationMode = (mode) => {
    setDonationMode(mode);
    if (mode === 'package' && selectedCampaign) {
      setDonationData(prev => ({ ...prev, amount: packageQty * selectedCampaign.packagePrice, customAmount: '' }));
    } else {
      setDonationData(prev => ({ ...prev, amount: 0, customAmount: '' }));
    }
  };

  const handlePackageChange = (val, isAbsolute = false) => {
    const newQty = isAbsolute ? val : packageQty + val;
    if (newQty >= 1 && selectedCampaign) {
      setPackageQty(newQty);
      setDonationData(prev => ({ ...prev, amount: newQty * selectedCampaign.packagePrice, qurbanNames: [] }));
    }
  };

  const calculateZakat = () => {
    const income = parseInt(zakatInput) || 0;
    let zakatAmount = 0;

    if (zakatCalcType === 'profesi') {
      if (income >= NISAB_PROFESI) {
        zakatAmount = income * 0.025;
      } else {
        alert(`Pendapatan belum mencapai Nisab profesi bulanan (${formatIDR(NISAB_PROFESI)}).`);
        setZakatResult(0);
        return;
      }
    } else if (zakatCalcType === 'maal') {
      if (income >= NISAB_MAAL) {
        zakatAmount = income * 0.025;
      } else {
        alert(`Harta tersimpan belum mencapai Nisab maal tahunan (${formatIDR(NISAB_MAAL)} / setara 85 gram emas).`);
        setZakatResult(0);
        return;
      }
    }

    if (zakatAmount > 0) {
      setDonationData(prev => ({ ...prev, amount: zakatAmount, customAmount: zakatAmount.toString() }));
      setZakatResult(zakatAmount);
    }
  };

  const updateQurbanName = (index, value) => {
    const newNames = [...donationData.qurbanNames];
    newNames[index] = value;
    setDonationData(prev => ({ ...prev, qurbanNames: newNames }));
  };

  // --- SHARED COMPONENTS ---
  const renderBottomNav = (activeMenu) => (
    <div className="absolute bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 flex justify-around px-2 py-2 pb-safe z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <button onClick={() => goTo('home')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeMenu === 'home' ? 'text-teal-600' : 'text-gray-400 hover:text-teal-500'}`}>
        <div className={`transition-all duration-300 ${activeMenu === 'home' ? 'bg-teal-50 px-4 py-1.5 rounded-full mb-1' : 'mb-1.5'}`}>
          <Home size={20} className={activeMenu === 'home' ? 'fill-teal-100' : ''} />
        </div>
        <span className={`text-[10px] ${activeMenu === 'home' ? 'font-bold' : 'font-medium'}`}>Beranda</span>
      </button>

      <button onClick={() => goTo('news')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeMenu === 'news' ? 'text-teal-600' : 'text-gray-400 hover:text-teal-500'}`}>
        <div className={`transition-all duration-300 ${activeMenu === 'news' ? 'bg-teal-50 px-4 py-1.5 rounded-full mb-1' : 'mb-1.5'}`}>
          <Newspaper size={20} className={activeMenu === 'news' ? 'fill-teal-100' : ''} />
        </div>
        <span className={`text-[10px] ${activeMenu === 'news' ? 'font-bold' : 'font-medium'}`}>Kabar Berita</span>
      </button>

      <button onClick={() => goTo('donasi_saya')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeMenu === 'donasi_saya' ? 'text-teal-600' : 'text-gray-400 hover:text-teal-500'}`}>
        <div className={`transition-all duration-300 ${activeMenu === 'donasi_saya' ? 'bg-teal-50 px-4 py-1.5 rounded-full mb-1' : 'mb-1.5'}`}>
          <Heart size={20} className={activeMenu === 'donasi_saya' ? 'fill-teal-100' : ''} />
        </div>
        <span className={`text-[10px] ${activeMenu === 'donasi_saya' ? 'font-bold' : 'font-medium'}`}>Donasi Saya</span>
      </button>
    </div>
  );

  // --- SCREENS ---
  const renderHome = () => {
    // Filter logic for search
    const isSearching = searchQuery.trim().length > 0;
    const displayedCampaigns = isSearching
      ? campaigns.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase()))
      : campaigns;

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/60 to-slate-50 relative">
        <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          {/* Header */}
          <div className="bg-white px-5 pt-8 pb-4 flex justify-between items-center sticky top-0 z-20 shadow-sm border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/20">
                <Heart size={20} className="text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-teal-700 text-lg leading-none tracking-tight">Peduli<span className="text-teal-400">Sesama</span></span>
                <span className="text-gray-500 text-[11px] font-semibold mt-1">Selamat Pagi, Orang Baik 👋</span>
              </div>
            </div>
            <div onClick={() => goTo('user_profile')} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 border border-gray-100 cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-colors">
              <User size={20} />
            </div>
          </div>

          {/* Search */}
          <div className="px-5 mt-5 mb-6">
            <div className="relative shadow-sm rounded-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kampanye atau kategori..."
                className="w-full bg-white text-gray-800 rounded-full py-3.5 px-12 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
              <Search size={18} className="absolute left-5 top-4 text-gray-400" />
            </div>
          </div>

          {!isSearching && (
            <>
              {/* Banners Carousel */}
              <div ref={bannerRef} className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 px-5 pb-2 no-scrollbar scroll-smooth">
                {campaigns.map(camp => (
                  <div
                    key={camp.id}
                    onClick={() => goTo('detail', camp)}
                    className="min-w-[88%] h-36 relative rounded-2xl overflow-hidden snap-center shadow-md shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <img src={camp.image} alt={camp.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-transparent flex flex-col justify-center p-5">
                      <p className="text-teal-100 text-[10px] font-bold mb-1 uppercase tracking-wider">{camp.category}</p>
                      <h2 className="text-white font-bold text-lg leading-tight w-5/6 line-clamp-2">{camp.title}</h2>
                    </div>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="px-5 mt-6 mb-8">
                <h2 className="font-bold text-gray-800 text-base mb-4">Kategori Pilihan</h2>
                <div className="grid grid-cols-4 gap-3">
                  {categoryList.map((cat, i) => (
                    <div key={i} onClick={() => { setActiveCategory(cat); setScreen('category'); window.scrollTo(0, 0); }} className="flex flex-col items-center cursor-pointer active:scale-95 group">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${cat.color} bg-white shadow-sm border border-gray-50`}>
                        <cat.icon size={24} />
                      </div>
                      <span className="text-[10px] font-semibold text-center text-gray-600">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgent Highlight */}
              <div className="mt-2 mb-8 bg-gradient-to-b from-rose-50/80 to-transparent py-5 border-t border-rose-100/50">
                <div className="px-5 flex items-center gap-2 mb-4">
                  <div className="bg-rose-100 p-1.5 rounded-lg"><Flame size={18} className="text-rose-500" /></div>
                  <h2 className="font-bold text-gray-800 text-base">Bantuan Mendesak</h2>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-5 pb-4 no-scrollbar">
                  {campaigns.filter(c => c.urgent).map(camp => {
                    const progress = (camp.collected / camp.target) * 100;
                    return (
                      <div key={camp.id} onClick={() => goTo('detail', camp)} className="min-w-[75%] bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden cursor-pointer active:scale-95 snap-center">
                        <div className="h-32 w-full relative">
                          <img src={camp.image} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                            <Clock size={10} /> Sisa {camp.daysLeft} Hari
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 leading-tight mb-3 text-sm line-clamp-2">{camp.title}</h3>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex justify-between items-end">
                            <p className="font-bold text-rose-500 text-sm">{formatIDR(camp.collected)}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{progress.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Campaign List */}
          <div className="px-5 pb-6">
            <h2 className="font-bold text-gray-800 text-base mb-4">
              {isSearching ? `Hasil Pencarian (${displayedCampaigns.length})` : "Rekomendasi Kebaikan"}
            </h2>

            {displayedCampaigns.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Tidak ada kampanye yang sesuai dengan pencarian Anda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {displayedCampaigns.map(camp => {
                  const progress = camp.hasNoTarget ? 0 : (camp.collected / camp.target) * 100;
                  return (
                    <div key={camp.id} onClick={() => goTo('detail', camp)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4 cursor-pointer hover:border-teal-100 active:scale-[0.98]">
                      <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative shadow-sm">
                        <img src={camp.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider bg-teal-50 w-fit px-1.5 py-0.5 rounded">{camp.category}</p>
                          <h3 className="font-bold text-gray-800 leading-tight text-sm line-clamp-2 mb-1.5">{camp.title}</h3>
                        </div>
                        <div>
                          {/* Hanya tampilkan progress bar jika memiliki target */}
                          {!camp.hasNoTarget && (
                            <div className="w-full bg-gray-100 rounded-full h-1 mb-1.5 mt-2">
                              <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2">
                            <p className="font-bold text-teal-600 text-xs">{formatIDR(camp.collected)}</p>

                            {/* Logika Tampilan Target/Waktu */}
                            {!camp.hasNoTarget && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold">{progress.toFixed(0)}%</span>}
                            {camp.hasNoTarget && !camp.hasNoTimeLimit && <span className="text-[10px] text-gray-500">{camp.daysLeft} Hari</span>}
                            {camp.hasNoTarget && camp.hasNoTimeLimit && <span className="text-[10px] text-gray-500 font-medium">Tanpa Batas</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info Lembaga */}
          {!isSearching && (
            <div className="px-5 py-8 bg-slate-100 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Heart size={16} className="text-white fill-white" />
                </div>
                <span className="font-extrabold text-teal-700 text-base leading-none tracking-tight">Peduli<span className="text-teal-400">Sesama</span></span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 text-justify">
                Lembaga filantropi independen yang berdedikasi untuk menyalurkan kebaikan donatur secara transparan, profesional, dan tepat sasaran. Resmi terdaftar dengan SK Kemenkumham RI No. AHU-00123.AH.01.04.Tahun 2026.
              </p>
              <div className="text-xs text-gray-500 mb-5">
                <p className="font-bold text-gray-700 mb-1">Alamat Kantor Pusat</p>
                <p>Jl. Kebaikan Bangsa No. 99, Gedung Amal Lt. 2, Jakarta Selatan, DKI Jakarta 12345</p>
              </div>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-colors">
                  <Instagram size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-colors">
                  <Facebook size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-colors">
                  <MessageCircle size={14} />
                </a>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-[10px] text-gray-400">© 2026 Yayasan Peduli Sesama. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
        {renderBottomNav('home')}
      </div>
    );
  };

  const renderNews = () => {
    // Kumpulkan semua update dari semua campaign
    const allUpdates = campaigns.flatMap(camp =>
      (camp.updates || []).map(upd => ({
        ...upd,
        campaignId: camp.id,
        campaignTitle: camp.title,
        category: camp.category
      }))
    );

    // Untuk simulasi, anggap sudah disorting berdasar tanggal.

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-white px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 text-center">Kabar Berita</h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 px-5 pt-6 no-scrollbar">
          {allUpdates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Newspaper size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500">Belum ada kabar terbaru saat ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {allUpdates.map((update, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedUpdate(update);
                    // Saat kita menekan update dari list berita global, kita tidak butuh state SelectedCampaign, cukup render isinya.
                    goTo('update_detail');
                  }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {update.image && (
                    <div className="h-40 w-full bg-gray-100">
                      <img src={update.image} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{update.category}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{update.date}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base leading-snug mb-2">{update.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{update.excerpt}</p>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400">Dari kampanye:</span>
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-1">{update.campaignTitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderBottomNav('news')}
      </div>
    );
  };

  const renderUpdateDetail = () => {
    if (!selectedUpdate) return null;
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-20 sticky top-0">
          <button onClick={() => handleBack(previousScreen)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Detail Berita</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 no-scrollbar">
          <p className="text-[11px] text-teal-600 font-bold mb-2 uppercase tracking-wider">{selectedUpdate.date}</p>
          <h1 className="text-xl font-bold text-gray-800 leading-snug mb-5">{selectedUpdate.title}</h1>

          {selectedUpdate.image && (
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100">
              <img src={selectedUpdate.image} alt={selectedUpdate.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line text-justify bg-slate-50 p-5 rounded-2xl border border-gray-100">
            {selectedUpdate.content}
          </div>
        </div>

        {/* Sticky CTA Button di Detail Berita */}
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 z-30 pb-safe rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.08)]">
          <button
            onClick={() => {
              const camp = campaigns.find(c => c.id === selectedUpdate.campaignId);
              if (camp) goTo('amount', camp);
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            <Heart size={20} className="fill-white" />
            Donasi Sekarang
          </button>
        </div>
      </div>
    );
  };

  const renderDonasiSaya = () => (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white px-5 pt-8 pb-4 sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 text-center">Donasi Saya</h1>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-6 no-scrollbar">
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <History size={40} />
            </div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Belum Ada Riwayat</h2>
            <p className="text-gray-500 text-sm mb-6">Silakan masuk ke akun Anda untuk melihat semua riwayat dan laporan donasi kebaikanmu.</p>
            <button onClick={() => goTo('user_profile')} className="w-full bg-teal-600 text-white font-bold text-base py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform">
              Masuk Sekarang
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-400 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/30 mb-8 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <p className="text-teal-50 text-sm font-semibold mb-1">Total Kebaikanmu</p>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Rp 600.000</h2>
                <div className="flex items-center text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Award size={14} className="mr-1.5 text-yellow-300 fill-yellow-300" />
                  <span className="font-medium">Level: Orang Baik</span>
                </div>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-4">Riwayat Terbaru</h3>
            <div className="flex flex-col gap-3">
              {mockHistory.map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 border border-teal-100"><Receipt size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{item.date}</p>
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{item.title}</h4>
                    <p className="font-bold text-teal-600 text-sm">{formatIDR(item.amount)}</p>
                  </div>
                  <div className={`${item.bg} ${item.color} text-[10px] font-bold px-2 py-1 rounded-md`}>{item.status}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {renderBottomNav('donasi_saya')}
    </div>
  );

  const renderUserProfile = () => {
    if (!isLoggedIn) {
      return (
        <div className="flex flex-col h-full bg-slate-50 relative">
          <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
            <button onClick={() => handleBack(previousScreen)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
            <h2 className="font-bold text-lg text-gray-800 ml-2">Masuk Akun</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center text-center pb-24">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-6 shadow-inner"><User size={48} /></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pantau Jejak Kebaikanmu</h2>
            <p className="text-gray-500 text-sm mb-10">Masuk untuk melihat riwayat donasi, mengunduh laporan, dan menyimpan data secara aman.</p>

            <button onClick={() => { setIsLoggedIn(true); goTo('home'); }} className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm mb-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[12px] font-black">G</span> Lanjutkan dengan Google
            </button>
            <button onClick={() => { setIsLoggedIn(true); goTo('home'); }} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[12px] font-black">A</span> Lanjutkan dengan Apple
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 pt-10 pb-20 px-5 rounded-b-[2.5rem] relative shadow-lg">
          <div className="absolute top-5 left-5 z-20">
            <button onClick={() => goTo('home')} className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors"><ChevronLeft size={20} /></button>
          </div>
          <h1 className="text-xl font-bold text-white mb-6 text-center relative z-10">Profil Akun</h1>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full p-1 shadow-md">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e2e8f0" className="w-full h-full rounded-full bg-gray-100" />
            </div>
            <div className="text-white">
              <h2 className="font-bold text-lg mb-0.5">Andi Dermawan</h2>
              <p className="text-teal-100 text-xs mb-1.5">andi.dermawan@email.com</p>
              <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm font-medium">3 Kampanye didukung</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 px-5 -mt-8 relative z-20 no-scrollbar">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mb-5">
            {[{ icon: User, label: 'Edit Profil', color: 'text-blue-500', bg: 'bg-blue-50' }, { icon: Wallet, label: 'Metode Pembayaran', color: 'text-purple-500', bg: 'bg-purple-50' }, { icon: History, label: 'Riwayat Transaksi', color: 'text-teal-500', bg: 'bg-teal-50' }].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-4 ${i !== 2 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}><item.icon size={20} /></div><span className="font-semibold text-gray-700 text-sm">{item.label}</span></div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            ))}
          </div>
          <button onClick={() => { setIsLoggedIn(false); goTo('home'); }} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-500 font-bold py-4 rounded-2xl"><LogOut size={20} />Keluar Akun</button>
        </div>
      </div>
    );
  };

  const renderCategory = () => {
    if (!activeCategory) return null;
    const filteredCampaigns = campaigns.filter(c => c.category.toLowerCase() === activeCategory.name.toLowerCase());
    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-20 sticky top-0">
          <button onClick={() => handleBack('home')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Kampanye {activeCategory.name}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 no-scrollbar">
          {filteredCampaigns.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredCampaigns.map(camp => {
                const progress = camp.hasNoTarget ? 0 : (camp.collected / camp.target) * 100;
                return (
                  <div key={camp.id} onClick={() => goTo('detail', camp)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4">
                    <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0"><img src={camp.image} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div><h3 className="font-bold text-gray-800 text-sm line-clamp-2">{camp.title}</h3></div>
                      <div>
                        {!camp.hasNoTarget && (
                          <div className="w-full bg-gray-100 rounded-full h-1 mb-1.5 mt-2">
                            <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="font-bold text-teal-600 text-xs">{formatIDR(camp.collected)}</p>
                          {!camp.hasNoTarget && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold">{progress.toFixed(0)}%</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
              <p className="font-bold text-gray-800 mb-1">Belum ada kampanye</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedCampaign) return null;
    const progress = selectedCampaign.hasNoTarget ? 0 : (selectedCampaign.collected / selectedCampaign.target) * 100;
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="relative h-64 w-full shrink-0">
          <img src={selectedCampaign.image} className="w-full h-full object-cover" />
          <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={() => handleBack(previousScreen)} className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"><ChevronLeft size={24} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 -mt-6 bg-white rounded-t-3xl relative z-10 no-scrollbar shadow-lg">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
          <div className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">{selectedCampaign.category}</div>
          <h1 className="text-xl font-bold text-gray-800 leading-snug mb-3">{selectedCampaign.title}</h1>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <p className="text-2xl font-bold text-teal-600 mb-1">{formatIDR(selectedCampaign.collected)}</p>
            {!selectedCampaign.hasNoTarget && (
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden"><div className="bg-teal-500 h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span className="font-bold text-gray-800">{selectedCampaign.donors} Donatur</span>
              {selectedCampaign.hasNoTimeLimit ? (
                <span className="font-bold text-teal-600">Selalu Terbuka</span>
              ) : (
                <span className="font-bold text-gray-800">{selectedCampaign.daysLeft} Hari</span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 mb-5">
            <button
              onClick={() => setDetailTab('cerita')}
              className={`pb-3 flex-1 font-bold text-sm transition-all relative ${detailTab === 'cerita' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Cerita
              {detailTab === 'cerita' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
            </button>
            <button
              onClick={() => setDetailTab('info')}
              className={`pb-3 flex-1 font-bold text-sm transition-all relative ${detailTab === 'info' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Info Terbaru
              {detailTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab Content: Cerita */}
          {detailTab === 'cerita' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">Cerita Penggalangan Dana</h3>
              <p className="text-gray-600 text-sm leading-relaxed text-justify mb-6">
                {selectedCampaign.description}
                <br /><br />
                Donasi Anda sangat berarti. Mari kita bersama-sama mewujudkan kebaikan ini sekarang juga. Berapapun donasi Anda akan sangat membantu tujuan mulia ini.
              </p>
            </div>
          )}

          {/* Tab Content: Info Terbaru (Timeline) */}
          {detailTab === 'info' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Kabar Penyaluran</h3>

              {(!selectedCampaign.updates || selectedCampaign.updates.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-gray-100 mb-6">
                  <p className="text-gray-500 text-sm font-medium">Belum ada info terbaru saat ini.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-teal-100 ml-3 pl-5 space-y-6 pb-6">
                  {selectedCampaign.updates.map((update) => (
                    <div
                      key={update.id}
                      onClick={() => {
                        setSelectedUpdate(update);
                        goTo('update_detail');
                      }}
                      className="relative bg-white border border-gray-100 shadow-sm rounded-xl p-4 cursor-pointer hover:border-teal-200 active:scale-[0.98] transition-all"
                    >
                      <div className="absolute -left-[27px] top-4 w-4 h-4 bg-teal-500 rounded-full border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] text-teal-600 font-bold mb-1 uppercase tracking-wider">{update.date}</p>
                      <h4 className="font-bold text-gray-800 text-sm mb-2 leading-tight">{update.title}</h4>
                      <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-3">{update.excerpt}</p>
                      <span className="text-teal-600 text-[11px] font-bold flex items-center gap-1">Baca selengkapnya <ChevronRight size={12} /></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 z-30 pb-safe rounded-t-2xl">
          <button onClick={() => goTo('amount')} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98]">
            {selectedCampaign.isZakat ? "Tunaikan Zakat" : selectedCampaign.isQurban ? "Qurban Sekarang" : "Donasi Sekarang"}
          </button>
        </div>
      </div>
    );
  };

  const renderAmount = () => {
    const camp = selectedCampaign;
    if (!camp) return null;

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => handleBack('detail')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Pilih Nominal</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6">
            <img src={camp.image} className="w-12 h-12 rounded-lg object-cover" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">{camp.isZakat ? "Zakat untuk:" : camp.isQurban ? "Qurban untuk:" : "Mendonasikan untuk:"}</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{camp.title}</p>
            </div>
          </div>

          {/* ------------- LOGIKA ZAKAT ------------- */}
          {camp.isZakat && (
            <>
              {/* Simulasi Harga Emas */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote size={16} className="text-emerald-600" />
                  <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Harga Emas Saat Ini</span>
                </div>
                <p className="text-xl font-extrabold text-emerald-800">{formatIDR(GOLD_PRICE_PER_GRAM)} <span className="text-sm font-medium">/ gram</span></p>
              </div>

              <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
                <button onClick={() => setZakatMode('calculator')} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-all ${zakatMode === 'calculator' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Calculator size={16} /> Kalkulator Zakat</button>
                <button onClick={() => setZakatMode('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${zakatMode === 'manual' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Input Manual</button>
              </div>

              {zakatMode === 'calculator' ? (
                <div className="bg-white border border-teal-100 rounded-2xl p-5 mb-6 shadow-sm">
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => { setZakatCalcType('profesi'); setZakatResult(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'profesi' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'border-gray-200 text-gray-500'}`}>Zakat Profesi</button>
                    <button onClick={() => { setZakatCalcType('maal'); setZakatResult(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${zakatCalcType === 'maal' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'border-gray-200 text-gray-500'}`}>Zakat Maal (Harta)</button>
                  </div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    {zakatCalcType === 'profesi' ? 'Total Pendapatan Per Bulan' : 'Total Harta Tersimpan (Tabungan, Emas)'}
                  </label>
                  <div className="relative mb-4">
                    <span className="absolute left-4 top-3.5 font-bold text-gray-400">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={zakatInput}
                      onChange={(e) => { setZakatInput(e.target.value); setZakatResult(null); }}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-base font-bold text-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 mb-5 text-[11px] text-gray-500 leading-relaxed">
                    <p><strong>Batas Nisab:</strong></p>
                    <ul className="list-disc pl-4 mt-1">
                      <li>Profesi: {formatIDR(NISAB_PROFESI)}/bln (Setara 85gr Emas / 12)</li>
                      <li>Maal: {formatIDR(NISAB_MAAL)} (Setara 85gr Emas)</li>
                    </ul>
                    <p className="mt-1">Kewajiban Zakat yang dikeluarkan adalah <strong>2,5%</strong> dari total.</p>
                  </div>

                  {zakatResult === null ? (
                    <button onClick={calculateZakat} className="w-full bg-teal-100 text-teal-700 hover:bg-teal-200 font-bold text-lg py-4 rounded-xl shadow-sm transition-all">
                      Hitung Zakat
                    </button>
                  ) : zakatResult > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-4">
                      <p className="text-emerald-800 text-sm font-semibold mb-1">Kewajiban Zakat Anda:</p>
                      <p className="text-2xl font-extrabold text-emerald-600 mb-4">{formatIDR(zakatResult)}</p>
                      <button onClick={() => goTo('profile')} className="w-full bg-teal-600 text-white font-bold text-lg py-3 rounded-xl shadow-lg shadow-teal-600/30 active:scale-[0.98] transition-all">
                        Lanjutkan Pembayaran
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-gray-800 mb-2">Masukkan Nominal Zakat</h3>
                  <div className="relative">
                    <span className="absolute left-4 top-4 font-bold text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={donationData.customAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDonationData({ ...donationData, customAmount: e.target.value, amount: val })
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl py-4 pl-12 pr-4 text-lg font-bold text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ------------- LOGIKA FIXED AMOUNT HYBRID (PAKET & QURBAN) ------------- */}
          {camp.isFixedAmount && !camp.isQurban && (
            <div className="flex bg-gray-200/60 p-1 rounded-xl mb-6">
              <button onClick={() => toggleDonationMode('package')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${donationMode === 'package' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Paket</button>
              <button onClick={() => toggleDonationMode('open')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${donationMode === 'open' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Donasi Bebas</button>
            </div>
          )}

          {/* ------------- INPUT NOMINAL BEBAS (HYBRID OPEN / REGULAR) ------------- */}
          {(!camp.isZakat && (!camp.isFixedAmount || donationMode === 'open')) && (
            <>
              <h3 className="font-bold text-gray-800 mb-4">Pilih Nominal Cepat</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {quickAmounts.map(amt => (
                  <button key={amt} onClick={() => setDonationData({ ...donationData, amount: amt, customAmount: amt.toString() })} className={`py-3 rounded-xl border text-center font-bold transition-all ${donationData.amount === amt ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-[0_0_0_1px_rgba(20,184,166,1)]' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {formatIDR(amt).replace(',00', '')}
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-gray-800 mb-2">Atau Masukkan Nominal Lain</h3>
              <div className="relative">
                <span className="absolute left-4 top-4 font-bold text-gray-500">Rp</span>
                <input
                  type="number"
                  value={donationData.customAmount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDonationData({ ...donationData, customAmount: e.target.value, amount: val })
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl py-4 pl-12 pr-4 text-lg font-bold text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Minimum nominal Rp 10.000</p>
            </>
          )}

          {/* ------------- INPUT FIXED AMOUNT PAKET / QURBAN ------------- */}
          {(camp.isFixedAmount && (donationMode === 'package' || donationMode === 'qurban')) && (
            <>
              <h3 className="font-bold text-gray-800 mb-3">Tentukan Kuantitas</h3>
              <div className="bg-white border border-teal-100 rounded-2xl p-4 mb-6 shadow-sm">

                <div className="flex justify-between items-center mb-5">
                  <div className="pr-2">
                    <h4 className="font-bold text-gray-800 text-sm">{camp.packageName}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{formatIDR(camp.packagePrice)} / pkt</p>
                  </div>
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1 shrink-0">
                    <button onClick={() => handlePackageChange(-1)} disabled={packageQty <= 1} className={`w-10 h-10 flex items-center justify-center rounded-lg ${packageQty <= 1 ? 'text-gray-300' : 'text-teal-600 bg-white shadow-sm'}`}><Minus size={18} /></button>
                    <span className="w-10 text-center font-bold text-gray-800 text-lg">{packageQty}</span>
                    <button onClick={() => handlePackageChange(1)} className="w-10 h-10 flex items-center justify-center rounded-lg text-teal-600 bg-white shadow-sm"><Plus size={18} /></button>
                  </div>
                </div>

                {/* Sugesti nominal untuk paket */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 2, 5, 10].map(qty => (
                    <button key={qty} onClick={() => handlePackageChange(qty, true)} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${packageQty === qty ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 border-gray-200'}`}>{qty} Qty</button>
                  ))}
                </div>

                {/* Detail Isi Bundling Dinamis */}
                {camp.isBundle && camp.bundleItems && (
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mt-4 shadow-sm">
                    <p className="text-xs font-bold text-teal-800 mb-3 uppercase tracking-wide flex items-center gap-1.5"><Gift size={14} /> Rincian Kebaikan Anda:</p>
                    <div className="flex flex-col gap-2.5">
                      {camp.bundleItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-200 text-teal-800 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                            {item.baseQty * packageQty}
                          </div>
                          <span className="font-semibold text-teal-900 text-sm leading-tight">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Accumulator (Hide for Zakat Calculator mode to enforce button) */}
        {!(camp.isZakat && zakatMode === 'calculator') && (
          <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-gray-500 text-sm font-semibold">Total Tagihan</span>
              <span className="text-xl font-extrabold text-teal-600">{formatIDR(donationData.amount)}</span>
            </div>
            <button onClick={() => goTo('profile')} disabled={donationData.amount < 10000} className={`w-full font-bold text-lg py-4 rounded-xl transition-all ${donationData.amount >= 10000 ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              Lanjutkan
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    // Hitung berapa field nama yang dibutuhkan khusus untuk Qurban
    const isQurban = selectedCampaign?.isQurban;
    const namesCount = isQurban ? (selectedCampaign?.namesPerQty || 1) * packageQty : 0;
    const namesArray = Array.from({ length: namesCount });

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <button onClick={() => handleBack('amount')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg text-gray-800 ml-2">Lengkapi Data</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4 mb-6 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-teal-800 text-xs font-semibold mb-0.5">Total Donasi</p>
              <p className="text-teal-700 font-extrabold text-xl">{formatIDR(donationData.amount)}</p>
            </div>
            <div className="text-right">
              <span className="bg-white text-teal-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">{selectedCampaign?.category}</span>
            </div>
          </div>

          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Data Diri Pembayar</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
              <input type="text" placeholder="Masukkan nama Anda" value={donationData.name} onChange={(e) => setDonationData({ ...donationData, name: e.target.value })} className="w-full bg-slate-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email / WhatsApp <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input type="text" placeholder="Untuk bukti kuitansi" value={donationData.email} onChange={(e) => setDonationData({ ...donationData, email: e.target.value })} className="w-full bg-slate-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div>
                <p className="font-bold text-gray-800 text-sm">Sembunyikan nama saya</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Tampil sebagai Hamba Allah</p>
              </div>
              <button onClick={() => setDonationData({ ...donationData, isAnonymous: !donationData.isAnonymous })} className={`w-12 h-6 rounded-full relative transition-colors ${donationData.isAnonymous ? 'bg-teal-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${donationData.isAnonymous ? 'translate-x-6.5 left-1' : 'translate-x-0.5 left-0'}`}></div>
              </button>
            </div>
          </div>

          {/* ------------- ATAS NAMA QURBAN ------------- */}
          {isQurban && namesArray.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Atas Nama (Mudhohi)</h3>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{namesArray.length} Pequrban</span>
              </div>
              <p className="text-xs text-gray-500 mb-4 bg-amber-50 border border-amber-100 p-3 rounded-xl leading-relaxed">
                Anda memilih {packageQty} Qty ({selectedCampaign.packageName}). Sesuai ketentuan, ini mencakup slot <strong>{namesArray.length} Mudhohi/Pequrban</strong>. Silakan isi nama yang diniatkan untuk berqurban (opsional jika untuk diri sendiri).
              </p>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6">
                {namesArray.map((_, i) => (
                  <div key={i} className={`p-4 ${i !== namesArray.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Nama Mudhohi ke-{i + 1}</label>
                    <input
                      type="text"
                      placeholder={`Nama lengkap Mudhohi ke-${i + 1}`}
                      value={donationData.qurbanNames[i] || ''}
                      onChange={(e) => updateQurbanName(i, e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => goTo('payment')} disabled={!donationData.name.trim() && !donationData.isAnonymous} className={`w-full font-bold text-lg py-4 rounded-xl transition-all ${(donationData.name.trim() || donationData.isAnonymous) ? 'bg-teal-600 text-white shadow-lg active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Pilih Metode Pembayaran
          </button>
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    const groupedPayments = paymentMethods.reduce((acc, curr) => {
      if (!acc[curr.type]) acc[curr.type] = [];
      acc[curr.type].push(curr);
      return acc;
    }, {});

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white p-4 flex items-center border-b border-gray-100 shadow-sm z-10"><button onClick={() => handleBack('profile')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={24} /></button><h2 className="font-bold text-lg text-gray-800 ml-2">Metode Pembayaran</h2></div>
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5 mb-6 flex justify-between items-center shadow-sm">
            <span className="text-teal-800 font-semibold">Total Tagihan:</span>
            <span className="text-teal-700 font-extrabold text-xl">{formatIDR(donationData.amount)}</span>
          </div>
          {Object.entries(groupedPayments).map(([type, methods], index) => (
            <div key={index} className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">{type}</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {methods.map((method, i) => (
                  <div key={method.id} onClick={() => setDonationData({ ...donationData, paymentMethod: method.id })} className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${i !== methods.length - 1 ? 'border-b border-gray-50' : ''} ${donationData.paymentMethod === method.id ? 'bg-teal-50/40' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 border border-gray-100 ${method.color}`}><method.icon size={20} /></div>
                      <span className="font-semibold text-gray-800">{method.name}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${donationData.paymentMethod === method.id ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                      {donationData.paymentMethod === method.id && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => goTo('success')} disabled={!donationData.paymentMethod} className={`w-full font-bold text-lg py-4 rounded-xl transition-all ${donationData.paymentMethod ? 'bg-teal-600 text-white shadow-lg active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Bayar Sekarang
          </button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col h-full bg-white justify-center relative overflow-hidden">
      <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-yellow-400 animate-bounce"></div>
      <div className="absolute top-20 right-10 w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
      <div className="px-6 flex flex-col items-center text-center z-10">
        <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-teal-100"><CheckCircle size={56} className="text-teal-500" /></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih, Orang Baik!</h1>
        <p className="text-gray-600 text-sm mb-8">Pembayaran Anda sebesar <span className="font-bold text-teal-600">{formatIDR(donationData.amount)}</span> telah kami terima.</p>
        <button onClick={() => goTo('home')} className="w-full bg-teal-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98]">Kembali ke Beranda</button>
      </div>
    </div>
  );

  return (
    // Memenuhi format Max-Width Desktop/Web dan Fullwidth di Mobile tanpa fake device border
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans" style={{ fontFamily: "'Source Sans Pro', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
      <div className="w-full max-w-md h-[100dvh] bg-white relative flex flex-col sm:shadow-2xl overflow-hidden">
        {screen === 'home' && renderHome()}
        {screen === 'donasi_saya' && renderDonasiSaya()}
        {screen === 'news' && renderNews()}
        {screen === 'update_detail' && renderUpdateDetail()}
        {screen === 'user_profile' && renderUserProfile()}
        {screen === 'category' && renderCategory()}
        {screen === 'detail' && renderDetail()}
        {screen === 'amount' && renderAmount()}
        {screen === 'profile' && renderProfile()}
        {screen === 'payment' && renderPayment()}
        {screen === 'success' && renderSuccess()}
      </div>
    </div>
  );
}