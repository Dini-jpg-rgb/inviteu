"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface PackageTransaction {
  id: string;
  orderNumber: string;
  packageId: "basic" | "pro" | "premium";
  packageName: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  date: string;
  action: string;
}

export interface PartnerInvitation {
  id: string;
  title: string;
  eventDate: string;
  status: "Published" | "Draft" | "Expired";
  rsvpCount: number;
  rsvpSummary?: {
    hadir: number;
    tidakHadir: number;
    belumMerespons: number;
  };
}

interface PartnerContextType {
  activePackage: "basic" | "pro" | "premium" | null;
  transactions: PackageTransaction[];
  invitations: PartnerInvitation[];
  buyPackage: (packageId: "basic" | "pro" | "premium") => void;
  resetPackage: () => void;
  loadDemoInvitations: () => void;
  clearInvitations: () => void;
  addInvitation: (inv: Omit<PartnerInvitation, "id">) => void;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

// Sample demo invitations matching Image 3
export const DEMO_INVITATIONS: PartnerInvitation[] = [
  {
    id: "inv-01",
    title: "Ana and Dimas",
    eventDate: "12 Des 2026",
    status: "Published",
    rsvpCount: 84,
    rsvpSummary: { hadir: 84, tidakHadir: 8, belumMerespons: 20 },
  },
  {
    id: "inv-02",
    title: "Sari and Bayu",
    eventDate: "20 Jan 2027",
    status: "Draft",
    rsvpCount: 0,
    rsvpSummary: { hadir: 0, tidakHadir: 0, belumMerespons: 0 },
  },
  {
    id: "inv-03",
    title: "Putu and Ayu",
    eventDate: "03 Mar 2027",
    status: "Published",
    rsvpCount: 12,
    rsvpSummary: { hadir: 44, tidakHadir: 6, belumMerespons: 16 },
  },
];

// Sample default transactions matching Image 4
export const DEMO_TRANSACTIONS: PackageTransaction[] = [
  {
    id: "tx-1",
    orderNumber: "ORD-0001",
    packageId: "pro",
    packageName: "Pro",
    amount: "Rp 50.000",
    status: "Paid",
    date: "02 Jan 2026",
    action: "Detail",
  },
  {
    id: "tx-2",
    orderNumber: "ORD-0002",
    packageId: "premium",
    packageName: "Premium",
    amount: "Rp 150.000",
    status: "Pending",
    date: "10 Okt 2026",
    action: "Detail",
  },
  {
    id: "tx-3",
    orderNumber: "ORD-0003",
    packageId: "basic",
    packageName: "Basic",
    amount: "Rp 25.000",
    status: "Failed",
    date: "11 Okt 2026",
    action: "Detail",
  },
];

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [activePackage, setActivePackage] = useState<"basic" | "pro" | "premium" | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("inviteu_active_package");
      return (saved as "basic" | "pro" | "premium") || null;
    } catch {
      return null;
    }
  });

  const [transactions, setTransactions] = useState<PackageTransaction[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("inviteu_partner_transactions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [invitations, setInvitations] = useState<PartnerInvitation[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("inviteu_partner_invitations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      if (activePackage) {
        localStorage.setItem("inviteu_active_package", activePackage);
      } else {
        localStorage.removeItem("inviteu_active_package");
      }
      localStorage.setItem("inviteu_partner_transactions", JSON.stringify(transactions));
      localStorage.setItem("inviteu_partner_invitations", JSON.stringify(invitations));
    } catch (e) {
      console.error("Error saving partner state to localStorage:", e);
    }
  }, [activePackage, transactions, invitations]);

  // Handler to purchase / activate package
  const buyPackage = (packageId: "basic" | "pro" | "premium") => {
    setActivePackage(packageId);

    const priceMap: Record<string, string> = {
      basic: "Rp 150.000",
      pro: "Rp 350.000",
      premium: "Rp 750.000",
    };

    const nameMap: Record<string, string> = {
      basic: "Basic",
      pro: "Pro",
      premium: "Premium",
    };

    // If transactions are currently empty, initialize with Image 4 demo set (with Pro as latest)
    // or prepend this new order
    const newTx: PackageTransaction = {
      id: `tx-${Date.now()}`,
      orderNumber: `ORD-000${transactions.length + 1}`,
      packageId,
      packageName: nameMap[packageId] || "Pro",
      amount: priceMap[packageId] || "Rp 350.000",
      status: "Paid",
      date: "19 Okt 2026",
      action: "Detail",
    };

    if (transactions.length === 0) {
      // Populated with demo transactions matching Image 4
      setTransactions(DEMO_TRANSACTIONS);
    } else {
      setTransactions([newTx, ...transactions]);
    }
  };

  const resetPackage = () => {
    setActivePackage(null);
    setTransactions([]);
    setInvitations([]);
    localStorage.removeItem("inviteu_active_package");
    localStorage.removeItem("inviteu_partner_transactions");
    localStorage.removeItem("inviteu_partner_invitations");
  };

  const loadDemoInvitations = () => {
    setInvitations(DEMO_INVITATIONS);
  };

  const clearInvitations = () => {
    setInvitations([]);
  };

  const addInvitation = (inv: Omit<PartnerInvitation, "id">) => {
    const newInv: PartnerInvitation = {
      ...inv,
      id: `inv-${Date.now()}`,
    };
    setInvitations([newInv, ...invitations]);
  };

  return (
    <PartnerContext.Provider
      value={{
        activePackage,
        transactions,
        invitations,
        buyPackage,
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
