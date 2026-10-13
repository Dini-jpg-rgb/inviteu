"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuth } from "@/context/AuthContext";

export default function PartnerDashboardPage() {
  const { partner, user } = useAuth();

  // Mock data ringkasan undangan sesuai PRD v3.0 Bagian 11.1
  const recentInvitations = [
    {
      id: "inv-001",
      title: "Pernikahan Budi & Ani",
      eventDate: "24 Nov 2026",
      status: "published" as const,
      guestsCount: 150,
      rsvpAttending: 120,
      slug: "budi-ani-wedding",
    },
    {
      id: "inv-002",
      title: "Resepsi Dimas & Sarah",
      eventDate: "12 Des 2026",
      status: "published" as const,
      guestsCount: 80,
      rsvpAttending: 62,
      slug: "dimas-sarah-love",
    },
    {
      id: "inv-003",
      title: "Engagement Rizky & Maya",
      eventDate: "05 Jan 2027",
      status: "draft" as const,
      guestsCount: 50,
      rsvpAttending: 0,
      slug: "rizky-maya",
    },
    {
      id: "inv-004",
      title: "Pernikahan Reza & Citra",
      eventDate: "10 Okt 2026",
      status: "expired" as const,
      guestsCount: 200,
      rsvpAttending: 185,
      slug: "reza-citra",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Dashboard Partner
            </h1>
            <Badge variant="info">B2B Portal</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Selamat datang kembali,{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {partner?.nama_bisnis || "Artha Wedding Organizer"}
            </span>{" "}
            ({user?.email || "partner@inviteu.id"}).
          </p>
        </div>

        {/* Quick Action Shortcut (PRD 11.1) */}
        <div className="flex items-center gap-3">
          <Link href="/packages">
            <Button variant="outline" size="sm">
              Tambah Kuota Paket
            </Button>
          </Link>
          <Link href="/invitations/create">
            <Button size="sm" className="shadow-sm">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Undangan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Informasi Package & Quota Bar (PRD 11.1 & 6.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Paket Langganan Aktif
            </span>
            <Badge variant="success">Aktif</Badge>
          </div>
          <h3 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Pro Partner Tier
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Termasuk semua widget interaktif, galeri foto s/d 20 foto & integrasi Google Maps.
          </p>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-xs">
            <span className="text-zinc-500">Masa Berlaku:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Tidak Terbatas (Publish-based)</span>
          </div>
        </Card>

        {/* Quota Progress */}
        <Card className="p-6 border-zinc-200/80 dark:border-zinc-800 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Sisa Kuota Undangan (Publish Count)
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              8 Kuota Tersisa dari 10
            </span>
          </div>
          <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-zinc-900 dark:bg-zinc-50 h-3 rounded-full transition-all duration-500"
              style={{ width: "80%" }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                2 Undangan Terpakai
              </p>
              <p className="text-[11px]">Hanya berkurang saat pertama kali publish (PRD v3.0 Rule 6.3).</p>
            </div>
            <Link href="/packages" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 underline hover:text-zinc-700">
              Upgrade ke Premium &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Stat Cards Ringkasan Undangan & RSVP (PRD 11.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Undangan"
          value="4"
          description="Seluruh proyek undangan di akun Anda"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          title="Undangan Aktif (Published)"
          value="2"
          description="Dapat diakses tamu undangan"
          badge={<Badge variant="success">Published</Badge>}
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Draft Sedang Diedit"
          value="1"
          description="Belum mengurangi kuota publish"
          badge={<Badge variant="secondary">Draft</Badge>}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          title="Total Konfirmasi Hadir"
          value="182 Tamu"
          description="Dari total 230 undangan terkirim"
          badge={<Badge variant="info">79% Hadir</Badge>}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* 4. Tabel Daftar Undangan Terkini (Recent Invitations) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Undangan Terkini</CardTitle>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Daftar undangan yang baru-baru ini dikelola oleh tim Anda.
            </p>
          </div>
          <Link href="/invitations" className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100">
            Lihat Semua Undangan &rarr;
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Acara</TableHead>
                <TableHead>Tanggal Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Respon RSVP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-zinc-900 dark:text-zinc-50 font-semibold">{inv.title}</p>
                      <p className="text-[11px] text-zinc-400">/{inv.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {inv.eventDate}
                  </TableCell>
                  <TableCell>
                    {inv.status === "published" && <Badge variant="success">Published</Badge>}
                    {inv.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                    {inv.status === "expired" && <Badge variant="destructive">Expired</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {inv.status === "published" ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {inv.rsvpAttending} hadir / {inv.guestsCount} tamu
                      </span>
                    ) : inv.status === "expired" ? (
                      <span className="text-zinc-500">{inv.rsvpAttending} hadir (Acara Selesai)</span>
                    ) : (
                      <span className="text-zinc-400 italic">Belum dipublish</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/invitations/${inv.id}`}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        Detail & RSVP
                      </Link>
                      {inv.status === "published" && (
                        <Link
                          href={`/${inv.slug}`}
                          target="_blank"
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 transition"
                        >
                          Buka Link
                        </Link>
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
