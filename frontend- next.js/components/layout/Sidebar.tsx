"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [customPhoto] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("inviteu_partner_photo") || null;
    } catch {
      return null;
    }
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "My Invitations",
      href: "/invitations",
    },
    {
      name: "Template",
      href: "/templates",
    },
    {
      name: "Package",
      href: "/packages",
    },
  ];

  const isProfileActive = pathname === "/profile";

  return (
    <aside className="w-[230px] md:w-[250px] shrink-0 h-screen sticky top-0 overflow-y-auto bg-[#2d1b11] text-[#e3d1c4] p-5 flex flex-col justify-between border-r border-[#422718] select-none">
      <div className="flex flex-col gap-6">
        {/* InviteU Circular Logo */}
        <div className="pt-2 px-2">
          <Link href="/dashboard" className="inline-block">
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

        {/* Navigation List */}
        <nav className="flex flex-col gap-2 mt-2">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#f5a638] text-[#2d1b11] font-bold shadow-md"
                    : "text-[#d8c2b3] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile Section at Bottom Left (matching Image 1, 2, 3, 4 with link to /profile) */}
      <div className="mt-auto pt-4">
        <div
          className={`bg-white rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-sm border transition-all ${
            isProfileActive
              ? "border-[#f5a638] ring-2 ring-[#f5a638]/50"
              : "border-[#3e2417] hover:border-zinc-300"
          }`}
        >
          {/* Avatar Icon & User Info - Clickable to /profile */}
          <Link
            href="/profile"
            title="Buka Profil Partner"
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-300 group-hover:scale-105 transition-transform">
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
              <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight group-hover:text-amber-700 transition-colors">
                Undiksha Team
              </h4>
              <p className="text-[11px] text-zinc-500 font-medium leading-none mt-0.5">
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
  );
}
