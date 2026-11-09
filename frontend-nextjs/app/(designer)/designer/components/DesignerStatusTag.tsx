"use client";

import React from "react";
import { Tag } from "antd";

const statusTokens: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "draft" },
  approved: { label: "Aktif", className: "active" },
  published: { label: "Aktif", className: "active" },
  active: { label: "Aktif", className: "active" },
  aktif: { label: "Aktif", className: "active" },
  expired: { label: "Kedaluwarsa", className: "expired" },
  kedaluwarsa: { label: "Kedaluwarsa", className: "expired" },
  archived: { label: "Diarsipkan", className: "archived" },
  diarsipkan: { label: "Diarsipkan", className: "archived" },
  inactive: { label: "Nonaktif", className: "inactive" },
  in_review: { label: "Dalam review", className: "review" },
  pending: { label: "Dalam review", className: "review" },
  pending_review: { label: "Dalam review", className: "review" },
  rejected: { label: "Perlu revisi", className: "rejected" },
  revision: { label: "Perlu revisi", className: "rejected" },
  revisi: { label: "Perlu revisi", className: "rejected" },
};

export function DesignerStatusTag({
  status,
}: {
  status: string;
}) {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const token = statusTokens[normalized] ?? {
    label: status,
    className: "unknown",
  };
  return (
    <Tag className={`designer-status-tag designer-status-${token.className}`}>
      {token.label}
    </Tag>
  );
}
