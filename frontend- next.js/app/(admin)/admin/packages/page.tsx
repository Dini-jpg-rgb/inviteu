import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminPackagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Package Management</h1>
          <p className="text-sm text-zinc-500">
            Mengelola definisi paket tier (Basic, Pro, Premium), batasan kuota, dan harga (PRD Bagian 16).
          </p>
        </div>
        <Button size="sm">+ Tambah Tier Paket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <Badge variant="outline">Tier 1</Badge>
          <h3 className="text-xl font-bold mt-2">Basic Tier</h3>
          <p className="text-sm text-zinc-500 mt-1">Rp 99.000 / 5 Kuota Publish</p>
          <p className="text-xs text-zinc-400 mt-3">Widget standar, max 5 foto galeri.</p>
        </Card>
        <Card className="p-6 border-blue-300">
          <Badge variant="info">Tier 2</Badge>
          <h3 className="text-xl font-bold mt-2">Pro Tier</h3>
          <p className="text-sm text-zinc-500 mt-1">Rp 199.000 / 15 Kuota Publish</p>
          <p className="text-xs text-zinc-400 mt-3">Semua widget interaktif, max 20 foto.</p>
        </Card>
        <Card className="p-6 border-amber-300">
          <Badge variant="warning">Tier 3</Badge>
          <h3 className="text-xl font-bold mt-2">Premium Tier</h3>
          <p className="text-sm text-zinc-500 mt-1">Rp 349.000 / 30 Kuota Publish</p>
          <p className="text-xs text-zinc-400 mt-3">Fitur lengkap tanpa batasan galeri.</p>
        </Card>
      </div>
    </div>
  );
}
