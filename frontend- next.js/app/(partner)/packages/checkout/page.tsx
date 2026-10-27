"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pkgParam = (searchParams.get("pkg") as "basic" | "pro" | "premium") || "pro";

  const { buyPackage } = usePartner();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const packageDetails = {
    basic: {
      name: "Package Basic",
      price: "Rp 150.000",
      numericPrice: 150000,
      description: "Invitation: 100, Widget: Basic, Design: Basic",
    },
    pro: {
      name: "Package Pro",
      price: "Rp 350.000",
      numericPrice: 350000,
      description: "Invitation: 250, Widget: Pro, Design: Pro",
    },
    premium: {
      name: "Package Premium",
      price: "Rp 750.000",
      numericPrice: 750000,
      description: "Invitation: 500, Widget: Premium, Design: Premium",
    },
  };

  const selectedPkg = packageDetails[pkgParam] || packageDetails.pro;

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // 1. Activate package & record transaction
      buyPackage(pkgParam);
      setIsProcessing(false);
      setShowModal(false);

      // 2. Navigate to /packages so user can verify active package (Image 4)
      router.push("/packages");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Header (Matching Image 2) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Periksa pesananmu sebelum membayar
        </p>
      </div>

      {/* 2. Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Package dipilih & Metode pembayaran (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Package dipilih */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
              Package dipilih
            </h3>

            <div className="flex items-center justify-between gap-4 mt-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                  {selectedPkg.name}
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-normal">
                  {selectedPkg.description}
                </p>
              </div>

              <div className="text-xs sm:text-sm font-bold text-zinc-900 shrink-0">
                {selectedPkg.price}
              </div>
            </div>
          </div>

          {/* Card 2: Metode pembayaran */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
              Metode pembayaran
            </h3>

            <div className="bg-[#fcfaf7] border border-[#eee5da] rounded-xl p-8 sm:p-12 flex items-center justify-center text-center mt-3">
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed font-normal">
                Metode pembayaran mengikuti model pembayaran B2B yang masih menunggu keputusan bisnis.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Ringkasan Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
              Ringkasan
            </h3>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-xs text-zinc-500 mt-4 italic font-normal">
              <span>Subtotal</span>
              <span>{selectedPkg.price}</span>
            </div>

            <div className="border-t border-zinc-100 my-4" />

            {/* Total */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-900">
              <span>Total</span>
              <span>{selectedPkg.price}</span>
            </div>

            {/* CTA Button: Lanjut ke pembayaran */}
            <button
              id="btn-lanjut-pembayaran"
              onClick={() => setShowModal(true)}
              className="w-full bg-[#1c1c1c] hover:bg-black text-white font-medium text-xs py-3 rounded-lg mt-5 transition-colors cursor-pointer shadow-xs"
            >
              Lanjut ke pembayaran
            </button>

            {/* Subtext */}
            <p className="text-[11px] text-zinc-500 mt-3 text-center font-normal">
              Package aktif setelah pembayaran berhasil.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pop-up / Modal Konfirmasi Pembayaran */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Konfirmasi Pembayaran
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Order Details */}
            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <div className="font-bold">{selectedPkg.name}</div>
                  <div className="text-[11px] text-amber-800">{selectedPkg.description}</div>
                </div>
                <div className="font-bold text-sm">{selectedPkg.price}</div>
              </div>

              <div className="space-y-1.5 text-zinc-600 pt-1">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-medium text-zinc-900">Simulasi Pembayaran B2B</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-emerald-600">Siap Diproses</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-100 font-bold text-zinc-900 text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-amber-600">{selectedPkg.price}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                id="btn-bayar-sekarang"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 bg-[#f5a638] hover:bg-[#e09228] text-white text-xs font-bold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Bayar Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-500">Memuat checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
