import React from "react";
import { SectionProperties, MilestoneItem } from "../types";

export function LoveStoryWidget(props: SectionProperties) {
  const {
    title = "Our Love Story",
    subtitle = "Bagaimana perjalanan cinta kami bersemi hingga menuju pelaminan.",
    milestones = [
      { id: "1", year: "2021", title: "Pertama Bertemu", story: "Berawal dari perkenalan sederhana di sebuah kedai kopi di Denpasar." },
      { id: "2", year: "2023", title: "Memulai Komitmen", story: "Memutuskan untuk melangkah bersama melewati segala dinamika kehidupan." },
      { id: "3", year: "2026", title: "Menuju Pelaminan", story: "Mengikat janji suci di hadapan keluarga dan sahabat tercinta." },
    ],
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "transparent",
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
      style={{ backgroundColor: backgroundColor || "rgba(255,255,255,0.7)" }}
    >
      <div className={`flex flex-col ${alignClass}`}>
        <span
          className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-2"
          style={{
            backgroundColor: `${accentColor}18`,
            color: accentColor,
          }}
        >
          Kisah Perjalanan
        </span>
        <h3
          className="text-lg font-bold tracking-wide"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 max-w-xs mt-1 mb-4 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative border-l-2 border-stone-200 ml-4 pl-4 space-y-4 my-2 text-left">
        {milestones.map((item: MilestoneItem) => (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
            <span
              className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {item.year}
            </span>
            <h4
              className="text-xs font-bold mt-1"
              style={{ color: textColor }}
            >
              {item.title}
            </h4>
            <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
              {item.story}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
