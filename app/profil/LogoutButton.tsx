"use client";

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-white text-red-500 font-semibold py-3.5 px-4 rounded-2xl border border-red-100 shadow-sm shadow-red-50 hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
    >
      <LogOut size={18} />
      <span>Keluar Akun</span>
    </button>
  );
}
