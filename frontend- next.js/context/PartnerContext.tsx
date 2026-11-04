"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isMockAuthToken } from "@/lib/api-client";

export interface PackageTransaction {
  id: string;
  orderNumber: string;
  packageId: string;
  packageName: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed" | "Simulated";
  date: string;
  action: string;
}

export interface ActivePartnerPackage {
  id: number;
  name: string;
  invitationQuota: number;
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
  activePackage: string | null;
  activePackageDetails: ActivePartnerPackage | null;
  transactions: PackageTransaction[];
  invitations: PartnerInvitation[];
  buyPackage: (pkg: ActivePartnerPackage & { price: string }) => void;
  resetPackage: () => void;
  clearInvitations: () => void;
  addInvitation: (inv: Omit<PartnerInvitation, "id">) => void;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

function getStoredValue(scope: string, key: string, legacyKey: string, isDemoSession: boolean) {
  if (typeof window === "undefined") return null;

  try {
    return (
      localStorage.getItem(`inviteu_${scope}_${key}`) ??
      (isDemoSession ? localStorage.getItem(legacyKey) : null)
    );
  } catch (error) {
    console.error("Error loading partner state from localStorage:", error);
    return null;
  }
}

function getStoredArray<T>(
  scope: string,
  key: string,
  legacyKey: string,
  isDemoSession: boolean,
): T[] {
  const savedValue = getStoredValue(scope, key, legacyKey, isDemoSession);
  if (!savedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue as T[] : [];
  } catch (error) {
    console.error("Error parsing partner state from localStorage:", error);
    return [];
  }
}

function getStoredActivePackageDetails(scope: string, isDemoSession: boolean) {
  const savedValue = getStoredValue(
    scope,
    "active_package_details",
    "inviteu_active_package_details",
    isDemoSession,
  );
  if (!savedValue) return null;

  try {
    const parsedValue: unknown = JSON.parse(savedValue);
    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "id" in parsedValue &&
      typeof parsedValue.id === "number" &&
      "name" in parsedValue &&
      typeof parsedValue.name === "string" &&
      "invitationQuota" in parsedValue &&
      typeof parsedValue.invitationQuota === "number"
    ) {
      return {
        id: parsedValue.id,
        name: parsedValue.name,
        invitationQuota: parsedValue.invitationQuota,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing active package from localStorage:", error);
    return null;
  }
}

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const isDemoSession = isMockAuthToken(token);
  const storageScope = isDemoSession ? "demo" : `backend_${user?.id ?? "anonymous"}`;

  return (
    <PartnerStateProvider
      key={storageScope}
      storageScope={storageScope}
      isDemoSession={isDemoSession}
    >
      {children}
    </PartnerStateProvider>
  );
}

function PartnerStateProvider({
  children,
  storageScope,
  isDemoSession,
}: {
  children: React.ReactNode;
  storageScope: string;
  isDemoSession: boolean;
}) {
  const [activePackage, setActivePackage] = useState<string | null>(() => {
    const savedPackage = getStoredValue(
      storageScope,
      "active_package",
      "inviteu_active_package",
      isDemoSession,
    );
    return savedPackage;
  });
  const [activePackageDetails, setActivePackageDetails] =
    useState<ActivePartnerPackage | null>(() =>
      getStoredActivePackageDetails(storageScope, isDemoSession),
    );
  const [transactions, setTransactions] = useState<PackageTransaction[]>(() =>
    getStoredArray(
      storageScope,
      "partner_transactions",
      "inviteu_partner_transactions",
      isDemoSession,
    ),
  );
  const [invitations, setInvitations] = useState<PartnerInvitation[]>(() =>
    getStoredArray(
      storageScope,
      "partner_invitations",
      "inviteu_partner_invitations",
      isDemoSession,
    ),
  );

  useEffect(() => {
    try {
      const activePackageKey = `inviteu_${storageScope}_active_package`;
      if (activePackage) {
        localStorage.setItem(activePackageKey, activePackage);
      } else {
        localStorage.removeItem(activePackageKey);
      }
      const activePackageDetailsKey = `inviteu_${storageScope}_active_package_details`;
      if (activePackageDetails) {
        localStorage.setItem(activePackageDetailsKey, JSON.stringify(activePackageDetails));
      } else {
        localStorage.removeItem(activePackageDetailsKey);
      }
      localStorage.setItem(
        `inviteu_${storageScope}_partner_transactions`,
        JSON.stringify(transactions),
      );
      localStorage.setItem(
        `inviteu_${storageScope}_partner_invitations`,
        JSON.stringify(invitations),
      );
    } catch (error) {
      console.error("Error saving partner state to localStorage:", error);
    }
  }, [activePackage, activePackageDetails, invitations, storageScope, transactions]);

  const buyPackage = (pkg: ActivePartnerPackage & { price: string }) => {
    setActivePackage(String(pkg.id));
    setActivePackageDetails({
      id: pkg.id,
      name: pkg.name,
      invitationQuota: pkg.invitationQuota,
    });

    const newTx: PackageTransaction = {
      id: `tx-${Date.now()}`,
      orderNumber: `ORD-000${transactions.length + 1}`,
      packageId: String(pkg.id),
      packageName: pkg.name,
      amount: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(Number(pkg.price)),
      status: "Simulated",
      date: new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date()),
      action: "Detail",
    };

    setTransactions([newTx, ...transactions]);
  };

  const resetPackage = () => {
    setActivePackage(null);
    setActivePackageDetails(null);
    setTransactions([]);
    localStorage.removeItem(`inviteu_${storageScope}_active_package`);
    localStorage.removeItem(`inviteu_${storageScope}_active_package_details`);
    localStorage.removeItem(`inviteu_${storageScope}_partner_transactions`);
    if (isDemoSession) {
      localStorage.removeItem("inviteu_active_package");
      localStorage.removeItem("inviteu_active_package_details");
      localStorage.removeItem("inviteu_partner_transactions");
    }
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
        activePackageDetails,
        transactions,
        invitations,
        buyPackage,
        resetPackage,
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
