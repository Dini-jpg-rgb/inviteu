"use client";

import React, { useState } from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
  urlDisplay?: string;
  zoomLevel?: number;
  templateTitle?: string;
}

export function PhoneMockup({
  children,
  urlDisplay = "inviteu.id/preview/wedding",
  zoomLevel = 100,
  templateTitle = "Undangan Pernikahan",
}: PhoneMockupProps) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);

  return (
    <div
      className="flex flex-col items-center transition-transform duration-200"
      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
    >
      {/* Smartphone Outer Chassis (iPhone Pro Style) */}
      <div
        className="relative mx-auto rounded-[54px] p-[10px] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-black/50 select-none"
        aria-label={templateTitle}
      >
        
        {/* Hardware Buttons simulation (positioned on outer chassis) */}
        <div className="absolute -left-[3px] top-28 w-[3px] h-10 bg-zinc-600 rounded-l-xs shadow-xs" />
        <div className="absolute -left-[3px] top-42 w-[3px] h-12 bg-zinc-600 rounded-l-xs shadow-xs" />
        <div className="absolute -left-[3px] top-58 w-[3px] h-12 bg-zinc-600 rounded-l-xs shadow-xs" />
        <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-zinc-600 rounded-r-xs shadow-xs" />

        {/* Outer Metallic Bezel with Anti-Leak Masking */}
        <div
          className="relative rounded-[45px] overflow-hidden bg-black p-[3.5px] border-[2px] border-zinc-900 shadow-inner"
          style={{
            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
            maskImage: "radial-gradient(white, black)",
          }}
        >
          {/* Internal Screen Container (375x750 mobile screen ratio) */}
          <div
            className="relative w-[360px] sm:w-[375px] h-[750px] bg-white rounded-[40px] overflow-hidden flex flex-col select-none"
            style={{
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              maskImage: "radial-gradient(white, black)",
              isolation: "isolate",
            }}
          >
            {/* Top iOS Status Bar & Dynamic Island */}
            <div className="absolute top-0 left-0 right-0 z-40 h-11 px-7 pt-3 flex items-center justify-between text-zinc-800 pointer-events-none bg-gradient-to-b from-white/95 via-white/50 to-transparent">
              {/* Time */}
              <span className="text-[13px] font-semibold tracking-tight">9:41</span>

              {/* Dynamic Island / Notch */}
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 space-x-1 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-950/80 ring-1 ring-zinc-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              </div>

              {/* Status Icons */}
              <div className="flex items-center space-x-1.5 text-zinc-800">
                {/* Signal */}
                <div className="flex items-end space-x-[1.5px] h-2.5">
                  <div className="w-[2.5px] h-1 bg-current rounded-xs" />
                  <div className="w-[2.5px] h-1.5 bg-current rounded-xs" />
                  <div className="w-[2.5px] h-2 bg-current rounded-xs" />
                  <div className="w-[2.5px] h-2.5 bg-current rounded-xs" />
                </div>
                {/* WiFi */}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.32c3.83 0 7.33 1.48 9.97 3.93L12 18.25 2.03 11.25C4.67 8.8 8.17 7.32 12 7.32z" />
                </svg>
                {/* Battery */}
                <div className="w-5 h-2.5 border border-current rounded-xs p-[1px] flex items-center relative">
                  <div className="h-full w-full bg-current rounded-2xs" />
                  <div className="absolute -right-1 w-0.5 h-1.5 bg-current rounded-r-xs" />
                </div>
              </div>
            </div>

            {/* Scrollable Template Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300">
              {children}
            </div>

            {/* Floating Music Disc Button */}
            <button
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              className={`absolute bottom-16 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-300 ${
                isPlayingMusic
                  ? "bg-[#6f7f5f] text-white shadow-emerald-900/30 animate-spin-slow"
                  : "bg-white/80 text-zinc-600 hover:bg-white"
              }`}
              title={isPlayingMusic ? "Heningkan Musik" : "Putar Musik Latar"}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </button>

            {/* Bottom Safari Address Bar & Home Bar (Strictly Rounded to match phone screen radius) */}
            <div className="bg-white border-t border-zinc-200/90 px-4 pt-2 pb-2 text-zinc-600 z-40 rounded-b-[40px] overflow-hidden shrink-0">
              <div className="flex items-center justify-center space-x-2 bg-zinc-100 hover:bg-zinc-200/80 transition-colors py-1.5 px-3 rounded-full text-xs text-zinc-600">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V8H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 7V5.5a3 3 0 10-6 0V8h6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium tracking-tight truncate max-w-[210px]">{urlDisplay}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-[10px] text-zinc-400">SSL</span>
              </div>

              {/* iOS Home Indicator */}
              <div className="w-32 h-1 bg-zinc-800 rounded-full mx-auto mt-2.5 mb-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


