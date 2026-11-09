"use client";

import React, { useState } from "react";
import { SectionProperties } from "../types";

export function DigitalGiftWidget(props: SectionProperties) {
  const {
    title = "Tanda Kasih (Digital Gift)",
    subtitle = "Doa restu Anda merupakan karunia terindah bagi kami. Bagi yang berkenan memberikan tanda kasih:",
    bankName = "BCA",
    accountNumber = "1234 5678 90",
    accountHolder = "Mogran & Laura",
    giftNote = "Terima kasih atas kebaikan dan doa tulus Anda.",
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "transparent",
    paddingY = "md",
  } = props;

  const [copied, setCopied] = useState(false);

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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          Amplop Digital
        </span>
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

      {/* Bank Account Card */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-4 rounded-xl shadow-md my-2 text-left relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
            {bankName}
          </span>
          <span className="text-[10px] text-stone-400">Cashless Transfer</span>
        </div>

        <div className="my-3">
          <p className="font-mono text-base font-semibold tracking-widest">
            {accountNumber}
          </p>
          <p className="text-[11px] text-stone-300 mt-0.5">a.n. {accountHolder}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>{copied ? "✓ Tersalin!" : "📋 Salin Nomor Rekening"}</span>
        </button>
      </div>

      {giftNote && (
        <p className="text-[11px] text-stone-500 text-center mt-3 italic">
          {giftNote}
        </p>
      )}
    </div>
  );
}
