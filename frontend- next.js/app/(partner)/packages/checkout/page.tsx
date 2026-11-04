"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";
import { apiPublicRequest } from "@/lib/api-client";

interface ApiPackage {
  id: number;
  name: string;
  description: string | null;
  price: string;
  invitation_quota: number;
  duration_months: number | null;
}

interface PackageResponse {
  success: boolean;
  message?: string;
  data?: {
    package?: ApiPackage;
  };
}

function formatPrice(price: string) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return `Rp ${price}`;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = Number(searchParams.get("packageId"));
  const hasValidPackageId = Number.isInteger(packageId) && packageId > 0;
  const { buyPackage } = usePartner();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<ApiPackage | null>(null);
  const [isLoadingPackage, setIsLoadingPackage] = useState(hasValidPackageId);
  const [packageLoadError, setPackageLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidPackageId) return;

    const controller = new AbortController();

    async function loadPackage() {
      setIsLoadingPackage(true);
      setPackageLoadError(null);
      try {
        const response = await apiPublicRequest(`/packages/${packageId}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as PackageResponse;
        if (!response.ok || !result.success || !result.data?.package) {
          throw new Error(result.message || "Tidak dapat memuat paket yang dipilih.");
        }
        setSelectedPkg(result.data.package);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPackageLoadError(
          error instanceof Error ? error.message : "Tidak dapat memuat paket yang dipilih.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingPackage(false);
      }
    }

    void loadPackage();
    return () => controller.abort();
  }, [hasValidPackageId, packageId]);

  const handleConfirmPayment = () => {
    if (!selectedPkg) return;

    setIsProcessing(true);
    setTimeout(() => {
      buyPackage({
        id: selectedPkg.id,
        name: selectedPkg.name,
        price: selectedPkg.price,
        invitationQuota: selectedPkg.invitation_quota,
      });
      setIsProcessing(false);
      setShowModal(false);
      router.push("/packages");
    }, 600);
  };

  if (!hasValidPackageId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <p role="alert">ID paket tidak valid. Pilih paket dari halaman Package.</p>
        <button
          type="button"
          onClick={() => router.push("/packages")}
          className="mt-3 rounded-lg bg-[#331c11] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2918]"
        >
          Kembali ke Package
        </button>
      </div>
    );
  }

  if (isLoadingPackage) {
    return <p className="text-sm text-zinc-500">Memuat paket yang dipilih...</p>;
  }

  if (packageLoadError || !selectedPkg) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <p role="alert">{packageLoadError || "Paket tidak tersedia."}</p>
        <button
          type="button"
          onClick={() => router.push("/packages")}
          className="mt-3 rounded-lg bg-[#331c11] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2918]"
        >
          Kembali ke Package
        </button>
      </div>
    );
  }

  const formattedPrice = formatPrice(selectedPkg.price);

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
                  {selectedPkg.description || "Tidak ada deskripsi paket."}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Kuota undangan: {selectedPkg.invitation_quota}
                  {selectedPkg.duration_months !== null &&
                    ` · Masa aktif: ${selectedPkg.duration_months} bulan`}
                </p>
              </div>

              <div className="text-xs sm:text-sm font-bold text-zinc-900 shrink-0">
                {formattedPrice}
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
              <span>{formattedPrice}</span>
            </div>

            <div className="border-t border-zinc-100 my-4" />

            {/* Total */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-900">
              <span>Total</span>
              <span>{formattedPrice}</span>
            </div>

            {/* Simulated selection flow; actual order/payment integration is not connected. */}
            <button
              id="btn-lanjut-pembayaran"
              onClick={() => setShowModal(true)}
              className="w-full bg-[#1c1c1c] hover:bg-black text-white font-medium text-xs py-3 rounded-lg mt-5 transition-colors cursor-pointer shadow-xs"
            >
              Lanjut ke simulasi
            </button>

            <p className="text-[11px] text-zinc-500 mt-3 text-center font-normal">
              Simulasi lokal: tidak membuat order atau pembayaran backend.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pop-up / Modal Konfirmasi Simulasi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Konfirmasi simulasi
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
                  <div className="text-[11px] text-amber-800">
                    {selectedPkg.description || `Kuota undangan: ${selectedPkg.invitation_quota}`}
                  </div>
                </div>
                <div className="font-bold text-sm">{formattedPrice}</div>
              </div>

              <div className="space-y-1.5 text-zinc-600 pt-1">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-medium text-zinc-900">Simulasi lokal</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-emerald-600">Siap diaktifkan</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-100 font-bold text-zinc-900 text-sm">
                  <span>Harga paket:</span>
                  <span className="text-amber-600">{formattedPrice}</span>
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
                  <span>Aktifkan paket (simulasi)</span>
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
