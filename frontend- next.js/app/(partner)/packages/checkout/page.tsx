"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePartner, PackageId } from "@/context/PartnerContext";

interface WidgetItem {
  name: string;
  basic: boolean;
  medium: boolean;
  pro: boolean;
}

// 17 Widget items exactly matching Image 2
const WIDGETS: WidgetItem[] = [
  { name: "Cover", basic: true, medium: true, pro: true },
  { name: "Event Details", basic: true, medium: true, pro: true },
  { name: "Gallery", basic: true, medium: true, pro: true },
  { name: "Story", basic: false, medium: true, pro: true },
  { name: "Countdown", basic: true, medium: true, pro: true },
  { name: "Music", basic: true, medium: true, pro: true },
  { name: "RSVP", basic: true, medium: true, pro: true },
  { name: "Guestbook", basic: true, medium: true, pro: true },
  { name: "Digital Gift", basic: true, medium: true, pro: true },
  { name: "Video Greeting", basic: false, medium: false, pro: false }, // Terkunci (Add-on)
  { name: "Location / Google Maps", basic: true, medium: true, pro: true },
  { name: "Bank Account", basic: true, medium: true, pro: true },
  { name: "E-wallet", basic: true, medium: true, pro: true },
  { name: "Dress Code", basic: true, medium: true, pro: true },
  { name: "Live Streaming", basic: false, medium: false, pro: false }, // Terkunci (Add-on)
  { name: "FAQ", basic: true, medium: true, pro: true },
  { name: "Wedding Hashtag", basic: false, medium: true, pro: true },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pkgParam = (searchParams.get("pkg") as PackageId) || "medium";

  const { activePackage } = usePartner();

  const packageDetails: Record<
    PackageId,
    {
      title: string;
      name: string;
      price: string;
      quota: string;
      numericPrice: number;
      description: string;
    }
  > = {
    basic: {
      title: "Package Basic",
      name: "Paket Basic",
      price: "Rp 100.000",
      quota: "5",
      numericPrice: 100000,
      description: "Invitation: 5, Template: Basic, Semua Widget Inti",
    },
    medium: {
      title: "Package Medium",
      name: "Paket Medium",
      price: "Rp 250.000",
      quota: "20",
      numericPrice: 250000,
      description: "Invitation: 20, Template: Medium & Basic, Semua Widget Inti",
    },
    pro: {
      title: "Package Pro",
      name: "Paket Pro",
      price: "Rp 500.000",
      quota: "50",
      numericPrice: 500000,
      description: "Invitation: 50, Template: Pro, Medium & Basic, Semua Widget Inti",
    },
    premium: {
      title: "Package Pro",
      name: "Paket Pro",
      price: "Rp 500.000",
      quota: "50",
      numericPrice: 500000,
      description: "Invitation: 50, Template: Pro, Medium & Basic, Semua Widget Inti",
    },
  };

  const selectedPkg = packageDetails[pkgParam] || packageDetails.medium;
  const isCurrentActive =
    activePackage === pkgParam ||
    (pkgParam === "pro" && activePackage === "premium") ||
    (pkgParam === "premium" && activePackage === "pro");

  const normalizedPkgKey: "basic" | "medium" | "pro" =
    pkgParam === "basic" ? "basic" : pkgParam === "medium" ? "medium" : "pro";

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Page Header (Matching Image 2) */}
      <div className="pt-0.5">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 tracking-tight">
          {selectedPkg.title}
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-500 font-normal mt-0.5">
          Detail widget dan batas penggunaan
        </p>
      </div>

      {/* 2. Main Two-Column Grid (Left: Widget Table, Right: Summary Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Widget List Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">
            Widget
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfaf7] border-y border-[#eee5da]">
                  <th className="py-2.5 px-3 sm:px-4 text-xs font-semibold text-zinc-600">
                    Widget
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-xs font-semibold text-zinc-600 text-center w-44 sm:w-56">
                    Status di package ini
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3ece3]">
                {WIDGETS.map((widget, idx) => {
                  const isAvailable = widget[normalizedPkgKey];

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-[#fdfbf9] transition-colors"
                    >
                      <td className="py-2.5 px-3 sm:px-4 text-xs sm:text-sm text-zinc-800 font-medium">
                        {widget.name}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center justify-center px-4 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf7f0] text-[#15803d] border border-[#bbf7d0]">
                            Tersedia
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-4 py-0.5 rounded-full text-[11px] font-semibold bg-[#f6efe6] text-[#785942] border border-[#e2d0c2]">
                            Terkunci
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Ringkasan package Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
          <h3 className="text-base font-bold text-zinc-900 mb-5">
            Ringkasan package
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-normal">Harga</span>
              <span className="font-bold text-zinc-900">
                {selectedPkg.price}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-normal">
                Invitation (quota)
              </span>
              <span className="font-bold text-zinc-900">
                {selectedPkg.quota}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-normal">Add-on</span>
              <span className="font-bold text-zinc-900">Sesuai package</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-2.5">
            {isCurrentActive ? (
              <button
                type="button"
                disabled
                className="w-full bg-[#f6efe6] text-[#785942] text-xs sm:text-sm font-semibold py-2.5 rounded-xl border border-[#e2d0c2] cursor-default"
              >
                Paket Sedang Aktif
              </button>
            ) : (
              <button
                type="button"
                id="btn-pilih-package-ini"
                onClick={() => router.push(`/packages/payment?pkg=${pkgParam}`)}
                className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs sm:text-sm font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Pilih package ini
              </button>
            )}

            <Link href="/packages" className="block w-full">
              <button
                type="button"
                className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-semibold py-2.5 rounded-xl border border-zinc-300 transition-colors cursor-pointer shadow-2xs"
              >
                Kembali ke daftar
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="text-xs text-zinc-500 p-4">Memuat detail package...</div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
