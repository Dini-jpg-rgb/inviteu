"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUserManagement } from "@/context/UserManagementContext";

export default function DesignerProfilePage() {
  const { getDesignerStatus } = useUserManagement();
  const currentStatus = getDesignerStatus("designer@inviteu.id");
  const isAccountActive = currentStatus === "active";
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Profil Desainer Kreatif</h1>
          <p className="text-sm text-zinc-500">
            Sesuai PRD v3.0 Bagian 24: Profil Designer terpisah dari Profil Bisnis Partner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isAccountActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAccountActive ? "bg-emerald-600 animate-pulse" : "bg-rose-600"
              }`}
            />
            <span>{isAccountActive ? "Aktif" : "Inaktif"}</span>
          </span>
        </div>
      </div>

      {!isAccountActive && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Akun Desainer Dinonaktifkan</p>
            <p className="mt-0.5 text-rose-700 text-[11px]">
              Akun Anda dinonaktifkan oleh Administrator. Pengajuan template baru sementara dibatasi.
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <span>✓</span>
          <span>Perubahan profil desainer berhasil disimpan!</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nama Lengkap Desainer" defaultValue="Rian Creative Lead" />
          <Input label="Email Akun" defaultValue="designer@inviteu.id" disabled />
          <Input label="Spesialisasi Desain" defaultValue="Wedding Luxury & Typography" />
          <Input label="Tautan Portofolio / Behance" defaultValue="https://behance.net/rian-inviteu" />
          <div className="pt-4 flex justify-end">
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
