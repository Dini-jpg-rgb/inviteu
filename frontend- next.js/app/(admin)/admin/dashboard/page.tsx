"use client";

import React from "react";
import Link from "next/link";
import { DualAxisLineChart } from "@/components/dashboard/DualAxisLineChart";
import { RsvpDonutChart } from "@/components/dashboard/RsvpDonutChart";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header (Matching Image 4) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Ringkasan pergerakan platform dan invitation
        </p>
      </div>

      {/* 2. Four Stat Cards (Amber Cards #f5a638 - Matching Image 4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Partner Aktif */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[105px]">
          <span className="text-xs font-bold text-[#44230b]">
            Partner aktif
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#2d1b11] mt-2 tracking-tight">
            24
          </div>
        </div>

        {/* Card 2: Invitation Published */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[105px]">
          <span className="text-xs font-bold text-[#44230b]">
            Invitation Published
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#2d1b11] mt-2 tracking-tight">
            318
          </div>
        </div>

        {/* Card 3: Template Pending Review */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[105px]">
          <span className="text-xs font-bold text-[#44230b]">
            Template Pending Review
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#2d1b11] mt-2 tracking-tight">
            3
          </div>
        </div>

        {/* Card 4: Transaksi Pending */}
        <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 border border-[#e59524] text-[#2d1b11] shadow-xs flex flex-col justify-between min-h-[105px]">
          <span className="text-xs font-bold text-[#44230b]">
            Transaksi Pending
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#2d1b11] mt-2 tracking-tight">
            2
          </div>
        </div>
      </div>

      {/* 3. Charts Row: Dual Axis Line Chart (Left) & RSVP Donut Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Dual Axis Line Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <DualAxisLineChart />
        </div>

        {/* Right: RSVP Donut Chart */}
        <div className="lg:col-span-4 flex flex-col">
          <RsvpDonutChart
            totalTamu={130}
            hadir={85}
            tidakHadir={10}
            belumMerespons={15}
          />
        </div>
      </div>

      {/* 4. Table 1: Template Menunggu Review (Matching Image 4) */}
      <div className="space-y-2.5">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
          Template menunggu review
        </h3>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
                <tr>
                  <th className="py-3 px-4 font-bold">Template</th>
                  <th className="py-3 px-4 font-bold">Designer</th>
                  <th className="py-3 px-4 font-bold">Disubmit</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-zinc-900">
                    Floral Pink
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-medium">
                    Dwi
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-normal">
                    Kemarin
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Pending Review
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link href="/admin/templates">
                      <button className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer">
                        Review
                      </button>
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-zinc-900">
                    Classic Cream
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-medium">
                    Jack
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-normal">
                    2 hari lalu
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Pending Review
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link href="/admin/templates">
                      <button className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer">
                        Review
                      </button>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Table 2: Transaksi Terbaru (Matching Image 4) */}
      <div className="space-y-2.5">
        <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
          Transaksi terbaru
        </h3>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f5a638] text-[#2d1b11] font-bold">
                <tr>
                  <th className="py-3 px-4 font-bold">Order</th>
                  <th className="py-3 px-4 font-bold">Partner</th>
                  <th className="py-3 px-4 font-bold">Package</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                    ORD-0001
                  </td>
                  <td className="py-3.5 px-4 text-zinc-800 font-semibold">
                    Studio Kumtura
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-medium">
                    Premium
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-[#fef5e7] text-amber-800 font-semibold px-3 py-0.5 rounded-full text-[11px] border border-amber-200">
                      Pending
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link href="/admin/transactions">
                      <button className="bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 text-[11px] font-semibold px-4 py-1 rounded-full shadow-2xs transition-colors cursor-pointer">
                        Detail
                      </button>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
