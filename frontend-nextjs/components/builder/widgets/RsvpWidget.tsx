"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionProperties } from "../types";

export function RsvpWidget(props: SectionProperties) {
  const {
    title = "Will You Join Us?",
    subtitle = "Mohon konfirmasi kehadiran Anda untuk membantu persiapan jamuan kami.",
    submitButtonText = "Kirim Konfirmasi Kehadiran",
    alignment = "center",
    fontFamily = "serif",
    textColor = "#24380f",
    accentColor = "#6f7f5f",
    backgroundColor = "#ffffff",
    paddingY = "md",
  } = props;

  const [presence, setPresence] = useState("Hadir");
  const [name, setName] = useState("");

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
      className={`px-4 rounded-2xl border border-stone-200 shadow-xs transition-all ${paddingClass} ${fontClass}`}
      style={{ backgroundColor }}
    >
      <div className={`flex flex-col ${alignClass}`}>
        <span
          className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-1.5"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          Konfirmasi Kehadiran
        </span>
        <h3
          className="font-bold text-lg tracking-wide"
          style={{ color: textColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 mt-1 mb-4 leading-relaxed text-center">
            {subtitle}
          </p>
        )}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-3 text-xs">
        <div>
          <label className="block text-stone-700 font-medium mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama Anda"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-stone-700 font-medium mb-1">
            Konfirmasi Kehadiran
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["Hadir", "Tidak Hadir"].map((option) => {
              const isSelected = presence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPresence(option)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    isSelected ? "shadow-xs font-semibold" : ""
                  }`}
                  style={
                    isSelected
                      ? option === "Hadir"
                        ? { backgroundColor: "#173B2B", borderColor: "#173B2B", color: "#A7E0B8" }
                        : { backgroundColor: "#7A2925", borderColor: "#7A2925", color: "#FFD4CE" }
                      : { backgroundColor: "#FFF8EE", borderColor: "#EBD9BE", color: "#9A5A00" }
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          className="w-full text-white font-semibold py-2.5 rounded-lg mt-2 cursor-pointer shadow-xs transition-opacity hover:opacity-90"
          style={{ backgroundColor: textColor }}
        >
          {submitButtonText}
        </Button>
      </form>
    </div>
  );
}
