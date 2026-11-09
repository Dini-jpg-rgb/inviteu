import React from "react";
import { SectionProperties } from "../types";

export function EventDetailsWidget(props: SectionProperties) {
  const {
    badge = "Acara & Lokasi",
    placeName = "Sangeh Sanctuary Villa",
    address = "Jl. Contoh No. 123, Denpasar, Bali",
    dateText = "Senin, 28 Desember 2026",
    timeText = "09:00 - 13:00 WITA",
    mapUrl = "https://maps.google.com",
    alignment = "center",
    fontFamily = "serif",
    fontSize = "base",
    fontWeight = "bold",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "#ffffff",
    paddingY = "md",
    borderRadius = "lg",
    borderWidth = "thin",
    borderColor = "#e7e5e4",
    bgImage,
    bgImageOpacity = 30,
    bgImagePosition = "center",
    bgImageSize = "cover",
    layoutVariant = "default",
    shadow = "sm",
  } = props;

  const paddingClass = (
    {
      none: "py-0",
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
      script: "font-serif italic",
    } as Record<string, string>
  )[fontFamily as string] || "font-serif";

  const alignClass = (
    {
      left: "text-left items-start",
      center: "text-center items-center",
      right: "text-right items-end",
    } as Record<string, string>
  )[alignment as string] || "text-center items-center";

  const radiusClass = (
    {
      none: "rounded-none",
      sm: "rounded-md",
      md: "rounded-xl",
      lg: "rounded-2xl",
      xl: "rounded-3xl",
      full: "rounded-full",
    } as Record<string, string>
  )[borderRadius as string] || "rounded-2xl";

  const borderClass = (
    {
      none: "border-0",
      thin: "border",
      medium: "border-2",
      thick: "border-4",
    } as Record<string, string>
  )[borderWidth as string] || "border";

  const shadowClass = (
    {
      none: "shadow-none",
      sm: "shadow-xs",
      md: "shadow-md",
      lg: "shadow-xl",
    } as Record<string, string>
  )[shadow as string] || "shadow-xs";

  const weightClass = (
    {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    } as Record<string, string>
  )[fontWeight as string] || "font-bold";

  const sizeClass = (
    {
      xs: "text-base",
      sm: "text-lg",
      base: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    } as Record<string, string>
  )[fontSize as string] || "text-xl";

  return (
    <div
      className={`relative px-4 transition-all overflow-hidden ${paddingClass} ${fontClass} ${radiusClass} ${borderClass} ${shadowClass}`}
      style={{
        backgroundColor: backgroundColor || "#ffffff",
        borderColor: borderWidth !== "none" ? borderColor || "#e7e5e4" : "transparent",
      }}
    >
      {/* Background Image Layer */}
      {bgImage && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundPosition: bgImagePosition as string,
            backgroundSize: bgImageSize as string,
            backgroundRepeat: "no-repeat",
            opacity: (Number(bgImageOpacity) || 30) / 100,
          }}
        />
      )}

      <div className={`relative z-10 flex flex-col ${alignClass} ${layoutVariant === "card" ? "p-3 bg-white/70 backdrop-blur-xs rounded-xl" : ""}`}>
        {badge && (
          <span
            className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {badge}
          </span>
        )}
        <h3
          className={`mt-3 tracking-wide ${sizeClass} ${weightClass}`}
          style={{ color: textColor }}
        >
          {placeName}
        </h3>
        <p className="text-xs opacity-75 whitespace-pre-line mt-1" style={{ color: textColor }}>
          {address}
        </p>
      </div>

      <div className="relative z-10 my-4 py-3 border-y border-stone-200/60 flex items-center justify-around text-xs">
        <div>
          <p className="text-stone-400 text-[10px]">Tanggal</p>
          <p className="font-semibold" style={{ color: textColor }}>{dateText}</p>
        </div>
        <div className="w-px h-6 bg-stone-200" />
        <div>
          <p className="text-stone-400 text-[10px]">Waktu</p>
          <p className="font-semibold" style={{ color: textColor }}>{timeText}</p>
        </div>
      </div>

      {mapUrl && (
        <div className="relative z-10 text-center">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold hover:underline"
            style={{ color: accentColor }}
          >
            <span>📍 Buka Petunjuk Arah di Google Maps</span>
          </a>
        </div>
      )}
    </div>
  );
}
