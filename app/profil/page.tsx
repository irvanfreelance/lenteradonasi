import React from 'react';
import Header from '@/components/layout/Header';
import { User, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

async function getProfileData(donorId: string) {
  try {
    const res = await query(
      `SELECT name, email, phone, is_anonymous_default, created_at FROM donors WHERE id = $1 LIMIT 1`,
      [donorId]
    );
    return res.length > 0 ? res[0] : null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/login');
  }

  const donorId = (session.user as any).id;
  const profile = await getProfileData(donorId);

  if (!profile) {
    return (
      <div className="flex flex-col h-full bg-slate-50 relative pb-24">
        <Header subtitle="Profil Akun" />
        <div className="p-5 flex justify-center mt-10 text-gray-500 text-sm">Data profil tidak ditemukan.</div>
      </div>
    );
  }

  const joinDate = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long' }).format(new Date(profile.created_at || new Date()));

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      <Header subtitle="Profil Akun" />
      
      <div className="flex-1 overflow-y-auto px-5 pt-6 no-scrollbar">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-500 to-emerald-400"></div>
          
          <div className="relative pt-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md mb-4 relative">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-teal-600 border border-gray-200 overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-teal-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h2>
            <div className="flex items-center text-sm text-gray-500 mb-4 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Award size={14} className="mr-1.5 text-yellow-500" />
              Bergabung sejak {joinDate}
            </div>
          </div>
        </div>

        {/* Data Diri */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-800 mb-5">Data Diri</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Nama Lengkap</p>
                <p className="text-sm font-medium text-gray-800">{profile.name}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-50"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-800">{profile.email}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-50"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">No. Handphone</p>
                <p className="text-sm font-medium text-gray-800">{profile.phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
