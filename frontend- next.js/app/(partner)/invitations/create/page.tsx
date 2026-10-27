"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";

export default function CreateInvitationPage() {
  const router = useRouter();
  const { addInvitation, activePackage } = usePartner();

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Published");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addInvitation({
        title: title.trim(),
        eventDate: eventDate.trim(),
        status,
        rsvpCount: status === "Published" ? 12 : 0,
        rsvpSummary: {
          hadir: status === "Published" ? 12 : 0,
          tidakHadir: 0,
          belumMerespons: 0,
        },
      });

      setIsSubmitting(false);
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Buat Undangan Baru
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Isi informasi acara pernikahan untuk membuat tautan undangan digital
        </p>
      </div>

      {!activePackage && (
        <div className="bg-[#ebdecb] rounded-xl p-3 px-4 text-xs text-[#6e4d2a] border border-[#dfceba]">
          ⚠️ Anda belum memiliki package aktif. Undangan yang dibuat dalam status Published memerlukan kuota package aktif.
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#e5d8c8] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Nama Pasangan / Judul Undangan *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rian & Maya Wedding"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Tanggal Acara *
            </label>
            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="Contoh: 15 Des 2026"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Status Publikasi Awal
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Draft" | "Published")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="Published">Published (Langsung Aktif)</option>
              <option value="Draft">Draft (Simpan Sementara)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Link href="/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#331c11] hover:bg-black text-white font-semibold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan & Buat Undangan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
