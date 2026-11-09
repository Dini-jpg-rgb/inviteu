"use client";

import React from "react";
import { BuilderSection } from "./model";
import { ElementRenderer } from "./ElementRenderer";
import { WidgetRenderer } from "./WidgetRenderer";
import { BuilderDevice, getResponsiveSize } from "./model";
import { ObjectManipulationFrame } from "./ObjectManipulationFrame";
import { getResponsiveProps } from "./model";
import { getBuilderObjectStyle } from "./styles";

interface SectionContainerProps {
  section: BuilderSection;
  selectedId: string | null;
  device: BuilderDevice;
  zoom: number;
  editable?: boolean;
  preview?: boolean;
  onSelect: (id: string) => void;
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

export function SectionContainer({
  section,
  selectedId,
  device,
  zoom,
  editable = true,
  preview = false,
  onSelect,
  onPositionChange,
  onSizeChange,
  onDirectTextChange,
}: SectionContainerProps) {
  if (!section.visible) return null;
  const size = getResponsiveSize(section, device);
  const props = getResponsiveProps(section, device);
  const objectStyle = getBuilderObjectStyle(props);

  return (
    <section
      onClick={(event) => {
        event.stopPropagation();
        onSelect(section.id);
      }}
      className={
        preview
          ? "relative mx-auto w-full max-w-none"
          : `relative mx-auto w-full max-w-none border border-dashed bg-white transition-[border-color,box-shadow] ${
              selectedId === section.id
                ? "z-[1] border-[#FCB040] shadow-[inset_0_0_0_1px_rgba(252,176,64,0.28)]"
                : "border-[#e8dfd3] hover:border-[#d7a148]"
            }`
      }
      style={{
        width: `${size.width}%`,
        minHeight: size.height || Number(props.minHeight) || 180,
        padding: Number(props.padding) || 0,
        margin: Number(props.margin) || 0,
        ...objectStyle,
        display: "block",
        backgroundSize: String(props.backgroundSize || "cover"),
        backgroundPosition: String(props.backgroundPosition || "center"),
        boxSizing: "border-box",
        overflow: preview ? "hidden" : undefined,
      }}
    >
      {!preview && (
        <span className="absolute left-2 top-2 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#9A5A00]">
          {section.name}
        </span>
      )}
      <div
        className="relative"
        style={{
          minHeight: size.height,
          display: String(props.display || "flex"),
          flexDirection: String(props.flexDirection || "column") as
            | "row"
            | "column",
          gap: Number(props.gap) || 0,
          alignItems: String(props.alignment || "stretch"),
          justifyContent: String(props.justify || "flex-start"),
        }}
      >
        {!preview &&
        section.children.filter((child) => child.visible).length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#9aa1ad]">
            Empty section
          </div>
        ) : (
          section.children.map(
            (child) =>
              child.visible && (
                <ObjectManipulationFrame
                  key={child.id}
                  node={child}
                  device={device}
                  zoom={zoom}
                  selected={selectedId === child.id}
                  editable={editable}
                  onSelect={() => onSelect(child.id)}
                  onPositionChange={onPositionChange}
                  onSizeChange={onSizeChange}
                >
                  {child.kind === "widget" ? (
                    <WidgetRenderer
                      widget={child}
                      device={device}
                      onSelect={() => onSelect(child.id)}
                      previewMode={preview}
                    />
                  ) : (
                    <ElementRenderer
                      element={child}
                      device={device}
                      previewMode={preview}
                      onSelect={() => onSelect(child.id)}
                      parentSectionProps={props}
                      onDirectTextChange={
                        onDirectTextChange
                          ? (text) => onDirectTextChange(child.id, text)
                          : undefined
                      }
                    />
                  )}
                </ObjectManipulationFrame>
              )
          )
        )}
      </div>
    </section>
  );
}
