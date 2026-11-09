"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePartner } from "@/context/PartnerContext";

export default function InvitationsPage() {
  const { invitations, activePackage } = usePartner();
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "expired">("all");

  const filtered = invitations.filter((inv) => {
    if (filter === "published") return inv.status === "Published";
    if (filter === "draft") return inv.status === "Draft";
    if (filter === "expired") return inv.status === "Expired";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            My Invitations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Kelola seluruh tautan dan status undangan digital klien Anda
          </p>
        </div>

        <Link href="/invitations/create">
          <button className="bg-[#331c11] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <span>+</span>
            <span>Create Invitation</span>
          </button>
        </Link>
      </div>

      {/* Package Warning if none */}
      {!activePackage && (
        <div className="bg-[#ebdecb] rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6e4d2a] border border-[#dfceba]">
          <span className="font-medium">
            Anda belum memiliki package aktif. Silakan beli paket untuk dapat mempublish undangan klien.
          </span>
          <Link href="/packages" className="shrink-0">
            <button className="bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-xs px-4 py-1.5 rounded-lg border border-[#d8c3ad] shadow-2xs transition-colors cursor-pointer">
              Lihat Package
            </button>
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-[#331c11] text-white"
              : "text-zinc-600 hover:bg-white"
          }`}
        >
          Semua ({invitations.length})
        </button>
        <button
          onClick={() => setFilter("published")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filter === "published"
              ? "bg-[#331c11] text-white"
              : "text-zinc-600 hover:bg-white"
          }`}
        >
          Published ({invitations.filter((i) => i.status === "Published").length})
        </button>
        <button
          onClick={() => setFilter("draft")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filter === "draft"
              ? "bg-[#331c11] text-white"
              : "text-zinc-600 hover:bg-white"
          }`}
        >
          Draft ({invitations.filter((i) => i.status === "Draft").length})
        </button>
      </div>

      {/* Invitations Table */}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <p className="font-medium text-xs">Tidak ada data undangan</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Klik tombol &quot;+ Create Invitation&quot; di atas untuk membuat undangan baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-900">
                      {inv.title}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
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
  );
}
