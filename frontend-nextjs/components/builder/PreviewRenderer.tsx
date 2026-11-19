/**
 * InviteU Page Builder - Preview Renderer (MVP 1)
 *
 * Menampilkan hasil akhir undangan secara interaktif dan bersih tanpa kontrol editor.
 * Mendukung simulasi responsif Desktop, Tablet, dan Mobile.
 */

"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
} from "@ant-design/icons";
import { Button, Select, Space, Tag } from "antd";
import { BuilderDevice, BuilderDocument } from "./model";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderMetadata } from "./BuilderProperties";
import { resolveTheme } from "@/lib/theme-resolver";
import { OpeningEnvelopeModal } from "./animation/OpeningEnvelopeModal";
import { DecorativeAnimationOverlay } from "./animation/DecorativeAnimationOverlay";
import {
  OpeningAnimationType,
  DecorativeAnimationType,
} from "./animation/animationTypes";

export interface PreviewRendererProps {
  document: BuilderDocument;
  metadata: BuilderMetadata;
  initialDevice?: BuilderDevice;
  onClose: () => void;
  fontFaceCss?: string;
  hasUnsavedChanges?: boolean;
}

type PreviewViewportPreset =
  | "mobile_320"
  | "mobile_390"
  | "tablet_768"
  | "desktop_1120"
  | "desktop_1440";

interface ViewportConfig {
  device: BuilderDevice;
  width: number;
  label: string;
}

const PREVIEW_VIEWPORTS: Record<PreviewViewportPreset, ViewportConfig> = {
  mobile_320: {
    device: "mobile",
    width: 320,
    label: "Mobile Small (320 px)",
  },
  mobile_390: {
    device: "mobile",
    width: 390,
    label: "Mobile Standard (390 px)",
  },
  tablet_768: {
    device: "tablet",
    width: 768,
    label: "Tablet (768 px)",
  },
  desktop_1120: {
    device: "desktop",
    width: 1120,
    label: "Desktop Compact (1120 px)",
  },
  desktop_1440: {
    device: "desktop",
    width: 1440,
    label: "Desktop Large (1440 px)",
  },
};

export function PreviewRenderer({
  document,
  metadata,
  initialDevice = "mobile",
  onClose,
  fontFaceCss,
  hasUnsavedChanges = false,
}: PreviewRendererProps) {
  const initialPreset: PreviewViewportPreset =
    initialDevice === "desktop"
      ? "desktop_1440"
      : initialDevice === "tablet"
      ? "tablet_768"
      : "mobile_390";

  const [viewportPreset, setViewportPreset] =
    useState<PreviewViewportPreset>(initialPreset);
  const [viewMode, setViewMode] = useState<"standard" | "full_guest">("full_guest");

  const currentViewport = PREVIEW_VIEWPORTS[viewportPreset] || PREVIEW_VIEWPORTS.mobile_390;

  // Resolve opening and decorative animations from document / metadata
  const openingAnimType = (
    (document.pageAnimation?.opening?.type as OpeningAnimationType) ||
    ((document.sections[0]?.props?.openingAnimation as OpeningAnimationType) || "none")
  );

  const decorativeAnimType = (
    (document.pageAnimation?.decorative?.type as DecorativeAnimationType) ||
    ((document.sections[0]?.props?.decorativeAnimation as DecorativeAnimationType) || "none")
  );

  const [isOpeningOpen, setIsOpeningOpen] = useState(
    openingAnimType !== "none"
  );

  // Resolve active theme & local overrides into CSS variables
  const resolvedTheme = useMemo(() => {
    return resolveTheme(
      metadata.themeId || metadata.themeCategory,
      metadata.themeConfig
    );
  }, [metadata.themeId, metadata.themeCategory, metadata.themeConfig]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#faf8f5]">
      {fontFaceCss && <style>{fontFaceCss}</style>}
      {resolvedTheme?.cssVariablesString && (
        <style>{`:root { ${resolvedTheme.cssVariablesString} }`}</style>
      )}

      {/* Top Preview Bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EBD9BE] bg-white px-4 py-2.5 shadow-xs">
        <Space size={10}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onClose}
            className="!border-[#EBD9BE] !text-[#3A2313] hover:!border-[#9A5A00]"
          >
            Kembali ke Editor
          </Button>
          <div className="hidden sm:block text-xs font-semibold text-[#3A2313]">
            {metadata.name || "Preview Undangan"}
          </div>
          <Tag color={hasUnsavedChanges ? "gold" : "green"} className="!text-[11px] !mr-0">
            {hasUnsavedChanges ? "Draft lokal (belum tersimpan)" : "Tersimpan"}
          </Tag>
          <Tag color="purple" className="!text-[11px] !mr-0 hidden md:inline-flex">
            Tema: {resolvedTheme.presetName || "Default"}
          </Tag>
        </Space>

        <Space size={8}>
          <Select
            value={viewMode}
            onChange={setViewMode}
            className="!w-[155px]"
            options={[
              { value: "full_guest", label: "Full Guest View" },
              { value: "standard", label: "Canvas View" },
            ]}
          />
          <Select
            aria-label="Preview viewport"
            value={viewportPreset}
            onChange={(val) => setViewportPreset(val as PreviewViewportPreset)}
            className="!w-[210px]"
            options={Object.entries(PREVIEW_VIEWPORTS).map(([key, config]) => ({
              value: key,
              label: (
                <Space size={6}>
                  {config.device === "mobile" ? (
                    <MobileOutlined />
                  ) : config.device === "tablet" ? (
                    <TabletOutlined />
                  ) : (
                    <DesktopOutlined />
                  )}
                  {config.label}
                </Space>
              ),
            }))}
          />
        </Space>
      </header>

      {/* Interactive Opening Envelope / Animation Overlay */}
      {viewMode === "full_guest" && openingAnimType !== "none" && (
        <OpeningEnvelopeModal
          type={openingAnimType}
          title={metadata.name || "The Wedding Celebration"}
          guestName="Bapak / Ibu / Rekan Terhormat"
          isOpen={isOpeningOpen}
          onOpenComplete={() => setIsOpeningOpen(false)}
        />
      )}

      {/* Decorative Falling Elements Overlay */}
      {decorativeAnimType !== "none" && (
        <DecorativeAnimationOverlay type={decorativeAnimType} />
      )}

      {/* Invitation Viewport */}
      {viewMode === "full_guest" ? (
        <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 flex justify-center">
          <div
            className="w-full overflow-hidden bg-white shadow-2xl transition-all duration-300 rounded-2xl flex flex-col my-auto"
            style={{
              maxWidth: currentViewport.width,
              minHeight: "85vh",
            }}
          >
            <div className="p-2 border-b border-stone-200 bg-[#FFF8EE] text-center text-xs text-[#9A5A00] font-medium">
              Simulasi Undangan Tamu · {currentViewport.device.toUpperCase()} ({currentViewport.width}px)
            </div>
            <div className="flex-1">
              <BuilderCanvas
                document={document}
                selectedId={null}
                onSelect={() => {}}
                device={currentViewport.device}
                customWidth={currentViewport.width}
                zoom={100}
                title={metadata.name}
                canvasBackground={metadata.canvasBackground}
                interactive={true}
                editable={false}
                presentationOnly
                fitToViewport={false}
                previewMode
                cssVariables={resolvedTheme.cssVariables}
                onPositionChange={() => {}}
                onSizeChange={() => {}}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <BuilderCanvas
            document={document}
            selectedId={null}
            onSelect={() => {}}
            device={currentViewport.device}
            customWidth={currentViewport.width}
            zoom={100}
            title={metadata.name}
            canvasBackground={metadata.canvasBackground}
            interactive={false}
            editable={false}
            presentationOnly
            fitToViewport
            previewMode
            cssVariables={resolvedTheme.cssVariables}
            onPositionChange={() => {}}
            onSizeChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
