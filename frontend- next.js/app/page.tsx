import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-between">
      {/* 1. Navbar Sederhana */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-bold flex items-center justify-center text-sm shadow-sm">
              IU
            </div>
            <div>
              <span className="font-bold text-base tracking-tight leading-none">InviteU</span>
              <span className="block text-[10px] text-zinc-500 font-medium">B2B Invitation Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Masuk (Login)
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Daftar Partner
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
          <Badge variant="info">PRD v3.0 Ready</Badge>
          <span>Platform Solusi Undangan Digital untuk Vendor & WO</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
          Kelola & Buat Undangan Digital Klien Anda Lebih Cepat
        </h1>

        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          InviteU membantu fotografer, wedding organizer, dan vendor menyediakan layanan undangan digital elegan tanpa perlu membangun sistem sendiri.
        </p>

        {/* CTA Utama */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/login">
            <Button size="lg" className="shadow-md px-6">
              🚀 Masuk ke Portal (Login)
            </Button>
          </Link>
          <Link href="/budi-ani-wedding">
            <Button variant="outline" size="lg" className="px-6">
              💌 Pratinjau Undangan Tamu
            </Button>
          </Link>
        </div>

        {/* 3. Pilihan Pintu Masuk Peran (3 Role Portals) */}
        <div className="pt-12 text-left">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 text-center">
            Pilih Pintu Masuk Ruang Kerja Anda:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Kartu Partner */}
            <Link href="/login" className="block group">
              <Card className="p-6 h-full border-zinc-200 hover:border-zinc-400 hover:shadow-md transition-all dark:border-zinc-800 dark:hover:border-zinc-600">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="default">B2B Partner</Badge>
                  <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Portal Partner</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Beli paket kuota, kelola daftar undangan, pantau RSVP tamu, dan bagikan akses pengantin.
                </p>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Rute: /dashboard &rarr;
                </div>
              </Card>
            </Link>

            {/* Kartu Desainer */}
            <Link href="/login/designer" className="block group">
              <Card className="p-6 h-full border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all dark:border-zinc-800 dark:hover:border-indigo-600">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="info">Desainer Template</Badge>
                  <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Workspace Desainer</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Ruang kerja kreatif untuk membuat stok template, mengajukan persetujuan ke Admin, dan memperbaiki revisi.
                </p>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Rute: /designer/dashboard &rarr;
                </div>
              </Card>
            </Link>

            {/* Kartu Admin */}
            <Link href="/login/admin" className="block group">
              <Card className="p-6 h-full border-rose-200 hover:border-rose-400 hover:shadow-md transition-all dark:border-zinc-800 dark:hover:border-rose-600">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="destructive">Superadmin</Badge>
                  <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Panel Kontrol Admin</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pengawasan operasional platform, verifikasi & approval template dari desainer, dan pemantauan transaksi.
                </p>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Rute: /admin/dashboard &rarr;
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        &copy; 2026 InviteU Platform. All rights reserved. Sesuai Dokumen PRD v3.0 & ERD.
      </footer>
    </div>
  );
}
