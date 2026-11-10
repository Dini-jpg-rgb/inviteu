import React, { Suspense } from "react";
import { PageBuilder } from "@/components/builder/PageBuilder";

export default function DesignerTemplateBuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#2D1C15] flex items-center justify-center text-white text-xs">Memuat Page Builder...</div>}>
      <PageBuilder role="designer" />
    </Suspense>
  );
}

