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
  onPositionChange: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  onSizeChange: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  onDirectTextChange?: (id: string, text: string) => void;
}

const deviceWidths: Record<BuilderDevice, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1120,
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
  onPositionChange,
  onSizeChange,
  onDirectTextChange,
}: BuilderCanvasProps) {
  const width = deviceWidths[device];
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

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
        presentationOnly ? "bg-white" : "bg-[#f2f0ed]"
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
            className={`absolute left-0 top-0 origin-top-left ${
              presentationOnly
                ? "bg-white"
                : "bg-white shadow-[0_4px_18px_rgba(58,35,19,0.10)]"
            }`}
            style={{
              width,
              height: canvasHeight,
              transform: `scale(${scale})`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex h-full flex-col bg-white"
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
                  />
                ))
              ) : presentationOnly ? null : (
                <div className="flex min-h-[360px] flex-1 items-center justify-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="space-y-1">
                        <Text strong className="block">
                          Canvas is empty
                        </Text>
                        <Text type="secondary" className="text-xs">
                          Add a section or object from Assets to start designing.
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
