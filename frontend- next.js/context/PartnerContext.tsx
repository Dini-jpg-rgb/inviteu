"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type DocumentType = "receipt" | "invoice";
export type InvoiceStatus = "paid" | "unpaid" | "cancelled";
export type PackageId = "basic" | "medium" | "pro" | "premium";

export interface InvoiceReceiptItem {
  id: string; // e.g. "REC-2026-10-001" or "INV-2026-10-002"
  docType: DocumentType; // "receipt" | "invoice"
  packageId: PackageId;
  packageName: string; // e.g. "Package Pro - 250 Kuota Undangan" (tanpa tanda kurung)
  packageShortName: string; // e.g. "Package Pro"
  packageFeatures: string; // "Invitation: 250, Widget: Pro, Design: Pro"
  quotaText: string; // "250 Kuota Undangan"
  amount: string; // e.g. "Rp 350.000"
  numericAmount: number; // 350000
  paymentMethod: string; // "Simulasi Pembayaran B2B" | "BCA Virtual Account" dll
  status: InvoiceStatus; // "paid" | "unpaid" | "cancelled"
  statusLabel: "Lunas" | "Menunggu" | "Batal";
  date: string; // e.g. "02 Jan 2026"
  paidAt?: string;
  cancelledAt?: string;
  notes?: string;
}

export interface PackageTransaction {
  id: string;
  orderNumber: string;
  packageId: PackageId;
  packageName: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  date: string;
  action: string;
}

export interface PartnerInvitation {
  id: string;
  title: string;
  template?: string;
  cover?: string;
  eventDate: string;
  status: "Published" | "Draft" | "Expired";
  expiration?: string;
  rsvpCount: number;
  rsvpSummary?: {
    hadir: number;
    tidakHadir: number;
    belumMerespons: number;
  };
}

// Konfigurasi paket standar terpusat (Harga & Kuota resmi)
export const PACKAGE_CONFIG: Record<
  PackageId,
  {
    name: string;
    fullName: string;
    quotaText: string;
    features: string;
    price: string;
    numericPrice: number;
  }
> = {
  basic: {
    name: "Paket Basic",
    fullName: "Paket Basic - 5 Kuota Undangan",
    quotaText: "5 Kuota Undangan",
    features: "Akses katalog template Basic, Max 5 undangan aktif",
    price: "Rp 100.000",
    numericPrice: 100000,
  },
  medium: {
    name: "Paket Medium",
    fullName: "Paket Medium - 20 Kuota Undangan",
    quotaText: "20 Kuota Undangan",
    features: "Akses katalog template Medium & Basic, Max 20 undangan aktif",
    price: "Rp 250.000",
    numericPrice: 250000,
  },
  pro: {
    name: "Paket Pro",
    fullName: "Paket Pro - 50 Kuota Undangan",
    quotaText: "50 Kuota Undangan",
    features: "Akses katalog template Pro, Medium & Basic, Max 50 undangan aktif",
    price: "Rp 500.000",
    numericPrice: 500000,
  },
  premium: {
    name: "Paket Pro",
    fullName: "Paket Pro - 50 Kuota Undangan",
    quotaText: "50 Kuota Undangan",
    features: "Akses katalog template Pro, Medium & Basic, Max 50 undangan aktif",
    price: "Rp 500.000",
    numericPrice: 500000,
  },
};

// Data riwayat invoice & receipt bawaan (selaras harga & format)
export const DEFAULT_INVOICES: InvoiceReceiptItem[] = [
  {
    id: "REC-2026-10-001",
    docType: "receipt",
    packageId: "pro",
    packageName: "Package Pro - 250 Kuota Undangan",
    packageShortName: "Package Pro",
    packageFeatures: "Invitation: 250, Widget: Pro, Design: Pro",
    quotaText: "250 Kuota Undangan",
    amount: "Rp 350.000",
    numericAmount: 350000,
    paymentMethod: "Simulasi Pembayaran B2B",
    status: "paid",
    statusLabel: "Lunas",
    date: "02 Jan 2026",
    paidAt: "02 Jan 2026, 14:20",
  },
  {
    id: "INV-2026-10-002",
    docType: "invoice",
    packageId: "premium",
    packageName: "Package Premium - 500 Kuota Undangan",
    packageShortName: "Package Premium",
    packageFeatures: "Invitation: 500, Widget: Premium, Design: Premium",
    quotaText: "500 Kuota Undangan",
    amount: "Rp 750.000",
    numericAmount: 750000,
    paymentMethod: "Simulasi Pembayaran B2B",
    status: "unpaid",
    statusLabel: "Menunggu",
    date: "10 Okt 2026",
  },
  {
    id: "INV-2026-10-003",
    docType: "invoice",
    packageId: "basic",
    packageName: "Package Basic - 100 Kuota Undangan",
    packageShortName: "Package Basic",
    packageFeatures: "Invitation: 100, Widget: Basic, Design: Basic",
    quotaText: "100 Kuota Undangan",
    amount: "Rp 150.000",
    numericAmount: 150000,
    paymentMethod: "Simulasi Pembayaran B2B",
    status: "cancelled",
    statusLabel: "Batal",
    date: "11 Okt 2026",
    cancelledAt: "11 Okt 2026, 16:45",
    notes: "Dibatalkan oleh pengguna saat konfirmasi pembayaran.",
  },
  {
    id: "REC-2026-10-041",
    docType: "receipt",
    packageId: "pro",
    packageName: "Package Pro - 250 Kuota Undangan",
    packageShortName: "Package Pro",
    packageFeatures: "Invitation: 250, Widget: Pro, Design: Pro",
    quotaText: "250 Kuota Undangan",
    amount: "Rp 350.000",
    numericAmount: 350000,
    paymentMethod: "BCA Virtual Account",
    status: "paid",
    statusLabel: "Lunas",
    date: "14 Okt 2026",
    paidAt: "14 Okt 2026, 09:15",
  },
  {
    id: "REC-2026-09-028",
    docType: "receipt",
    packageId: "basic",
    packageName: "Package Basic - 100 Kuota Undangan",
    packageShortName: "Package Basic",
    packageFeatures: "Invitation: 100, Widget: Basic, Design: Basic",
    quotaText: "100 Kuota Undangan",
    amount: "Rp 150.000",
    numericAmount: 150000,
    paymentMethod: "QRIS / GoPay",
    status: "paid",
    statusLabel: "Lunas",
    date: "14 Sep 2026",
    paidAt: "14 Sep 2026, 11:30",
  },
  {
    id: "INV-2026-10-099",
    docType: "invoice",
    packageId: "premium",
    packageName: "Package Premium - 500 Kuota Undangan",
    packageShortName: "Package Premium",
    packageFeatures: "Invitation: 500, Widget: Premium, Design: Premium",
    quotaText: "500 Kuota Undangan",
    amount: "Rp 750.000",
    numericAmount: 750000,
    paymentMethod: "Mandiri Virtual Account",
    status: "cancelled",
    statusLabel: "Batal",
    date: "18 Okt 2026",
    cancelledAt: "18 Okt 2026, 20:10",
    notes: "Pembayaran dibatalkan atau kedaluwarsa.",
  },
];

export const DEFAULT_INVITATIONS: PartnerInvitation[] = [
  {
    id: "inv-01",
    title: "Mogran and Laura",
    template: "Botanical Sage",
    cover: "/templates/wedding/couple-main.jpg",
    eventDate: "28 Des 2026",
    status: "Published",
    expiration: "28 Jun 2027",
    rsvpCount: 84,
    rsvpSummary: { hadir: 84, tidakHadir: 10, belumMerespons: 6 },
  },
];

// Alias for backwards compatibility
export const DEMO_INVITATIONS: PartnerInvitation[] = DEFAULT_INVITATIONS;

interface PartnerContextType {
  activePackage: PackageId | null;
  setActivePackage: (pkg: PackageId | null) => void;
  invoices: InvoiceReceiptItem[];
  transactions: PackageTransaction[];
  invitations: PartnerInvitation[];
  buyPackage: (packageId: PackageId) => InvoiceReceiptItem;
  cancelCheckout: (packageId: PackageId) => InvoiceReceiptItem;
  createPendingInvoice: (packageId: PackageId, paymentMethod?: string) => InvoiceReceiptItem;
  payInvoice: (invoiceId: string) => void;
  cancelInvoice: (invoiceId: string) => void;
  getInvoiceById: (invoiceId: string) => InvoiceReceiptItem | undefined;
  resetPackage: () => void;
  loadDemoInvitations: () => void;
  clearInvitations: () => void;
  addInvitation: (inv: Omit<PartnerInvitation, "id">) => void;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

const INVOICES_STORAGE_KEY = "inviteu_partner_invoices_v3";
const ACTIVE_PACKAGE_KEY = "inviteu_active_package";
const INVITATIONS_STORAGE_KEY = "inviteu_partner_invitations_v5";

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [activePackage, setActivePackage] = useState<PackageId | null>(() => {
    if (typeof window === "undefined") return "pro"; // Default pro aktif sesuai alur
    try {
      const saved = localStorage.getItem(ACTIVE_PACKAGE_KEY);
      if (saved === "none" || saved === "null") return null;
      if (saved === "basic" || saved === "medium" || saved === "pro" || saved === "premium") return saved as PackageId;
      return "pro";
    } catch {
      return "pro";
    }
  });

  const [invoices, setInvoices] = useState<InvoiceReceiptItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_INVOICES;
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_INVOICES;
  });

  const [invitations, setInvitations] = useState<PartnerInvitation[]>(() => {
    if (typeof window === "undefined") return DEFAULT_INVITATIONS;
    try {
      const saved = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_INVITATIONS;
  });

  // Sync state to localStorage
  useEffect(() => {
    try {
      if (activePackage) {
        localStorage.setItem(ACTIVE_PACKAGE_KEY, activePackage);
      } else {
        localStorage.setItem(ACTIVE_PACKAGE_KEY, "none");
      }
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
    } catch (e) {
      console.error("Error saving partner state to localStorage:", e);
    }
  }, [activePackage, invoices, invitations]);

  // Derived transactions for backward compatibility
  const transactions: PackageTransaction[] = invoices.map((inv) => ({
    id: inv.id,
    orderNumber: inv.id,
    packageId: inv.packageId,
    packageName: inv.packageShortName,
    amount: inv.amount,
    status: inv.status === "paid" ? "Paid" : inv.status === "cancelled" ? "Failed" : "Pending",
    date: inv.date,
    action: "Detail",
  }));

  // Pembelian paket -> status Lunas (Receipt)
  const buyPackage = useCallback(
    (packageId: PackageId): InvoiceReceiptItem => {
      setActivePackage(packageId);

      const config = PACKAGE_CONFIG[packageId] || PACKAGE_CONFIG.pro;
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const randomCode = Math.floor(Math.random() * 900) + 100;
      const receiptId = `REC-2026-11-${randomCode}`;

      const newReceipt: InvoiceReceiptItem = {
        id: receiptId,
        docType: "receipt",
        packageId,
        packageName: config.fullName,
        packageShortName: config.name,
        packageFeatures: config.features,
        quotaText: config.quotaText,
        amount: config.price,
        numericAmount: config.numericPrice,
        paymentMethod: "Simulasi Pembayaran B2B",
        status: "paid",
        statusLabel: "Lunas",
        date: dateStr,
        paidAt: `${dateStr}, ${timeStr}`,
        notes: "Pembayaran telah berhasil diverifikasi oleh sistem.",
      };

      setInvoices((prev) => [newReceipt, ...prev]);
      return newReceipt;
    },
    []
  );

  // Pembatalan saat checkout konfirmasi -> status Batal (Invoice)
  const cancelCheckout = useCallback(
    (packageId: PackageId): InvoiceReceiptItem => {
      const config = PACKAGE_CONFIG[packageId] || PACKAGE_CONFIG.pro;
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const randomCode = Math.floor(Math.random() * 900) + 100;
      const invoiceId = `INV-2026-11-${randomCode}`;

      const newCancelledInvoice: InvoiceReceiptItem = {
        id: invoiceId,
        docType: "invoice",
        packageId,
        packageName: config.fullName,
        packageShortName: config.name,
        packageFeatures: config.features,
        quotaText: config.quotaText,
        amount: config.price,
        numericAmount: config.numericPrice,
        paymentMethod: "Simulasi Pembayaran B2B",
        status: "cancelled",
        statusLabel: "Batal",
        date: dateStr,
        cancelledAt: `${dateStr}, ${timeStr}`,
        notes: "Dibatalkan oleh pengguna saat jendela konfirmasi pembayaran.",
      };

      setInvoices((prev) => [newCancelledInvoice, ...prev]);
      return newCancelledInvoice;
    },
    []
  );

  // Membuat tagihan baru berstatus Menunggu saat partner memilih metode bayar
  const createPendingInvoice = useCallback(
    (packageId: PackageId, paymentMethod: string = "QRIS"): InvoiceReceiptItem => {
      const config = PACKAGE_CONFIG[packageId] || PACKAGE_CONFIG.pro;
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const randomCode = Math.floor(Math.random() * 900) + 100;
      const invoiceId = `INV-2026-11-${randomCode}`;

      const newPendingInvoice: InvoiceReceiptItem = {
        id: invoiceId,
        docType: "invoice",
        packageId,
        packageName: config.fullName,
        packageShortName: config.name,
        packageFeatures: config.features,
        quotaText: config.quotaText,
        amount: config.price,
        numericAmount: config.numericPrice,
        paymentMethod,
        status: "unpaid",
        statusLabel: "Menunggu",
        date: dateStr,
        notes: "Menunggu penyelesaian pembayaran oleh partner.",
      };

      setInvoices((prev) => [newPendingInvoice, ...prev]);
      return newPendingInvoice;
    },
    []
  );

  // Melunasi invoice yang berstatus Menunggu -> Berubah menjadi Receipt (Lunas)
  const payInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((item) => {
        if (item.id === invoiceId) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const timeStr = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          // Ubah ID dari INV- ke REC- jika sebelumnya invoice
          const newId = item.id.startsWith("INV-")
            ? item.id.replace("INV-", "REC-")
            : item.id;

          setActivePackage(item.packageId);

          return {
            ...item,
            id: newId,
            docType: "receipt",
            status: "paid",
            statusLabel: "Lunas",
            paidAt: `${dateStr}, ${timeStr}`,
            notes: "Invoice telah diselesaikan dan diverifikasi menjadi Receipt.",
          };
        }
        return item;
      })
    );
  }, []);

  // Membatalkan invoice yang berstatus Menunggu -> Berubah menjadi Batal
  const cancelInvoice = useCallback((invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((item) => {
        if (item.id === invoiceId) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const timeStr = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return {
            ...item,
            status: "cancelled",
            statusLabel: "Batal",
            cancelledAt: `${dateStr}, ${timeStr}`,
            notes: "Tagihan dibatalkan oleh pengguna melalui detail invoice.",
          };
        }
        return item;
      })
    );
  }, []);

  const getInvoiceById = useCallback(
    (invoiceId: string) => {
      return invoices.find((inv) => inv.id === invoiceId || inv.id === invoiceId.replace("REC-", "INV-") || inv.id === invoiceId.replace("INV-", "REC-"));
    },
    [invoices]
  );

  const resetPackage = () => {
    setActivePackage(null);
    setInvoices(DEFAULT_INVOICES);
    setInvitations([]);
    try {
      localStorage.setItem(ACTIVE_PACKAGE_KEY, "none");
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const loadDemoInvitations = () => {
    setActivePackage("pro");
    setInvitations(DEMO_INVITATIONS);
    try {
      localStorage.setItem(ACTIVE_PACKAGE_KEY, "pro");
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(DEMO_INVITATIONS));
    } catch {
      // ignore
    }
  };

  const clearInvitations = () => {
    setInvitations([]);
    try {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const addInvitation = (inv: Omit<PartnerInvitation, "id">) => {
    const newInv: PartnerInvitation = {
      ...inv,
      id: `inv-${Date.now()}`,
      template: inv.template || "Botanical Sage",
      cover: inv.cover || "/templates/wedding/couple-main.jpg",
      expiration: inv.expiration || "28 Jun 2027",
    };
    setInvitations([newInv, ...invitations]);
  };

  return (
    <PartnerContext.Provider
      value={{
        activePackage,
        setActivePackage,
        invoices,
        transactions,
        invitations,
        buyPackage,
        cancelCheckout,
        createPendingInvoice,
        payInvoice,
        cancelInvoice,
        getInvoiceById,
        resetPackage,
        loadDemoInvitations,
        clearInvitations,
        addInvitation,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartner() {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error("usePartner must be used within a PartnerProvider");
  }
  return context;
}
