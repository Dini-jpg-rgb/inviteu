"use client";

import React, { useState } from "react";

interface DataPoint {
  date: string;
  rsvp: number; // 0 - 15
}

// Data matching Image 1
const DATA_7_DAYS: DataPoint[] = [
  { date: "6 Okt", rsvp: 3 },
  { date: "7 Okt", rsvp: 5 },
  { date: "8 Okt", rsvp: 1 },
  { date: "9 Okt", rsvp: 7 },
  { date: "10 Okt", rsvp: 11 },
  { date: "11 Okt", rsvp: 9 },
  { date: "12 Okt", rsvp: 14.5 },
];

const DATA_30_DAYS: DataPoint[] = [
  { date: "13 Sep", rsvp: 2 },
  { date: "18 Sep", rsvp: 5 },
  { date: "23 Sep", rsvp: 4 },
  { date: "28 Sep", rsvp: 9 },
  { date: "03 Okt", rsvp: 7 },
  { date: "08 Okt", rsvp: 11 },
  { date: "12 Okt", rsvp: 14.5 },
];

interface DualAxisLineChartProps {
  isEmpty?: boolean;
}

export function DualAxisLineChart({ isEmpty = false }: DualAxisLineChartProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const baseData = period === "7d" ? DATA_7_DAYS : DATA_30_DAYS;
  const data = isEmpty ? baseData.map((d) => ({ ...d, rsvp: 0 })) : baseData;

  // Chart dimensions & scaling
  const width = 600;
  const height = 210;
  const paddingLeft = 35;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxRsvp = 15;

  // Calculate coordinates
  const getX = (index: number) => paddingLeft + (index / (data.length - 1)) * chartWidth;
  const getYRsvp = (val: number) => paddingTop + chartHeight - (val / maxRsvp) * chartHeight;

  // Generate SVG path string (Blue Line)
  const rsvpPath = data.reduce((acc, point, i) => {
    const x = getX(i);
    const y = getYRsvp(point.rsvp);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Grid steps (15, 11, 7, 3, 0 - exactly matching Image 1)
  const gridSteps = [15, 11, 7, 3, 0];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs flex flex-col justify-between h-full">
      {/* Chart Top Bar (Title & Period Switcher - Matching Image 1) */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
          RSVP masuk per hari
        </h3>

        {/* 7 Hari / 30 Hari Switcher */}
        <div className="inline-flex items-center gap-1 bg-zinc-100/90 p-0.5 rounded-full border border-zinc-200/80">
          <button
            type="button"
            onClick={() => setPeriod("7d")}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all cursor-pointer ${
              period === "7d"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            7 hari
          </button>
          <button
            type="button"
            onClick={() => setPeriod("30d")}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all cursor-pointer ${
              period === "30d"
                ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            30 hari
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[450px]"
          style={{ overflow: "visible" }}
        >
          {/* Horizontal Grid lines & Left Y Axis labels */}
          {gridSteps.map((stepVal, idx) => {
            const y = paddingTop + (idx / (gridSteps.length - 1)) * chartHeight;
            return (
              <g key={idx}>
                {/* Horizontal Grid line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1ede6"
                  strokeWidth="1"
                />
                {/* Left label: RSVP */}
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] font-medium"
                >
                  {stepVal}
                </text>
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {data.map((point, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px] font-medium"
              >
                {point.date}
              </text>
            );
          })}

          {/* RSVP Line (Royal Blue Line - Matching Image 1) */}
          <path
            d={rsvpPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Empty state notice */}
          {isEmpty && (
            <g pointerEvents="none">
              <rect
                x={width / 2 - 110}
                y={height / 2 - 20}
                width={220}
                height={28}
                rx={14}
                fill="#ffffff"
                stroke="#e5d8c8"
                strokeWidth="1"
              />
              <text
                x={width / 2}
                y={height / 2 - 2}
                textAnchor="middle"
                className="fill-zinc-400 text-[10px] font-medium"
              >
                Belum ada data RSVP masuk
              </text>
            </g>
          )}

          {/* Dots on Blue Line */}
          {data.map((point, i) => {
            const x = getX(i);
            const y = getYRsvp(point.rsvp);
            const isHovered = hoverIndex === i;
            return (
              <g
                key={`rsvp-${i}`}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 4}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {/* Tooltip on Hover */}
          {hoverIndex !== null && !isEmpty && (
            <g pointerEvents="none">
              <rect
                x={getX(hoverIndex) - 35}
                y={getYRsvp(data[hoverIndex].rsvp) - 28}
                width="70"
                height="22"
                rx="6"
                fill="#1c1c1c"
                className="drop-shadow-md"
              />
              <text
                x={getX(hoverIndex)}
                y={getYRsvp(data[hoverIndex].rsvp) - 13}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
              >
                {data[hoverIndex].rsvp} RSVP
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
