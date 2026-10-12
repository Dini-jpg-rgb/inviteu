import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function DesignerProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Profil Desainer Kreatif</h1>
        <p className="text-sm text-zinc-500">
          Sesuai PRD v3.0 Bagian 24: Profil Designer terpisah dari Profil Bisnis Partner.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Input label="Nama Lengkap Desainer" defaultValue="Rian Creative Lead" />
        <Input label="Email Akun" defaultValue="designer@inviteu.id" disabled />
        <Input label="Spesialisasi Desain" defaultValue="Wedding Luxury & Typography" />
        <Input label="Tautan Portofolio / Behance" defaultValue="https://behance.net/rian-inviteu" />
        <div className="pt-4 flex justify-end">
          <Button>Simpan Perubahan</Button>
        </div>
      </Card>
    </div>
  );
}
