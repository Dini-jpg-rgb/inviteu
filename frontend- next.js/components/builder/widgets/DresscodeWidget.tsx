import React from "react";
import { WidgetRendererProps } from "../registry/types";
import { BUILDER_COLOR_PALETTE } from "../colorPalette";

export interface DresscodeItem {
  name: string;
  hex: string;
}

export interface DresscodeContent {
  title?: string;
  subtitle?: string;
  palettes?: DresscodeItem[];
}

export function DresscodeWidget({
  settings,
  content,
}: WidgetRendererProps<DresscodeContent>) {
  const {
    title = "Dresscode",
    subtitle = "InviteU Color Palette",
    palettes = [...BUILDER_COLOR_PALETTE],
  } = content || {};

  const {
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "#f9f8f3",
    paddingY = "md",
  } = settings || {};

  const paddingClass = ({
    none: "py-0",
    sm: "py-4",
    md: "py-7",
    lg: "py-10",
    xl: "py-14",
  } as Record<string, string>)[(paddingY as string) || "md"] || "py-7";

  const fontClass = ({
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    script: "font-serif italic",
  } as Record<string, string>)[(fontFamily as string) || "serif"] || "font-serif";

  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment || "center"] || "text-center items-center";

  return (
    <div
      className={`px-4 rounded-2xl border border-stone-200 transition-all ${paddingClass} ${fontClass}`}
      style={{ backgroundColor: backgroundColor || "#f9f8f3" }}
    >
      <div className={`flex flex-col ${alignClass} mb-4`}>
        <span
          className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-1"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          Pedoman Busana
        </span>
        <h3
          className="font-bold text-lg tracking-wide"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Color Palette Swatches */}
      <div className="flex items-center justify-center space-x-2.5 max-w-[280px] mx-auto flex-wrap gap-y-2">
        {palettes?.map((item) => (
          <div key={`${item.name}-${item.hex}`} className="flex flex-col items-center group cursor-pointer">
            <div
              className="w-10 h-10 rounded-md shadow-xs border border-black/10 transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.hex }}
              title={`${item.name} · ${item.hex.toUpperCase()}`}
            />
            <span className="text-[8px] text-zinc-600 font-medium mt-1 max-w-[72px] whitespace-nowrap text-center">
              {item.name}
            </span>
            <span className="text-[8px] text-zinc-500 font-mono">
              {item.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
