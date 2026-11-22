import React from "react";
import { SectionProperties } from "../types";

export function CountdownWidget(props: SectionProperties) {
  const {
    title = "Menuju Hari Bahagia",
    subtitle = "Kami menantikan kehadiran dan doa restu Anda di hari istimewa ini.",
    days = 45,
    hours = 12,
    minutes = 30,
    seconds = 15,
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "#f9f8f6",
    paddingY = "md",
  } = props;

  const paddingClass = (
    {
      sm: "py-4",
      md: "py-6",
      lg: "py-10",
      xl: "py-14",
    } as Record<string, string>
  )[paddingY as string] || "py-6";

  const fontClass = (
    {
      serif: "font-serif",
      sans: "font-sans",
      mono: "font-mono",
    } as Record<string, string>
  )[fontFamily as string] || "font-serif";

  const alignClass = (
    {
      left: "text-left items-start",
      center: "text-center items-center",
      right: "text-right items-end",
    } as Record<string, string>
  )[alignment as string] || "text-center items-center";

  return (
    <div
      className={`px-4 rounded-2xl border border-stone-200 transition-all ${paddingClass} ${fontClass}`}
      style={{ backgroundColor }}
    >
      <div className={`flex flex-col ${alignClass} mb-3`}>
        <span
          className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-1.5"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          Hitung Mundur
        </span>
        <h3
          className="font-bold text-base tracking-wide"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 mt-0.5 max-w-xs">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {[
          { label: "Hari", val: days },
          { label: "Jam", val: hours },
          { label: "Menit", val: minutes },
          { label: "Detik", val: seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="w-14 py-2 bg-white rounded-xl border border-stone-200 shadow-2xs text-center"
          >
            <span
              className="block font-mono font-bold text-base"
              style={{ color: accentColor }}
            >
              {String(item.val).padStart(2, "0")}
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-stone-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
