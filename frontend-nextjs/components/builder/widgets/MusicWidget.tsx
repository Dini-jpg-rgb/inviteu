"use client";

import React, { useState } from "react";
import { SectionProperties } from "../types";

export function MusicWidget(props: SectionProperties) {
  const {
    title = "Background Music",
    songTitle = "A Thousand Years",
    artistName = "Christina Perri",
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "transparent",
    paddingY = "md",
  } = props;

  const [isPlaying, setIsPlaying] = useState(true);

  const paddingClass = (
    {
      sm: "py-3",
      md: "py-5",
      lg: "py-8",
      xl: "py-12",
    } as Record<string, string>
  )[paddingY as string] || "py-5";

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
          {title}
        </span>

        {/* Music Player Bar */}
        <div className="w-full bg-white/90 p-3 rounded-xl border border-stone-200 shadow-xs flex items-center space-x-3">
          {/* Vinyl Disc Animation */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
              isPlaying ? "animate-spin-slow" : ""
            }`}
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-sm">🎵</span>
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold truncate" style={{ color: textColor }}>
              {songTitle}
            </p>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">
              {artistName}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-xs hover:bg-stone-100 transition-colors shrink-0"
            style={{ color: textColor }}
            title={isPlaying ? "Jeda Lagu" : "Putar Lagu"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
