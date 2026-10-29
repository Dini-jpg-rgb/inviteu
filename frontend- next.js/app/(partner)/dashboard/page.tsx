"use client";

import React from "react";
import Link from "next/link";
import { usePartner } from "@/context/PartnerContext";

export default function PartnerDashboardPage() {
  const {
    activePackage,
    invitations,
    loadDemoInvitations,
    clearInvitations,
    resetPackage,
  } = usePartner();

  // Calculated metrics
  const publishedInvitations = invitations.filter((i) => i.status === "Published");
  const draftInvitations = invitations.filter((i) => i.status === "Draft");
  const expiredInvitations = invitations.filter((i) => i.status === "Expired");

  const publishedCount = publishedInvitations.length;
  const draftCount = draftInvitations.length;
  const expiredCount = expiredInvitations.length;
  const totalInvitations = invitations.length;

  const totalRsvpHadir = invitations.reduce(
    (acc, curr) => acc + (curr.rsvpSummary?.hadir ?? curr.rsvpCount ?? 0),
    0
  );
  const totalRsvpTidakHadir = invitations.reduce(
    (acc, curr) => acc + (curr.rsvpSummary?.tidakHadir ?? 0),
    0
  );
  const totalRsvpBelumMerespons = invitations.reduce(
    (acc, curr) => acc + (curr.rsvpSummary?.belumMerespons ?? 0),
    0
  );

  const maxQuota = activePackage === "basic" ? 10 : activePackage === "pro" ? 10 : 30;

  // Capitalized package name
  const packageName =
    activePackage === "basic"
      ? "Basic"
      : activePackage === "pro"
      ? "Pro"
      : activePackage === "premium"
      ? "Premium"
      : "-";

  return (
    <div className="space-y-5 max-w-6xl">
      {/* 1. Header (Title, Subtitle, & Create Invitation Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Ringkasan package, quota, dan invitation
          </p>
        </div>

        <Link href="/invitations/create">
          <button className="bg-[#331c11] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <span>+</span>
            <span>Create Invitation</span>
          </button>
        </Link>
      </div>

      {/* 2. Top Warning Banner (Only visible when package is not active - matching Image 1) */}
      {!activePackage && (
        <div className="bg-[#ebdecb] rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6e4d2a] border border-[#dfceba]">
          <span className="font-medium">
            Kamu belum punya package aktif. Beli package untuk mulai membuat invitation.
          </span>
          <Link href="/packages" className="shrink-0">
            <button className="bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-xs px-4 py-1.5 rounded-lg border border-[#d8c3ad] shadow-2xs transition-colors cursor-pointer">
              Lihat Package
            </button>
          </Link>
        </div>
      )}

      {/* 3. Four Stat Cards (Matching Image 1 & Image 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Package Aktif */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#df9226] text-[#2d1b11] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#543015]">
            Package aktif
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#2d1b11] mt-2 tracking-tight">
            {activePackage ? packageName : "-"}
          </div>
        </div>

        {/* Card 2: Quota Terpakai */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#df9226] text-[#2d1b11] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#543015]">
            Quota terpakai
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#2d1b11] mt-2 tracking-tight">
            {activePackage ? (
              <span>
                {publishedCount} <span className="text-xl sm:text-2xl font-bold text-[#44230b]">/ {maxQuota}</span>
              </span>
            ) : (
              "-"
            )}
          </div>
        </div>

        {/* Card 3: Invitation Published */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#df9226] text-[#2d1b11] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#543015]">
            Invitation Published
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#2d1b11] mt-2 tracking-tight">
            {publishedCount}
          </div>
        </div>

        {/* Card 4: RSVP Hadir */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#df9226] text-[#2d1b11] shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#543015]">
            RSVP hadir
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#2d1b11] mt-2 tracking-tight">
            {totalRsvpHadir}
          </div>
        </div>
      </div>

      {/* 4. Conditional Content: Empty State (Image 1) OR Active Dashboard (Image 3) */}
      {!activePackage ? (
        /* Image 1: Belum Ada Package Aktif Empty State Card */
        <div className="bg-white rounded-2xl p-16 sm:p-24 border border-[#e5d8c8] flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            Belum ada package aktif
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mt-1.5 leading-relaxed font-normal">
            Beli package untuk mulai membuat dan mempublish invitation.
          </p>
          <Link href="/packages">
            <button className="bg-[#1c1c1c] hover:bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-lg mt-5 shadow-xs transition-colors cursor-pointer">
              Lihat Package
            </button>
          </Link>
        </div>
      ) : (
        /* Image 3: Active Dashboard Content */
        <div className="space-y-5">
          {/* Middle Row: Status invitation & Ringkasan RSVP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Invitation Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                Status invitation
              </h3>

              <div className="space-y-3 pt-1 text-xs">
                {/* Draft Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 font-medium text-zinc-700">Draft</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#331c11] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(draftCount / totalInvitations) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-zinc-900">{draftCount}</span>
                </div>

                {/* Published Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 font-medium text-zinc-700">Published</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#331c11] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(publishedCount / totalInvitations) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-zinc-900">{publishedCount}</span>
                </div>

                {/* Expired Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 font-medium text-zinc-700">Expired</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#331c11] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(expiredCount / totalInvitations) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-zinc-900">{expiredCount}</span>
                </div>
              </div>
            </div>

            {/* Ringkasan RSVP Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs space-y-3.5">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                Ringkasan RSVP
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Hadir</span>
                  <span className="font-bold text-zinc-900 text-sm">{totalRsvpHadir}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Tidak hadir</span>
                  <span className="font-bold text-zinc-900 text-sm">{totalRsvpTidakHadir}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Belum merespons</span>
                  <span className="font-bold text-zinc-900 text-sm">{totalRsvpBelumMerespons}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table: Invitation Terbaru */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 mb-2.5">
              Invitation terbaru
            </h3>

            <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#331c11] text-white">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Invitation</th>
                      <th className="py-3 px-4 font-semibold">Tanggal event</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">RSVP</th>
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {invitations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-zinc-400">
                          <p className="font-medium text-xs">Belum ada invitation dibuat</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Klik tombol &quot;+ Create Invitation&quot; di atas untuk membuat undangan pertama klien Anda.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-zinc-900">
                            {inv.title}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-600 font-normal">
                            {inv.eventDate}
                          </td>
                          <td className="py-3.5 px-4">
                            {inv.status === "Published" ? (
                              <span className="inline-block bg-[#eaf7f0] text-emerald-700 font-semibold px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                                Published
                              </span>
                            ) : inv.status === "Draft" ? (
                              <span className="inline-block bg-[#fef5e7] text-amber-700 font-semibold px-3 py-1 rounded-full text-[11px] border border-amber-200">
                                Draft
                              </span>
                            ) : (
                              <span className="inline-block bg-zinc-100 text-zinc-600 font-semibold px-3 py-1 rounded-full text-[11px]">
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-700 font-medium">
                            {inv.rsvpCount > 0 ? `${inv.rsvpCount} hadir` : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link href={`/invitations/${inv.id}`}>
                              <button className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-semibold px-4 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer">
                                Buka
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Testing Helper Panel (for testing workflows easily) */}
      <div className="pt-6 border-t border-[#dfcebc]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-zinc-500 font-medium">
          Status Sistem: Package{" "}
          <strong className="text-zinc-800">
            {activePackage ? activePackage.toUpperCase() : "BELUM AKTIF"}
          </strong>{" "}
          | Invitation: <strong className="text-zinc-800">{invitations.length}</strong>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invitations.length === 0 ? (
            <button
              onClick={loadDemoInvitations}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              🧪 Simulasikan 3 Undangan Klien (Gambar 3)
            </button>
          ) : (
            <button
              onClick={clearInvitations}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 font-medium text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Kosongkan Undangan (Kembali ke 0)
            </button>
          )}

          {activePackage && (
            <button
              onClick={resetPackage}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Reset Package (Kembali ke Gambar 1)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
