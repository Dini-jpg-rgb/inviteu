"use client";

import React from "react";

interface RsvpDonutChartProps {
  totalTamu?: number;
  hadir?: number;
  tidakHadir?: number;
  belumMerespons?: number;
}

export function RsvpDonutChart({
  totalTamu = 131,
  hadir = 84,
  tidakHadir = 9,
  belumMerespons = 27,
}: RsvpDonutChartProps) {
  const sum = hadir + tidakHadir + belumMerespons;
  const radius = 46;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  // Segment proportions
  const hadirPct = sum > 0 ? hadir / sum : 0;
  const tidakHadirPct = sum > 0 ? tidakHadir / sum : 0;
  const belumMeresponsPct = sum > 0 ? belumMerespons / sum : 0;

  const hadirStroke = hadirPct * circumference;
  const tidakHadirStroke = tidakHadirPct * circumference;
  const belumMeresponsStroke = belumMeresponsPct * circumference;

  // Offsets (starting from top -90deg)
  const offsetHadir = 0;
  const offsetTidakHadir = -hadirStroke;
  const offsetBelumMerespons = -(hadirStroke + tidakHadirStroke);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs flex flex-col justify-between h-full">
      <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight mb-2">
        Status RSVP
      </h3>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Donut Chart SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background circle track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />

            {/* Segment 1: Hadir (Green) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#15803d"
              strokeWidth={strokeWidth}
              strokeDasharray={`${hadirStroke} ${circumference}`}
              strokeDashoffset={offsetHadir}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />

            {/* Segment 2: Tidak Hadir (Red) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#dc2626"
              strokeWidth={strokeWidth}
              strokeDasharray={`${tidakHadirStroke} ${circumference}`}
              strokeDashoffset={offsetTidakHadir}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />

            {/* Segment 3: Belum Merespons (Amber) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#f5a638"
              strokeWidth={strokeWidth}
              strokeDasharray={`${belumMeresponsStroke} ${circumference}`}
              strokeDashoffset={offsetBelumMerespons}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black text-zinc-900 leading-none tracking-tight">
              {totalTamu}
            </span>
            <span className="text-[10px] font-medium text-zinc-500 mt-0.5 leading-none">
              tamu hadir
            </span>
          </div>
        </div>

        {/* Legend Stack on the right */}
        <div className="flex flex-col gap-3 min-w-[120px] text-xs">
          {/* Hadir */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] shrink-0" />
              <span className="text-zinc-700 font-medium text-xs">Hadir</span>
            </div>
            <span className="font-bold text-zinc-900">{hadir}</span>
          </div>

          {/* Tidak hadir */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
              <span className="text-zinc-700 font-medium text-xs">Tidak hadir</span>
            </div>
            <span className="font-bold text-zinc-900">{tidakHadir}</span>
          </div>

          {/* Belum merespons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5a638] shrink-0" />
              <span className="text-zinc-700 font-medium text-xs">Belum merespons</span>
            </div>
            <span className="font-bold text-zinc-900">{belumMerespons}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

