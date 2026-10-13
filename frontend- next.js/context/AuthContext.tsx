"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Partner } from "@/types/database";

export interface RegisterPartnerData {
  nama_bisnis: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean,
    selectedRole?: "partner" | "admin" | "designer"
  ) => Promise<{ success: boolean; role?: "partner" | "admin" | "designer"; message?: string }>;
  register: (data: RegisterPartnerData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

// Helper untuk set cookie
function setAuthCookies(token: string, role: string, remember = false) {
  const maxAge = remember ? COOKIE_MAX_AGE : 60 * 60 * 24; // 1 hari jika tidak remember
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// Helper untuk hapus cookie
function removeAuthCookies() {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth state saat aplikasi pertama kali dimuat
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("inviteu_token");
      const storedUser = localStorage.getItem("inviteu_user");
      const storedPartner = localStorage.getItem("inviteu_partner");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedPartner) {
          setPartner(JSON.parse(storedPartner));
        }
      }
    } catch (e) {
      console.error("Gagal membaca auth state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    remember = false,
    selectedRole?: "partner" | "admin" | "designer"
  ) => {
    setIsLoading(true);
    try {
      // 1. Coba hubungi backend jika tersedia
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      let loginSuccess = false;
      let userData: User | null = null;
      let partnerData: Partner | null = null;
      let authToken = "";

      if (apiUrl) {
        try {
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role: selectedRole }),
          });
          if (res.ok) {
            const json = await res.json();
            authToken = json.token;
            userData = json.user;
            partnerData = json.partner;
            loginSuccess = true;
          }
        } catch {
          // Backend offline, fallback ke simulasi development
        }
      }

      // 2. Fallback mode offline/development agar FE langsung bisa dites
      if (!loginSuccess) {
        await new Promise((r) => setTimeout(r, 600)); // Simulasi network delay

        // Tentukan role berdasarkan tab yang dipilih atau isi email
        const targetRole: "partner" | "admin" | "designer" =
          selectedRole ||
          (email.toLowerCase().includes("admin")
            ? "admin"
            : email.toLowerCase().includes("designer")
            ? "designer"
            : "partner");

        // Validasi dummy
        if (email && password.length >= 6) {
          authToken = `mock_token_${Date.now()}`;

          if (targetRole === "admin") {
            userData = {
              id: "user_admin_01",
              name: "Superadmin InviteU",
              email: email,
              role: "admin",
              status: "active",
            };
            partnerData = null;
          } else if (targetRole === "designer") {
            userData = {
              id: "user_designer_01",
              name: "Rian Creative Lead",
              email: email,
              role: "designer",
              status: "active",
            };
            partnerData = null;
          } else {
            userData = {
              id: "user_partner_01",
              name: email.split("@")[0].toUpperCase() || "Partner InviteU",
              email: email,
              role: "partner",
              status: "active",
            };
            partnerData = {
              id: "partner_01",
              user_id: "user_partner_01",
              nama_bisnis: "Artha Wedding & Event",
              status: "active",
              active_package_id: "pkg_pro",
            };
          }

          loginSuccess = true;
        } else {
          setIsLoading(false);
          return { success: false, message: "Email atau kata sandi tidak valid (minimal 6 karakter)" };
        }
      }

      if (userData && authToken) {
        setUser(userData);
        setPartner(partnerData);
        setToken(authToken);

        // Simpan ke Cookies & LocalStorage
        setAuthCookies(authToken, userData.role, remember);
        localStorage.setItem("inviteu_token", authToken);
        localStorage.setItem("inviteu_user", JSON.stringify(userData));
        if (partnerData) {
          localStorage.setItem("inviteu_partner", JSON.stringify(partnerData));
        } else {
          localStorage.removeItem("inviteu_partner");
        }

        setIsLoading(false);
        return { success: true, role: userData.role as "partner" | "admin" | "designer" };
      }

      setIsLoading(false);
      return { success: false, message: "Terjadi kesalahan saat masuk" };
    } catch {
      setIsLoading(false);
      return { success: false, message: "Gagal terhubung ke server" };
    }
  };

  const register = async (data: RegisterPartnerData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));

      const authToken = `mock_token_${Date.now()}`;
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "partner",
        status: "active",
      };

      const newPartner: Partner = {
        id: `partner_${Date.now()}`,
        user_id: newUser.id,
        nama_bisnis: data.nama_bisnis,
        phone: data.phone,
        status: "active",
      };

      setUser(newUser);
      setPartner(newPartner);
      setToken(authToken);

      setAuthCookies(authToken, "partner", true);
      localStorage.setItem("inviteu_token", authToken);
      localStorage.setItem("inviteu_user", JSON.stringify(newUser));
      localStorage.setItem("inviteu_partner", JSON.stringify(newPartner));

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, message: "Gagal melakukan pendaftaran akun partner" };
    }
  };

  const logout = () => {
    setUser(null);
    setPartner(null);
    setToken(null);
    removeAuthCookies();
    localStorage.removeItem("inviteu_token");
    localStorage.removeItem("inviteu_user");
    localStorage.removeItem("inviteu_partner");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
