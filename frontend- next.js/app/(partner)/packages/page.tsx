"use client";

import React from "react";
import Link from "next/link";
import { usePartner, PackageId } from "@/context/PartnerContext";

interface PackageTier {
  id: PackageId;
  name: string;
  price: string;
  description: string;
  features: string[];
}

const PACKAGE_TIERS: PackageTier[] = [
  {
    id: "basic",
    name: "Paket Basic",
    price: "Rp 100.000",
    description: "Cocok untuk partner yang membutuhkan paket undangan digital dasar dengan biaya awal lebih rendah.",
    features: [
      "Akses katalog template Basic, hanya bisa akses template basic.",
      "Semua widget inti: Cover, Event Details, Countdown, Gallery, Music, Digital Gift, dan RSVP.",
      "Maksimal 5 undangan aktif secara bersamaan.",
      "Masa aktif undangan 3 bulan.",
      "Video Greeting dapat dibeli secara terpisah.",
      "Pengeditan terbatas pada teks dan konten yang diizinkan template.",
    ],
  },
  {
    id: "medium",
    name: "Paket Medium",
    price: "Rp 250.000",
    description: "Cocok untuk partner yang menangani lebih banyak klien dan membutuhkan kapasitas konten lebih besar.",
    features: [
      "Akses katalog template Medium, ini dia dapet akses juga ke template basic",
      "Semua widget inti dari Basic.",
      "Maksimal 20 undangan aktif secara bersamaan.",
      "Masa aktif undangan 6 bulan.",
      "Video Greeting dapat dibeli secara terpisah.",
      "Pengeditan teks dan konten mengikuti field yang diizinkan template.",
    ],
  },
  {
    id: "pro",
    name: "Paket Pro",
    price: "Rp 500.000",
    description: "Cocok untuk partner dengan volume undangan lebih tinggi yang membutuhkan kuota paling besar.",
    features: [
      "Akses katalog template Pro, dapet akses ke template basic dan medium",
      "Semua widget inti dari Basic dan Medium.",
      "Maksimal 50 undangan aktif secara bersamaan.",
      "Masa aktif undangan 12 bulan.",
      "Video Greeting dapat dibeli secara terpisah.",
      "Pengeditan teks dan konten mengikuti field yang diizinkan template.",
    ],
  },
];

export default function PartnerPackagesPage() {
  const { activePackage } = usePartner();

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto">
      {/* 1. Header (Matching Image 2) */}
      <div className="pt-0.5">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 tracking-tight">
          Package List
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-500 font-normal mt-0.5">
          Pilih package yang sesuai kebutuhanmu
        </p>
      </div>

      {/* 2. Top Info Banner */}
      {!activePackage ? (
        <div className="bg-[#eef4ff] text-[#2563eb] rounded-xl p-2.5 px-3.5 text-xs font-medium border border-[#dbeafe]">
          Kamu belum punya package aktif. Pilih salah satu untuk mulai.
        </div>
      ) : (
        <div className="bg-[#eef4ff] text-[#1d4ed8] rounded-xl p-2.5 px-3.5 text-xs font-medium border border-[#dbeafe] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span>
            Kamu saat ini sedang menggunakan paket{" "}
            <strong className="capitalize">
              {activePackage === "medium"
                ? "Paket Medium"
                : activePackage === "pro" || activePackage === "premium"
                ? "Paket Pro"
                : "Paket Basic"}
            </strong>
            . Kamu dapat memilih paket lain untuk upgrade atau beralih paket.
          </span>
          <Link href="/dashboard" className="shrink-0 font-bold hover:underline">
            Buka Dashboard →
          </Link>
        </div>
      )}

      {/* 3. Three Compact Package Cards (Fitting within screen height without unnecessary scroll) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
        {PACKAGE_TIERS.map((pkg) => {
          const isCurrentActive =
            activePackage === pkg.id ||
            (pkg.id === "pro" && activePackage === "premium");

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-xs ${
                isCurrentActive
                  ? "border-[#f5a638] ring-2 ring-[#f5a638]/40"
                  : "border-[#e5d8c8]"
              }`}
            >
              <div>
                {/* Header: Title & Optional Active Pill */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    {pkg.name}
                  </h3>
                  {isCurrentActive && (
                    <span className="bg-[#eaf7f0] text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Aktif
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-1">
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    {pkg.price}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-zinc-500 font-normal mt-1 leading-snug">
                  {pkg.description}
                </p>

                {/* Features List with Green Dots */}
                <ul className="mt-3 sm:mt-3.5 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-zinc-700">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] shrink-0 mt-1.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Actions: Lihat tema & Pilih package */}
              <div className="mt-4 pt-2 space-y-2">
                <Link href="/templates" className="block w-full">
                  <button
                    type="button"
                    className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold py-2 rounded-xl border border-zinc-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    Lihat tema
                  </button>
                </Link>

                {isCurrentActive ? (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-[#f6efe6] text-[#785942] text-xs font-semibold py-2 rounded-xl border border-[#e2d0c2] cursor-default"
                  >
                    Paket Sedang Aktif
                  </button>
                ) : (
                  <Link
                    href={`/packages/checkout?pkg=${pkg.id}`}
                    className="block w-full"
                  >
                    <button
                      type="button"
                      className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Pilih package
                    </button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
