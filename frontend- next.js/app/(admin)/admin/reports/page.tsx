import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminReportsPage() {
  const reportsList = [
    {
      title: "1. Partner Report",
      desc: "Laporan pertumbuhan vendor B2B, tingkat konversi registrasi, dan partner retention.",
      metrics: "48 Total Partner (89% Aktif)",
    },
    {
      title: "2. Invitation Report",
      desc: "Laporan statistik undangan yang dibuat, rasio Draft vs Published vs Expired.",
      metrics: "312 Published, 45 Draft, 18 Expired",
    },
    {
      title: "3. Transaction Report",
      desc: "Laporan perputaran keuangan, invoice lunas, dan pendapatan per paket langganan.",
      metrics: "Rp 42.800.000 (Bulan Berjalan)",
    },
    {
      title: "4. Usage Report",
      desc: "Laporan utilisasi kuota publish, widget paling sering dipakai, dan beban server.",
      metrics: "78% Kuota Terpakai Efektif",
    },
    {
      title: "5. RSVP Report",
      desc: "Laporan keikutsertaan tamu undangan, rasio kehadiran, dan rata-rata tamu per acara.",
      metrics: "84% Rata-rata Konfirmasi Hadir",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Operasional (5 Jenis Reports)</h1>
          <p className="text-sm text-zinc-500">
            Sesuai PRD v3.0 Bagian 16: Partner Report, Invitation Report, Transaction Report, Usage Report, RSVP Report.
          </p>
        </div>
        <Button size="sm" variant="outline">Export Excel / CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsList.map((r, i) => (
          <Card key={i} className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">{r.title}</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{r.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{r.metrics}</span>
              <Button size="sm" variant="outline" className="text-xs py-1">Unduh</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
