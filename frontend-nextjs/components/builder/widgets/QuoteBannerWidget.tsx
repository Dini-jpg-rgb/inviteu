import React from "react";
import { WidgetRendererProps } from "../registry/types";

export interface QuoteBannerContent {
  tag?: string;
  message?: string;
  groom?: string;
  bride?: string;
}

export function QuoteBannerWidget({
  settings,
  content,
}: WidgetRendererProps<QuoteBannerContent>) {
  const {
    tag = "Two Hearts, One Journey",
    message = "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
    groom = "MOGRAN",
    bride = "LAURA",
  } = content || {};

  const {
    fontFamily = "serif",
    textColor = "#fffcea",
    accentColor = "#cfcaa3",
    backgroundColor = "#455633",
    paddingY = "md",
  } = settings || {};

  const paddingClass = ({
    none: "py-0",
    sm: "py-4",
    md: "py-6",
    lg: "py-9",
    xl: "py-12",
  } as Record<string, string>)[(paddingY as string) || "md"] || "py-6";

  const fontClass = ({
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    script: "font-serif italic",
  } as Record<string, string>)[(fontFamily as string) || "serif"] || "font-serif";

  return (
    <div
      className={`px-6 text-center relative rounded-2xl shadow-md border border-[#6f7f5f]/40 transition-all ${paddingClass} ${fontClass}`}
      style={{
        backgroundColor: backgroundColor || "#455633",
        color: textColor || "#fffcea",
      }}
    >
      <div className="border border-[#6f7f5f]/40 p-4 rounded-xl">
        <h2 className="text-base tracking-wider font-semibold mb-2" style={{ color: textColor }}>
          {tag}
        </h2>
        <p className="text-xs leading-relaxed opacity-90 max-w-[280px] mx-auto mb-3">
          {message}
        </p>
        <div
          className="flex items-center justify-center space-x-2 text-xs tracking-widest uppercase font-bold"
          style={{ color: textColor }}
        >
          <span>{groom}</span>
          <span
            className="text-base lowercase"
            style={{ color: accentColor }}
          >
            &
          </span>
          <span>{bride}</span>
        </div>
      </div>
    </div>
  );
}
