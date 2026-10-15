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
    /* eslint-disable react-hooks/set-state-in-effect */
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
        await new Promise((r) => setTimeout(r, 400)); // Simulasi network delay

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        // Akun terdaftar resmi sesuai spesifikasi
        const registeredUsers: Record<
          string,
          { password: string; role: "partner" | "admin" | "designer"; name: string; business?: string }
        > = {
          "admin@gmail.com": {
            password: "111111",
            role: "admin",
            name: "Superadmin InviteU",
          },
          "designer@gmail.com": {
            password: "222222",
            role: "designer",
            name: "Lead Designer InviteU",
          },
          "partner@gmail.com": {
            password: "333333",
            role: "partner",
            name: "Dwi Mahardika (Partner)",
            business: "Mahardika Wedding Planner",
          },
          // Dukungan akun inviteu.id sebelumnya
          "admin@inviteu.id": {
            password: "password123",
            role: "admin",
            name: "Superadmin InviteU",
          },
          "designer@inviteu.id": {
            password: "password123",
            role: "designer",
            name: "Lead Designer InviteU",
          },
          "partner@inviteu.id": {
            password: "password123",
            role: "partner",
            name: "Artha Wedding Partner",
            business: "Artha Wedding & Event",
          },
        };

        // 1. Cek apakah email terdaftar di sistem
        const registeredUser = registeredUsers[cleanEmail];

        if (registeredUser) {
          // Isolasi Ketat Role: Jika halaman login dikhususkan untuk role tertentu, tolak jika role tidak cocok
          if (selectedRole && registeredUser.role !== selectedRole) {
            setIsLoading(false);
            const roleNames: Record<string, string> = {
              partner: "Partner",
              admin: "Admin",
              designer: "Designer",
            };
            return {
              success: false,
              message: `Akses Ditolak: Akun '${cleanEmail}' adalah akun ${roleNames[registeredUser.role]}, tidak dapat masuk di halaman ${roleNames[selectedRole]}. Silakan gunakan link login khusus ${roleNames[registeredUser.role]}.`,
            };
          }

          if (cleanPassword !== registeredUser.password) {
            setIsLoading(false);
            return {
              success: false,
              message: `Kata sandi salah untuk akun ${registeredUser.role}. Silakan periksa kembali.`,
            };
          }

          authToken = `mock_token_${Date.now()}`;
          const targetRole = registeredUser.role;

          if (targetRole === "admin") {
            userData = {
              id: "user_admin_01",
              name: registeredUser.name,
              email: cleanEmail,
              role: "admin",
              status: "active",
            };
            partnerData = null;
          } else if (targetRole === "designer") {
            userData = {
              id: "user_designer_01",
              name: registeredUser.name,
              email: cleanEmail,
              role: "designer",
              status: "active",
            };
            partnerData = null;
          } else {
            userData = {
              id: "user_partner_01",
              name: registeredUser.name,
              email: cleanEmail,
              role: "partner",
              status: "active",
            };
            partnerData = {
              id: "partner_01",
              user_id: "user_partner_01",
              nama_bisnis: registeredUser.business || "Mitra Partner InviteU",
              status: "active",
              active_package_id: "pkg_pro",
            };
          }

          loginSuccess = true;
        } else {
          // Akun admin & designer wajib sudah terdaftar di sistem
          if (selectedRole === "admin" || selectedRole === "designer") {
            setIsLoading(false);
            return {
              success: false,
              message: `Akun ${selectedRole} tidak terdaftar di sistem. Hubungi tim teknis InviteU.`,
            };
          }

          // Akun partner umum / pendaftaran baru (fallback)
          if (cleanPassword.length < 6) {
            setIsLoading(false);
            return { success: false, message: "Kata sandi minimal 6 karakter" };
          }

          const targetRole: "partner" | "admin" | "designer" =
            selectedRole ||
            (cleanEmail.includes("admin")
              ? "admin"
              : cleanEmail.includes("designer")
              ? "designer"
              : "partner");

          authToken = `mock_token_${Date.now()}`;
          userData = {
            id: `user_${Date.now()}`,
            name: cleanEmail.split("@")[0].toUpperCase(),
            email: cleanEmail,
            role: targetRole,
            status: "active",
          };

          if (targetRole === "partner") {
            partnerData = {
              id: `partner_${Date.now()}`,
              user_id: userData.id,
              nama_bisnis: "Bisnis Partner Saya",
              status: "active",
            };
          } else {
            partnerData = null;
          }

          loginSuccess = true;
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
