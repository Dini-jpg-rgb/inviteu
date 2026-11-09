"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SectionConfig } from "@/components/builder/registry";
import { InvitationRenderer } from "./InvitationRenderer";
import {
  bindInvitationContentToSections,
  getDummyInvitationContent,
} from "@/lib/template-schema";

interface InvitationPreviewOverlayProps {
  sections: SectionConfig[];
  title: string;
  slug: string;
  primaryColor: string;
  onClose: () => void;
}

type PreviewViewport = "mobile" | "desktop";

export function InvitationPreviewOverlay({
  sections,
  title,
  slug,
  primaryColor,
  onClose,
}: InvitationPreviewOverlayProps) {
  const [viewport, setViewport] = useState<PreviewViewport>("mobile");
  const [zoom, setZoom] = useState(100);

  const previewSections = useMemo(
    () => bindInvitationContentToSections(sections, getDummyInvitationContent()),
    [sections]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const scale = zoom / 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${title}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          <p className="truncate text-xs text-zinc-400">
            inviteu.id/preview/{slug} · Data contoh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-zinc-800 p-1 text-xs">
            {(["mobile", "desktop"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewport(value)}
                aria-pressed={viewport === value}
                className={`rounded-md px-3 py-1.5 ${
                  viewport === value ? "bg-white text-zinc-900" : "text-zinc-300"
                }`}
              >
                {value === "mobile" ? "Mobile" : "Desktop"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-2 py-1 text-xs">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(50, value - 10))}
              aria-label="Perkecil preview"
            >
              −
            </button>
            <span className="min-w-10 text-center tabular-nums">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(120, value + 10))}
              aria-label="Perbesar preview"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium hover:bg-zinc-600"
          >
            Tutup
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 justify-center overflow-auto bg-zinc-800 p-3 sm:p-6">
        <div
          className={`h-full min-h-[480px] overflow-hidden bg-[#fcfbfa] text-zinc-900 shadow-2xl ${
            viewport === "mobile"
              ? "w-full max-w-[390px] rounded-2xl"
              : "w-full max-w-[1440px] rounded-lg"
          }`}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 text-[10px] text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="truncate">inviteu.id/{slug}</span>
              <span className="ml-auto" style={{ color: primaryColor }}>
                {viewport === "mobile" ? "Mobile" : "Desktop"}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <InvitationRenderer
                sections={previewSections}
                className="min-h-full space-y-4 bg-[#fcfbfa] p-4"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
