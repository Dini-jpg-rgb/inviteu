"use client";

import React, { useState } from "react";

interface FallbackImageProps {
  src?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackLabel?: string;
}

export function FallbackImage({
  src,
  alt,
  className = "",
  style,
  fallbackLabel = "Gambar tidak tersedia",
}: FallbackImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel}
        className={`${className} flex items-center justify-center bg-stone-200 px-2 text-center text-xs text-stone-500`}
        style={style}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
