import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

const sourceSansPro = Source_Sans_3({
  variable: "--font-source-sans-pro",
  subsets: ["latin"],
  weight: ['300', '400', '600', '700'],
});

export const metadata: Metadata = {
  title: "PeduliSesama - Publik Donasi",
  description: "Platform Donasi Publik PeduliSesama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${sourceSansPro.variable} h-full antialiased`}>
      <body className="h-full flex flex-col bg-slate-50 font-sans">
        <main className="flex-1 w-full max-w-md mx-auto relative overflow-hidden bg-white shadow-xl flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            {children}
          </div>
          <BottomNav />
        </main>
      </body>
    </html>
  );
}
