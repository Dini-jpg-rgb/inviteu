import React from "react";
import { FallbackImage } from "@/components/invitations/FallbackImage";
import { SectionProperties } from "../types";

export function CoverWidget(props: SectionProperties) {
  const {
    title = "Two Hearts, One Journey",
    subtitle = "With joyful hearts, we invite you to celebrate our new chapter.",
    coupleTitle = "MOGRAN & LAURA",
    imageUrl = "/templates/wedding/couple-main.jpg",
    alignment = "center",
    fontFamily = "serif",
    fontSize = "base",
    fontWeight = "bold",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "rgba(255, 255, 255, 0.75)",
    paddingY = "md",
    borderRadius = "lg",
    borderWidth = "thin",
    borderColor = "#e7e5e4",
    bgImage,
    bgImageOpacity = 40,
    bgImagePosition = "center",
    bgImageSize = "cover",
    layoutVariant = "default",
    shadow = "sm",
    // Image specific adjustments
    cropFit = "cover",
    objectPosition = "center",
    imageHeight = 176,
    imageBorderRadius = "md",
  } = props;

  const paddingClass = (
    {
      none: "py-0",
      sm: "py-4",
      md: "py-8",
      lg: "py-12",
      xl: "py-16",
    } as Record<string, string>
  )[paddingY as string] || "py-8";

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

  const imgRadiusClass = (
    {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-xl",
      lg: "rounded-2xl",
      full: "rounded-full",
    } as Record<string, string>
  )[imageBorderRadius as string] || "rounded-xl";

  const shadowClass = (
    {
      none: "shadow-none",
      sm: "shadow-xs",
      md: "shadow-md",
      lg: "shadow-xl",
    } as Record<string, string>
  )[shadow as string] || "shadow-xs";

  const borderClass = (
    {
      none: "border-0",
      thin: "border",
      medium: "border-2",
      thick: "border-4",
    } as Record<string, string>
  )[borderWidth as string] || "border";

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
      xs: "text-lg sm:text-xl",
      sm: "text-xl sm:text-2xl",
      base: "text-2xl sm:text-3xl",
      lg: "text-3xl sm:text-4xl",
      xl: "text-4xl sm:text-5xl",
    } as Record<string, string>
  )[fontSize as string] || "text-2xl sm:text-3xl";

  return (
    <div
      className={`relative px-4 overflow-hidden transition-all ${paddingClass} ${fontClass} ${radiusClass} ${shadowClass} ${borderClass}`}
      style={{
        backgroundColor: backgroundColor || "rgba(255, 255, 255, 0.75)",
        borderColor: borderWidth !== "none" ? borderColor || "#e7e5e4" : "transparent",
      }}
    >
      {/* Background Image Layer (MVP 5) */}
      {bgImage && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundPosition: bgImagePosition as string,
            backgroundSize: bgImageSize as string,
            backgroundRepeat: "no-repeat",
            opacity: (Number(bgImageOpacity) || 40) / 100,
          }}
        />
      )}

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col ${alignClass} ${layoutVariant === "card" ? "p-4 bg-white/70 backdrop-blur-xs rounded-xl border border-stone-200/60 shadow-xs" : ""}`}>
        {title && (
          <span
            className="inline-block text-[11px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full mb-3"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {title}
          </span>
        )}

        <h2
          className={`tracking-wide ${sizeClass} ${weightClass}`}
          style={{ color: textColor }}
        >
          {coupleTitle}
        </h2>

        {subtitle && (
          <p
            className="text-xs max-w-xs mt-2 leading-relaxed opacity-85"
            style={{ color: textColor }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Hero Image with Cropping & Sizing (MVP 5) */}
        <div
          className={`relative z-10 mt-5 w-full overflow-hidden bg-stone-100 shadow-inner ${imgRadiusClass}`}
          style={{ height: `${Number(imageHeight) || 176}px` }}
        >
          <FallbackImage
            src={imageUrl}
            alt={coupleTitle}
            className="w-full h-full"
            fallbackLabel="Foto utama tidak tersedia"
            style={{
              objectFit: (cropFit as "cover" | "contain" | "fill") || "cover",
              objectPosition: (objectPosition as string) || "center",
            }}
          />
        </div>
    </div>
  );
}
