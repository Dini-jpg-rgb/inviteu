import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function AdminInvitationsMonitoringPage() {
  const invitations = [
    { id: "INV-101", title: "Pernikahan Budi & Ani", partner: "Artha WO", date: "24 Nov 2026", status: "Published", views: 420 },
    { id: "INV-102", title: "Resepsi Dimas & Sarah", partner: "Harmoni Photo", date: "12 Des 2026", status: "Published", views: 180 },
    { id: "INV-103", title: "Engagement Rizky & Maya", partner: "Artha WO", date: "05 Jan 2027", status: "Draft", views: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Invitation Monitoring</h1>
          <Badge variant="outline">Read-Only</Badge>
        </div>
        <p className="text-sm text-zinc-500">
          Sesuai PRD v3.0 Bagian 16.1: Admin bersifat monitoring/read-only atas seluruh undangan milik Partner.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Undangan</TableHead>
                <TableHead>Nama Acara</TableHead>
                <TableHead>Pemilik (Partner)</TableHead>
                <TableHead>Tanggal Acara</TableHead>
                <TableHead>Status Lifecycle</TableHead>
                <TableHead>Trafik Pengunjung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="font-semibold">{inv.title}</TableCell>
                  <TableCell className="text-xs text-zinc-600">{inv.partner}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{inv.date}</TableCell>
                  <TableCell>
                    {inv.status === "Published" ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{inv.views} Views</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
