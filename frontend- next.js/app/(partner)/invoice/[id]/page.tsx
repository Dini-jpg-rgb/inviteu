"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePartner, PACKAGE_CONFIG } from "@/context/PartnerContext";

export default function InvoiceReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "";
  const decodedId = decodeURIComponent(rawId);

  const { getInvoiceById, cancelInvoice } = usePartner();
  const invoice = getInvoiceById(decodedId);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read partner name & phone from localStorage if customized
  const [partnerName, setPartnerName] = useState("Undiksha Team");
  const [partnerPhone, setPartnerPhone] = useState("0812 3456 7890");

  React.useEffect(() => {
    try {
      const savedName = localStorage.getItem("inviteu_partner_name");
      if (savedName) setPartnerName(savedName);
      const savedPhone = localStorage.getItem("inviteu_partner_phone");
      if (savedPhone) setPartnerPhone(savedPhone);
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 font-bold text-xl flex items-center justify-center mx-auto border border-rose-200">
          !
        </div>
        <h2 className="text-base font-bold text-zinc-900">
          Dokumen Tidak Ditemukan
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Nomor invoice atau receipt <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">{decodedId}</code> tidak ditemukan di dalam sistem.
        </p>
        <div className="pt-2">
          <Link href="/invoice">
            <button className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
              ← Kembali ke Riwayat Pembayaran
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isReceipt = invoice.docType === "receipt" || invoice.status === "paid";
  const isCancelled = invoice.status === "cancelled";
  const isUnpaid = invoice.status === "unpaid";

  const handlePayNow = () => {
    // Arahkan ke halaman menunggu pembayaran
    router.push(
      `/packages/payment?pkg=${invoice.packageId}&invoiceId=${encodeURIComponent(invoice.id)}`
    );
  };

  const handleCancelNow = () => {
    if (confirm(`Apakah Anda yakin ingin membatalkan tagihan ${invoice.id}?`)) {
      cancelInvoice(invoice.id);
      showToast("Tagihan berhasil dibatalkan. Status kini menjadi Batal.");
    }
  };

  const handlePrintDownload = () => {
    window.print();
  };

  const packageMeta = PACKAGE_CONFIG[invoice.packageId] || {
    name: invoice.packageShortName,
    fullName: invoice.packageName,
    quotaText: invoice.quotaText,
    features: invoice.packageFeatures,
    price: invoice.amount,
    numericPrice: invoice.numericAmount,
  };

  return (
    <div className="space-y-3.5 pb-4 max-w-3xl mx-auto print:max-w-none print:w-full print:m-0 print:p-0 print:space-y-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-2.5 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in no-print print:hidden">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation (Hidden in Print) */}
      <div className="flex items-center justify-between gap-3 pt-0.5 no-print print:hidden">
        <Link
          href="/invoice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a5b32] hover:text-[#5a391c] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Invoice &amp; Riwayat Pembayaran</span>
        </Link>

        {/* Action Button: Download PDF / Cetak */}
        <button
          type="button"
          onClick={handlePrintDownload}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Download PDF / Cetak</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* BERSIH & RAPI: DOKUMEN INVOICE / RECEIPT TANPA KATA-KATA AI    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-[#ede3d5] shadow-xs p-5 sm:p-6 space-y-4 print:border print:border-zinc-300 print:shadow-none print:p-6 print:m-0 print:w-full print:rounded-none">
        {/* Document Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#ede3d5]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2d1b11] text-amber-300 font-bold text-xs shadow-2xs shrink-0">
              IU
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {isReceipt ? "Kuitansi Pembayaran" : isCancelled ? "Invoice Dibatalkan" : "Tagihan Invoice"}
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-zinc-900 tracking-tight">
                {invoice.id}
              </div>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex flex-col sm:items-end gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isReceipt
                  ? "bg-[#eaf7f0] text-emerald-800 border-emerald-300"
                  : isCancelled
                  ? "bg-rose-50 text-rose-800 border-rose-300"
                  : "bg-[#fef5e7] text-amber-800 border-amber-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isReceipt ? "bg-emerald-600" : isCancelled ? "bg-rose-600" : "bg-amber-600 animate-pulse"
                }`}
              />
              <span className="uppercase tracking-wider">
                {isReceipt ? "Lunas" : isCancelled ? "Batal" : "Menunggu Pembayaran"}
              </span>
            </span>

            <div className="text-[11px] text-zinc-500 font-medium">
              Tanggal: <strong className="text-zinc-700">{invoice.date}</strong>
              {invoice.paidAt && (
                <span className="ml-2 text-emerald-700">
                  • Lunas: <strong>{invoice.paidAt}</strong>
                </span>
              )}
              {invoice.cancelledAt && (
                <span className="ml-2 text-rose-700">
                  • Batal: <strong>{invoice.cancelledAt}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Information Grid: Ditagihkan Kepada & Diterbitkan Oleh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#faf6f0] border border-[#ede3d5] space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Ditagihkan Kepada:
            </p>
            <div className="font-bold text-xs text-zinc-900">
              {partnerName}
            </div>
            <div className="text-[11px] text-zinc-600">
              undikshateam@gmail.com
            </div>
            <div className="text-[11px] text-zinc-600 font-mono">
              {partnerPhone}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#faf6f0] border border-[#ede3d5] space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Diterbitkan Oleh:
            </p>
            <div className="font-bold text-xs text-zinc-900">
              PT InviteU Digital Nusantara
            </div>
            <div className="text-[11px] text-zinc-600">
              billing@inviteu.id
            </div>
            <div className="text-[11px] text-zinc-700 font-semibold pt-0.5">
              Metode: {invoice.paymentMethod}
            </div>
          </div>
        </div>

        {/* PACKAGE DETAILS & FINANCIAL SETTLEMENT TABLE */}
        <div className="rounded-xl border border-[#ede3d5] overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-[#faf6f0] px-4 py-2 flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-wider border-b border-[#ede3d5]">
            <span>Rincian Paket</span>
            <span>Nominal</span>
          </div>

          {/* Package Info Row */}
          <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-900">
                  {packageMeta.name}
                </span>
                <span className="bg-[#fef5e7] text-amber-800 border border-[#fae2c0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {packageMeta.quotaText}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {packageMeta.features}
              </p>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 shrink-0">
              {packageMeta.price}
            </div>
          </div>

          {/* Total Tagihan Line */}
          <div className="px-4 py-3 bg-[#faf6f0] border-t border-[#ede3d5] flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-[#2d1b11]">
              {isReceipt ? "Total Pembayaran" : "Total Tagihan"}
            </span>
            <span className="text-base sm:text-lg font-black text-[#2d1b11] tracking-tight">
              {packageMeta.price}
            </span>
          </div>
        </div>

        {/* Action Buttons for Unpaid or Cancelled State (Disembunyikan saat dicetak) */}
        {isUnpaid && (
          <div className="rounded-xl border border-[#fae2c0] bg-[#fffaf2] p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print print:hidden">
            <div className="text-zinc-700">
              <span className="font-bold text-[#92400e]">Status: Menunggu Pembayaran.</span> Selesaikan transaksi untuk mengaktifkan kuota paket.
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCancelNow}
                className="bg-white hover:bg-zinc-50 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Batalkan Tagihan
              </button>
              <button
                type="button"
                onClick={handlePayNow}
                className="bg-[#f5a638] hover:bg-[#e09228] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Bayar Sekarang</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print print:hidden">
            <div className="text-rose-800">
              <span className="font-bold">Status: Tagihan Telah Dibatalkan.</span>
            </div>

            <div className="shrink-0 self-end sm:self-auto">
              <Link href={`/packages/checkout?pkg=${invoice.packageId}`}>
                <button className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer">
                  Beli Paket Baru
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Footer Seal & Reference ID */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-zinc-400">
          <div>
            Dokumen resmi diterbitkan oleh InviteU Platform.
          </div>
          <div className="font-mono text-zinc-500">
            INVITEU-BILLING-{invoice.id}
          </div>
        </div>
      </div>
    </div>
  );
}
