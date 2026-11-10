"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PARTNER_TEMPLATES, PartnerTemplateItem } from "./data";
import { usePartner } from "@/context/PartnerContext";

const TIER_LEVELS: Record<string, number> = {
  basic: 1,
  medium: 2,
  pro: 3,
  premium: 4,
};

export default function PartnerTemplatesPage() {
  const { activePackage, setActivePackage } = usePartner();
  const userTier = (activePackage || "basic").toLowerCase();

  const [searchQuery, setSearchQuery] = useState("");
  // Default selected tier matches user's active subscribed tier
  const [selectedTier, setSelectedTier] = useState<"semua" | "basic" | "medium" | "pro">(() => {
    if (userTier === "medium") return "medium";
    if (userTier === "pro") return "pro";
    return "basic";
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>("Semua");
  const [selectedColor, setSelectedColor] = useState<string>("Semua");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTemplates = useMemo(() => {
    return PARTNER_TEMPLATES.filter((tpl) => {
      // Tier / Version filter (replaces old category filter)
      if (selectedTier !== "semua" && tpl.tier !== selectedTier) {
        return false;
      }

      // Style filter
      if (selectedStyle !== "Semua" && !tpl.style.toLowerCase().includes(selectedStyle.toLowerCase())) {
        return false;
      }

      // Color filter
      if (selectedColor !== "Semua" && !tpl.color.toLowerCase().includes(selectedColor.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = tpl.name.toLowerCase().includes(query) || tpl.fullName.toLowerCase().includes(query);
        const matchesStyle = tpl.style.toLowerCase().includes(query);
        const matchesColor = tpl.color.toLowerCase().includes(query);
        if (!matchesName && !matchesStyle && !matchesColor) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedTier, selectedStyle, selectedColor]);

  // Check if template can be edited by current user subscription
  const canEditTemplate = (tpl: PartnerTemplateItem) => {
    const tplLevel = TIER_LEVELS[tpl.tier || "basic"] || 1;
    const userLevel = TIER_LEVELS[userTier] || 1;
    return userLevel >= tplLevel;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================== */}
      {/* 1. HEADER                                                      */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a170e] tracking-tight">
            Pilih Template
          </h1>
          <p className="text-xs sm:text-sm text-[#5d4037] font-medium mt-1">
            Hanya template yang Published/Active, Bisa diakses dari menu ini atau dari Create Invitation.
          </p>
        </div>

        {/* User Current Subscription Indicator & Demo Switcher */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs border border-[#ecdcc8] px-3.5 py-2 rounded-2xl shadow-2xs">
          <span className="text-xs text-zinc-600 font-medium">Akun Anda:</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wide">
            {userTier}
          </span>
          <div className="h-4 w-[1px] bg-zinc-200 mx-1" />
          <span className="text-[11px] text-zinc-400">Simulasi:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100">
            {(["basic", "medium", "pro"] as const).map((tierKey) => (
              <button
                key={tierKey}
                type="button"
                onClick={() => {
                  setActivePackage(tierKey);
                  setSelectedTier(tierKey);
                }}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md capitalize transition-all cursor-pointer ${
                  userTier === tierKey
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tierKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH & FILTER TOOLBAR                                     */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari template"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/90 bg-white px-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons: [Semua] & [Version Dropdown] */}
        <div className="flex items-center gap-2">
          {/* Semua Button */}
          <button
            type="button"
            onClick={() => setSelectedTier("semua")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
              selectedTier === "semua"
                ? "bg-white text-zinc-900 border border-zinc-200/90"
                : "bg-white/70 text-zinc-600 border border-zinc-200/50 hover:bg-white"
            }`}
          >
            Semua
          </button>

          {/* Version Dropdown (Replaces the "Wedding" button) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center space-x-2 ${
                selectedTier !== "semua"
                  ? "bg-white text-zinc-900 border border-zinc-200/90 ring-1 ring-amber-500/40"
                  : "bg-white/70 text-zinc-600 border border-zinc-200/50 hover:bg-white"
              }`}
            >
              <span className="capitalize">
                {selectedTier === "basic"
                  ? "Basic"
                  : selectedTier === "medium"
                  ? "Medium"
                  : selectedTier === "pro"
                  ? "Pro"
                  : "Versi"}
              </span>
              <span className="text-[9px] text-zinc-500 transition-transform duration-200" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "none" }}>
                ▼
              </span>
            </button>

            {/* Floating Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 rounded-2xl bg-white border border-zinc-200 shadow-xl py-1.5 z-40 animate-fadeIn">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                  Pilih Versi Paket
                </div>

                {/* Option Basic */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier("basic");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors cursor-pointer ${
                    selectedTier === "basic" ? "bg-amber-50/60 font-bold text-amber-900" : "text-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Basic</span>
                      {userTier === "basic" && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Paket Anda
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Emerald Gold, Elegant, Minimalist
                    </div>
                  </div>
                  {selectedTier === "basic" && <span className="text-amber-700 text-xs font-bold">✓</span>}
                </button>

                {/* Option Medium */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier("medium");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors cursor-pointer ${
                    selectedTier === "medium" ? "bg-amber-50/60 font-bold text-amber-900" : "text-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Medium</span>
                      {userTier === "medium" ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Paket Anda
                        </span>
                      ) : userTier === "basic" ? (
                        <span className="text-[9px] bg-zinc-100 text-zinc-600 font-medium px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <span>🔒</span>
                          <span>Hanya Preview</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Javanese Elegant, Traditional, Romantic
                    </div>
                  </div>
                  {selectedTier === "medium" && <span className="text-amber-700 text-xs font-bold">✓</span>}
                </button>

                {/* Option Pro */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTier("pro");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors cursor-pointer ${
                    selectedTier === "pro" ? "bg-amber-50/60 font-bold text-amber-900" : "text-zinc-700"
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Pro</span>
                      {userTier === "pro" ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Paket Anda
                        </span>
                      ) : (
                        <span className="text-[9px] bg-zinc-100 text-zinc-600 font-medium px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <span>🔒</span>
                          <span>Hanya Preview</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Rustic, Classic, Floral, Modern
                    </div>
                  </div>
                  {selectedTier === "pro" && <span className="text-amber-700 text-xs font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropdowns: Style & Warna */}
        <div className="flex items-center gap-2">
          {/* Style Dropdown */}
          <div className="relative min-w-[120px]">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full appearance-none rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2 pr-8 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="Semua">Style</option>
              <option value="Art Deco">Art Deco</option>
              <option value="Traditional Javanese">Traditional Javanese</option>
              <option value="Traditional Bali">Traditional Bali</option>
              <option value="Elegant">Elegant</option>
              <option value="Minimalist">Minimalist</option>
              <option value="Floral">Floral</option>
              <option value="Modern">Modern</option>
              <option value="Romantic">Romantic</option>
              <option value="Rustic">Rustic</option>
              <option value="Classic">Classic</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
              ▼
            </span>
          </div>

          {/* Warna Dropdown */}
          <div className="relative min-w-[120px]">
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full appearance-none rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2 pr-8 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              <option value="Semua">Warna</option>
              <option value="Emas">Emas</option>
              <option value="Emerald">Emerald</option>
              <option value="Navy">Navy Blue</option>
              <option value="Terracotta">Terracotta</option>
              <option value="Hijau">Hijau</option>
              <option value="Pink">Pink</option>
              <option value="Cokelat">Cokelat</option>
              <option value="Putih">Putih</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Notice Banner when viewing templates outside user's subscribed plan */}
      {selectedTier !== "semua" && !canEditTemplate({ tier: selectedTier } as PartnerTemplateItem) && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🔒</span>
            <span>
              Anda sedang melihat template <strong>Akun {selectedTier.toUpperCase()}</strong>. Karena Anda saat ini berlangganan <strong>Akun {userTier.toUpperCase()}</strong>, Anda dapat melihat pratinjau template ini namun akses edit terkunci.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActivePackage(selectedTier as any)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer ml-3"
          >
            Upgrade ke {selectedTier.toUpperCase()}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. 4-COLUMN TEMPLATES GRID                                     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredTemplates.map((tpl) => {
          const canEdit = canEditTemplate(tpl);

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-[22px] p-3 border border-[#ecdcc8]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail Container with Rounded Corners */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 mb-3 border border-zinc-100">
                  <Image
                    src={tpl.thumbnail}
                    alt={tpl.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-white text-[10px] font-semibold tracking-wider uppercase">
                      {tpl.style}
                    </span>
                  </div>

                  {!canEdit && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                      <span>🔒</span>
                      <span>Hanya Preview</span>
                    </div>
                  )}
                </div>

                {/* Template Name & Category */}
                <div className="px-1 pb-3">
                  <h3 className="font-bold text-sm text-zinc-900 group-hover:text-amber-800 transition-colors">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: tpl.dotColor }}
                      />
                      <span>{tpl.category}</span>
                    </div>

                    {/* Tier Badge */}
                    {tpl.tierBadge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          tpl.tier === "basic"
                            ? "text-emerald-800 bg-emerald-50 border-emerald-200/80"
                            : tpl.tier === "medium"
                            ? "text-amber-800 bg-amber-50 border-amber-200/80"
                            : "text-purple-800 bg-purple-50 border-purple-200/80"
                        }`}
                      >
                        {tpl.tierBadge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!canEdit ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/templates/${tpl.slug}`}
                    className="py-2.5 px-2 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 text-center transition-colors shadow-2xs block"
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/templates/builder?theme=${tpl.themeSlug}`}
                    className="py-2.5 px-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 text-center transition-colors shadow-2xs flex items-center justify-center space-x-1"
                    title="Buka langsung di Page Builder (Mode Pengembang)"
                  >
                    <span>🛠️</span>
                    <span>Edit (Dev)</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/templates/${tpl.slug}`}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 text-center transition-colors shadow-2xs block"
                >
                  Lihat preview
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-dashed border-zinc-300">
          <p className="text-sm font-semibold text-zinc-700">Tidak ada template yang cocok</p>
          <p className="text-xs text-zinc-500 mt-1">
            Coba ubah kata kunci pencarian atau reset filter di atas.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedTier("semua");
              setSelectedStyle("Semua");
              setSelectedColor("Semua");
            }}
            className="mt-3 text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
}
