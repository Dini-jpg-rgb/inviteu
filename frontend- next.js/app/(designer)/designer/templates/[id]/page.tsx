"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PhoneMockup } from "../components/PhoneMockup";
import { MogranLauraInvitation } from "../components/MogranLauraInvitation";
import { getTemplateBySlug, TEMPLATES_REGISTRY } from "../themes/registry";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function TemplatePreviewPage() {
  const params = useParams();
  const slug = (params?.id as string) || "wedding";

  const template = getTemplateBySlug(slug) || TEMPLATES_REGISTRY[0];

  // Control states: Zoom level starts at 60% as requested by user
  const [zoomLevel, setZoomLevel] = useState<number>(60);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Fullscreen Preview states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenMode, setFullscreenMode] = useState<"phone" | "mobile">("phone");

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        if (showJsonInspector) setShowJsonInspector(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, showJsonInspector]);

  const handleCopyJson = () => {
    if (template.rawFigmaJson) {
      navigator.clipboard.writeText(JSON.stringify(template.rawFigmaJson, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const adjustZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(130, Math.max(40, prev + delta)));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================== */}
      {/* 1. TOP TOOLBAR & BREADCRUMB                                    */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500 mb-1">
            <Link
              href="/designer/templates"
              className="hover:text-indigo-600 transition-colors flex items-center space-x-1"
            >
              <span>←</span>
              <span>Daftar Template</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              Pratinjau ({template.name})
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {template.name}
            </h1>
            <Badge
              variant={
                template.status === "Published"
                  ? "success"
                  : template.status === "Pending Review"
                  ? "warning"
                  : "destructive"
              }
            >
              {template.status}
            </Badge>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-sm font-mono">
              v{template.version}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Kategori: <strong className="text-zinc-700 dark:text-zinc-300">{template.themeCategory}</strong> · Dibuat: {template.createdAt}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Controls: 60%, 75%, 90%, 100% + Stepper */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md text-xs space-x-1">
            <button
              onClick={() => adjustZoom(-10)}
              className="px-1.5 py-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xs transition-colors"
              title="Perkecil (-10%)"
            >
              −
            </button>
            <button
              onClick={() => setZoomLevel(60)}
              className={`px-2 py-1 rounded-xs transition-colors ${
                zoomLevel === 60
                  ? "bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
              title="Ukuran 60% (Pas di layar laptop)"
            >
              60%
            </button>
            <button
              onClick={() => setZoomLevel(75)}
              className={`px-2 py-1 rounded-xs transition-colors ${
                zoomLevel === 75
                  ? "bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              75%
            </button>
            <button
              onClick={() => setZoomLevel(90)}
              className={`px-2 py-1 rounded-xs transition-colors ${
                zoomLevel === 90
                  ? "bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              90%
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className={`px-2 py-1 rounded-xs transition-colors ${
                zoomLevel === 100
                  ? "bg-white dark:bg-zinc-700 shadow-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              100%
            </button>
            <button
              onClick={() => adjustZoom(10)}
              className="px-1.5 py-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xs transition-colors"
              title="Perbesar (+10%)"
            >
              +
            </button>
          </div>

          {/* Fullscreen Preview Toggle Button */}
          <Button
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs flex items-center space-x-1.5 shadow-xs"
            title="Tampilkan Pratinjau di Layar Penuh"
          >
            <span>⛶</span>
            <span>Layar Penuh (Fullscreen)</span>
          </Button>

          {/* JSON Inspector Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowJsonInspector(true)}
            className="text-xs flex items-center space-x-1.5"
          >
            <span>📄</span>
            <span>Skema JSON</span>
          </Button>

          {/* Submit for Review */}
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            onClick={() => alert("Template diajukan ke Admin untuk ditinjau (Approval Workflow PRD Bagian 19)!")}
          >
            Ajukan ke Admin
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN PREVIEW AREA (PHONE MOCKUP WORKBENCH)                  */}
      {/* ============================================================== */}
      <div className="relative min-h-[680px] bg-gradient-to-b from-zinc-100 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start border border-zinc-200 dark:border-zinc-800 shadow-inner overflow-hidden">
        
        {/* Subtle Canvas Grid Pattern */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Device Label Tag & Fullscreen Shortcut */}
        <div className="relative z-10 mb-4 inline-flex items-center space-x-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Pratinjau Mobile ({zoomLevel}%)</span>
          <span className="text-zinc-400">·</span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center space-x-1"
          >
            <span>⛶ Buka Layar Penuh</span>
          </button>
        </div>

        {/* The Phone Mockup Frame */}
        <div className="relative z-10 pb-6">
          <PhoneMockup
            urlDisplay={`inviteu.id/preview/${template.slug}`}
            zoomLevel={zoomLevel}
            templateTitle={template.name}
          >
            <MogranLauraInvitation themeData={template} />
          </PhoneMockup>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FULLSCREEN PREVIEW OVERLAY (FITUR HALAMAN PENUH)            */}
      {/* ============================================================== */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn select-none">
          {/* Top Fullscreen Control Bar */}
          <div className="h-14 px-6 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-white shrink-0 z-50">
            <div className="flex items-center space-x-3">
              <span className="text-lg">⛶</span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Pratinjau Layar Penuh — {template.name}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {fullscreenMode === "phone" ? "Mode Bingkai Smartphone" : "Mode Tampilan Web Mobile Asli"}
                </p>
              </div>
            </div>

            {/* Middle Mode Switcher */}
            <div className="flex items-center bg-zinc-800 p-1 rounded-lg text-xs space-x-1">
              <button
                onClick={() => setFullscreenMode("phone")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  fullscreenMode === "phone"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                📱 Bingkai HP
              </button>
              <button
                onClick={() => setFullscreenMode("mobile")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  fullscreenMode === "mobile"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                📲 Web Mobile Penuh
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {fullscreenMode === "phone" && (
                <div className="flex items-center bg-zinc-800 px-2 py-1 rounded-md text-xs space-x-2 text-zinc-300">
                  <span>Zoom:</span>
                  <button
                    onClick={() => adjustZoom(-10)}
                    className="hover:text-white px-1"
                  >
                    −
                  </button>
                  <span className="font-mono text-white font-medium">{zoomLevel}%</span>
                  <button
                    onClick={() => adjustZoom(10)}
                    className="hover:text-white px-1"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Close Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors border border-zinc-700"
                title="Tekan Escape untuk keluar"
              >
                <span>✕</span>
                <span>Tutup Layar Penuh (Esc)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Body Canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
            {/* Subtle Grid in Fullscreen */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {fullscreenMode === "phone" ? (
              <div className="my-auto transition-transform duration-200">
                <PhoneMockup
                  urlDisplay={`inviteu.id/preview/${template.slug}`}
                  zoomLevel={zoomLevel}
                  templateTitle={template.name}
                >
                  <MogranLauraInvitation themeData={template} />
                </PhoneMockup>
              </div>
            ) : (
              /* Edge-to-Edge Standalone Mobile View */
              <div className="w-full max-w-[420px] h-[92vh] max-h-[860px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-zinc-800">
                <div className="bg-zinc-900 text-white text-[11px] px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono">inviteu.id/preview/{template.slug}</span>
                  </div>
                  <span className="text-zinc-400">Mobile Safari Web</span>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-zinc-300">
                  <MogranLauraInvitation themeData={template} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. JSON SCHEMA INSPECTOR (MODAL / SLIDE-OVER)                  */}
      {/* ============================================================== */}
      {showJsonInspector && (
        <div
          onClick={() => setShowJsonInspector(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                  <span>📄</span>
                  <span>Skema Desain JSON (Data-Driven Template Architecture)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tersimpan di tabel database <code className="text-indigo-600 dark:text-indigo-400 font-mono">template_versions.konten_layout_widget_styling</code>.
                </p>
              </div>
              <button
                onClick={() => setShowJsonInspector(false)}
                className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Explanation Note for User */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
              <span className="text-base">💡</span>
              <div>
                <strong>Mengapa Template Didesain Menggunakan JSON?</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  Format JSON memisahkan <em>tata letak data (data schema)</em> dari <em>tampilan visual (React renderer)</em>. Saat Partner mengedit nama mempelai, tanggal, atau foto, sistem tidak perlu merombak kode program Next.js—cukup mengubah data JSON ini di database!
                </p>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 text-zinc-100 font-mono text-xs">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(template.rawFigmaJson || template.content, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <span className="text-xs text-zinc-500">
                Total 64 Node Figma Elemen Terdaftar
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyJson}
                  className="text-xs"
                >
                  {copiedJson ? "✓ Tersalin ke Clipboard!" : "Salin JSON"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowJsonInspector(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

