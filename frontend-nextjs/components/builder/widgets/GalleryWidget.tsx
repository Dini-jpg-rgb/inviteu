import React from "react";
import { FallbackImage } from "@/components/invitations/FallbackImage";
import { SectionProperties } from "../types";

export function GalleryWidget(props: SectionProperties) {
  const {
    title = "Our Moments",
    galleryImages = [
      "/templates/wedding/gallery-1.jpg",
      "/templates/wedding/gallery-2.jpg",
      "/templates/wedding/gallery-3.jpg",
      "/templates/wedding/gallery-4.jpg",
    ],
    alignment = "center",
    fontFamily = "serif",
    fontSize = "base",
    fontWeight = "bold",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "#faf8f5",
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
    // Image specific adjustments
    cropFit = "cover",
    objectPosition = "center",
    imageHeight = 96,
    imageBorderRadius = "md",
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

  const imgRadiusClass = (
    {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-lg",
      lg: "rounded-xl",
      full: "rounded-full",
    } as Record<string, string>
  )[imageBorderRadius as string] || "rounded-lg";

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
      xs: "text-sm",
      sm: "text-base",
      base: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
    } as Record<string, string>
  )[fontSize as string] || "text-lg";

  const images: string[] = galleryImages && galleryImages.length > 0
    ? galleryImages
    : [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
        "/templates/wedding/couple-main.jpg",
        "/templates/wedding/venue.jpg",
      ];

  const count = Number(props.imageCount) || images.length;
  const displayImages = images.slice(0, count);

  return (
    <div
      className={`relative px-4 overflow-hidden transition-all ${paddingClass} ${fontClass} ${radiusClass} ${borderClass} ${shadowClass}`}
      style={{
        backgroundColor: backgroundColor || "#faf8f5",
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

      <div className={`relative z-10 flex flex-col ${alignClass} mb-3`}>
        <span
          className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full mb-1"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          Galeri Kenangan
        </span>
        <h3
          className={`tracking-wide ${sizeClass} ${weightClass}`}
          style={{ color: textColor }}
        >
          {title}
        </h3>
      </div>

      <div
        className={`relative z-10 ${
          layoutVariant === "minimal"
            ? "grid grid-cols-1 gap-3"
            : layoutVariant === "grid-3"
            ? "grid grid-cols-3 gap-2"
            : layoutVariant === "carousel"
            ? "flex gap-2 overflow-x-auto pb-2 snap-x no-scrollbar"
            : layoutVariant === "masonry"
            ? "columns-2 gap-2 space-y-2"
            : "grid grid-cols-2 gap-2"
        }`}
      >
        {displayImages.map((img: string, i: number) => (
          <div
            key={i}
            className={`relative overflow-hidden bg-stone-200 border border-stone-300 shadow-2xs group ${imgRadiusClass} ${
              layoutVariant === "carousel" ? "min-w-[70%] shrink-0 snap-center" : ""
            } ${layoutVariant === "masonry" && i % 2 === 1 ? "!h-32" : ""}`}
            style={{
              height:
                layoutVariant === "masonry" && i % 2 === 1
                  ? `${(Number(imageHeight) || 96) + 32}px`
                  : `${Number(imageHeight) || 96}px`,
            }}
          >
            <FallbackImage
              src={img}
              alt={`Gallery ${i + 1}`}
              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              fallbackLabel="Foto tidak tersedia"
              style={{
                objectFit: (cropFit as "cover" | "contain" | "fill") || "cover",
                objectPosition: (objectPosition as string) || "center",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
