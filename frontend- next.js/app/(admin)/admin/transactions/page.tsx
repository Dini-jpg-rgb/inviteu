import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function AdminTransactionsPage() {
  const transactions = [
    { id: "TRX-901", partner: "Artha WO", package: "Pro Package (15 Kuota)", amount: "Rp 199.000", status: "Lunas", date: "11 Okt 2026, 09:12" },
    { id: "TRX-902", partner: "Harmoni Photo", package: "Basic Package (5 Kuota)", amount: "Rp 99.000", status: "Lunas", date: "10 Okt 2026, 15:40" },
    { id: "TRX-903", partner: "Bunga Melati WO", package: "Premium Package (30 Kuota)", amount: "Rp 349.000", status: "Lunas", date: "09 Okt 2026, 11:25" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Transaction / Payment Monitoring</h1>
        <p className="text-sm text-zinc-500">
          Memantau riwayat transaksi pembelian paket dan status pembayaran Partner B2B (PRD Bagian 16 & 27.1).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice / TRX</TableHead>
                <TableHead>Nama Partner</TableHead>
                <TableHead>Paket yang Dibeli</TableHead>
                <TableHead>Total Pembayaran</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead>Waktu Transaksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trx) => (
                <TableRow key={trx.id}>
                  <TableCell className="font-mono text-xs">{trx.id}</TableCell>
                  <TableCell className="font-semibold">{trx.partner}</TableCell>
                  <TableCell className="text-xs text-zinc-600">{trx.package}</TableCell>
                  <TableCell className="font-bold text-zinc-900 dark:text-zinc-50">{trx.amount}</TableCell>
                  <TableCell><Badge variant="success">{trx.status}</Badge></TableCell>
                  <TableCell className="text-xs text-zinc-500">{trx.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
