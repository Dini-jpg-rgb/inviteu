"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  User,
  Plus,
  LogOut,
  FolderOpen,
  GitBranch,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DesignerTemplatesProvider } from "./designer/DesignerTemplatesContext";
import { ConfigProvider, App as AntdApp } from "antd";

const designerTheme = {
  token: {
    colorPrimary: "#FFAD38",
    colorInfo: "#FFAD38",
    colorSuccess: "#258447",
    colorWarning: "#F5A623",
    colorError: "#CB3025",
    colorTextBase: "#422B1C",
    colorText: "#422B1C",
    colorTextHeading: "#422B1C",
    colorTextSecondary: "#99918A",
    colorBgBase: "#FFFFFF",
    colorBgLayout: "#F7F6F4",
    colorBgContainer: "#FFFFFF",
    colorBorder: "#EAE5DF",
    colorBorderSecondary: "#EAE5DF",
    borderRadius: 8,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      colorPrimary: "#FFAD38",
      colorPrimaryHover: "#F5A623",
      colorPrimaryActive: "#E09214",
      colorPrimaryText: "#3D2516",
      colorLink: "#FFAD38",
      colorLinkHover: "#F5A623",
      borderRadius: 8,
      defaultBorderColor: "#EAE5DF",
      defaultColor: "#422B1C",
      defaultBg: "#FFFFFF",
      defaultHoverBg: "#FAF8F5",
      defaultHoverBorderColor: "#FFAD38",
      defaultHoverColor: "#3D2516",
    },
    Card: {
      colorBorderSecondary: "#EAE5DF",
      colorBgContainer: "#FFFFFF",
      borderRadiusLG: 10,
    },
    Table: {
      headerBg: "#F7F6F4",
      headerColor: "#422B1C",
      borderColor: "#EAE5DF",
      rowHoverBg: "#FAF8F5",
      colorText: "#422B1C",
    },
    Input: {
      activeBorderColor: "#FFAD38",
      hoverBorderColor: "#FFAD38",
      colorBorder: "#EAE5DF",
      colorText: "#422B1C",
      colorTextPlaceholder: "#99918A",
    },
    Select: {
      colorPrimary: "#FFAD38",
      colorPrimaryHover: "#FFAD38",
      colorBorder: "#EAE5DF",
      optionSelectedBg: "#FFF8EE",
      optionSelectedColor: "#422B1C",
    },
    Tabs: {
      colorPrimary: "#FFAD38",
      itemSelectedColor: "#3D2516",
      itemHoverColor: "#FFAD38",
      inkBarColor: "#FFAD38",
    },
    Segmented: {
      itemSelectedBg: "#FFFFFF",
      itemSelectedColor: "#3D2516",
      itemColor: "#99918A",
      itemHoverColor: "#422B1C",
      trackBg: "#EAE5DF",
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Timeline: {
      tailColor: "#EAE5DF",
    },
    Modal: {
      borderRadiusLG: 12,
      contentBg: "#FFFFFF",
      headerBg: "#FFFFFF",
    },
    Pagination: {
      colorPrimary: "#FFAD38",
      itemActiveBg: "#FFAD38",
    },
  },
};

function DesignerLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Mode Fullscreen Page Builder tanpa Sidebar
  if (pathname.includes("/builder")) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#2D1C15] text-white">
        {children}
      </div>
    );
  }

  // Menu Navigasi Designer Sederhana & Terstruktur
  const designerNavigation = [
    {
      name: "Dashboard",
      href: "/designer/dashboard",
      icon: <LayoutDashboard size={18} strokeWidth={1.8} />,
    },
    {
      name: "My Templates",
      href: "/designer/templates",
      icon: <Palette size={18} strokeWidth={1.8} />,
    },
    {
      name: "Asset Library",
      href: "/designer/assets",
      icon: <FolderOpen size={18} strokeWidth={1.8} />,
    },
    {
      name: "Riwayat Revisi",
      href: "/designer/revisions",
      icon: <GitBranch size={18} strokeWidth={1.8} />,
    },
    {
      name: "Profil Desainer",
      href: "/designer/profile",
      icon: <User size={18} strokeWidth={1.8} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F4] text-[#422B1C]">
      {/* Sidebar Designer sesuai PRD Bagian 17 */}
      <aside className="w-[260px] shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-[#341F12] bg-[#3D2516] p-6 flex flex-col justify-between select-none shadow-sm">
        <div className="flex flex-col gap-6">
          {/* InviteU Circular Logo - Centered in Sidebar */}
          <div className="pt-1 flex items-center justify-center">
            <Link href="/designer/templates" className="inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md border border-[#EAE5DF]/40 hover:scale-105 transition-transform">
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

          {/* Quick Action Button Create Template (PRD 18.3) */}
          <Link
            href="/designer/templates/builder"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FFAD38] hover:bg-[#F5A623] active:bg-[#E09214] px-4 py-2.5 text-xs font-semibold text-[#3D2516] shadow-xs transition cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>Buat Template Baru</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            <p className="px-3 text-[11px] font-semibold text-[#99918A]/90 uppercase tracking-wider mb-1">
              Ruang Kerja Kreatif
            </p>
            {designerNavigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/designer/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors ${
                    isActive
                      ? "bg-[#FFAD38] text-[#3D2516] font-semibold shadow-xs"
                      : "text-[#EAE5DF] hover:bg-[#4E3220] hover:text-white font-medium"
                  }`}
                >
                  <span className={isActive ? "text-[#3D2516]" : "text-[#EAE5DF]"}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info role & Logout button */}
        <div className="space-y-2.5">
          <div className="rounded-xl border border-[#4E3220] bg-[#341F12] p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Hak Akses: Desainer</span>
              <span className="bg-[#FFAD38]/20 text-[#FFAD38] border border-[#FFAD38]/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                Role-03
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#99918A]">
              Fokus pembuatan template & revisi feedback admin.
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-[#FF8A80] hover:bg-[#4E3220] hover:text-[#FF5252] rounded-lg border border-[#4E3220] transition-colors cursor-pointer"
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 h-screen ${
          pathname.includes("/edit") || pathname.includes("/builder")
            ? "overflow-hidden p-0"
            : "overflow-y-auto p-6 lg:p-8"
        } bg-[#F7F6F4]`}
      >
        {children}
      </main>
    </div>
  );
}

export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={designerTheme}>
      <AntdApp>
        <DesignerTemplatesProvider>
          <DesignerLayoutContent>{children}</DesignerLayoutContent>
        </DesignerTemplatesProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
