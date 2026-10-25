import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";

export default function AdminTemplateManagementPage() {
  const templates = [
    { id: "T-01", name: "Elegance Gold Floral", designer: "Rian (Creative Lead)", status: "Pending Review", date: "12 Okt 2026" },
    { id: "T-02", name: "Modern Minimalist Card", designer: "Siti Rahma", status: "Published", date: "08 Okt 2026" },
    { id: "T-03", name: "Traditional Javanese", designer: "Rian (Creative Lead)", status: "Rejected", date: "05 Okt 2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Template Management & Approval</h1>
        <p className="text-sm text-zinc-500">
          Sesuai PRD v3.0 Bagian 21 & 23: Admin adalah approval authority untuk menyetujui template dari Designer sebelum aktif di katalog Partner.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Template</TableHead>
                <TableHead>Desainer</TableHead>
                <TableHead>Status Approval</TableHead>
                <TableHead>Waktu Pengajuan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-semibold">{t.name}</TableCell>
                  <TableCell className="text-xs text-zinc-600">{t.designer}</TableCell>
                  <TableCell>
                    {t.status === "Pending Review" && <Badge variant="warning">Pending Review</Badge>}
                    {t.status === "Published" && <Badge variant="success">Published (Active)</Badge>}
                    {t.status === "Rejected" && <Badge variant="destructive">Rejected</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{t.date}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      {t.status === "Pending Review" ? "Buka Review" : "Lihat Detail"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
