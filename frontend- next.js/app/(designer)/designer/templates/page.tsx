import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TEMPLATES_REGISTRY } from "./themes/registry";

export default function DesignerTemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Katalog Desain Template
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Daftar template undangan berbasis skema data JSON dan status persetujuan Admin (PRD v3.0 Bagian 19).
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white self-start sm:self-auto">
          + Buat Template Baru
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES_REGISTRY.map((tpl, index) => {
          const isFirstCard = index === 0; // Mogran & Laura

          return (
            <Card
              key={tpl.id}
              className={`overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                isFirstCard
                  ? "ring-2 ring-emerald-500/80 border-emerald-200 dark:border-emerald-800"
                  : ""
              }`}
            >
              <div>
                {/* Thumbnail Preview Area */}
                <div className="relative w-full h-48 bg-zinc-100 overflow-hidden group">
                  <Image
                    src={tpl.thumbnail}
                    alt={tpl.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-medium tracking-wide">
                      {tpl.themeCategory}
                    </span>
                  </div>

                  {isFirstCard && (
                    <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                      <span>✨</span>
                      <span>JSON Ready & Preview Aktif</span>
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        tpl.status === "Published"
                          ? "success"
                          : tpl.status === "Pending Review"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {tpl.status}
                    </Badge>
                    <span className="text-xs font-mono text-zinc-400">
                      v{tpl.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 transition-colors">
                    <Link href={`/designer/templates/${tpl.slug}`}>
                      {tpl.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {tpl.slug === "wedding" || tpl.id === "template-wedding" || tpl.id === "template-130"
                      ? "Nuansa alam botanis hijau sage, monogram kaligrafi, bingkai vintage mirror, RSVP, dan countdown."
                      : "Template bertema elegan dan minimalis modern dengan layout fleksibel."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 flex justify-between">
                    <span>Terakhir Diubah</span>
                    <span>{tpl.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 mt-2">
                <Link
                  href={`/designer/templates/${tpl.slug}`}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 py-2.5 px-4 rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>👁️</span>
                  <span>Pratinjau Desain (Preview HP)</span>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

