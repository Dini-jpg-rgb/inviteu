"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPartnerTemplateBySlug, PARTNER_TEMPLATES } from "../data";
import { MogranLauraInvitation } from "@/app/(designer)/designer/templates/components/MogranLauraInvitation";
import { BaliTropicalInvitation } from "@/app/(designer)/designer/templates/components/BaliTropicalInvitation";
import { EmeraldGoldBasicInvitation } from "@/app/(designer)/designer/templates/components/EmeraldGoldBasicInvitation";
import { JavaneseElegantInvitation } from "../components/JavaneseElegantInvitation";
import { usePartner } from "@/context/PartnerContext";

const TIER_LEVELS: Record<string, number> = {
  basic: 1,
  medium: 2,
  pro: 3,
  premium: 4,
};

export default function PartnerTemplateDetailPage() {
  const params = useParams();
  const slug = (params?.id as string) || "wedding";

  const template = getPartnerTemplateBySlug(slug) || PARTNER_TEMPLATES[0];

  const { activePackage, setActivePackage } = usePartner();
  const userTier = (activePackage || "basic").toLowerCase();
  const tplTier = (template.tier || "basic").toLowerCase();

  const canEdit = (TIER_LEVELS[userTier] || 1) >= (TIER_LEVELS[tplTier] || 1);

  // Device preview toggle: "mobile" | "desktop" (matches User Image 2)
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");

  // Determine which invitation component to render
  const isEmerald = template.themeSlug === "emerald-gold-basic";
  const isBali = template.themeSlug === "bali-tropical";
  const isJavanese = template.themeSlug === "javanesse-elegant" || template.themeSlug === "javanese-elegant";

  return (
    <div className="space-y-5 pb-12">
      {/* ============================================================== */}
      {/* 1. HEADER (Matches User Image 2)                               */}
      {/* ============================================================== */}
      <div className="pt-1 pb-1">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a170e] tracking-tight">
            {template.fullName}
          </h1>
          {template.tierBadge && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs flex items-center space-x-1 ${
                template.tier === "basic"
                  ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                  : template.tier === "medium"
                  ? "text-amber-800 bg-amber-100 border-amber-300"
                  : "text-purple-800 bg-purple-100 border-purple-300"
              }`}
            >
              <span>{template.tierBadge}</span>
              {!canEdit && <span>🔒</span>}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#5d4037] font-medium mt-0.5">
          Preview template {!canEdit && "(Hanya Baca - Perlu Upgrade untuk Mengedit)"}
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. TWO-COLUMN PREVIEW & INFO WORKSPACE                         */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* ============================================================= */}
        {/* 2.A LEFT / CENTER CANVAS (Taupe / Gray Rounded Area)          */}
        {/* ============================================================= */}
        <div className="relative w-full flex-1 bg-[#8d7c71] rounded-[28px] p-6 sm:p-8 flex flex-col items-center min-h-[780px] overflow-hidden shadow-sm">
          {/* Top-Left Device Mode Toggle (Mobile / Desktop) */}
          <div className="self-start mb-6 z-20 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-[#2D1C15] text-white shadow-md"
                  : "bg-white/90 text-zinc-700 hover:bg-white shadow-xs"
              }`}
            >
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-[#2D1C15] text-white shadow-md"
                  : "bg-white/90 text-zinc-700 hover:bg-white shadow-xs"
              }`}
            >
              Desktop
            </button>
          </div>

          {/* Smartphone Mockup (Mobile View - Matches User Image 2) */}
          {deviceMode === "mobile" ? (
            <div className="relative w-[390px] sm:w-[414px] h-[844px] max-h-[92vh] bg-black rounded-[52px] p-3 shadow-2xl flex flex-col border-[2px] border-zinc-800">
              {/* Inner Smartphone Screen */}
              <div
                className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col ${
                  isEmerald
                    ? "bg-[#0f4a38]"
                    : isBali
                    ? "bg-[#102218]"
                    : isJavanese
                    ? "bg-[#243320]"
                    : "bg-[#fcfaf7]"
                }`}
              >
                {/* Top iOS Status Bar & Dynamic Island */}
                <div
                  className={`h-9 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold select-none shrink-0 z-30 ${
                    isEmerald
                      ? "bg-[#0f4a38]/90 text-[#c59b4e]"
                      : isBali
                      ? "bg-[#102218]/90 text-[#e8c97e]"
                      : isJavanese
                      ? "bg-[#243320]/90 text-[#c5a059]"
                      : "bg-white/80 text-zinc-700"
                  }`}
                >
                  <span>9:41</span>
                  <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-1.5 space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>5G</span>
                    <div
                      className={`w-4 h-2 border rounded-2xs p-[1px] flex ${
                        isEmerald
                          ? "border-[#c59b4e]"
                          : isBali
                          ? "border-[#e8c97e]"
                          : isJavanese
                          ? "border-[#c5a059]"
                          : "border-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-full h-full ${
                          isEmerald
                            ? "bg-[#c59b4e]"
                            : isBali
                            ? "bg-[#e8c97e]"
                            : isJavanese
                            ? "bg-[#c5a059]"
                            : "bg-zinc-700"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollable Invitation Content inside Phone Screen */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">
                  {isJavanese ? (
                    <JavaneseElegantInvitation />
                  ) : isEmerald ? (
                    <EmeraldGoldBasicInvitation />
                  ) : isBali ? (
                    <BaliTropicalInvitation />
                  ) : (
                    <MogranLauraInvitation />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Mockup View */
            <div className="w-full max-w-3xl h-[730px] max-h-[82vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-zinc-300 overflow-hidden">
              {/* Browser Window Header */}
              <div className="h-10 bg-zinc-100 border-b border-zinc-200 px-4 flex items-center space-x-3 shrink-0">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-white border border-zinc-200 rounded-md py-1 px-3 text-[11px] text-zinc-500 font-mono text-center">
                  inviteu.id/preview/{template.slug}
                </div>
              </div>

              {/* Scrollable Desktop Content */}
              <div className="flex-1 overflow-y-auto bg-zinc-50 flex justify-center p-4">
                <div className="w-full max-w-md shadow-md rounded-2xl overflow-hidden">
                  {isJavanese ? (
                    <JavaneseElegantInvitation />
                  ) : isEmerald ? (
                    <EmeraldGoldBasicInvitation />
                  ) : isBali ? (
                    <BaliTropicalInvitation />
                  ) : (
                    <MogranLauraInvitation />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* 2.B RIGHT SIDEBAR: INFO TEMPLATE (Matches User Image 2)        */}
        {/* ============================================================= */}
        <aside className="w-full lg:w-80 xl:w-96 bg-white rounded-[24px] p-6 sm:p-7 border border-[#ecdcc8]/70 shadow-xs flex flex-col justify-between shrink-0 h-fit">
          <div>
            <h2 className="text-base font-bold text-zinc-900 mb-4">
              Info template
            </h2>

            {/* Key-Value Specification Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Kategori</span>
                <span className="text-zinc-900 font-semibold">{template.category}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Style</span>
                <span className="text-zinc-900 font-semibold">{template.style}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Warna</span>
                <span className="text-zinc-900 font-semibold">{template.color}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-500 font-medium">Paket Akun</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                    template.tier === "basic"
                      ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                      : template.tier === "medium"
                      ? "text-amber-800 bg-amber-50 border-amber-200"
                      : "text-purple-800 bg-purple-50 border-purple-200"
                  }`}
                >
                  <span>{template.tierBadge || "Semua Akun"}</span>
                  {!canEdit && <span>🔒</span>}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-zinc-100" />

            {/* Section di template ini */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-zinc-900">
                Section di template ini
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {template.sections}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-2.5">
            {canEdit ? (
              <Link
                href={`/templates/builder?theme=${template.themeSlug}`}
                className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-3 rounded-xl text-center shadow-xs transition-colors block cursor-pointer"
              >
                Edit this template
              </Link>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <span>🔒</span>
                      <span>Akses Pelanggan Terkunci</span>
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                      Mode Dev
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Template ini khusus untuk <strong>{template.tierBadge}</strong> (akun Anda saat ini <strong>Akun {userTier.toUpperCase()}</strong>). Untuk masa pengembangan & pengujian, Anda tetap dapat masuk dan mengedit template ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePackage(template.tier as any)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-amber-100/90 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold border border-amber-300 transition-colors cursor-pointer text-center"
                  >
                    ⚡ Set Akun Menjadi {template.tierBadge} (1-Klik)
                  </button>
                </div>

                {/* Dev Mode Button to enter Editor */}
                <Link
                  href={`/templates/builder?theme=${template.themeSlug}`}
                  className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-3 rounded-xl text-center shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>🛠️</span>
                  <span>Buka di Page Builder (Mode Pengembang)</span>
                </Link>
              </div>
            )}
            <Link
              href="/templates"
              className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold py-2.5 rounded-xl text-center transition-colors block cursor-pointer"
            >
              Kembali ke Template
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
