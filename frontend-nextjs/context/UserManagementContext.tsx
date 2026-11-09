"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "designer" | "partner";
  status: "active" | "inactive";
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  // Specific fields
  businessName?: string;
  partnerTier?: "Basic" | "Pro" | "Premium";
  quotaUsage?: string;
  specialization?: string;
  portfolioUrl?: string;
  templatesCount?: number;
  adminAuthority?: string;
}

export interface ManagedPackage {
  id: "basic" | "pro" | "premium";
  name: string;
  price: string;
  priceNote: string;
  features: string[];
}

export const DEFAULT_PACKAGES: ManagedPackage[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Rp 150.000",
    priceNote: "harga mengikuti keputusan bisnis",
    features: [
      "Invitation: 100",
      "Widget basic",
      "Design basic",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp 350.000",
    priceNote: "harga mengikuti keputusan bisnis",
    features: [
      "Invitation: 250",
      "Widget pro",
      "Design pro",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "Rp 750.000",
    priceNote: "harga mengikuti keputusan bisnis",
    features: [
      "Invitation: 500",
      "Widget premium",
      "Design premium",
    ],
  },
];

export const DEFAULT_USERS: ManagedUser[] = [
  // Admins
  {
    id: "ADM-001",
    name: "Superadmin InviteU",
    email: "admin@inviteu.id",
    phone: "0811 2233 4455",
    role: "admin",
    status: "active",
    adminAuthority: "Super Administrator (Otoritas Penuh)",
    createdAt: "01 Jan 2026",
    lastLogin: "Hari ini, 15:40",
  },
  {
    id: "ADM-002",
    name: "Dewi System Admin",
    email: "dewi.admin@inviteu.id",
    phone: "0812 9988 7766",
    role: "admin",
    status: "active",
    adminAuthority: "Moderator & User Oversight",
    createdAt: "15 Feb 2026",
    lastLogin: "Kemarin, 11:20",
  },
  // Designers
  {
    id: "DSG-001",
    name: "Rian Creative Lead",
    email: "designer@inviteu.id",
    phone: "0819 8765 4321",
    role: "designer",
    status: "active",
    specialization: "Wedding Luxury & Typography",
    portfolioUrl: "https://behance.net/rian-inviteu",
    templatesCount: 14,
    createdAt: "10 Jan 2026",
    lastLogin: "Hari ini, 10:15",
  },
  {
    id: "DSG-002",
    name: "Siti Minimalist Art",
    email: "siti.design@inviteu.id",
    phone: "0857 1122 3344",
    role: "designer",
    status: "active",
    specialization: "Minimalist Modern & Botanical",
    portfolioUrl: "https://dribbble.com/sitidesign",
    templatesCount: 8,
    createdAt: "05 Mar 2026",
    lastLogin: "18 Okt 2026, 09:30",
  },
  {
    id: "DSG-003",
    name: "Budi Traditional Craft",
    email: "budi.craft@inviteu.id",
    phone: "0813 4455 6677",
    role: "designer",
    status: "inactive",
    specialization: "Batik & Nusantara Traditional",
    portfolioUrl: "https://behance.net/budicraft",
    templatesCount: 5,
    createdAt: "22 Feb 2026",
    lastLogin: "12 Okt 2026, 14:00",
  },
  // Partners
  {
    id: "PTR-001",
    name: "Undiksha Team",
    email: "undikshateam@gmail.com",
    phone: "0812 3456 7890",
    role: "partner",
    status: "active",
    businessName: "Mahardika Wedding Planner",
    partnerTier: "Pro",
    quotaUsage: "48/250",
    createdAt: "12 Jan 2026",
    lastLogin: "Hari ini, 16:05",
  },
  {
    id: "PTR-002",
    name: "Artha Wedding Organizer",
    email: "partner@inviteu.id",
    phone: "0813 5566 7788",
    role: "partner",
    status: "active",
    businessName: "Artha Wedding & Event",
    partnerTier: "Pro",
    quotaUsage: "8/10",
    createdAt: "18 Jan 2026",
    lastLogin: "19 Okt 2026, 17:10",
  },
  {
    id: "PTR-003",
    name: "Harmoni Photo Studio",
    email: "harmoni@studio.com",
    phone: "0821 3344 5566",
    role: "partner",
    status: "active",
    businessName: "Harmoni Visual Creative",
    partnerTier: "Basic",
    quotaUsage: "1/5",
    createdAt: "02 Feb 2026",
    lastLogin: "15 Okt 2026, 13:45",
  },
  {
    id: "PTR-004",
    name: "Bunga Melati WO",
    email: "melati@bunga.id",
    phone: "0878 9900 1122",
    role: "partner",
    status: "inactive",
    businessName: "Bunga Melati Decoration & WO",
    partnerTier: "Premium",
    quotaUsage: "25/30",
    createdAt: "20 Jan 2026",
    lastLogin: "05 Okt 2026, 08:30",
  },
];

interface UserManagementContextType {
  users: ManagedUser[];
  packages: ManagedPackage[];
  updateUserStatus: (userId: string, newStatus: "active" | "inactive") => void;
  addUserAccount: (
    role: "admin" | "designer",
    accountData: {
      name: string;
      email: string;
      phone: string;
      specialization?: string;
      portfolioUrl?: string;
      adminAuthority?: string;
    }
  ) => void;
  updatePackage: (
    pkgId: "basic" | "pro" | "premium",
    updated: {
      name?: string;
      price?: string;
      priceNote?: string;
      features?: string[];
    }
  ) => void;
  resetPackagesToDefault: () => void;
  getUserById: (id: string) => ManagedUser | undefined;
  getPartnerStatus: (emailOrId?: string) => "active" | "inactive";
  getDesignerStatus: (emailOrId?: string) => "active" | "inactive";
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "inviteu_managed_users_v1";
const PACKAGES_STORAGE_KEY = "inviteu_managed_packages_v1";

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  // 1. Initial State using lazy initializer
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    if (typeof window === "undefined") return DEFAULT_USERS;
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  });

  const [packages, setPackages] = useState<ManagedPackage[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PACKAGES;
    try {
      const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PACKAGES;
  });

  // Keep localStorage updated when state changes
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
    } catch {
      // ignore
    }
  }, [packages]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === USERS_STORAGE_KEY && e.newValue) {
        try {
          setUsers(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
      if (e.key === PACKAGES_STORAGE_KEY && e.newValue) {
        try {
          setPackages(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Update Status of any user
  const updateUserStatus = useCallback((userId: string, newStatus: "active" | "inactive") => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  }, []);

  // Add account for Admin or Designer
  const addUserAccount = useCallback(
    (
      role: "admin" | "designer",
      data: {
        name: string;
        email: string;
        phone: string;
        specialization?: string;
        portfolioUrl?: string;
        adminAuthority?: string;
      }
    ) => {
      const dateStr = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date());

      const prefix = role === "admin" ? "ADM" : "DSG";
      const randomId = `${prefix}-${String(Math.floor(Math.random() * 900) + 100)}`;

      const newUser: ManagedUser = {
        id: randomId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role,
        status: "active",
        createdAt: dateStr,
        lastLogin: "Baru dibuat",
        specialization: data.specialization,
        portfolioUrl: data.portfolioUrl,
        adminAuthority: data.adminAuthority || (role === "admin" ? "Administrator" : undefined),
        templatesCount: role === "designer" ? 0 : undefined,
      };

      setUsers((prev) => [newUser, ...prev]);
    },
    []
  );

  // Update Package definition
  const updatePackage = useCallback(
    (
      pkgId: "basic" | "pro" | "premium",
      updated: {
        name?: string;
        price?: string;
        priceNote?: string;
        features?: string[];
      }
    ) => {
      setPackages((prev) =>
        prev.map((p) => {
          if (p.id === pkgId) {
            return {
              ...p,
              name: updated.name !== undefined ? updated.name : p.name,
              price: updated.price !== undefined ? updated.price : p.price,
              priceNote: updated.priceNote !== undefined ? updated.priceNote : p.priceNote,
              features: updated.features !== undefined ? updated.features : p.features,
            };
          }
          return p;
        })
      );
    },
    []
  );

  const resetPackagesToDefault = useCallback(() => {
    setPackages(DEFAULT_PACKAGES);
  }, []);

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const getPartnerStatus = useCallback(
    (emailOrId = "undikshateam@gmail.com") => {
      const p = users.find(
        (u) =>
          u.role === "partner" &&
          (u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId)
      );
      return p ? p.status : "active";
    },
    [users]
  );

  const getDesignerStatus = useCallback(
    (emailOrId = "designer@inviteu.id") => {
      const d = users.find(
        (u) =>
          u.role === "designer" &&
          (u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId)
      );
      return d ? d.status : "active";
    },
    [users]
  );

  return (
    <UserManagementContext.Provider
      value={{
        users,
        packages,
        updateUserStatus,
        addUserAccount,
        updatePackage,
        resetPackagesToDefault,
        getUserById,
        getPartnerStatus,
        getDesignerStatus,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
}

export function useUserManagement() {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error("useUserManagement must be used within a UserManagementProvider");
  }
  return context;
}
