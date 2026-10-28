"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // 8 Menu Utama Admin sesuai PRD v3.0 Bagian 16
  const adminNavigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Package Management",
      href: "/admin/packages",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Partner Management",
      href: "/admin/partners",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Invitation Monitoring",
      href: "/admin/invitations",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      name: "Template Management",
      href: "/admin/templates",
      badge: "2 Review",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Widget Management",
      href: "/admin/widgets",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
    },
    {
      name: "Transaction / Payment",
      href: "/admin/transactions",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      name: "Reports (5 Laporan)",
      href: "/admin/reports",
      badge: null,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const isUserManagementActive = pathname.startsWith("/admin/user-management");
  const [userMgmtOpen, setUserMgmtOpen] = React.useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar Khusus Super Admin sesuai PRD Bagian 16 */}
      <aside className="w-[280px] shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-zinc-200 bg-white p-6 flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-6">
          {/* Header Brand Admin */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm shadow">
              IU
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                InviteU Admin
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Internal Oversight Panel
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1">
            <p className="px-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Menu Pengawasan (PRD 16)
            </p>

            {/* Dashboard */}
            <Link
              href="/admin/dashboard"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname === "/admin/dashboard"
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </div>
            </Link>

            {/* Package Management */}
            <Link
              href="/admin/packages"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/packages")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Package Management</span>
              </div>
            </Link>

            {/* USER MANAGEMENT (Group with 3 Sub-menus: Admin, Designer, Partner) */}
            <div className="flex flex-col">
              <div
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer select-none ${
                  isUserManagementActive
                    ? "bg-rose-50/70 text-rose-700 font-bold dark:bg-rose-950/40 dark:text-rose-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
                onClick={() => setUserMgmtOpen(!userMgmtOpen)}
              >
                <Link
                  href="/admin/user-management/admin"
                  className="flex items-center gap-2.5 flex-1"
                  onClick={(e) => {
                    // Let navigation proceed or toggle
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>User Management</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMgmtOpen(!userMgmtOpen);
                  }}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-zinc-800 rounded transition"
                  aria-label="Toggle Submenu"
                >
                  <svg
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                      userMgmtOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Sub-menu Items */}
              {userMgmtOpen && (
                <div className="pl-6 pr-1 pt-1 pb-1 space-y-0.5 border-l-2 border-rose-100 ml-4 my-1 dark:border-rose-950">
                  <Link
                    href="/admin/user-management/admin"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                      pathname === "/admin/user-management/admin"
                        ? "bg-rose-100 text-rose-800 font-bold dark:bg-rose-950/70 dark:text-rose-300"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Admin Management</span>
                  </Link>

                  <Link
                    href="/admin/user-management/designer"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                      pathname === "/admin/user-management/designer"
                        ? "bg-rose-100 text-rose-800 font-bold dark:bg-rose-950/70 dark:text-rose-300"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Designer Management</span>
                  </Link>

                  <Link
                    href="/admin/user-management/partner"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                      pathname === "/admin/user-management/partner"
                        ? "bg-rose-100 text-rose-800 font-bold dark:bg-rose-950/70 dark:text-rose-300"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Partner Management</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Invitation Monitoring */}
            <Link
              href="/admin/invitations"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/invitations")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Invitation Monitoring</span>
              </div>
            </Link>

            {/* Template Management */}
            <Link
              href="/admin/templates"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/templates")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Template Management</span>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                2 Review
              </span>
            </Link>

            {/* Widget Management */}
            <Link
              href="/admin/widgets"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/widgets")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <span>Widget Management</span>
              </div>
            </Link>

            {/* Transaction / Payment */}
            <Link
              href="/admin/transactions"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/transactions")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Transaction / Payment</span>
              </div>
            </Link>

            {/* Reports */}
            <Link
              href="/admin/reports"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                pathname.startsWith("/admin/reports")
                  ? "bg-rose-50 text-rose-700 font-semibold dark:bg-rose-950/50 dark:text-rose-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Reports (5 Laporan)</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* Footer info role & Logout button */}
        <div className="space-y-2">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Hak Akses: Superadmin</span>
              <Badge variant="destructive">Role-01</Badge>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Otoritas persetujuan template & pemantauan platform.
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
