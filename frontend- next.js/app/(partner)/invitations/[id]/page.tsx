"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

type TabType = "overview" | "edit" | "guests" | "event_owner" | "share";

export default function InvitationDetailPage() {
  const params = useParams();
  const invitationId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(false);

  // Mock data sesuai lifecycle PRD v3.0
  const invitation = {
    id: invitationId || "inv_01",
    title: "The Wedding of Deasy & Rama",
    slug: "deasy-dan-rama",
    status: "published", // draft | published | expired
    templateName: "Elegant Floral v1.0",
    eventDate: "28 Mei 2025",
    eventTime: "09:00 - 13:00 WIB",
    location: "Grand Ballroom Hotel Indonesia Kempinski, Jakarta",
    expirationDate: "28 Juni 2025",
    guestCount: 250,
    rsvpCount: 184,
    attendingCount: 142,
  };

  const shareUrl = `http://localhost:3000/${invitation.slug}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/invitations" className="hover:underline">
              Undangan Saya
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-300 font-medium">{invitation.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {invitation.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ● Status: Published
          </span>
          <Link href={`/${invitation.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              Lihat Undangan Publik ↗
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Sub-menu Tabs (PRD v3.0 Section 11.4) */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto text-sm font-medium">
        {[
          { id: "overview", label: "Overview" },
          { id: "edit", label: "Edit Undangan" },
          { id: "guests", label: "Guest & RSVP" },
          { id: "event_owner", label: "Event Owner Access" },
          { id: "share", label: "Share Invitation" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 border-b-2 transition whitespace-nowrap text-xs font-semibold ${
              activeTab === tab.id
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Ringkasan Informasi Undangan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Template Terpasang</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                  {invitation.templateName}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Tanggal Acara</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                  {invitation.eventDate} ({invitation.eventTime})
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Masa Aktif (Expiration)</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                  {invitation.expirationDate}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">Catatan Kunci PRD v3.0 (Data Event Terkunci):</p>
                <p className="mt-0.5">
                  Karena undangan ini berstatus <strong>Published</strong>, tanggal, waktu, dan lokasi acara tidak dapat diubah kembali demi menjaga konsistensi informasi yang telah disebar kepada para tamu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. EDIT INVITATION */}
        {activeTab === "edit" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Structured Page Builder
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Anda dapat mengedit teks cerita, mengganti foto galeri, dan menyesuaikan widget tanpa mengurangi kuota tambahan.
            </p>
            <div className="pt-4">
              <Link href="/designer/templates/create">
                <Button size="lg" className="font-semibold">
                  Buka Page Builder 🎨
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. GUEST & RSVP */}
        {activeTab === "guests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Data Tamu & Konfirmasi Kehadiran (RSVP)
              </h2>
              <Button size="sm">+ Tambah Tamu Manual</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <p className="text-xs text-zinc-500">Total Tamu Diundang</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{invitation.guestCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <p className="text-xs text-zinc-500">Telah Mengisi RSVP</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{invitation.rsvpCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <p className="text-xs text-zinc-500">Konfirmasi Hadir</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{invitation.attendingCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. EVENT OWNER ACCESS */}
        {activeTab === "event_owner" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Akses Khusus Pengantin (Event Owner Access)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Klien pengantin tidak perlu mendaftar akun. Berikan link atau kode OTP ini agar mereka bisa memantau data tamu dan RSVP secara langsung (khusus melihat RSVP / View-Only).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Kode Akses OTP Pengantin:
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-50 mt-1">
                    {otpGenerated ? "849-210" : "••••••"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOtpGenerated(true)}
                >
                  {otpGenerated ? "Generate Ulang OTP" : "Tampilkan / Generate OTP"}
                </Button>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500">
                Link Akses RSVP Langsung: <span className="font-mono text-zinc-700 dark:text-zinc-300">https://inviteu.id/owner-access/inv_01</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. SHARE INVITATION */}
        {activeTab === "share" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Bagikan Tautan Undangan (Share Link Generik)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Salin tautan ini untuk disebarkan kepada tamu atau diberikan kepada pengantin.
              </p>
            </div>

            <div className="flex items-center gap-3 max-w-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono dark:border-zinc-800 dark:bg-zinc-800"
              />
              <Button size="md" onClick={() => copyToClipboard(shareUrl)}>
                {copied ? "Tersalin! ✓" : "Salin Link"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
