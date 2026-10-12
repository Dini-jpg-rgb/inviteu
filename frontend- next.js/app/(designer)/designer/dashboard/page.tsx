"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Notification } from "@/components/ui/Notification";

export default function DesignerDashboardPage() {
  // Mock data template karya Desainer sesuai PRD v3.0 Bagian 18
  const myTemplates = [
    {
      id: "T-01",
      name: "Elegance Gold Floral",
      category: "Wedding Luxury",
      status: "pending_review" as const,
      updatedAt: "12 Okt 2026, 14:20",
    },
    {
      id: "T-02",
      name: "Modern Minimalist Card",
      category: "Modern / Chic",
      status: "published" as const,
      updatedAt: "08 Okt 2026, 10:15",
    },
    {
      id: "T-03",
      name: "Traditional Javanese Royal",
      category: "Adat / Budaya",
      status: "rejected" as const,
      updatedAt: "05 Okt 2026, 16:30",
      rejectionFeedback: "Warna background teks akad kurang kontras dengan background batik, harap sesuaikan.",
    },
    {
      id: "T-04",
      name: "Rustic Eucalyptus Breeze",
      category: "Outdoor / Rustic",
      status: "draft" as const,
      updatedAt: "Kemarin, 19:40",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner Peringatan Rejection Feedback (PRD 18.1 & 21.1) */}
      <Notification
        type="warning"
        title="1 Template Memerlukan Revisi Feedback Admin"
        message='Template "Traditional Javanese Royal" berstatus Rejected. Klik "Perbaiki Template" untuk melihat catatan revisi dari Admin.'
      />

      {/* Header Designer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Workspace Designer
            </h1>
            <Badge variant="info">Work-Oriented</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Fokus pembuatan dan pengelolaan template undangan digital (PRD v3.0 Bagian 18).
          </p>
        </div>

        {/* Quick Action Button (PRD 18.3) */}
        <Link href="/designer/templates">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Buat Template Baru
          </Button>
        </Link>
      </div>

      {/* 5 Stat Cards Template Summary (PRD 18.1: Draft, Pending, Published, Rejected) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Template"
          value="4"
          description="Karya desainer Anda"
        />
        <StatCard
          title="Draft (Proses)"
          value="1"
          badge={<Badge variant="secondary">Draft</Badge>}
          description="Belum diajukan"
        />
        <StatCard
          title="Pending Review"
          value="1"
          badge={<Badge variant="warning">Review</Badge>}
          description="Menunggu admin"
        />
        <StatCard
          title="Published (Aktif)"
          value="1"
          badge={<Badge variant="success">Tayang</Badge>}
          description="Digunakan partner"
        />
        <StatCard
          title="Perlu Revisi"
          value="1"
          badge={<Badge variant="destructive">Rejected</Badge>}
          description="Ada catatan admin"
        />
      </div>

      {/* Recent Templates Table (PRD 18.2) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Daftar Template Terbaru</CardTitle>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pantau status persetujuan dan riwayat pembaruan template karya Anda.
            </p>
          </div>
          <Link href="/designer/templates" className="text-xs font-semibold text-indigo-600 hover:underline">
            Semua Template &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Template</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status Approval</TableHead>
                <TableHead>Terakhir Diperbarui</TableHead>
                <TableHead className="text-right">Aksi Desainer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTemplates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">
                    <div>
                      {tpl.name}
                      {tpl.rejectionFeedback && (
                        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-normal">
                          Feedback: "{tpl.rejectionFeedback}"
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tpl.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {tpl.status === "published" && <Badge variant="success">Published</Badge>}
                    {tpl.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                    {tpl.status === "pending_review" && <Badge variant="warning">Pending Review</Badge>}
                    {tpl.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {tpl.updatedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tpl.status === "draft" && (
                        <Button size="sm" variant="outline">
                          Edit di Editor
                        </Button>
                      )}
                      {tpl.status === "rejected" && (
                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                          Perbaiki Revisi
                        </Button>
                      )}
                      {tpl.status === "published" && (
                        <Button size="sm" variant="outline">
                          Buat Revisi (v2)
                        </Button>
                      )}
                      {tpl.status === "pending_review" && (
                        <span className="text-xs text-zinc-400 italic">Menunggu Admin</span>
                      )}
                    </div>
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
