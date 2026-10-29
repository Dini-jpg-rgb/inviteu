"use client";

import React from "react";
import Link from "next/link";
import { usePartner } from "@/context/PartnerContext";
import { useUserManagement } from "@/context/UserManagementContext";

export default function PartnerPackagesPage() {
  const { activePackage, transactions } = usePartner();
  const { packages } = useUserManagement();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Header (Matching Image 4) */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Package
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
          Pilih package untuk membuka quota dan widget
        </p>
      </div>

      {/* 2. Three Package Cards (Matching Image 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((pkg) => {
          const isCurrentActive = activePackage === pkg.id;

          return (
            <div
              key={pkg.id}
              className="bg-[#f5a638] rounded-2xl p-5 sm:p-6 border border-[#df9226] shadow-xs flex flex-col justify-between text-[#2d1b11] relative"
            >
              {/* Active Badge (Top Right) */}
              {isCurrentActive && (
                <div className="absolute top-4 right-5">
                  <span className="bg-[#d2f3e8] text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs">
                    Aktif
                  </span>
                </div>
              )}

              <div>
                {/* Title */}
                <h3 className="text-sm font-bold text-zinc-900">
                  {pkg.name}
                </h3>

                {/* Price */}
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                    {pkg.price}
                  </span>
                  <p className="text-[11px] text-zinc-800 font-medium mt-0.5">
                    {pkg.priceNote}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[#df9226] my-4" />

                {/* Features List */}
                <ul className="space-y-2 text-xs font-medium text-zinc-900">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-2">
                {/* Button 1: Lihat detail */}
                <Link
                  href={`/packages/checkout?pkg=${pkg.id}`}
                  className="block w-full"
                >
                  <button className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-semibold text-xs py-2.5 rounded-lg border border-zinc-200 shadow-2xs transition-colors cursor-pointer">
                    Lihat detail
                  </button>
                </Link>

                {/* Button 2: Pilih package OR Package aktif */}
                {isCurrentActive ? (
                  <button
                    disabled
                    className="w-full bg-white/80 text-zinc-500 font-semibold text-xs py-2.5 rounded-lg border border-zinc-200/60 cursor-default"
                  >
                    Package aktif
                  </button>
                ) : (
                  <Link
                    href={`/packages/checkout?pkg=${pkg.id}`}
                    className="block w-full"
                  >
                    <button className="w-full bg-[#1a1a1a] hover:bg-black text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer">
                      Pilih package
                    </button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Status Transaksi Table (Matching Image 4) */}
      <div className="pt-2">
        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 mb-2.5">
          Status transaksi
        </h3>

        <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#331c11] text-white">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Package</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400">
                      <p className="font-medium text-xs">Belum ada riwayat transaksi package</p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Pilih salah satu package di atas untuk memulai langganan.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-zinc-900">
                        {tx.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 font-medium">
                        {tx.packageName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-900 font-semibold">
                        {tx.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === "Paid" ? (
                          <span className="inline-block bg-[#eaf7f0] text-emerald-700 font-semibold px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                            Paid
                          </span>
                        ) : tx.status === "Pending" ? (
                          <span className="inline-block bg-[#fef5e7] text-amber-700 font-semibold px-3 py-1 rounded-full text-[11px] border border-amber-200">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-block bg-rose-50 text-rose-700 font-semibold px-3 py-1 rounded-full text-[11px] border border-rose-200">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 font-normal">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => alert(`Rincian Transaksi: ${tx.orderNumber}\nPaket: ${tx.packageName}\nTotal: ${tx.amount}\nStatus: ${tx.status}`)}
                          className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-semibold px-3.5 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
