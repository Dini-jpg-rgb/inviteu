
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PartnerProvider } from "@/context/PartnerContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // 8 Menu Utama Admin sesuai Screenshots (Image 2, 3, 4, 5)
  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      name: "Package Management",
      href: "/admin/packages",
    },
    {
      name: "Partner Management",
      href: "/admin/partners",
    },
    {
      name: "Invitation Monitoring",
      href: "/admin/invitations",
    },
    {
      name: "Template Management",
      href: "/admin/templates",
    },
    {
      name: "Widget Management",
      href: "/admin/widgets",
    },
    {
      name: "Transaction / Payment",
      href: "/admin/transactions",
    },
    {
      name: "Reports",
      href: "/admin/reports",
    },
  ];

  return (
    <PartnerProvider>
      <div className="flex h-screen overflow-hidden bg-[#f6efe6] text-zinc-900 selection:bg-[#2d1b11] selection:text-white">
        {/* Left Sidebar Espresso Brown (Matching Images 2, 3, 4, 5) */}
        <aside className="w-[230px] md:w-[250px] shrink-0 h-screen sticky top-0 overflow-y-auto bg-[#24140b] text-[#e3d1c4] p-5 flex flex-col justify-between border-r border-[#3a2012] select-none">
          <div className="flex flex-col gap-6">
            {/* InviteU Circular Logo - Centered in Sidebar */}
            <div className="pt-2 flex items-center justify-center">
              <Link href="/admin/dashboard" className="inline-flex items-center justify-center">
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
            <nav className="flex flex-col gap-1.5 mt-2">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/admin/dashboard"
                    ? pathname === "/admin/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${isActive
                        ? "bg-[#f5a638] text-[#2d1b11] font-bold shadow-sm"
                        : "text-[#d8c2b3] hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Left Profile Card (Admin) */}
          <div className="mt-auto pt-4">
            <div className="bg-white rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-sm border border-[#3e2417]">
              {/* Avatar Icon & User Info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center shrink-0 text-zinc-500 border border-zinc-300">
                  <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">
                    Undiksha Team
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-none mt-0.5">
                    Admin
                  </p>
                </div>
              </div>

              {/* Orange "Keluar" Button */}
              <button
                onClick={() => logout()}
                title="Keluar dari akun admin"
                className="bg-[#f5a638] hover:bg-[#e09228] text-white text-[11px] font-bold px-3 py-1 rounded-md transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}
