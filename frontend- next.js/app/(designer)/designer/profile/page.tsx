"use client";

import React, { useState } from "react";
import { User, CheckCircle2, AlertTriangle, Save } from "lucide-react";
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
      <div className="flex items-center justify-between border-b border-[#EAE5DF]/70 pb-4">
        <div>
          <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#422B1C]">
            Profil Desainer Kreatif
          </h1>
          <p className="text-sm text-[#99918A] mt-0.5">
            Sesuai PRD v3.0 Bagian 24: Profil Designer terpisah dari Profil Bisnis Partner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#99918A] font-medium">Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isAccountActive
                ? "bg-[#EAF5EE] text-[#258447] border-[#BBE3CA]"
                : "bg-[#FFF8F7] text-[#CB3025] border-[#F8C8C4]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAccountActive ? "bg-[#258447] animate-pulse" : "bg-[#CB3025]"
              }`}
            />
            <span>{isAccountActive ? "Aktif" : "Inaktif"}</span>
          </span>
        </div>
      </div>

      {!isAccountActive && (
        <div className="rounded-[10px] border border-[#F8C8C4] bg-[#FFF8F7] p-4 text-xs text-[#CB3025] flex items-start gap-3">
          <AlertTriangle size={18} strokeWidth={1.8} className="text-[#CB3025] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Akun Desainer Dinonaktifkan</p>
            <p className="mt-0.5 text-[#CB3025] text-[11px]">
              Akun Anda dinonaktifkan oleh Administrator. Pengajuan template baru sementara dibatasi.
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-[10px] border border-[#BBE3CA] bg-[#EAF5EE] p-3 text-xs text-[#258447] font-medium flex items-center gap-2">
          <CheckCircle2 size={16} strokeWidth={1.8} />
          <span>Perubahan profil desainer berhasil disimpan!</span>
        </div>
      )}

      <Card className="p-6 rounded-[10px] border-[#EAE5DF] bg-white shadow-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nama Lengkap Desainer" defaultValue="Rian Creative Lead" />
          <Input label="Email Akun" defaultValue="designer@inviteu.id" disabled />
          <Input label="Spesialisasi Desain" defaultValue="Wedding Luxury & Typography" />
          <Input label="Tautan Portofolio / Behance" defaultValue="https://behance.net/rian-inviteu" />
          <div className="pt-4 flex justify-end">
            <Button type="submit" className="!bg-[#FFAD38] !text-[#3D2516] hover:!bg-[#F5A623] font-semibold shadow-xs !rounded-lg inline-flex items-center gap-2">
              <Save size={15} strokeWidth={1.8} />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
