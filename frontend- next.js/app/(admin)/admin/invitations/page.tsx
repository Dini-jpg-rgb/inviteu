"use client";

import React, { useState } from "react";

export default function AdminInvitationsMonitoringPage() {
  const [search, setSearch] = useState("");
  const invitations = [
    { id: "INV-101", title: "Rani & Dimas Wedding", partner: "Studio Kumtura", template: "Elegant", date: "12 Des 2026", status: "Published", views: 420, rsvp: "85 Hadir" },
    { id: "INV-102", title: "Resepsi Putu & Ayu", partner: "Bali Moments", template: "Floral", date: "03 Mar 2027", status: "Published", views: 180, rsvp: "15 Hadir" },
    { id: "INV-103", title: "Wira & Cahya Sacred Union", partner: "Kirana Event", template: "Modern", date: "18 Feb 2027", status: "Published", views: 240, rsvp: "40 Hadir" },
    { id: "INV-104", title: "Sari & Bayu Intimate", partner: "Undiksha Team", template: "Minimalist", date: "20 Jan 2027", status: "Draft", views: 0, rsvp: "-" },
    { id: "INV-105", title: "Lina & Arif Celebration", partner: "Harmoni Photo", template: "Elegant", date: "14 Feb 2027", status: "Draft", views: 0, rsvp: "-" },
  ];

  const filtered = invitations.filter((inv) =>
    inv.title.toLowerCase().includes(search.toLowerCase()) ||
    inv.partner.toLowerCase().includes(search.toLowerCase()) ||
    inv.template.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Invitation Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Monitoring status dan performa undangan dari seluruh mitra partner (Read-Only)
        </p>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <input
          type="text"
          placeholder="Cari undangan atau partner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#e5d8c8] text-xs px-4 py-2.5 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#f5a638] shadow-xs"
        />
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">ID Undangan</th>
                <th className="py-3 px-4 font-bold">Judul Undangan</th>
                <th className="py-3 px-4 font-bold">Mitra Partner</th>
                <th className="py-3 px-4 font-bold">Template</th>
                <th className="py-3 px-4 font-bold">Tanggal Acara</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">RSVP Hadir</th>
                <th className="py-3 px-4 font-bold text-center">Pengunjung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                    {inv.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-zinc-900">
                    {inv.title}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-700 font-medium">
                    {inv.partner}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-normal">
                    {inv.template}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-normal">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4">
                    {inv.status === "Published" ? (
                      <span className="inline-block bg-[#eaf7f0] text-emerald-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-emerald-200">
                        Published
                      </span>
                    ) : (
                      <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-900">
                    {inv.rsvp}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-zinc-700">
                    {inv.views} Views
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
