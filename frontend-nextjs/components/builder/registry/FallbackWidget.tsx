import React from "react";
import { WidgetRendererProps } from "./types";

export function FallbackWidget({
  id,
  name,
}: WidgetRendererProps & { type?: string }) {
  return (
    <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-center text-xs shadow-xs my-2">
      <span className="text-2xl block mb-1">⚠️</span>
      <h4 className="font-bold text-amber-900 dark:text-amber-200">
        Widget Tidak Terdaftar: [{name || id}]
      </h4>
      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 max-w-xs mx-auto leading-relaxed">
        Komponen renderer untuk widget ini belum terdaftar di <code>WIDGET_REGISTRY</code> atau tidak tersedia. Fallback aman aktif.
      </p>
    </div>
  );
}
