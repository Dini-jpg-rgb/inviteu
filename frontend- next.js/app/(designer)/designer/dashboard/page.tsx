"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  Edit3,
  AlertTriangle,
  FileText,
  FolderOpen,
  Plus,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Popover,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { DesignerPageHeader } from "../components/DesignerPageHeader";
import { useDesignerTemplates } from "../DesignerTemplatesContext";
import { DesignerStatusTag } from "../components/DesignerStatusTag";

const { Text, Title } = Typography;

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "warning" | "success" | "info";
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Catatan Revisi dari Admin",
    description:
      "Modern Intimate: Tambahkan detail lokasi acara dan periksa kembali kontras teks.",
    time: "20 menit lalu",
    read: false,
    type: "warning",
    link: "/designer/templates/702",
  },
  {
    id: "notif-2",
    title: "Template Dalam Antrean Review",
    description: "Garden Evening telah diterima sistem dan sedang dikurasi.",
    time: "2 jam lalu",
    read: false,
    type: "info",
    link: "/designer/templates/703",
  },
  {
    id: "notif-3",
    title: "Template Berhasil Disetujui",
    description: "Botanical Wedding telah dipublikasikan ke katalog Partner.",
    time: "1 hari lalu",
    read: true,
    type: "success",
    link: "/designer/templates/701",
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function DesignerDashboardPage() {
  const { templates } = useDesignerTemplates();
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const normalizeStatus = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "published" || normalized === "active") return "approved";
    if (normalized === "pending_review" || normalized === "pending") {
      return "in_review";
    }
    return normalized;
  };

  const countStatus = (status: string) =>
    templates.filter((template) => normalizeStatus(template.status) === status)
      .length;

  const totalTemplates = templates.length;
  const draftCount = countStatus("draft");
  const inReviewCount = countStatus("in_review");
  const publishedCount = countStatus("approved");

  // Needs Attention: Templates with status "rejected" or having rejection note
  const attentionTemplates = useMemo(
    () =>
      templates.filter(
        (t) =>
          normalizeStatus(t.status) === "rejected" ||
          normalizeStatus(t.status) === "revision" ||
          (Boolean(t.rejection_note) && normalizeStatus(t.status) !== "approved")
      ),
    [templates]
  );

  // Continue Working: Last modified draft or rejected template
  const lastActiveDraft = useMemo(() => {
    const editable = templates.filter((t) =>
      ["draft", "rejected", "revision"].includes(normalizeStatus(t.status))
    );
    if (!editable.length) return null;
    return [...editable].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
  }, [templates]);

  // Recent Templates for thumbnail-first display
  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 4);
  }, [templates]);

  // Notifications logic
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Notification Popover Content
  const notificationContent = (
    <div className="w-[320px] sm:w-[360px]">
      <div className="flex items-center justify-between border-b border-[#EAE5DF] pb-2.5">
        <Space size={6}>
          <Text strong className="text-sm text-[#422B1C]">
            Notifikasi
          </Text>
          {unreadCount > 0 && (
            <Tag color="warning" className="!mr-0 !text-[11px] !font-medium">
              {unreadCount} baru
            </Tag>
          )}
        </Space>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            className="!px-0 !text-xs !text-[#FFAD38] hover:!text-[#D48816]"
            onClick={markAllNotificationsRead}
          >
            Tandai dibaca
          </Button>
        )}
      </div>

      <List
        size="small"
        className="max-h-[300px] overflow-y-auto"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            className={`!cursor-pointer !rounded-md !px-2 !py-2.5 transition-colors hover:bg-[#FAF8F5] ${
              !item.read ? "bg-[#FFF8EE]/80" : ""
            }`}
            onClick={() => {
              markNotificationRead(item.id);
              if (item.link) {
                setIsNotifOpen(false);
              }
            }}
          >
            <div className="flex w-full items-start gap-2.5">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  !item.read ? "bg-[#FFAD38]" : "bg-transparent"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <Text
                    strong={!item.read}
                    className="truncate text-xs text-[#422B1C]"
                  >
                    {item.title}
                  </Text>
                  <Text type="secondary" className="shrink-0 text-[10px] text-[#99918A]">
                    {item.time}
                  </Text>
                </div>
                <Text
                  type="secondary"
                  className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#99918A]"
                >
                  {item.description}
                </Text>
                {item.link && (
                  <Link
                    href={item.link}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#FFAD38] hover:text-[#D48816] hover:underline"
                    onClick={() => setIsNotifOpen(false)}
                  >
                    Buka template <ChevronRight size={12} className="inline ml-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Editorial, concise, contextual) */}
      <DesignerPageHeader
        title="Dashboard Desainer"
        description="Ringkasan prioritas kurasi template, tanggapan feedback admin, dan alur kerja desain Anda."
        actions={
          <Space size={10} wrap>
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              open={isNotifOpen}
              onOpenChange={setIsNotifOpen}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 4]}>
                <Button
                  icon={<Bell size={15} strokeWidth={1.8} />}
                  className="!rounded-lg border-[#EAE5DF] bg-white text-[#422B1C] hover:!border-[#FFAD38] hover:!text-[#3D2516]"
                  aria-label="Notifikasi review"
                >
                  Notifikasi
                </Button>
              </Badge>
            </Popover>

            <Link href="/designer/templates/create">
              <Button
                type="primary"
                icon={<Plus size={16} strokeWidth={2.2} />}
                className="!rounded-lg shadow-xs font-semibold !bg-[#FFAD38] !text-[#3D2516] hover:!bg-[#F5A623] !border-[#FFAD38]"
              >
                Buat Template Baru
              </Button>
            </Link>
          </Space>
        }
      />

      {/* 2. Template Overview: Single Integrated Visual Group */}
      <div className="rounded-[10px] border border-[#EAE5DF] bg-white shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 divide-y divide-[#EAE5DF] sm:divide-y-0 sm:grid-cols-4 sm:divide-x">
          {/* 1. Total Templates */}
          <Link
            href="/designer/templates?status=all"
            className="group block p-5 sm:p-6 transition-colors hover:bg-[#FAF8F5]"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#99918A]">
              <span>Total Template</span>
              <span className="h-2 w-2 rounded-full bg-[#422B1C]/30" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#422B1C] group-hover:text-[#FFAD38] transition-colors">
              {totalTemplates}
            </div>
            <div className="mt-1 flex items-center text-xs text-[#99918A] group-hover:text-[#422B1C]">
              <span>Seluruh koleksi</span>
              <ChevronRight size={13} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* 2. Published */}
          <Link
            href="/designer/templates?status=approved"
            className="group block p-5 sm:p-6 transition-colors hover:bg-[#FAF8F5]"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#99918A]">
              <span>Telah Terbit</span>
              <span className="h-2 w-2 rounded-full bg-[#258447]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#258447]">
              {publishedCount}
            </div>
            <div className="mt-1 flex items-center text-xs text-[#99918A] group-hover:text-[#258447]">
              <span>Aktif di katalog</span>
              <ChevronRight size={13} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* 3. Pending Review */}
          <Link
            href="/designer/templates?status=in_review"
            className="group block p-5 sm:p-6 transition-colors hover:bg-[#FAF8F5]"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#99918A]">
              <span>Dalam Review</span>
              <span className="h-2 w-2 rounded-full bg-[#F5A623]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#F5A623]">
              {inReviewCount}
            </div>
            <div className="mt-1 flex items-center text-xs text-[#99918A] group-hover:text-[#F5A623]">
              <span>Menunggu kurasi</span>
              <ChevronRight size={13} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* 4. Needs Revision */}
          <Link
            href="/designer/templates?status=revision"
            className="group block p-5 sm:p-6 transition-colors hover:bg-[#FAF8F5]"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#99918A]">
              <span>Perlu Revisi</span>
              <span className="h-2 w-2 rounded-full bg-[#CB3025]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#CB3025]">
              {attentionTemplates.length}
            </div>
            <div className="mt-1 flex items-center text-xs text-[#99918A] group-hover:text-[#CB3025]">
              <span>Memerlukan tindak lanjut</span>
              <ChevronRight size={13} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Priority / Action Required Section */}
      {attentionTemplates.length > 0 ? (
        <div className="rounded-[10px] border border-[#F8C8C4] bg-[#FFF8F7] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-[#F8C8C4]/60">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} strokeWidth={2} className="text-[#CB3025] shrink-0" />
              <span className="font-semibold text-sm sm:text-base text-[#CB3025]">
                Prioritas: Tindakan Diperlukan
              </span>
            </div>
            <Tag color="error" className="!mr-0 !text-[11px] !font-medium !rounded-[4px] self-start sm:self-auto">
              {attentionTemplates.length} Template Perlu Revisi
            </Tag>
          </div>

          <div className="divide-y divide-[#F8C8C4]/50">
            {attentionTemplates.map((item) => (
              <div key={item.id} className="pt-4 pb-1 first:pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/designer/templates/${item.id}`}
                      className="font-['Playfair_Display'] text-[15px] sm:text-[16px] font-semibold text-[#422B1C] hover:text-[#CB3025] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-[#99918A]">{item.category_name}</span>
                    <DesignerStatusTag status={item.status} />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/designer/templates/${item.id}/edit`}>
                      <Button
                        type="primary"
                        danger
                        icon={<Edit3 size={13} strokeWidth={2} />}
                        className="!text-xs !rounded-lg !bg-[#CB3025] !border-[#CB3025] font-medium"
                      >
                        Perbaiki di Builder
                      </Button>
                    </Link>
                    <Link href={`/designer/templates/${item.id}`}>
                      <Button size="small" className="!text-xs !rounded-lg border-[#EAE5DF] bg-white text-[#422B1C] hover:!border-[#FFAD38]">
                        Lihat Catatan
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-[#F8C8C4]/60 bg-white/80 px-3.5 py-2.5 text-xs text-[#CB3025] leading-relaxed">
                  <span className="font-semibold mr-1.5">Catatan Kurator Admin:</span>
                  <span className="italic">&quot;{item.rejection_note || "Periksa kembali kontras tipografi dan keselarasan warna sebelum mengajukan ulang."}&quot;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-[#EAE5DF] bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF5EE] text-[#258447]">
                <CheckCircle2 size={14} strokeWidth={2} />
              </span>
              <Text className="text-xs text-[#422B1C]">
                <strong>Semua template dalam kondisi optimal.</strong> Tidak ada catatan revisi tertunda dari tim kurator.
              </Text>
            </div>
            {lastActiveDraft && (
              <Link
                href={`/designer/templates/${lastActiveDraft.id}/edit`}
                className="inline-flex items-center gap-1 font-semibold text-[#FFAD38] hover:underline shrink-0"
              >
                Lanjutkan edit &quot;{lastActiveDraft.name}&quot; <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Main Grid: Left (Recent Work & Templates) | Right (Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column (60%): Recent Work & Recent Templates */}
        <div className="lg:col-span-7 space-y-5 lg:space-y-6">
          {/* Continue Working Card */}
          {lastActiveDraft && (
            <div className="rounded-[10px] border border-[#EAE5DF] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE5DF]/70">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} strokeWidth={2} className="text-[#FFAD38]" />
                  <span className="font-['Playfair_Display'] text-base font-semibold text-[#422B1C]">
                    Lanjutkan Pengerjaan Terakhir
                  </span>
                </div>
                <span className="text-xs text-[#99918A]">
                  Diedit {formatDate(lastActiveDraft.updated_at)}
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-[8px] border border-[#EAE5DF] bg-[#FFF8EE]">
                    {lastActiveDraft.thumbnail ? (
                      <Image
                        src={lastActiveDraft.thumbnail}
                        alt={lastActiveDraft.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#FFAD38]">
                        <FileText size={24} strokeWidth={1.8} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={`/designer/templates/${lastActiveDraft.id}`}
                        className="truncate font-['Playfair_Display'] text-[15px] font-semibold text-[#422B1C] hover:text-[#FFAD38]"
                      >
                        {lastActiveDraft.name}
                      </Link>
                      <DesignerStatusTag status={lastActiveDraft.status} />
                    </div>
                    <p className="truncate text-xs text-[#99918A] mb-1">
                      {lastActiveDraft.category_name}
                      {lastActiveDraft.style ? ` · ${lastActiveDraft.style}` : ""}
                    </p>
                    <Tag color="gold" className="!mr-0 uppercase !text-[10px] !font-bold !rounded-[4px]">
                      {lastActiveDraft.packageTier || "Basic"}
                    </Tag>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Link href={`/designer/templates/${lastActiveDraft.id}`}>
                    <Button size="small" className="!rounded-lg text-xs border-[#EAE5DF] text-[#422B1C] hover:!border-[#FFAD38]">
                      Preview
                    </Button>
                  </Link>
                  <Link href={`/designer/templates/${lastActiveDraft.id}/edit`}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<Edit3 size={13} strokeWidth={2} />}
                      className="text-xs !bg-[#FFAD38] !text-[#3D2516] hover:!bg-[#F5A623] !border-[#FFAD38] font-semibold !rounded-lg"
                    >
                      Buka Builder
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Templates: Balanced 2-Column Grid with 16px gap */}
          <div className="rounded-[10px] border border-[#EAE5DF] bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE5DF]/70">
              <span className="font-['Playfair_Display'] text-base font-semibold text-[#422B1C]">
                Template Terbaru
              </span>
              <Link
                href="/designer/templates"
                className="text-xs text-[#FFAD38] font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua ({totalTemplates}) <ArrowRight size={13} />
              </Link>
            </div>

            {recentTemplates.length ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-[8px] border border-[#EAE5DF] bg-white transition-all hover:border-[#FFAD38] hover:shadow-xs"
                  >
                    {/* Thumbnail with fixed 16/10 aspect ratio */}
                    <div className="relative aspect-[16/10] w-full bg-[#F7F6F4] overflow-hidden border-b border-[#EAE5DF]">
                      {template.thumbnail ? (
                        <Image
                          src={template.thumbnail}
                          alt={template.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 30vw"
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#99918A]">
                          IU
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <DesignerStatusTag status={template.status} />
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                      <div>
                        <Link
                          href={`/designer/templates/${template.id}`}
                          className="block truncate font-['Playfair_Display'] text-[14px] font-semibold text-[#422B1C] hover:text-[#FFAD38]"
                        >
                          {template.name}
                        </Link>
                        <div className="flex items-center justify-between text-[11px] text-[#99918A] mt-1">
                          <span className="truncate">{template.category_name}</span>
                          <span className="shrink-0">{formatDate(template.updated_at)}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#EAE5DF]/70 pt-2 text-xs">
                        <Link href={`/designer/templates/${template.id}`}>
                          <Button size="small" type="text" className="!text-[11px] !px-1.5 text-[#422B1C] hover:text-[#FFAD38]">
                            Preview
                          </Button>
                        </Link>
                        <Link href={`/designer/templates/${template.id}/edit`}>
                          <Button size="small" type="link" className="!text-[11px] !px-1 text-[#FFAD38] font-semibold">
                            Edit di Builder
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Empty description="Belum ada template yang dibuat" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column (40%): Recent Activity (Chronological Milestones) */}
        <div className="lg:col-span-5">
          <div className="rounded-[10px] border border-[#EAE5DF] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 pb-3.5 border-b border-[#EAE5DF]/70">
                <Clock size={16} strokeWidth={1.8} className="text-[#FFAD38]" />
                <span className="font-['Playfair_Display'] text-base font-semibold text-[#422B1C]">
                  Aktivitas &amp; Keputusan Kurasi
                </span>
              </div>

              {/* Spaced-out Timeline List */}
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#258447] shrink-0 ring-4 ring-[#EAF5EE]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#258447]">Template Approved</span>
                      <span className="text-[11px] text-[#99918A]">3 hari lalu</span>
                    </div>
                    <p className="mt-1 text-xs text-[#99918A] leading-relaxed mb-0">
                      <strong className="text-[#422B1C]">Botanical Wedding</strong> disetujui dan aktif di katalog publik Partner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#F5A623] shrink-0 ring-4 ring-[#FFF8EE]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#422B1C]">Diajukan untuk Review</span>
                      <span className="text-[11px] text-[#99918A]">Kemarin</span>
                    </div>
                    <p className="mt-1 text-xs text-[#99918A] leading-relaxed mb-0">
                      Template <strong className="text-[#422B1C]">Garden Evening</strong> telah diajukan ke tim kurator InviteU.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#CB3025] shrink-0 ring-4 ring-[#FFF8F7]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#CB3025]">Catatan Revisi Kurator</span>
                      <span className="text-[11px] text-[#99918A]">Hari ini</span>
                    </div>
                    <p className="mt-1 text-xs text-[#99918A] leading-relaxed mb-0">
                      Admin meminta perbaikan kontras teks pada <strong className="text-[#422B1C]">Modern Intimate</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#99918A] shrink-0 ring-4 ring-[#F7F6F4]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#422B1C]">Draft Diinisialisasi</span>
                      <span className="text-[11px] text-[#99918A]">5 hari lalu</span>
                    </div>
                    <p className="mt-1 text-xs text-[#99918A] leading-relaxed mb-0">
                      Inisialisasi tema Botanical Wedding v1.0 pada Page Builder.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Footer */}
            <div className="mt-6 border-t border-[#EAE5DF] pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#99918A] block mb-2.5">
                Pintasan Cepat
              </span>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <Link
                  href="/designer/templates"
                  className="flex items-center gap-2 rounded-lg border border-[#EAE5DF] p-2.5 hover:border-[#FFAD38] transition-colors text-[#422B1C] font-medium hover:bg-[#FAF8F5]"
                >
                  <FolderOpen size={15} className="text-[#FFAD38] shrink-0" />
                  <span className="truncate">My Templates</span>
                </Link>
                <Link
                  href="/designer/revisions"
                  className="flex items-center gap-2 rounded-lg border border-[#EAE5DF] p-2.5 hover:border-[#FFAD38] transition-colors text-[#422B1C] font-medium hover:bg-[#FAF8F5]"
                >
                  <Clock size={15} className="text-[#FFAD38] shrink-0" />
                  <span className="truncate">Riwayat Revisi</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
