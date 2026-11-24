"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function InviteULogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-20 h-20 flex items-center justify-center select-none">
        <Image
          src="/logo-inviteu.svg.svg"
          alt="InviteU Logo"
          width={80}
          height={80}
          priority
          unoptimized
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function EyeIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg className="w-4 h-4 text-zinc-400 hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-zinc-400 hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  activeRole?: "partner" | "admin" | "designer";
}

export function AuthLayout({ children, activeRole = "partner" }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 py-8 bg-[#fdfaf4] overflow-hidden select-none">
      
      {/* 1. Organic Blob Shape: Top Left (Soft Peach) */}
      <div className="absolute -top-16 -left-16 sm:-top-24 sm:-left-24 w-72 sm:w-96 h-72 sm:h-96 pointer-events-none opacity-80 z-0">
        <svg viewBox="0 0 400 400" className="w-full h-full fill-[#fde5cd]">
          <path d="M320,160 C360,240 310,340 220,360 C130,380 40,310 20,220 C0,130 60,40 160,20 C260,0 280,80 320,160 Z" />
        </svg>
      </div>

      {/* 2. Organic Blob Shape: Bottom Right (Warm Apricot / Golden Orange) */}
      <div className="absolute -bottom-20 -right-20 sm:-bottom-28 sm:-right-28 w-80 sm:w-[450px] h-80 sm:h-[450px] pointer-events-none opacity-80 z-0">
        <svg viewBox="0 0 400 400" className="w-full h-full fill-[#fed7aa]">
          <path d="M300,120 C360,200 340,320 250,360 C160,400 50,330 30,230 C10,130 90,30 190,10 C290,-10 240,40 300,120 Z" />
        </svg>
      </div>

      {/* 3. Main Center Card */}
      <div className="relative z-10 w-full max-w-[430px] bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] px-6 py-8 sm:px-9 sm:py-10 border border-zinc-100">
        {/* Logo at top */}
        <div className="mb-4">
          <InviteULogo />
        </div>

        {/* Dynamic Content */}
        {children}
      </div>

      {/* 4. Subtle Direct Role Link Switcher for Testing (at bottom center) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-3 text-[11px] text-zinc-400 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-zinc-200/60 shadow-2xs">
        <span className="text-zinc-500 font-medium">Rute Login:</span>
        <Link
          href="/login"
          className={`hover:text-amber-600 transition-colors ${
            activeRole === "partner" ? "font-bold text-amber-600" : ""
          }`}
        >
          Partner (Default)
        </Link>
        <span>·</span>
        <Link
          href="/login/admin"
          className={`hover:text-amber-600 transition-colors ${
            activeRole === "admin" ? "font-bold text-amber-600" : ""
          }`}
        >
          Admin
        </Link>
        <span>·</span>
        <Link
          href="/login/designer"
          className={`hover:text-amber-600 transition-colors ${
            activeRole === "designer" ? "font-bold text-amber-600" : ""
          }`}
        >
          Designer
        </Link>
      </div>

    </div>
  );
}
