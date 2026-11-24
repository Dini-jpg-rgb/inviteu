"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function Header() {
  const { user, partner, logout } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur px-8 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-950/80 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Partner Workspace
        </h1>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          B2B Partner
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quota shortcut pill */}
        <Link
          href="/packages"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sisa Kuota: <strong className="text-zinc-900 dark:text-zinc-100">8 Undangan</strong></span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {partner?.nama_bisnis || user?.name || "Partner InviteU"}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {user?.email || "partner@inviteu.id"}
            </p>
          </div>

          <button
            onClick={logout}
            title="Keluar dari akun"
            className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition text-xs font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
