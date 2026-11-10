"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePartner } from "@/context/PartnerContext";
import { DualAxisLineChart } from "@/components/dashboard/DualAxisLineChart";
import { RsvpDonutChart } from "@/components/dashboard/RsvpDonutChart";

export default function PartnerDashboardPage() {
  const {
    activePackage,
    invitations,
    resetPackage,
  } = usePartner();

  // Real calculated metrics from context invitations
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

  const totalTamu = totalRsvpHadir + totalRsvpTidakHadir + totalRsvpBelumMerespons;

  const maxQuota =
    activePackage === "basic"
      ? 5
      : activePackage === "medium"
      ? 20
      : 10;

  // Capitalized package name
  const packageName =
    activePackage === "basic"
      ? "Basic"
      : activePackage === "medium"
      ? "Medium"
      : activePackage === "pro" || activePackage === "premium"
      ? "Pro"
      : "-";

  // Data for Event Mendatang based on actual registered published invitations
  const upcomingEvents = publishedInvitations.map((inv) => ({
    title: inv.title,
    date: inv.eventDate,
    badge: "H-48",
    badgeColor: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]",
  }));

  // Data for Segera Expired based on actual registered expired invitations
  const expiringInvitations = expiredInvitations.map((inv) => ({
    title: inv.title,
    date: inv.expiration || inv.eventDate,
    badge: "Expired",
    badgeColor: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
  }));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Header (Title, Subtitle, & + Create Invitation Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-0.5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-0.5">
            Ringkasan package, quota, invitation, dan RSVP
          </p>
        </div>

        <Link href="/invitations/create">
          <button className="bg-[#24140b] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <span className="text-sm font-bold leading-none">+</span>
            <span>Create Invitation</span>
          </button>
        </Link>
      </div>

      {/* 2. Top Warning Banner (Only visible when package is not active) */}
      {!activePackage && (
        <div className="bg-[#ebdecb] rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6e4d2a] border border-[#dfceba]">
          <span className="font-medium">
            Kamu belum punya package aktif. Beli package untuk mulai membuat invitation.
          </span>
          <Link href="/packages" className="shrink-0">
            <button className="bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-xs px-3.5 py-1.5 rounded-lg border border-[#d8c3ad] shadow-2xs transition-colors cursor-pointer">
              Lihat Package
            </button>
          </Link>
        </div>
      )}

      {/* 3. Four Stat Cards (Amber Cards #f5a638) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Package Aktif */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-4.5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[92px]">
          <span className="text-[11px] sm:text-xs font-bold text-[#44230b]">
            Package aktif
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2d1b11] mt-1 tracking-tight">
            {activePackage ? packageName : "-"}
          </div>
        </div>

        {/* Card 2: Quota Terpakai (Real based on registered published invitations) */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-4.5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[92px]">
          <span className="text-[11px] sm:text-xs font-bold text-[#44230b]">
            Quota terpakai
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2d1b11] mt-1 tracking-tight">
            {activePackage ? (
              <span>
                {publishedCount}{" "}
                <span className="text-lg sm:text-xl font-bold text-[#44230b]">
                  / {maxQuota}
                </span>
              </span>
            ) : (
              "-"
            )}
          </div>
        </div>

        {/* Card 3: Invitation Published */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-4.5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[92px]">
          <span className="text-[11px] sm:text-xs font-bold text-[#44230b]">
            Invitation Published
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2d1b11] mt-1 tracking-tight">
            {publishedCount}
          </div>
        </div>

        {/* Card 4: RSVP Hadir */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-4.5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[92px]">
          <span className="text-[11px] sm:text-xs font-bold text-[#44230b]">
            RSVP hadir
          </span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2d1b11] mt-1 tracking-tight">
            {totalRsvpHadir}
          </div>
        </div>
      </div>

      {/* 4. Conditional Content: Empty State OR Active Dashboard */}
      {!activePackage ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 border border-[#e5d8c8] flex flex-col items-center justify-center text-center shadow-xs min-h-[320px]">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#f5a638] mb-3.5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
            Belum ada package aktif
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mt-1 leading-relaxed font-normal">
            Beli package untuk mulai membuat, mengelola kuota, dan mempublish invitation digital klienmu.
          </p>
          <Link href="/packages">
            <button className="bg-[#24140b] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-lg mt-4 shadow-xs transition-colors cursor-pointer">
              Lihat &amp; Beli Package
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Row 2: Charts (Dual Axis Blue Line Chart Left & RSVP Donut Chart Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* Left: RSVP masuk per hari */}
            <div className="lg:col-span-8 flex flex-col">
              <DualAxisLineChart isEmpty={publishedCount === 0} />
            </div>

            {/* Right: Status RSVP Donut Chart (Real values) */}
            <div className="lg:col-span-4 flex flex-col">
              <RsvpDonutChart
                totalTamu={totalTamu}
                hadir={totalRsvpHadir}
                tidakHadir={totalRsvpTidakHadir}
                belumMerespons={totalRsvpBelumMerespons}
              />
            </div>
          </div>

          {/* Row 3: 3 Cards Grid (Status invitation, Event mendatang, Segera expired) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
            {/* Card A: Status invitation */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5">
                Status invitation
              </h3>

              <div className="space-y-3 my-auto">
                {/* Draft Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-zinc-700">Draft</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#24140b] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(draftCount / Math.max(totalInvitations, 1)) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs font-bold text-zinc-900">{draftCount}</span>
                </div>

                {/* Published Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-zinc-700">Published</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#24140b] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(publishedCount / Math.max(totalInvitations, 1)) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs font-bold text-zinc-900">{publishedCount}</span>
                </div>

                {/* Expired Row */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-zinc-700">Expired</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#24140b] h-full rounded-full transition-all duration-300"
                      style={{
                        width: totalInvitations > 0 ? `${(expiredCount / Math.max(totalInvitations, 1)) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs font-bold text-zinc-900">{expiredCount}</span>
                </div>
              </div>
            </div>

            {/* Card B: Event mendatang (Berdasarkan invitation terdaftar) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5">
                Event mendatang
              </h3>

              <div className="space-y-2.5 my-auto">
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-3 text-center">Belum ada event mendatang</p>
                ) : (
                  upcomingEvents.map((evt, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-zinc-900 leading-tight">
                          {evt.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                          {evt.date}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${evt.badgeColor}`}>
                        {evt.badge}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card C: Segera expired (Berdasarkan invitation terdaftar) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-900 mb-2.5">
                Segera expired
              </h3>

              <div className="space-y-2.5 my-auto">
                {expiringInvitations.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-3 text-center">Tidak ada invitation yang akan expired</p>
                ) : (
                  expiringInvitations.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-zinc-900 leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                          {item.date}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Bottom Table (Invitation terbaru - Sesuai Tabel Menu My Invitations Lengkap Cover & Template) */}
          <div className="space-y-2 pt-0.5">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
              Invitation terbaru
            </h3>

            <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  {/* Amber Table Header Bar (7 Kolom Lengkap Selaras My Invitations) */}
                  <thead className="bg-[#f5a638] text-[#2d1b11]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Invitation</th>
                      <th className="py-3 px-4 font-semibold">Template</th>
                      <th className="py-3 px-4 font-semibold">Tanggal event</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Expiration</th>
                      <th className="py-3 px-4 font-semibold">RSVP</th>
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {invitations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400">
                          <p className="font-semibold text-xs text-zinc-600">Belum ada invitation dibuat</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Klik tombol &quot;+ Create Invitation&quot; di atas untuk membuat undangan baru.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-zinc-50/70 transition-colors"
                        >
                          {/* Invitation: Foto Cover diletakkan tepat di samping nama */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-100 shadow-2xs">
                                <Image
                                  src={inv.cover || "/templates/wedding/couple-main.jpg"}
                                  alt={inv.title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                              <span className="font-semibold text-xs sm:text-sm text-zinc-900">
                                {inv.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-700 font-normal">
                            {inv.template || "Botanical Sage"}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 font-normal">
                            {inv.eventDate}
                          </td>
                          <td className="py-3 px-4">
                            {inv.status === "Published" ? (
                              <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200">
                                Published
                              </span>
                            ) : inv.status === "Draft" ? (
                              <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-2.5 py-0.5 rounded-full text-[10px] border border-amber-200">
                                Draft
                              </span>
                            ) : (
                              <span className="inline-block bg-zinc-100 text-zinc-700 font-semibold px-2.5 py-0.5 rounded-full text-[10px] border border-zinc-200">
                                Expired
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 font-normal">
                            {inv.expiration || "-"}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 font-medium">
                            {inv.status === "Draft" ? "-" : `${inv.rsvpSummary?.hadir ?? inv.rsvpCount ?? 0} hadir`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link href={`/invitations/${inv.id}`}>
                              <button
                                type="button"
                                className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[10px] sm:text-xs font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
                              >
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
        </>
      )}

      {/* 5. Testing Helper Panel (Hanya Tombol Reset Package) */}
      <div className="pt-2 border-t border-[#dfcebc]/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="text-zinc-500 font-medium text-[11px]">
          Status Sistem: Package{" "}
          <strong className="text-zinc-800">
            {activePackage ? activePackage.toUpperCase() : "BELUM AKTIF"}
          </strong>{" "}
          | Invitation: <strong className="text-zinc-800">{invitations.length}</strong>
        </div>

        <button
          onClick={resetPackage}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-[11px] px-3 py-1 rounded-lg transition-colors cursor-pointer"
        >
          Reset Package (Kembali ke Belum Beli)
        </button>
      </div>
    </div>
  );
}
