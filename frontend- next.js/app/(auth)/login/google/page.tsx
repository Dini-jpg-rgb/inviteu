"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthSplitLayout } from "../../components/AuthSplitLayout";

function GoogleAccountPickerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams?.get("role") as "partner" | "admin" | "designer") || "partner";

  const { login } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const portalLabel =
    role === "admin"
      ? "Portal Admin"
      : role === "designer"
      ? "Portal Designer"
      : "Portal Partner";

  const redirectUrl =
    role === "admin"
      ? "/admin/dashboard"
      : role === "designer"
      ? "/designer/templates"
      : "/dashboard";

  const backLoginUrl =
    role === "admin"
      ? "/login/admin"
      : role === "designer"
      ? "/login/designer"
      : "/login";

  const handleSelectAccount = async (email: string) => {
    setSelectedEmail(email);
    await login(email, "demo123", true, role);
    setTimeout(() => {
      router.push(redirectUrl);
    }, 400);
  };

  return (
    <AuthSplitLayout
      bannerTitle="Satu klik menuju dashboard."
      bannerSubtitle="Masuk cepat dengan akun Google."
      portalLabel={portalLabel}
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-4">
        <h1 className="font-serif text-2xl sm:text-[26px] font-bold text-zinc-900 tracking-tight leading-tight">
          Pilih akun Google
        </h1>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          untuk melanjutkan ke InviteU
        </p>
      </div>

      {/* Account List (Matching Image 2) */}
      <div className="space-y-2.5">
        {/* Account 1: Ben Abednego */}
        <button
          type="button"
          onClick={() => handleSelectAccount("benabednego@gmail.com")}
          disabled={selectedEmail !== null}
          className="w-full text-left bg-white hover:bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-2xs hover:border-[#f5a638] cursor-pointer group disabled:opacity-50"
        >
          {/* Avatar BA */}
          <div className="w-9 h-9 rounded-full bg-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            BA
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-amber-700 transition-colors">
              Ben Abednego
            </h4>
            <p className="text-[11px] text-zinc-500 truncate">
              benabednego@gmail.com
            </p>
          </div>
          {selectedEmail === "benabednego@gmail.com" && (
            <span className="text-xs text-amber-600 font-semibold animate-pulse">
              Memproses...
            </span>
          )}
        </button>

        {/* Account 2: Dwi Mahardika */}
        <button
          type="button"
          onClick={() => handleSelectAccount("dwimahardika@email.com")}
          disabled={selectedEmail !== null}
          className="w-full text-left bg-white hover:bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-2xs hover:border-[#f5a638] cursor-pointer group disabled:opacity-50"
        >
          {/* Avatar DM */}
          <div className="w-9 h-9 rounded-full bg-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            DM
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-amber-700 transition-colors">
              Dwi Mahardika
            </h4>
            <p className="text-[11px] text-zinc-500 truncate">
              benabednego@gmail.com
            </p>
          </div>
          {selectedEmail === "dwimahardika@email.com" && (
            <span className="text-xs text-amber-600 font-semibold animate-pulse">
              Memproses...
            </span>
          )}
        </button>

        {/* Account 3: Gunakan akun lain */}
        <Link href={backLoginUrl} className="block w-full">
          <div className="w-full text-left bg-white hover:bg-zinc-50/80 border border-zinc-200 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-2xs hover:border-zinc-400 cursor-pointer group">
            <div className="w-9 h-9 rounded-full border border-zinc-300 text-zinc-600 font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              +
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                Gunakan akun lain
              </h4>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer Return to Login */}
      <div className="text-center mt-5 text-xs text-zinc-500">
        Kembali ke{" "}
        <Link
          href={backLoginUrl}
          className="font-bold text-[#d97706] hover:text-[#b45309] hover:underline"
        >
          Login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function GoogleAccountPickerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <GoogleAccountPickerContent />
    </Suspense>
  );
}
