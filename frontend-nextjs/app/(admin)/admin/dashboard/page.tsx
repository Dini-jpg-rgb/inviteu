"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Notification } from "@/components/ui/Notification";

export default function AdminDashboardPage() {
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock template review queue dari Designer (PRD Bagian 16 & 23)
  const [pendingTemplates, setPendingTemplates] = useState([
    {
      id: "tpl-101",
      name: "Elegance Gold Floral",
      designer: "Rian (Creative Lead)",
      category: "Wedding Luxury",
      submittedAt: "12 Okt 2026, 14:20",
      status: "pending_review",
    },
    {
      id: "tpl-102",
      name: "Minimalist Pastel Botanical",
      designer: "Siti Rahma",
      category: "Engagement / Intimate",
      submittedAt: "12 Okt 2026, 16:45",
      status: "pending_review",
    },
  ]);

  const handleApprove = (id: string, name: string) => {
    setPendingTemplates((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Template "${name}" berhasil di-Approve dan kini berstatus Published untuk Partner!`);
    setSelectedReview(null);
  };

  const handleReject = (id: string, name: string) => {
    if (!feedbackText) {
      alert("Harap berikan alasan/feedback penolakan untuk Designer (PRD 21.1)");
      return;
    }
    setPendingTemplates((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Template "${name}" ditolak dengan feedback: "${feedbackText}". Status berubah menjadi Rejected.`);
    setFeedbackText("");
    setSelectedReview(null);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <Notification
          type="success"
          title="Tindakan Berhasil"
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Admin Platform Overview
            </h1>
            <Badge variant="destructive">Pusat Kendali</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Monitoring operasional platform InviteU, persetujuan template, dan metrik transaksi B2B.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/templates">
            <Button size="sm" variant="outline">
              Kelola Semua Template
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
              Buka 5 Laporan (Reports)
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Operasional Platform (PRD Bagian 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Partner Terdaftar"
          value="48 Vendor"
          description="+6 vendor baru minggu ini"
          badge={<Badge variant="success">Aktif</Badge>}
          icon={
            <svg className="w-5 h-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          title="Undangan Published (Live)"
          value="312 Acara"
          description="Sedang aktif diakses tamu publik"
          badge={<Badge variant="info">Platform Wide</Badge>}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
        />
        <StatCard
          title="Total Transaksi Paket"
          value="Rp 42.800.000"
          description="Dari 64 pembelian paket kuota B2B"
          badge={<Badge variant="success">Lunas</Badge>}
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Template Menunggu Approval"
          value={pendingTemplates.length}
          description="Butuh tindakan persetujuan Admin"
          badge={<Badge variant="warning">Action Needed</Badge>}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Antrean Approval Template (PRD 16 & 21: Satu Level Approval Designer -> Admin) */}
      <Card className="border-amber-200/80 dark:border-amber-900/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-t-xl">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Antrean Persetujuan Template (Approval Authority)</CardTitle>
              <Badge variant="warning">{pendingTemplates.length} Menunggu</Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Sesuai PRD v3.0 Bagian 21: Designer tidak dapat publish langsung ke production. Admin bertindak sebagai approval authority.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {pendingTemplates.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              Tidak ada template yang sedang menunggu review. Semua kiriman telah diproses.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Template</TableHead>
                  <TableHead>Desainer</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead className="text-right">Tindakan Admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTemplates.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">
                      {item.designer}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {item.submittedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReview(item.id)}
                        >
                          Review & Feedback
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApprove(item.id, item.name)}
                        >
                          Approve Langsung
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Review & Reject Feedback (PRD 21.1) */}
      {selectedReview && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          title="Review Template Submission"
          description="Periksa detail tata letak sebelum menyetujui atau memberikan revisi ke Designer."
          footer={
            <>
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const t = pendingTemplates.find((x) => x.id === selectedReview);
                  if (t) handleReject(t.id, t.name);
                }}
              >
                Reject dengan Feedback
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const t = pendingTemplates.find((x) => x.id === selectedReview);
                  if (t) handleApprove(t.id, t.name);
                }}
              >
                Approve (Publish)
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50 text-xs space-y-1">
              <p><strong>ID Template:</strong> {selectedReview}</p>
              <p><strong>Status:</strong> Pending Review</p>
              <p><strong>Aturan:</strong> Jika di-Approve, template akan otomatis tersedia di menu katalog Partner saat Create Invitation.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan / Alasan Penolakan (Wajib diisi jika Reject):
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Contoh: Font judul sulit dibaca di layar mobile, harap ganti ukuran widget RSVP..."
                className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
