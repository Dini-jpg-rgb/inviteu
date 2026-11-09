"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TEMPLATES_REGISTRY } from "@/app/(designer)/designer/templates/themes/registry";

export default function PartnerTemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a170e] tracking-tight">
            Katalog Desain Template
          </h1>
          <p className="text-xs sm:text-sm text-[#4d2d1b] font-medium mt-1">
            Pilih tema desain undangan pernikahan premium untuk acara klien Anda
          </p>
        </div>

        <Link href="/invitations/create">
          <button className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors">
            + Buat Undangan dengan Template
          </button>
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES_REGISTRY.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-[#fffdf9] rounded-[24px] overflow-hidden border border-[#ecdcc8]/70 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative w-full h-56 bg-zinc-100 overflow-hidden">
                <Image
                  src={tpl.thumbnail}
                  alt={tpl.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md">
                    {tpl.themeCategory}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Siap Pakai
                  </span>
                  <span className="text-xs font-mono text-zinc-400">v{tpl.version}</span>
                </div>

                <h3 className="font-bold text-base text-zinc-900 group-hover:text-amber-700 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                  Nuansa alam botanis hijau sage, monogram kaligrafi, bingkai vintage mirror, RSVP, dan live countdown.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex gap-2">
              <Link
                href={`/designer/templates/${tpl.slug}`}
                className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 text-center hover:bg-zinc-100 transition-colors"
              >
                Pratinjau HP
              </Link>
              <Link
                href={`/invitations/create?theme=${tpl.slug}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold text-center transition-colors shadow-xs"
              >
                Gunakan Desain
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
