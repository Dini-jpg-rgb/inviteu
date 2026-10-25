"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export default function PackagesPage() {
  const packages = [
    {
      id: "pkg_basic",
      name: "Paket Basic",
      tier: "Basic",
      price: "Rp 149.000",
      quota: "3 Undangan Published",
      gallery: "Maks. 5 Foto Galeri",
      isCurrent: false,
      features: [
        "Widget Cover & Event Details",
        "Form RSVP Standar",
        "Peta Lokasi Google Maps",
        "Share Link Generik",
      ],
    },
    {
      id: "pkg_pro",
      name: "Paket Pro",
      tier: "Pro",
      price: "Rp 349.000",
      quota: "10 Undangan Published",
      gallery: "Maks. 15 Foto Galeri",
      isCurrent: true,
      popular: true,
      features: [
        "Semua fitur Paket Basic",
        "Widget Countdown & Cerita Cinta",
        "Widget Musik Latar",
        "Buku Tamu / Guestbook Interaktif",
        "Akses Event Owner (Khusus Pengantin)",
      ],
    },
    {
      id: "pkg_premium",
      name: "Paket Premium",
      tier: "Premium",
      price: "Rp 799.000",
      quota: "30 Undangan Published",
      gallery: "Unlimited Foto Galeri",
      isCurrent: false,
      features: [
        "Semua fitur Paket Pro",
        "Widget Video Ucapan & Streaming",
        "Hadiah Digital / Angpao Online",
        "Dukungan Prioritas InviteU",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Paket & Kuota Undangan
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pilih paket yang sesuai dengan kebutuhan kapasitas klien vendor Anda.
        </p>
      </div>

      {/* Quota Information Banner */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 flex items-start gap-3">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs space-y-1">
          <p className="font-semibold text-sm">Prinsip Kuota Berbasis Publikasi (PRD v3.0)</p>
          <p className="text-blue-800 dark:text-blue-300">
            Kuota hanya berkurang <strong>1 kali</strong> saat pertama kali undangan dipublish. Menyimpan sebagai <em>Draft</em> dan mengubah konten yang sudah <em>Published</em> <strong>tidak mengurangi kuota lagi</strong>.
          </p>
        </div>
      </div>

      {/* Package Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`rounded-2xl border p-6 flex flex-col justify-between transition relative ${
              pkg.isCurrent
                ? "border-zinc-900 bg-white shadow-lg ring-2 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100 dark:bg-zinc-900"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow">
                Paket Anda Saat Ini
              </span>
            )}

            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {pkg.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {pkg.price}
                </span>
                <span className="text-xs text-zinc-500">/paket</span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 space-y-1 text-xs">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  📊 {pkg.quota}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  🖼️ {pkg.gallery}
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant={pkg.isCurrent ? "secondary" : "primary"}
                className="w-full font-semibold"
                disabled={pkg.isCurrent}
              >
                {pkg.isCurrent ? "Paket Aktif" : "Pilih Paket"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
