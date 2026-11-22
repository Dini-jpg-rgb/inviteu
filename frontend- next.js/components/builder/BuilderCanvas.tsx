"use client";

import React, { useEffect, useRef, useState } from "react";
import { Empty, Typography } from "antd";
import {
  BuilderDevice,
  BuilderDocument,
  getResponsiveProps,
  getResponsiveSize,
} from "./model";
import { SectionContainer } from "./SectionContainer";

const { Text } = Typography;

export interface BuilderCanvasProps {
  document: BuilderDocument;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  device: BuilderDevice;
  zoom: number;
  title: string;
  interactive?: boolean;
  editable?: boolean;
  presentationOnly?: boolean;
  fitToViewport?: boolean;
  previewMode?: boolean;
  canvasBackground?: string;
  onPositionChange: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  onSizeChange: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  onDirectTextChange?: (id: string, text: string, fieldKey?: string) => void;
  onCopyStyle?: (id: string) => void;
  onPasteStyle?: (id: string) => void;
  hasCopiedStyle?: boolean;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onMoveLayer?: (id: string, direction: -1 | 1) => void;
  onDropFromPanel?: (sectionId: string, action: string, containerId?: string) => void;
  customWidth?: number;
  cssVariables?: Record<string, string>;
}

const deviceWidths: Record<BuilderDevice, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
};

const deviceLabels: Record<BuilderDevice, string> = {
  desktop: "Desktop · 1440 px (Baseline)",
  tablet: "Tablet · 768 px",
  mobile: "Mobile · 390 px",
};

const deviceHints: Record<BuilderDevice, string> = {
  desktop: "Base layout · Single source of design for all devices",
  tablet: "Tablet preview · Inherits base & applies automatic layout scaling",
  mobile: "Mobile preview · Inherits base & applies automatic stacking/scaling",
};

export function BuilderCanvas({
  document,
  selectedId,
  onSelect,
  device,
  zoom,
  interactive = true,
  editable = true,
  presentationOnly = false,
  fitToViewport = false,
  previewMode = false,
  canvasBackground,
  onPositionChange,
  onSizeChange,
  onDirectTextChange,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveLayer,
  onDropFromPanel,
  customWidth,
  cssVariables,
}: BuilderCanvasProps) {
  const width = customWidth || deviceWidths[device] || 390;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(width);
  const scale = fitToViewport
    ? Math.min(zoom / 100, availableWidth / width)
    : zoom / 100;
  const contentHeight = document.sections.reduce(
    (total, section) => {
      if (!section.visible) return total;
      const sectionProps = getResponsiveProps(section, device);
      const sectionHeight =
        getResponsiveSize(section, device).height ||
        Number(sectionProps.minHeight) ||
        180;
      const sectionMargin = Number(sectionProps.margin) || 0;
      return total + sectionHeight + sectionMargin * 2;
    },
    0
  );
  const canvasHeight =
    contentHeight || (presentationOnly ? 0 : 360);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !fitToViewport) return;
    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToViewport]);

  const activeLabel = customWidth
    ? `Viewport Kustom · ${customWidth} px (${device.toUpperCase()})`
    : deviceLabels[device];

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
        presentationOnly ? "bg-white" : "bg-[#F7F6F4]"
      }`}
      onClick={() => interactive && onSelect(null)}
    >
      <div
        ref={viewportRef}
        className={`min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain ${
          presentationOnly ? "p-0" : "px-[clamp(1rem,3vw,2.5rem)] py-8"
        }`}
      >
        <div
          className="relative mx-auto shrink-0"
          style={{
            width: `${width * scale}px`,
            height: `${canvasHeight * scale}px`,
          }}
        >
          <div
            className={`absolute left-0 top-0 origin-top-left overflow-x-hidden ${
              presentationOnly
                ? "bg-white"
                : device === "mobile"
                  ? "bg-white shadow-[0_4px_18px_rgba(61,37,22,0.08)] outline outline-2 outline-[#FFAD38]/40 rounded-sm"
                  : device === "tablet"
                    ? "bg-white shadow-[0_4px_18px_rgba(61,37,22,0.08)] outline outline-2 outline-[#FFAD38]/30 rounded-sm"
                    : "bg-white shadow-[0_4px_18px_rgba(61,37,22,0.08)] outline outline-2 outline-[#EAE5DF] rounded-sm"
            }`}
            style={{
              width,
              height: canvasHeight,
              transform: `scale(${scale})`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex h-full flex-col overflow-x-hidden"
              style={{
                backgroundColor: canvasBackground || "#ffffff",
                ...cssVariables,
              }}
              onClick={() => interactive && onSelect(null)}
            >
              {document.sections.length ? (
                document.sections.map((section) => (
                  <SectionContainer
                    key={section.id}
                    section={section}
                    selectedId={interactive ? selectedId : null}
                    device={device}
                    zoom={zoom}
                    editable={editable}
                    preview={previewMode}
                    onSelect={interactive ? (id) => onSelect(id) : () => {}}
                    onPositionChange={
                      interactive ? onPositionChange : () => {}
                    }
                    onSizeChange={interactive ? onSizeChange : () => {}}
                    onDirectTextChange={
                      interactive ? onDirectTextChange : undefined
                    }
                    onCopyStyle={interactive ? onCopyStyle : undefined}
                    onPasteStyle={interactive ? onPasteStyle : undefined}
                    hasCopiedStyle={hasCopiedStyle}
                    onDuplicate={interactive ? onDuplicate : undefined}
                    onDelete={interactive ? onDelete : undefined}
                    onToggleLock={interactive ? onToggleLock : undefined}
                    onMoveLayer={interactive ? onMoveLayer : undefined}
                    onDropFromPanel={interactive ? onDropFromPanel : undefined}
                  />
                ))
              ) : presentationOnly ? null : (
                <div className="flex min-h-[360px] flex-1 items-center justify-center p-6 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="space-y-1.5 max-w-xs">
                        <Text strong className="block text-sm text-[#422B1C]">
                          Canvas masih kosong
                        </Text>
                        <Text type="secondary" className="text-xs text-[#99918A] leading-relaxed">
                          Tambahkan section Cover wajib atau pilih template dari panel kiri (Elements / Widgets) untuk mulai menyusun undangan.
                        </Text>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
