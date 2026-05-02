"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Heart, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface LoginClientProps {
  configs: any;
}

export default function LoginClient({ configs }: LoginClientProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  // Clear URL params without reloading to make it cleaner after reading error
  useEffect(() => {
    if (error) {
      window.history.replaceState(null, "", "/login");
    }
  }, [error]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/profil" });
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "AccessDenied":
        return "Email Anda tidak ditemukan dalam sistem kami. Anda hanya bisa masuk menggunakan email yang sudah digunakan untuk berdonasi sebelumnya.";
      default:
        return "Terjadi kesalahan saat masuk. Silakan coba lagi.";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header with Back Button */}
      <div className="absolute top-0 left-0 right-0 p-5 z-20 flex justify-between items-center">
        <Link 
          href="/" 
          className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:bg-white transition-all"
        >
          <ChevronLeft size={24} className="-ml-1" />
        </Link>
      </div>

      {/* Background Decor */}
      <div 
        className="absolute top-0 left-0 right-0 h-80 z-0 bg-gradient-to-b from-teal-500/20 to-transparent"
        style={{
          background: configs?.primary_color 
            ? `linear-gradient(to bottom, ${configs.primary_color}30, transparent)`
            : undefined
        }}
      />
      
      <div className="flex-1 flex flex-col justify-center items-center p-6 z-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          <div className="p-8 pb-6 flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              {configs?.logo_url ? (
                <div className="relative w-24 h-24">
                  <Image 
                    src={configs.logo_url} 
                    alt={configs?.ngo_name || 'Logo'} 
                    fill 
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Heart size={40} className="text-white fill-white" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-2 font-sans tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Masuk untuk melihat riwayat donasi Anda di <strong className="text-gray-700">{configs?.ngo_name || 'PeduliSesama'}</strong>.
            </p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 border border-red-100 shadow-sm shadow-red-100/50">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="leading-snug font-medium">{getErrorMessage(error)}</p>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3.5 px-4 border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-gray-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[15px]">Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 font-medium">
                Pendaftaran baru tidak tersedia. Hanya donatur yang terdaftar yang dapat masuk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
