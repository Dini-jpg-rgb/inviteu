import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function AdminPartnersPage() {
  const partners = [
    { id: "P-01", name: "Artha Wedding Organizer", email: "partner@inviteu.id", tier: "Pro", quota: "8/10", status: "Aktif" },
    { id: "P-02", name: "Harmoni Photo Studio", email: "harmoni@studio.com", tier: "Basic", quota: "1/5", status: "Aktif" },
    { id: "P-03", name: "Bunga Melati WO", email: "melati@bunga.id", tier: "Premium", quota: "25/30", status: "Aktif" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Partner Management</h1>
        <p className="text-sm text-zinc-500">
          Mengelola data akun Partner vendor B2B, status verifikasi, dan paket langganan aktif (PRD Bagian 16).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Partner</TableHead>
                <TableHead>Nama Bisnis / Vendor</TableHead>
                <TableHead>Email Kontak</TableHead>
                <TableHead>Paket Tier</TableHead>
                <TableHead>Sisa Kuota</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{p.email}</TableCell>
                  <TableCell><Badge variant="info">{p.tier}</Badge></TableCell>
                  <TableCell className="font-medium text-emerald-600">{p.quota}</TableCell>
                  <TableCell><Badge variant="success">{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
