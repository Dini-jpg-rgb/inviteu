import React from "react";
import { SectionProperties } from "../types";

export function VideoGreetingWidget(props: SectionProperties) {
  const {
    title = "Video Ucapan & Momen Bahagia",
    subtitle = "Saksikan ucapan hangat serta kompilasi momen spesial kami.",
    videoUrl = "https://www.youtube.com/watch?v=sample",
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
        <div className="flex items-center space-x-1.5 mb-2">
          <span
            className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            Video Greeting
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 px-2 py-0.5 rounded-full">
            ⭐ Add-On
          </span>
        </div>

        <h3
          className="text-lg font-bold tracking-wide"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 max-w-xs mt-1 mb-4 leading-relaxed text-center">
            {subtitle}
          </p>
        )}
      </div>

      {/* Video Mockup Frame */}
      <div className="relative w-full aspect-video rounded-xl bg-stone-900 overflow-hidden shadow-inner flex items-center justify-center my-2 group">
        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform cursor-pointer">
          ▶
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white/80 text-[10px] px-2 py-1 bg-black/40 rounded-md">
          <span className="truncate max-w-[180px]">{videoUrl}</span>
          <span>1080p HD</span>
        </div>
      </div>
    </div>
  );
}
