"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  bannerTitle: string;
  bannerSubtitle: string;
  portalLabel?: string;
  currentRole?: "partner" | "admin" | "designer";
  showRoleSwitcher?: boolean;
}

export function AuthSplitLayout({
  children,
  bannerTitle,
  bannerSubtitle,
  portalLabel = "Portal Partner",
  currentRole,
  showRoleSwitcher = false,
}: AuthSplitLayoutProps) {
  return (
    /* Root container: ALWAYS flex-row (Kanan - Kiri), NEVER flex-col! */
    <div className="h-screen max-h-screen w-full flex flex-row bg-[#ffffff] selection:bg-[#2d1b11] selection:text-white overflow-hidden">
      
      {/* ============================================================== */}
      {/* LEFT COLUMN: Showcasing Phone Mockup & Flower Ornaments         */}
      {/* 50% width, full height, warm orange background                  */}
      {/* ============================================================== */}
      <div className="relative w-1/2 h-full bg-[#f5a638] flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 overflow-hidden select-none shrink-0">
        
        {/* ------------------------------------------------------------ */}
        {/* POJOK KANAN ATAS: Lapisan Bulat Putih + Aset Bunga 2         */}
        {/* Ujung tangkai mengarah ke sudut pojok kanan atas             */}
        {/* ------------------------------------------------------------ */}
        <div className="absolute -top-10 -right-10 sm:-top-14 sm:-right-14 md:-top-16 md:-right-16 w-40 h-40 sm:w-56 sm:h-56 md:w-68 md:h-68 rounded-full bg-white/25 pointer-events-none" />
        <div className="absolute -top-1 -right-1 sm:-top-3 sm:-right-3 md:-top-4 md:-right-4 w-28 sm:w-36 md:w-48 lg:w-52 pointer-events-none z-10 drop-shadow-xs rotate-180">
          <Image
            src="/templates/mogran-laura/aset%20bunga%202%20mogran%20-%20laura.png"
            alt="Aset Bunga 2 Kanan Atas"
            width={360}
            height={360}
            priority
            unoptimized
            className="w-full h-auto object-contain"
          />
        </div>

        {/* ------------------------------------------------------------ */}
        {/* POJOK KIRI BAWAH: Lapisan Bulat Putih + Aset Bunga 2          */}
        {/* Ujung tangkai mengarah ke sudut pojok kiri bawah (tanpa rotasi) */}
        {/* ------------------------------------------------------------ */}
        <div className="absolute -bottom-10 -left-10 sm:-bottom-14 sm:-left-14 md:-bottom-20 md:-left-20 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full bg-white/25 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 sm:-bottom-3 sm:-left-3 md:-bottom-4 md:-left-4 w-28 sm:w-36 md:w-48 lg:w-52 pointer-events-none z-10 drop-shadow-xs">
          <Image
            src="/templates/mogran-laura/aset%20bunga%202%20mogran%20-%20laura.png"
            alt="Aset Bunga 2 Kiri Bawah"
            width={360}
            height={360}
            priority
            unoptimized
            className="w-full h-auto object-contain"
          />
        </div>

        {/* ------------------------------------------------------------ */}
        {/* ASET BUNGA KIRI: Menyatu dengan DINDING KIRI halaman          */}
        {/* Ujung tangkai di atas dinding kiri, menjalar ke bawah        */}
        {/* ------------------------------------------------------------ */}
        <div className="absolute left-0 top-[20%] sm:top-[18%] md:top-[17%] w-24 sm:w-32 md:w-40 lg:w-44 z-20 pointer-events-none drop-shadow-md">
          <Image
            src="/templates/mogran-laura/aset%20bunga%20mogran%20-%20laura.png"
            alt="Bunga Kiri Menyatu Dinding"
            width={260}
            height={320}
            priority
            unoptimized
            className="w-full h-auto object-contain -translate-x-1 sm:-translate-x-2"
          />
        </div>

        {/* ------------------------------------------------------------ */}
        {/* ASET BUNGA KANAN: Menyatu dengan DINDING KANAN halaman        */}
        {/* Menjalar dari bawah ke atas mendekati HP                     */}
        {/* ------------------------------------------------------------ */}
        <div className="absolute right-0 bottom-[24%] sm:bottom-[22%] md:bottom-[20%] w-24 sm:w-32 md:w-40 lg:w-44 z-20 pointer-events-none drop-shadow-md rotate-180 scale-x-[-1]">
          <Image
            src="/templates/mogran-laura/aset%20bunga%20mogran%20-%20laura.png"
            alt="Bunga Kanan Menyatu Dinding"
            width={260}
            height={320}
            priority
            unoptimized
            className="w-full h-auto object-contain -translate-x-1 sm:-translate-x-2"
          />
        </div>

        {/* Spacer atas */}
        <div className="w-full h-1" />

        {/* ------------------------------------------------------------ */}
        {/* CENTER PHONE PREVIEW: Ukuran Lebih Besar & Proporsional      */}
        {/* ------------------------------------------------------------ */}
        <div className="relative my-auto flex items-center justify-center py-1 sm:py-2 z-10">
          <div className="relative w-[190px] sm:w-[245px] md:w-[305px] lg:w-[355px] xl:w-[385px] max-h-[66vh] flex items-center justify-center drop-shadow-2xl">
            <Image
              src="/templates/mogran-laura/aset%20preview%20hp%20mogran%20laura.png"
              alt="Preview Undangan Smartphone"
              width={645}
              height={645}
              priority
              unoptimized
              className="w-full h-auto max-h-[64vh] object-contain rounded-[24px] sm:rounded-[32px] md:rounded-[40px]"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BOTTOM SLOGAN & SUBTITLE                                     */}
        {/* ------------------------------------------------------------ */}
        <div className="relative z-10 text-center pb-1 pt-1">
          <h2 className="font-serif italic font-medium text-xs sm:text-base md:text-lg text-[#24140b] tracking-wide leading-tight">
            {bannerTitle}
          </h2>
          <p className="text-[9px] sm:text-[11px] md:text-xs text-[#523018] font-normal mt-0.5 max-w-xs sm:max-w-sm mx-auto leading-tight">
            {bannerSubtitle}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: Dedicated Clean Form Container                    */}
      {/* 50% width, full height                                          */}
      {/* ============================================================== */}
      <div className="w-1/2 h-full flex flex-col justify-between p-3 sm:p-4 md:p-6 bg-white overflow-hidden">
        
        {/* 1. TOP HEADER: Logo, Portal Pill, Diamond Divider (shrink-0) */}
        <div className="shrink-0 flex flex-col items-center justify-center text-center mb-1">
          {/* InviteU Watercolor Logo */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 relative flex items-center justify-center mb-1">
            <Image
              src="/logo-inviteu.svg.svg"
              alt="InviteU Logo"
              width={44}
              height={44}
              priority
              unoptimized
              className="w-full h-full object-contain"
            />
          </div>

          {/* Portal Pill */}
          <div className="inline-block border border-[#d8c2b3] bg-[#faf6f0] text-[#6b4728] text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs leading-none">
            {portalLabel}
          </div>

          {/* Diamond Divider */}
          <div className="flex items-center justify-center gap-2.5 w-28 sm:w-32 mx-auto my-1">
            <div className="h-[1px] bg-[#d9c7b4] flex-1" />
            <span className="text-[#a48265] text-[7px]">◆</span>
            <div className="h-[1px] bg-[#d9c7b4] flex-1" />
          </div>
        </div>

        {/* 2. MIDDLE SCROLLABLE FORM BODY (flex-1 min-h-0 overflow-y-auto) */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center py-1">
          <div className="w-full max-w-[370px] mx-auto px-1">
            {children}
          </div>
        </div>

        {/* 3. FIXED BOTTOM ROLE SWITCHER (shrink-0, ALWAYS VISIBLE & CLICKABLE) */}
        {showRoleSwitcher && currentRole && (
          <div className="shrink-0 pt-2 pb-0.5 border-t border-zinc-100 bg-white z-20 flex items-center justify-center gap-1.5 sm:gap-2 text-xs select-none">
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Beralih Portal:</span>
            <div className="inline-flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
              <Link
                href="/login"
                className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition ${
                  currentRole === "partner"
                    ? "bg-[#24140b] text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Partner
              </Link>
              <Link
                href="/login/admin"
                className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition ${
                  currentRole === "admin"
                    ? "bg-[#24140b] text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Admin
              </Link>
              <Link
                href="/login/designer"
                className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition ${
                  currentRole === "designer"
                    ? "bg-[#24140b] text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Designer
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
