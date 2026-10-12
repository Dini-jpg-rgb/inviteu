import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function DesignerTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Template Management</h1>
          <p className="text-sm text-zinc-500">
            Daftar template, status approval, dan pengajuan review ke Admin (PRD v3.0 Bagian 19).
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          + Buat Template Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="warning">Pending Review</Badge>
            <span className="text-xs text-zinc-400">Versi 1.0</span>
          </div>
          <h3 className="font-bold text-base">Elegance Gold Floral</h3>
          <p className="text-xs text-zinc-500 mt-1">Wedding Luxury Theme</p>
          <div className="mt-4 pt-3 border-t text-xs text-zinc-400 flex justify-between">
            <span>Dikirim ke Admin</span>
            <span>12 Okt 2026</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="success">Published</Badge>
            <span className="text-xs text-zinc-400">Versi 1.0</span>
          </div>
          <h3 className="font-bold text-base">Modern Minimalist Card</h3>
          <p className="text-xs text-zinc-500 mt-1">Modern / Chic Theme</p>
          <div className="mt-4 pt-3 border-t text-xs text-zinc-400 flex justify-between">
            <span>Aktif di Katalog</span>
            <span>08 Okt 2026</span>
          </div>
        </Card>

        <Card className="p-6 border-rose-200">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="destructive">Rejected</Badge>
            <span className="text-xs text-zinc-400">Versi 1.0</span>
          </div>
          <h3 className="font-bold text-base">Traditional Javanese Royal</h3>
          <p className="text-xs text-rose-600 mt-1">Ada catatan feedback dari admin</p>
          <div className="mt-4 pt-3 border-t text-xs flex justify-between items-center">
            <Button size="sm" variant="destructive" className="text-xs py-1">Revisi Sekarang</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
