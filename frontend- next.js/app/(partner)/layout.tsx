"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { PartnerProvider } from "@/context/PartnerContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBuilder = pathname.includes("/builder");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isBuilder) {
    return (
      <PartnerProvider>
        <div className="w-screen h-screen overflow-hidden bg-[#2D1C15] text-white">
          {children}
        </div>
      </PartnerProvider>
    );
  }

  return (
    <PartnerProvider>
      <div className="flex h-screen overflow-hidden bg-[#f6efe6] text-zinc-900 selection:bg-[#2d1b11] selection:text-white print:h-auto print:overflow-visible print:bg-white print:block">
        {/* Responsive Partner Sidebar (Drawer on mobile, Sticky on desktop) */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible print:block print:w-full">
          {/* Mobile Navigation Header (Only visible on screens < md) */}
          <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#2d1b11] text-[#e3d1c4] border-b border-[#422718] shrink-0 z-30 select-none print:hidden">
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Buka Menu Navigasi"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs">
                  <Image
                    src="/logo-inviteu.svg.svg"
                    alt="InviteU Logo"
                    width={22}
                    height={22}
                    priority
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-sm text-white tracking-tight">InviteU Partner</span>
              </Link>
            </div>

            <Link
              href="/profile"
              className="text-xs bg-[#f5a638] text-[#2d1b11] font-bold px-3 py-1 rounded-md shadow-xs hover:bg-[#e09228] transition-colors"
            >
              Profil
            </Link>
          </header>

          <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:h-auto print:w-full">
            {children}
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}
