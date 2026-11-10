"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { usePartner, PackageId } from "@/context/PartnerContext";

type PaymentMethodId =
  | "qris"
  | "gopay"
  | "bca_va"
  | "mandiri_va"
  | "bni_va"
  | "bri_va"
  | "credit_card";

interface BankOption {
  id: PaymentMethodId;
  code: string;
  name: string;
  detail: string;
}

const BANK_OPTIONS: BankOption[] = [
  {
    id: "bca_va",
    code: "BCA",
    name: "BCA Virtual Account",
    detail: "m-BCA, KlikBCA & ATM BCA",
  },
  {
    id: "mandiri_va",
    code: "MDR",
    name: "Mandiri Bill Payment",
    detail: "Livin' by Mandiri & ATM",
  },
  {
    id: "bni_va",
    code: "BNI",
    name: "BNI Virtual Account",
    detail: "BNI Mobile Banking & ATM",
  },
  {
    id: "bri_va",
    code: "BRI",
    name: "BRI Virtual Account (BRIVA)",
    detail: "BRImo & ATM BRI",
  },
];

interface EWalletOption {
  id: PaymentMethodId;
  code: string;
  name: string;
  detail: string;
}

const EWALLET_OPTIONS: EWalletOption[] = [
  {
    id: "qris",
    code: "QRIS",
    name: "QRIS",
    detail: "BCA Mobile, GoPay, OVO, DANA, ShopeePay & Semua Bank",
  },
  {
    id: "gopay",
    code: "GOPAY",
    name: "GoPay / GoPay Later",
    detail: "Aplikasi Gojek",
  },
];

function mapPaymentMethodToId(methodStr?: string): PaymentMethodId {
  if (!methodStr) return "qris";
  const lower = methodStr.toLowerCase();
  if (lower.includes("bni")) return "bni_va";
  if (lower.includes("bca")) return "bca_va";
  if (lower.includes("mandiri")) return "mandiri_va";
  if (lower.includes("bri")) return "bri_va";
  if (lower.includes("gopay")) return "gopay";
  if (lower.includes("kartu") || lower.includes("credit")) return "credit_card";
  return "qris";
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get("invoiceId");
  const pkgParam = (searchParams.get("pkg") as PackageId) || "medium";

  const { getInvoiceById, createPendingInvoice, payInvoice, cancelInvoice } = usePartner();

  // Workflow Stages:
  // 1. "SELECT_METHOD" -> Pengguna memilih metode pembayaran terlebih dahulu
  // 2. "PAYMENT_ACTIVE" -> Muncul QRIS / nomor VA + Waktu hitung mundur + status invoice "Menunggu"
  // 3. "PAYMENT_SUCCESS" -> In-place tampilan berganti ceklis "Pembayaran Berhasil" + status "Lunas"
  // 4. "PAYMENT_CANCELLED" -> Tampilan dibatalkan + status "Batal"
  const [stage, setStage] = useState<
    "SELECT_METHOD" | "PAYMENT_ACTIVE" | "PAYMENT_SUCCESS" | "PAYMENT_CANCELLED"
  >("SELECT_METHOD");

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<"ewallet" | "va" | "card" | null>(null);
  const [selectedBank, setSelectedBank] = useState<PaymentMethodId>("bca_va");
  const [selectedEWallet, setSelectedEWallet] = useState<PaymentMethodId>("qris");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<"va" | "ewallet" | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(invoiceIdParam);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(86399); // 23:59:59

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Jika halaman dibuka dengan invoiceId (misal partner klik "Bayar Sekarang" dari detail invoice)
  useEffect(() => {
    if (invoiceIdParam) {
      const inv = getInvoiceById(invoiceIdParam);
      if (inv) {
        setCurrentInvoiceId(inv.id);
        const mapped = mapPaymentMethodToId(inv.paymentMethod);
        setSelectedMethod(mapped);

        if (mapped === "bca_va" || mapped === "mandiri_va" || mapped === "bni_va" || mapped === "bri_va") {
          setSelectedCategory("va");
          setSelectedBank(mapped);
        } else if (mapped === "qris" || mapped === "gopay") {
          setSelectedCategory("ewallet");
          setSelectedEWallet(mapped);
        } else {
          setSelectedCategory("card");
        }

        if (inv.status === "paid") {
          setStage("PAYMENT_SUCCESS");
        } else if (inv.status === "cancelled") {
          setStage("PAYMENT_CANCELLED");
        } else {
          setStage("PAYMENT_ACTIVE");
        }
      }
    }
  }, [invoiceIdParam, getInvoiceById]);

  // Hitung mundur hanya berjalan saat tahap PAYMENT_ACTIVE
  useEffect(() => {
    if (stage !== "PAYMENT_ACTIVE") return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const packageDetails: Record<
    PackageId,
    {
      title: string;
      name: string;
      price: string;
      quota: string;
      duration: string;
      numericPrice: number;
    }
  > = {
    basic: {
      title: "Package Basic",
      name: "Paket Basic",
      price: "Rp 100.000",
      quota: "5 Undangan",
      duration: "3 Bulan",
      numericPrice: 100000,
    },
    medium: {
      title: "Package Medium",
      name: "Paket Medium",
      price: "Rp 250.000",
      quota: "20 Undangan",
      duration: "6 Bulan",
      numericPrice: 250000,
    },
    pro: {
      title: "Package Pro",
      name: "Paket Pro",
      price: "Rp 500.000",
      quota: "50 Undangan",
      duration: "12 Bulan",
      numericPrice: 500000,
    },
    premium: {
      title: "Package Pro",
      name: "Paket Pro",
      price: "Rp 500.000",
      quota: "50 Undangan",
      duration: "12 Bulan",
      numericPrice: 500000,
    },
  };

  const existingInvoice = invoiceIdParam ? getInvoiceById(invoiceIdParam) : undefined;
  const effectivePkg = (existingInvoice?.packageId || pkgParam) as PackageId;
  const selectedPkg = packageDetails[effectivePkg] || packageDetails.medium;

  const getMethodName = (m: PaymentMethodId | null): string => {
    switch (m) {
      case "qris":
        return "QRIS";
      case "bca_va":
        return "BCA Virtual Account";
      case "mandiri_va":
        return "Mandiri Bill Payment";
      case "bni_va":
        return "BNI Virtual Account";
      case "bri_va":
        return "BRI Virtual Account";
      case "gopay":
        return "GoPay";
      case "credit_card":
        return "Kartu Kredit";
      default:
        return "Midtrans Gateway";
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmMethodAndProceed = () => {
    if (!selectedMethod) return;

    if (!currentInvoiceId) {
      const newInvoice = createPendingInvoice(effectivePkg, getMethodName(selectedMethod));
      setCurrentInvoiceId(newInvoice.id);
    }

    setStage("PAYMENT_ACTIVE");
  };

  const handleMarkAsPaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (currentInvoiceId) {
        payInvoice(currentInvoiceId);
      }
      setIsProcessing(false);
      setStage("PAYMENT_SUCCESS");
    }, 600);
  };

  const handleCancelPayment = () => {
    if (currentInvoiceId) {
      cancelInvoice(currentInvoiceId);
    }
    setStage("PAYMENT_CANCELLED");
  };

  const activeBankObj = BANK_OPTIONS.find((b) => b.id === selectedBank) || BANK_OPTIONS[0];
  const activeEWalletObj = EWALLET_OPTIONS.find((e) => e.id === selectedEWallet) || EWALLET_OPTIONS[0];

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="SB-Mid-client-inviteu-sandbox"
        strategy="lazyOnload"
      />

      <div className="space-y-4 max-w-6xl mx-auto pb-8">
        {/* Clean, Non-AI Page Header (matching InviteU's typography) */}
        <div className="pt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide text-zinc-500">
                  Pembayaran Kemitraan
                </span>
                {currentInvoiceId && (
                  <>
                    <span className="text-zinc-300 text-xs">•</span>
                    <span className="text-[11px] text-zinc-600 font-medium">
                      Order ID: <strong className="text-zinc-900 font-mono">{currentInvoiceId}</strong>
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 tracking-tight mt-0.5">
                {stage === "SELECT_METHOD" && "Pilih Metode Pembayaran"}
                {stage === "PAYMENT_ACTIVE" && "Menunggu Pembayaran"}
                {stage === "PAYMENT_SUCCESS" && "Pembayaran Berhasil"}
                {stage === "PAYMENT_CANCELLED" && "Pembayaran Dibatalkan"}
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-normal mt-0.5">
                {stage === "SELECT_METHOD" &&
                  `Pilih metode pembayaran di bawah untuk mengaktifkan ${selectedPkg.title}`}
                {stage === "PAYMENT_ACTIVE" &&
                  "Selesaikan pembayaran sebelum batas waktu berakhir. Status tagihan tersimpan di menu Invoice."}
                {stage === "PAYMENT_SUCCESS" &&
                  "Paket kemitraan telah aktif dan invoice resmi telah diterbitkan."}
                {stage === "PAYMENT_CANCELLED" &&
                  "Tagihan telah dibatalkan dan tercatat pada riwayat invoice."}
              </p>
            </div>

            {/* Countdown Timer Badge (Clean, No Emojis, Only in PAYMENT_ACTIVE) */}
            {stage === "PAYMENT_ACTIVE" && (
              <div className="bg-[#fff8f0] border border-[#f5d0a6] rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                <div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Sisa Waktu Pembayaran
                  </div>
                  <div className="text-sm font-bold text-[#b45309] font-mono tracking-wider">
                    {formatTimer(secondsRemaining)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* ======================================================== */}
          {/* Sisi Kiri (8 cols): Konten Berdasarkan Tahapan Alur     */}
          {/* ======================================================== */}
          <div className="lg:col-span-8">
            {/* -------------------------------------------------------- */}
            {/* TAHAP 1: PILIH METODE PEMBAYARAN (Dropdown per Kategori) */}
            {/* -------------------------------------------------------- */}
            {stage === "SELECT_METHOD" && (
              <div
                ref={dropdownContainerRef}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ede3d5] shadow-xs space-y-3.5"
              >
                <div className="pb-3 border-b border-[#ede3d5] flex items-center justify-between">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-zinc-900">
                      Pilihan Metode Pembayaran
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Pilih kategori pembayaran dan saluran transaksi yang diinginkan
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-[#fef5e7] border border-[#fae2c0] px-2.5 py-0.5 rounded-full">
                    Aman &amp; Terverifikasi
                  </span>
                </div>

                <div className="space-y-3">
                  {/* --- KATEGORI 1: QRIS & E-WALLET (DROPDOWN) --- */}
                  <div
                    onClick={() => {
                      setSelectedCategory("ewallet");
                      setSelectedMethod(selectedEWallet);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      selectedCategory === "ewallet"
                        ? "border-2 border-[#f5a638] bg-[#fffaf2] ring-2 ring-[#f5a638]/20 shadow-xs"
                        : "border-[#ede3d5] bg-[#fffdfa] hover:bg-[#fff9f0] hover:border-[#f5a638]/60 shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Radio + Title */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            selectedCategory === "ewallet"
                              ? "border-[#f5a638] bg-[#f5a638]"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {selectedCategory === "ewallet" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            <span>QRIS & E-Wallet</span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-[#eaf7f0] border border-emerald-200 px-2 py-0.5 rounded-full">
                              Instan
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Pilihan:{" "}
                            <strong className="text-zinc-800 font-semibold">
                              {activeEWalletObj.name}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Right: Dropdown Selector */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory("ewallet");
                            setSelectedMethod(selectedEWallet);
                            setOpenDropdown(openDropdown === "ewallet" ? null : "ewallet");
                          }}
                          className="flex items-center justify-between gap-2 bg-white hover:bg-[#fffbf5] border border-[#ede3d5] hover:border-[#f5a638] text-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer min-w-[190px] transition-colors"
                        >
                          <span>{activeEWalletObj.name}</span>
                          <svg
                            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                              openDropdown === "ewallet" ? "rotate-180 text-[#f5a638]" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === "ewallet" && (
                          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#ede3d5] rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in duration-100">
                            {EWALLET_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEWallet(opt.id);
                                  setSelectedMethod(opt.id);
                                  setSelectedCategory("ewallet");
                                  setOpenDropdown(null);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-[#fff9f0] cursor-pointer ${
                                  selectedEWallet === opt.id
                                    ? "bg-[#fef5e7] text-[#2d1b11] font-bold"
                                    : "text-zinc-700"
                                }`}
                              >
                                <div>
                                  <div className="font-semibold">{opt.name}</div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5">
                                    {opt.detail}
                                  </div>
                                </div>
                                {selectedEWallet === opt.id && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-[#fde68a]/50 px-2 py-0.5 rounded">
                                    Terpilih
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- KATEGORI 2: VIRTUAL ACCOUNT / BANK (DROPDOWN) --- */}
                  <div
                    onClick={() => {
                      setSelectedCategory("va");
                      setSelectedMethod(selectedBank);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      selectedCategory === "va"
                        ? "border-2 border-[#f5a638] bg-[#fffaf2] ring-2 ring-[#f5a638]/20 shadow-xs"
                        : "border-[#ede3d5] bg-[#fffdfa] hover:bg-[#fff9f0] hover:border-[#f5a638]/60 shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Radio + Title */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            selectedCategory === "va"
                              ? "border-[#f5a638] bg-[#f5a638]"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {selectedCategory === "va" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            <span>Virtual Account (Transfer Bank)</span>
                            <span className="text-[10px] font-semibold text-amber-800 bg-[#fef5e7] border border-[#fae2c0] px-2 py-0.5 rounded-full">
                              Otomatis
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Bank terpilih:{" "}
                            <strong className="text-zinc-800 font-semibold">
                              {activeBankObj.name}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Right: Dropdown Selector */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory("va");
                            setSelectedMethod(selectedBank);
                            setOpenDropdown(openDropdown === "va" ? null : "va");
                          }}
                          className="flex items-center justify-between gap-2 bg-white hover:bg-[#fffbf5] border border-[#ede3d5] hover:border-[#f5a638] text-zinc-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer min-w-[190px] transition-colors"
                        >
                          <span>{activeBankObj.name}</span>
                          <svg
                            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                              openDropdown === "va" ? "rotate-180 text-[#f5a638]" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === "va" && (
                          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#ede3d5] rounded-xl shadow-lg z-30 py-1 overflow-hidden animate-in fade-in duration-100">
                            {BANK_OPTIONS.map((bank) => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBank(bank.id);
                                  setSelectedMethod(bank.id);
                                  setSelectedCategory("va");
                                  setOpenDropdown(null);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-[#fff9f0] cursor-pointer ${
                                  selectedBank === bank.id
                                    ? "bg-[#fef5e7] text-[#2d1b11] font-bold"
                                    : "text-zinc-700"
                                }`}
                              >
                                <div>
                                  <div className="font-semibold">{bank.name}</div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5">
                                    {bank.detail}
                                  </div>
                                </div>
                                {selectedBank === bank.id && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-[#fde68a]/50 px-2 py-0.5 rounded">
                                    Terpilih
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- KATEGORI 3: KARTU KREDIT / DEBIT --- */}
                  <div
                    onClick={() => {
                      setSelectedCategory("card");
                      setSelectedMethod("credit_card");
                      setOpenDropdown(null);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedCategory === "card"
                        ? "border-2 border-[#f5a638] bg-[#fffaf2] ring-2 ring-[#f5a638]/20 shadow-xs"
                        : "border-[#ede3d5] bg-[#fffdfa] hover:bg-[#fff9f0] hover:border-[#f5a638]/60 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            selectedCategory === "card"
                              ? "border-[#f5a638] bg-[#f5a638]"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {selectedCategory === "card" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            <span>Kartu Kredit / Debit Online</span>
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                              Visa, Mastercard, JCB
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Pembayaran online dengan verifikasi 3D Secure
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold ${
                          selectedCategory === "card"
                            ? "text-[#b45309] font-bold"
                            : "text-zinc-400"
                        }`}
                      >
                        {selectedCategory === "card" ? "Terpilih" : "Pilih"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAHAP 2: PAYMENT ACTIVE (Instruksi QRIS / VA)             */}
            {/* -------------------------------------------------------- */}
            {stage === "PAYMENT_ACTIVE" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">
                      Metode: {getMethodName(selectedMethod)}
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Menunggu Pembayaran
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStage("SELECT_METHOD")}
                    className="text-xs font-semibold text-zinc-700 hover:text-black hover:underline cursor-pointer"
                  >
                    ← Ganti metode
                  </button>
                </div>

                {/* --- DETAIL METODE: QRIS --- */}
                {selectedMethod === "qris" && (
                  <div className="space-y-3.5">
                    <div className="text-center py-1">
                      <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-0.5 rounded-full">
                        QRIS Standar Pembayaran Nasional
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900 mt-1.5">
                        Scan QRIS Menggunakan BCA Mobile / E-Wallet
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        BCA Mobile, Livin Mandiri, GoPay, OVO, DANA, ShopeePay
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-[#faf6f0] rounded-2xl border border-[#e5d8c8] max-w-xs mx-auto">
                      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-zinc-200 text-center">
                        <div className="text-[9px] font-bold text-red-600 tracking-wider mb-1.5">
                          QRIS • PEMBAYARAN INVITEU
                        </div>
                        <div className="w-40 h-40 bg-white flex items-center justify-center border-4 border-zinc-900 p-2 rounded-lg mx-auto">
                          <svg
                            className="w-full h-full text-zinc-900"
                            viewBox="0 0 100 100"
                            fill="currentColor"
                          >
                            <path d="M0,0 h30 v30 h-30 z M5,5 h20 v20 h-20 z M10,10 h10 v10 h-10 z" />
                            <path d="M70,0 h30 v30 h-30 z M75,5 h20 v20 h-20 z M80,10 h10 v10 h-10 z" />
                            <path d="M0,70 h30 v30 h-30 z M5,75 h20 v20 h-20 z M10,80 h10 v10 h-10 z" />
                            <rect x="35" y="10" width="8" height="8" />
                            <rect x="50" y="10" width="12" height="6" />
                            <rect x="40" y="25" width="22" height="6" />
                            <rect x="10" y="40" width="15" height="15" />
                            <rect x="30" y="40" width="10" height="10" />
                            <rect x="50" y="40" width="15" height="15" />
                            <rect x="75" y="40" width="18" height="8" />
                            <rect x="40" y="60" width="12" height="12" />
                            <rect x="60" y="65" width="15" height="15" />
                            <rect x="80" y="60" width="12" height="12" />
                            <rect x="35" y="80" width="10" height="10" />
                            <rect x="55" y="85" width="20" height="8" />
                          </svg>
                        </div>
                        <div className="mt-2 text-xs font-bold text-zinc-900">
                          Total: {selectedPkg.price}
                        </div>
                        <div className="text-[9px] text-zinc-400 font-mono">
                          NMID: ID1020084920192
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-xs text-zinc-700 space-y-1">
                      <div className="font-bold text-zinc-900 text-[11px]">
                        Cara Pembayaran QRIS:
                      </div>
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-zinc-600 leading-relaxed">
                        <li>Buka aplikasi m-Banking atau E-Wallet di ponselmu.</li>
                        <li>Pilih menu <strong>Scan QR / Bayar</strong>.</li>
                        <li>Arahkan kamera ke kode QR di atas.</li>
                        <li>
                          Periksa nama penerima <strong>InviteU Platform</strong> &
                          nominal {selectedPkg.price}.
                        </li>
                        <li>Masukkan PIN transaksi Anda.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* --- DETAIL METODE: VIRTUAL ACCOUNT --- */}
                {(selectedMethod === "bca_va" ||
                  selectedMethod === "mandiri_va" ||
                  selectedMethod === "bni_va" ||
                  selectedMethod === "bri_va") && (
                  <div className="space-y-3.5">
                    <div className="bg-[#fcfaf7] border border-[#e5d8c8] rounded-xl p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2.5 border-b border-[#eee5da]">
                        <span className="px-2 py-0.5 rounded bg-[#2d1b11] text-white font-bold text-[10px] uppercase">
                          {selectedMethod === "bca_va" && "BCA"}
                          {selectedMethod === "mandiri_va" && "MANDIRI"}
                          {selectedMethod === "bni_va" && "BNI"}
                          {selectedMethod === "bri_va" && "BRI"}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-zinc-900">
                            {getMethodName(selectedMethod)}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Verifikasi otomatis setelah transfer berhasil
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          Nomor Virtual Account
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-base sm:text-xl font-bold font-mono tracking-wider text-zinc-900">
                            {selectedMethod === "bca_va" && "80777 0812 3456 7890"}
                            {selectedMethod === "mandiri_va" && "70012 0812 3456 7890"}
                            {selectedMethod === "bni_va" && "8808 0812 3456 7890"}
                            {selectedMethod === "bri_va" && "12800 0812 3456 7890"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                selectedMethod === "bca_va"
                                  ? "80777081234567890"
                                  : selectedMethod === "mandiri_va"
                                  ? "70012081234567890"
                                  : selectedMethod === "bni_va"
                                  ? "8808081234567890"
                                  : "12800081234567890",
                                "va"
                              )
                            }
                            className="bg-white hover:bg-zinc-50 text-[#2d1b11] border border-zinc-300 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                          >
                            {copiedField === "va" ? "Tersalin" : "Salin Nomor"}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#eee5da]">
                        <div className="text-[10px] text-zinc-500 font-medium">
                          Total Pembayaran
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-sm sm:text-base font-bold text-zinc-900">
                            {selectedPkg.price}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(String(selectedPkg.numericPrice), "price")
                            }
                            className="text-xs font-bold text-[#b45309] hover:underline cursor-pointer"
                          >
                            {copiedField === "price" ? "Tersalin" : "Salin Nominal"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="font-bold text-zinc-900 text-[11px]">
                        Petunjuk Transfer Bank
                      </div>
                      {[
                        {
                          title: "Petunjuk via Mobile Banking",
                          steps: [
                            "Buka aplikasi Mobile Banking di ponsel Anda.",
                            "Pilih menu Transfer > Virtual Account.",
                            "Masukkan nomor Virtual Account di atas.",
                            "Periksa nama penerima InviteU & nominal tagihan.",
                            "Masukkan PIN transaksi dan konfirmasi.",
                          ],
                        },
                        {
                          title: "Petunjuk via ATM",
                          steps: [
                            "Masukkan Kartu ATM dan PIN Anda.",
                            "Pilih Transaksi Lainnya > Transfer > Virtual Account.",
                            "Masukkan nomor Virtual Account tujuan.",
                            "Pastikan nominal transfer sesuai tagihan.",
                            "Selesaikan transaksi dan simpan bukti transfer.",
                          ],
                        },
                      ].map((acc, idx) => (
                        <div
                          key={idx}
                          className="border border-zinc-200 rounded-xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveAccordion(
                                activeAccordion === idx ? -1 : idx
                              )
                            }
                            className="w-full flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 text-left font-semibold text-zinc-800 text-[11px] transition-colors cursor-pointer"
                          >
                            <span>{acc.title}</span>
                            <span>{activeAccordion === idx ? "▲" : "▼"}</span>
                          </button>
                          {activeAccordion === idx && (
                            <div className="p-3 bg-white border-t border-zinc-200">
                              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 leading-relaxed">
                                {acc.steps.map((st, sIdx) => (
                                  <li key={sIdx}>{st}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- DETAIL METODE: GOPAY --- */}
                {selectedMethod === "gopay" && (
                  <div className="space-y-3 text-center py-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs">
                      GoPay
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                        Bayar dengan GoPay / GoPay Later
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                        Buka aplikasi Gojek di ponsel Anda untuk mengonfirmasi pembayaran sebesar {selectedPkg.price}.
                      </p>
                    </div>
                  </div>
                )}

                {/* --- DETAIL METODE: KARTU KREDIT --- */}
                {selectedMethod === "credit_card" && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-zinc-900">
                      Informasi Kartu Kredit / Debit
                    </h3>
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-700 mb-0.5">
                        Nomor Kartu
                      </label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        className="w-full text-xs p-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#2d1b11]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-700 mb-0.5">
                          Masa Berlaku (MM/YY)
                        </label>
                        <input
                          type="text"
                          placeholder="12/28"
                          className="w-full text-xs p-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#2d1b11]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-700 mb-0.5">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="123"
                          className="w-full text-xs p-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#2d1b11]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAHAP 3: PAYMENT SUCCESS (In-Place Ceklis Pembayaran Berhasil) */}
            {/* -------------------------------------------------------- */}
            {stage === "PAYMENT_SUCCESS" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs text-center space-y-5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-100 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900">
                    Pembayaran Berhasil!
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-md mx-auto">
                    Terima kasih, pembayaran sebesar{" "}
                    <strong className="text-zinc-900">{selectedPkg.price}</strong>{" "}
                    telah kami terima. Paket{" "}
                    <strong className="text-zinc-900">{selectedPkg.title}</strong>{" "}
                    kini telah aktif di akun InviteU Anda.
                  </p>
                </div>

                <div className="bg-[#fcfaf7] border border-[#e5d8c8] rounded-xl p-4 sm:p-5 max-w-md mx-auto text-xs text-left space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-[#eee5da]">
                    <span className="text-zinc-500">Nomor Invoice</span>
                    <span className="font-bold font-mono text-zinc-900">
                      {currentInvoiceId || "INV-2026-11-001"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Paket Kemitraan</span>
                    <span className="font-bold text-zinc-900">
                      {selectedPkg.name} ({selectedPkg.quota})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Metode Pembayaran</span>
                    <span className="font-bold text-zinc-900">
                      {getMethodName(selectedMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Total Dibayar</span>
                    <span className="font-bold text-emerald-700">
                      {selectedPkg.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#eee5da]">
                    <span className="text-zinc-500">Status Transaksi</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Lunas (Selesai)
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <Link href="/dashboard" className="w-full sm:w-1/2">
                    <button
                      type="button"
                      className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs sm:text-sm font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Buka Dashboard
                    </button>
                  </Link>

                  <Link href="/invoice" className="w-full sm:w-1/2">
                    <button
                      type="button"
                      className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs sm:text-sm font-semibold py-2.5 rounded-xl border border-zinc-300 transition-colors cursor-pointer shadow-2xs"
                    >
                      Lihat Menu Invoice
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAHAP 4: PAYMENT CANCELLED (Tampilan Pembatalan In-Place) */}
            {/* -------------------------------------------------------- */}
            {stage === "PAYMENT_CANCELLED" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5d8c8] shadow-xs text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-100 border-4 border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                  <svg
                    className="w-6 h-6 text-rose-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                    Pembayaran Dibatalkan
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Transaksi {currentInvoiceId || "ini"} telah dibatalkan. Riwayat tagihan dengan status Batal tetap tersimpan pada menu Invoice.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => setStage("SELECT_METHOD")}
                    className="w-full sm:w-1/2 bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Ulangi Pembayaran
                  </button>

                  <Link href="/invoice" className="w-full sm:w-1/2">
                    <button
                      type="button"
                      className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold py-2.5 rounded-xl border border-zinc-300 transition-colors cursor-pointer"
                    >
                      Cek Riwayat Invoice
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* Sisi Kanan (4 cols): Ringkasan Pesanan + CTA Utama       */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="bg-white rounded-2xl border border-[#ede3d5] shadow-xs overflow-hidden">
              {/* Branded Warm Header */}
              <div className="bg-[#faf6f0] p-4 sm:p-4.5 border-b border-[#ede3d5] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Ringkasan Pesanan
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Aktivasi kuota undangan partner
                  </p>
                </div>
                <span className="bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {selectedPkg.name}
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-zinc-500 font-normal">Nama Paket</span>
                  <span className="font-bold text-zinc-900">
                    {selectedPkg.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-normal">Kuota Undangan</span>
                  <span className="font-bold text-zinc-900">
                    {selectedPkg.quota}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-normal">Masa Aktif</span>
                  <span className="font-bold text-zinc-900">
                    {selectedPkg.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-normal">Subtotal</span>
                  <span className="font-bold text-zinc-900">
                    {selectedPkg.price}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-700">
                  <span className="font-normal">Biaya Layanan Midtrans</span>
                  <span className="font-bold">Gratis (Rp 0)</span>
                </div>

                {/* Total Tagihan Box (Warm Golden Accent) */}
                <div className="mt-2 p-3 rounded-xl bg-[#fff9f0] border border-[#f5d0a6] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                      Total Tagihan
                    </span>
                    <span className="text-[10px] text-zinc-500">Termasuk pajak platform</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-[#b45309]">
                    {selectedPkg.price}
                  </span>
                </div>

                {/* ======================================================== */}
                {/* TOMBOL KONFIRMASI PEMBAYARAN DI SAMPING (DI BAWAH TOTAL) */}
                {/* ======================================================== */}
                {stage === "SELECT_METHOD" && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-konfirmasi-pembayaran-side"
                      disabled={!selectedMethod}
                      onClick={handleConfirmMethodAndProceed}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all ${
                        selectedMethod
                          ? "bg-[#2d1b11] hover:bg-black text-white cursor-pointer active:scale-[0.99]"
                          : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      {selectedMethod
                        ? `Konfirmasi Pembayaran`
                        : "Pilih Metode Pembayaran"}
                    </button>

                    <Link
                      href={`/packages/checkout?pkg=${pkgParam}`}
                      className="block text-center text-xs text-zinc-500 hover:text-zinc-800 font-medium mt-2.5"
                    >
                      ← Kembali ke Detail Widget
                    </Link>
                  </div>
                )}

                {/* Aksi saat PAYMENT_ACTIVE (Sudah Bayar & Batalkan) */}
                {stage === "PAYMENT_ACTIVE" && (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      id="btn-sudah-bayar-side"
                      onClick={handleMarkAsPaid}
                      disabled={isProcessing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Sudah Bayar</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPayment}
                      className="w-full bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Batalkan Pembayaran
                    </button>
                  </div>
                )}

                {/* Status Tagihan Real-Time */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#faf6f0] border border-[#ede3d5] text-xs space-y-1">
                  <div className="text-[10px] text-zinc-500">Status Tagihan:</div>
                  <div className="font-bold text-zinc-800 flex items-center gap-1.5 text-[11px]">
                    {stage === "SELECT_METHOD" && (
                      <span className="text-zinc-600">Belum Mengonfirmasi Metode</span>
                    )}
                    {stage === "PAYMENT_ACTIVE" && (
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Menunggu Pembayaran
                      </span>
                    )}
                    {stage === "PAYMENT_SUCCESS" && (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Lunas (Selesai)
                      </span>
                    )}
                    {stage === "PAYMENT_CANCELLED" && (
                      <span className="text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Dibatalkan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="snap-container" className="empty:hidden" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function PackagePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="text-xs text-zinc-500 p-6">
          Menghubungkan ke gateway pembayaran...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
