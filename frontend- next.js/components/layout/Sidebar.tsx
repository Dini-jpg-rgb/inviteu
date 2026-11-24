"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePartner } from "@/context/PartnerContext";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { activePackage, invitations } = usePartner();

  const [partnerName, setPartnerName] = useState("Undiksha Team");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  // Sync profile from localStorage on client-side only (prevents SSR hydration mismatch)
  React.useEffect(() => {
    const syncProfile = () => {
      try {
        const savedName = localStorage.getItem("inviteu_partner_name");
        if (savedName) setPartnerName(savedName);
        const savedPhoto = localStorage.getItem("inviteu_partner_photo");
        setCustomPhoto(savedPhoto || null);
      } catch {
        // ignore
      }
    };

    syncProfile();

    window.addEventListener("inviteu_profile_updated", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("inviteu_profile_updated", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const activePackageName =
    activePackage === "basic"
      ? "Basic"
      : activePackage === "medium"
      ? "Medium"
      : activePackage === "pro" || activePackage === "premium"
      ? "Pro"
      : "";

  const maxQuota =
    activePackage === "basic"
      ? 5
      : activePackage === "medium"
      ? 20
      : 10;

  const usedQuota = invitations.filter((i) => i.status === "Published").length;
  const remainingQuota = Math.max(0, maxQuota - usedQuota);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Package",
      href: "/packages",
    },
    {
      name: "Template",
      href: "/templates",
    },
    {
      name: "My Invitations",
      href: "/invitations",
    },
    {
      name: "Invoice & Riwayat Pembayaran",
      href: "/invoice",
    },
  ];

  const isProfileActive = pathname === "/profile";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 md:z-auto w-[270px] md:w-[250px] shrink-0 h-screen overflow-y-auto bg-[#2d1b11] text-[#e3d1c4] p-4 sm:p-5 flex flex-col justify-between border-r border-[#422718] select-none shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-5 relative">
          {/* Mobile Close Button (✕) */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute -top-1 right-0 text-[#d8c2b3] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <span className="text-lg leading-none">✕</span>
          </button>

          {/* InviteU Circular Logo - Centered in Sidebar */}
          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/dashboard"
              onClick={() => onClose?.()}
              className="inline-flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md hover:scale-105 transition-transform">
                <Image
                  src="/logo-inviteu.svg.svg"
                  alt="InviteU Logo"
                  width={48}
                  height={48}
                  priority
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Navigation List (Ukuran menu dan pilihan diperkecil persis seperti contoh gambar) */}
          <nav className="flex flex-col gap-1.5 mt-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#f5a638] text-[#2d1b11] font-bold shadow-xs"
                      : "text-[#d8c2b3] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      {/* Bottom Area: Package Aktif & User Profile */}
      <div className="mt-auto pt-3 space-y-2">
        {/* Kotak Paket Aktif & Sisa Quota (Dikecilkan lebih compact & proporsional) */}
        {activePackage && (
          <div className="bg-white rounded-xl p-2.5 shadow-sm border border-[#3e2417]/15 space-y-1.5 text-zinc-900 select-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 font-medium leading-none">
                  Package aktif
                </p>
                <h4
                  suppressHydrationWarning
                  className="text-xs font-bold text-zinc-900 leading-tight mt-0.5"
                >
                  {activePackageName}
                </h4>
              </div>
              <span
                suppressHydrationWarning
                className="text-[10px] font-bold text-zinc-800 bg-[#f7efe6] px-1.5 py-0.5 rounded border border-[#e5d8c8]"
              >
                {usedQuota} / {maxQuota}
              </span>
            </div>

            <div className="space-y-1">
              {/* Progress bar: Sisa kuota (load masih panjang jika baru terpakai sedikit) */}
              <div className="w-full h-1.5 rounded-full bg-[#f0e6d8] overflow-hidden">
                <div
                  suppressHydrationWarning
                  className="h-full bg-[#f5a638] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, (remainingQuota / maxQuota) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-zinc-400 font-medium">
                <span>Quota terpakai</span>
                <span suppressHydrationWarning>Sisa {remainingQuota}</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section at Bottom Left */}
        <div
          className={`bg-white rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-sm border transition-all ${
            isProfileActive
              ? "border-[#f5a638] ring-2 ring-[#f5a638]/50"
              : "border-[#3e2417] hover:border-zinc-300"
          }`}
        >
          {/* Avatar Icon & User Info - Clickable to /profile */}
          <Link
            href="/profile"
            onClick={() => onClose?.()}
            title="Buka Profil Partner"
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-300 group-hover:scale-105 transition-transform">
              {customPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customPhoto}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <h4
                suppressHydrationWarning
                className="text-xs font-bold text-zinc-900 truncate leading-tight group-hover:text-amber-700 transition-colors"
              >
                {partnerName}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium leading-none mt-0.5">
                Partner
              </p>
            </div>
          </Link>

          {/* Orange "Keluar" Button */}
          <button
            onClick={() => logout()}
            title="Keluar dari akun"
            className="bg-[#f5a638] hover:bg-[#e09228] text-white text-[11px] font-bold px-3 py-1 rounded-md transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
