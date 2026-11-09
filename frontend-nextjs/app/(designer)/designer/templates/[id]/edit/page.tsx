"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BuilderLayout } from "@/components/builder/BuilderLayout";

export default function EditTemplatePage() {
  const params = useParams();
  const idOrSlug = (params?.id as string) || "wedding";

  return (
    <BuilderLayout
      mode="edit"
      initialData={{
        id: idOrSlug,
        name: "Memuat template...",
        slug: "",
        themeCategory: "",
        status: "draft",
        version: "1.0",
        primaryColor: "#6f7f5f",
        secondaryColor: "#455633",
      }}
    />
  );
}
