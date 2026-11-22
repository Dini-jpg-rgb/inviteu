"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  Filter,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Card,
  Empty,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import { DesignerPageHeader } from "../components/DesignerPageHeader";
import { useDesignerTemplates } from "../DesignerTemplatesContext";
import { DesignerStatusTag } from "../components/DesignerStatusTag";

const { Text, Title } = Typography;

interface RevisionEntry {
  templateId: number | string;
  templateName: string;
  thumbnail?: string;
  category: string;
  status: string;
  date: string;
  curatorNote: string;
  isIssue: boolean;
  version: string;
}

export default function DesignerRevisionsPage() {
  const { templates } = useDesignerTemplates();
  const [filterMode, setFilterMode] = useState<"all" | "pending_action" | "resolved">("all");

  // Construct revision list from templates data
  const revisionEntries = useMemo<RevisionEntry[]>(() => {
    const list: RevisionEntry[] = [];

    templates.forEach((t) => {
      const normalized = t.status.toLowerCase();
      const hasNote = Boolean(t.rejection_note);
      const isRejected = normalized === "rejected" || normalized === "revision";
      const isApproved = normalized === "approved" || normalized === "published";

      if (isRejected || hasNote) {
        list.push({
          templateId: t.id,
          templateName: t.name,
          thumbnail: t.thumbnail,
          category: t.category_name,
          status: t.status,
          date: t.updated_at
            ? new Date(t.updated_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Hari ini",
          curatorNote:
            t.rejection_note ||
            "Periksa kembali kontras teks hero cover dan pastikan peta lokasi acara terhubung dengan jelas.",
          isIssue: true,
          version: t.version || "1.0",
        });
      } else if (isApproved) {
        list.push({
          templateId: t.id,
          templateName: t.name,
          thumbnail: t.thumbnail,
          category: t.category_name,
          status: t.status,
          date: t.updated_at
            ? new Date(t.updated_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "3 hari lalu",
          curatorNote: "Desain template telah memenuhi panduan estetika dan teknis InviteU. Template dipublikasikan ke katalog.",
          isIssue: false,
          version: t.version || "1.0",
        });
      }
    });

    return list;
  }, [templates]);

  const filteredEntries = useMemo(() => {
    if (filterMode === "pending_action") {
      return revisionEntries.filter((item) => item.isIssue);
    }
    if (filterMode === "resolved") {
      return revisionEntries.filter((item) => !item.isIssue);
    }
    return revisionEntries;
  }, [revisionEntries, filterMode]);

  const issueCount = revisionEntries.filter((r) => r.isIssue).length;
  const resolvedCount = revisionEntries.filter((r) => !r.isIssue).length;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <DesignerPageHeader
        title="Riwayat Revisi &amp; Kurasi"
        description="Pantau riwayat keputusan kurator InviteU, catatan perbaikan desain, dan status persetujuan publikasi."
        actions={
          <Link href="/designer/templates">
            <Button
              className="!rounded-lg border-[#EAE5DF] bg-white text-[#422B1C] hover:!border-[#FFAD38]"
            >
              Kembali ke My Templates
            </Button>
          </Link>
        }
      />

      {/* 2. Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <Segmented
          value={filterMode}
          onChange={(val) => setFilterMode(val as "all" | "pending_action" | "resolved")}
          className="p-1 bg-white border border-[#EAE5DF] rounded-[10px] shadow-xs"
          options={[
            { value: "all", label: `Semua Riwayat (${revisionEntries.length})` },
            { value: "pending_action", label: `Memerlukan Revisi (${issueCount})` },
            { value: "resolved", label: `Disetujui / Selesai (${resolvedCount})` },
          ]}
        />
        <Text className="text-xs text-[#99918A] hidden sm:inline">
          Diurutkan berdasarkan riwayat keputusan terbaru
        </Text>
      </div>

      {/* 3. Revisions List */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card
              key={entry.templateId}
              className={`rounded-[10px] border transition-all hover:shadow-xs ${
                entry.isIssue
                  ? "border-[#F8C8C4] bg-white"
                  : "border-[#EAE5DF] bg-white"
              }`}
              styles={{ body: { padding: "18px 22px" } }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-[8px] border border-[#EAE5DF] bg-[#F7F6F4]">
                    {entry.thumbnail ? (
                      <Image
                        src={entry.thumbnail}
                        alt={entry.templateName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-[#99918A]">
                        IU
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/designer/templates/${entry.templateId}`}
                        className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C] hover:text-[#FFAD38] truncate"
                      >
                        {entry.templateName}
                      </Link>
                      <Tag color="blue" className="!mr-0 font-mono !text-[10px] !rounded-[4px]">
                        v{entry.version}
                      </Tag>
                      <DesignerStatusTag status={entry.status} />
                    </div>

                    <Text className="block text-xs text-[#99918A] mb-3">
                      Kategori: {entry.category} · Tanggal Evaluasi: {entry.date} · Evaluator: Tim Kurator InviteU
                    </Text>

                    {/* Curator Note Box */}
                    <div
                      className={`rounded-lg border p-3 text-xs leading-relaxed ${
                        entry.isIssue
                          ? "border-[#F8C8C4] bg-[#FFF8F7] text-[#CB3025]"
                          : "border-[#BBE3CA] bg-[#EAF5EE] text-[#258447]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        {entry.isIssue ? (
                          <AlertCircle size={14} className="shrink-0" />
                        ) : (
                          <CheckCircle2 size={14} className="shrink-0" />
                        )}
                        <span>{entry.isIssue ? "Catatan Evaluasi Kurator:" : "Keputusan Kurasi:"}</span>
                      </div>
                      <p className="italic mb-0">&quot;{entry.curatorNote}&quot;</p>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex shrink-0 items-center sm:flex-col sm:items-end gap-2">
                  {entry.isIssue ? (
                    <Link href={`/designer/templates/${entry.templateId}/edit`}>
                      <Button
                        type="primary"
                        danger
                        icon={<Edit3 size={13} strokeWidth={2} />}
                        className="!rounded-lg text-xs !bg-[#CB3025] !border-[#CB3025]"
                      >
                        Perbaiki di Builder
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/designer/templates/${entry.templateId}`}>
                      <Button
                        type="primary"
                        icon={<Eye size={13} strokeWidth={2} />}
                        className="!rounded-lg text-xs !bg-[#FFAD38] !text-[#3D2516] hover:!bg-[#F5A623] !border-[#FFAD38] font-semibold"
                      >
                        Lihat Template
                      </Button>
                    </Link>
                  )}

                  <Link href={`/designer/templates/${entry.templateId}`}>
                    <Button
                      size="small"
                      className="!rounded-lg text-xs border-[#EAE5DF] text-[#422B1C] hover:!border-[#FFAD38]"
                    >
                      Detail Evaluasi
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs py-12 text-center">
          <Empty description="Tidak ada riwayat revisi pada filter ini.">
            <Link href="/designer/templates">
              <Button
                type="primary"
                className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
              >
                Lihat Semua Template
              </Button>
            </Link>
          </Empty>
        </Card>
      )}
    </div>
  );
}
