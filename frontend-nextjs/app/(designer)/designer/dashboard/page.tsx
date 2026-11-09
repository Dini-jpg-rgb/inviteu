"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
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
          (Boolean(t.rejection_note) && normalizeStatus(t.status) !== "approved")
      ),
    [templates]
  );

  // Continue Working: Last modified draft or rejected template
  const lastActiveDraft = useMemo(() => {
    const editable = templates.filter((t) =>
      ["draft", "rejected"].includes(normalizeStatus(t.status))
    );
    if (!editable.length) return null;
    return [...editable].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
  }, [templates]);

  // Recent Templates for the compact list
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
      <div className="flex items-center justify-between border-b border-[#EBD9BE] pb-2.5">
        <Space size={6}>
          <Text strong className="text-sm text-[#3A2313]">
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
            className="!px-0 !text-xs !text-[#9A5A00]"
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
            className={`!cursor-pointer !rounded-md !px-2 !py-2.5 transition-colors hover:bg-[#FFF8EE] ${
              !item.read ? "bg-[#FFF8EE]/70" : ""
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
                  !item.read ? "bg-[#E99B22]" : "bg-transparent"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <Text
                    strong={!item.read}
                    className="truncate text-xs text-[#3A2313]"
                  >
                    {item.title}
                  </Text>
                  <Text type="secondary" className="shrink-0 text-[10px]">
                    {item.time}
                  </Text>
                </div>
                <Text
                  type="secondary"
                  className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed"
                >
                  {item.description}
                </Text>
                {item.link && (
                  <Link
                    href={item.link}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#9A5A00] hover:underline"
                    onClick={() => setIsNotifOpen(false)}
                  >
                    Buka template <RightOutlined className="text-[9px]" />
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
    <div className="space-y-5">
      {/* 1. Header & Quick Actions */}
      <DesignerPageHeader
        title="Dashboard"
        description="Ringkasan produktivitas, status template, dan tinjauan kurasi Anda."
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
                  icon={<BellOutlined />}
                  className="border-[#EBD9BE] hover:!border-[#FCB040] hover:!text-[#9A5A00]"
                  aria-label="Notifikasi review"
                >
                  Notifikasi
                </Button>
              </Badge>
            </Popover>

            <Link href="/designer/templates/create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="shadow-xs"
              >
                Create New Template
              </Button>
            </Link>
          </Space>
        }
      />

      {/* 2. Overview: 4 Metrics Cards (Compact & Informative) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Templates */}
        <Card
          className="border-[#EBD9BE] bg-white transition-all hover:border-[#FCB040]"
          styles={{ body: { padding: "14px 16px" } }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary" className="text-xs font-medium uppercase tracking-wider text-[#765D48]">
                Total Templates
              </Text>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-[#3A2313]">
                {totalTemplates}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF8EE] text-base text-[#9A5A00]">
              <FolderOpenOutlined />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#765D48]">
            Koleksi template terdaftar
          </div>
        </Card>

        {/* Draft */}
        <Card
          className="border-[#EBD9BE] bg-white transition-all hover:border-[#FCB040]"
          styles={{ body: { padding: "14px 16px" } }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary" className="text-xs font-medium uppercase tracking-wider text-[#765D48]">
                Draft
              </Text>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-[#3A2313]">
                {draftCount}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-base text-stone-700">
              <EditOutlined />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#765D48]">
            Sedang dalam pengerjaan
          </div>
        </Card>

        {/* Pending Review */}
        <Card
          className="border-[#EBD9BE] bg-white transition-all hover:border-[#FCB040]"
          styles={{ body: { padding: "14px 16px" } }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary" className="text-xs font-medium uppercase tracking-wider text-[#765D48]">
                Pending Review
              </Text>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-[#9A5A00]">
                {inReviewCount}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDEBD3] text-base text-[#9A5A00]">
              <ClockCircleOutlined />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#765D48]">
            Menunggu kurasi admin
          </div>
        </Card>

        {/* Published */}
        <Card
          className="border-[#EBD9BE] bg-white transition-all hover:border-[#FCB040]"
          styles={{ body: { padding: "14px 16px" } }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary" className="text-xs font-medium uppercase tracking-wider text-[#765D48]">
                Published
              </Text>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-[#267044]">
                {publishedCount}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-base text-[#267044]">
              <CheckCircleOutlined />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#765D48]">
            Aktif di katalog Partner
          </div>
        </Card>
      </div>

      {/* 3. Needs Attention Section (Revision / Rejected with Admin Note) */}
      {attentionTemplates.length > 0 && (
        <Card
          className="border-[#F3C5C0] bg-[#FFF5F4]"
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B84438]/10 text-base text-[#B84438]">
                <ExclamationCircleOutlined />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Text strong className="text-sm text-[#7A2925]">
                    Needs Attention: Revisi Diperlukan
                  </Text>
                  <Tag color="error" className="!mr-0 !text-[11px] !font-medium">
                    {attentionTemplates.length} Template
                  </Tag>
                </div>
                {attentionTemplates.map((item) => (
                  <div key={item.id} className="mt-1.5 text-xs text-[#7A2925]">
                    <span className="font-semibold">{item.name}</span>:{" "}
                    <span className="italic">
                      &quot;{item.rejection_note || "Admin meminta perbaikan sebelum disetujui."}&quot;
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/designer/templates/${attentionTemplates[0].id}/edit`}>
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<EditOutlined />}
                  className="text-xs"
                >
                  Perbaiki di Builder
                </Button>
              </Link>
              <Link href={`/designer/templates/${attentionTemplates[0].id}`}>
                <Button size="small" className="text-xs">
                  Lihat Catatan
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Main Grid: Continue Working & Recent Activity */}
      <Row gutter={[16, 16]}>
        {/* Left Column: Continue Working & Quick Templates */}
        <Col xs={24} lg={15}>
          <div className="space-y-4">
            {/* Continue Working Card */}
            {lastActiveDraft && (
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-[#9A5A00]" />
                    <span className="text-sm font-semibold text-[#3A2313]">
                      Continue Working
                    </span>
                  </div>
                }
                extra={
                  <Text type="secondary" className="text-xs">
                    Terakhir diedit: {formatDate(lastActiveDraft.updated_at)}
                  </Text>
                }
                className="border-[#EBD9BE]"
                styles={{ body: { padding: "16px 20px" } }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    {lastActiveDraft.thumbnail ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#EBD9BE] bg-[#FFF8EE]">
                        <Image
                          src={lastActiveDraft.thumbnail}
                          alt={lastActiveDraft.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#EBD9BE] bg-[#FFF8EE] text-[#9A5A00]">
                        <FileTextOutlined className="text-2xl" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Title level={5} className="!mb-0 truncate !text-[15px]">
                          {lastActiveDraft.name}
                        </Title>
                        <DesignerStatusTag status={lastActiveDraft.status} />
                      </div>
                      <Text type="secondary" className="mt-0.5 block truncate text-xs">
                        {lastActiveDraft.category_name} · {lastActiveDraft.style}
                      </Text>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: lastActiveDraft.primaryColor }}
                          title={`Primary ${lastActiveDraft.primaryColor}`}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: lastActiveDraft.secondaryColor }}
                          title={`Secondary ${lastActiveDraft.secondaryColor}`}
                        />
                        <span className="text-[11px] text-[#765D48]">
                          {lastActiveDraft.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/designer/templates/${lastActiveDraft.id}/edit`}>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        className="text-xs"
                      >
                        Lanjutkan Mengedit
                      </Button>
                    </Link>
                    <Link href={`/designer/templates/${lastActiveDraft.id}`}>
                      <Button size="small" className="text-xs">
                        Preview
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Templates List */}
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#3A2313]">
                    Template Terbaru
                  </span>
                  <Link href="/designer/templates">
                    <Button type="link" size="small" className="!px-0 !text-xs !text-[#9A5A00]">
                      Lihat Semua ({totalTemplates}) <ArrowRightOutlined />
                    </Button>
                  </Link>
                </div>
              }
              className="border-[#EBD9BE]"
              styles={{ body: { padding: 0 } }}
            >
              {recentTemplates.length ? (
                <div className="divide-y divide-[#EBD9BE]">
                  {recentTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#FFF8EE]/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: template.primaryColor || "#FCB040" }}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/designer/templates/${template.id}`}
                            className="block truncate font-medium text-xs sm:text-sm text-[#3A2313] hover:!text-[#9A5A00]"
                          >
                            {template.name}
                          </Link>
                          <Text type="secondary" className="block truncate text-[11px]">
                            {template.category_name} · Diperbarui {formatDate(template.updated_at)}
                          </Text>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <DesignerStatusTag status={template.status} />
                        <Link href={`/designer/templates/${template.id}`}>
                          <Button type="text" size="small" className="!text-xs">
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Empty description="Belum ada template yang dibuat" />
                </div>
              )}
            </Card>
          </div>
        </Col>

        {/* Right Column: Recent Activity & Review Decisions */}
        <Col xs={24} lg={9}>
          <div className="space-y-4">
            {/* Recent Activity Card */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-[#9A5A00]" />
                  <span className="text-sm font-semibold text-[#3A2313]">
                    Recent Activity & Reviews
                  </span>
                </div>
              }
              className="border-[#EBD9BE]"
              styles={{ body: { padding: "16px 20px" } }}
            >
              <Timeline
                className="!text-xs"
                items={[
                  {
                    color: "#B84438",
                    children: (
                      <div>
                        <div className="flex items-center justify-between">
                          <Text strong className="text-xs text-[#7A2925]">
                            Catatan Revisi Admin
                          </Text>
                          <Text type="secondary" className="text-[10px]">
                            Hari ini
                          </Text>
                        </div>
                        <Text type="secondary" className="mt-0.5 block text-[11px]">
                          Admin meminta perbaikan kontras teks pada <strong>Modern Intimate</strong>.
                        </Text>
                      </div>
                    ),
                  },
                  {
                    color: "#9A5A00",
                    children: (
                      <div>
                        <div className="flex items-center justify-between">
                          <Text strong className="text-xs text-[#3A2313]">
                            Diajukan untuk Review
                          </Text>
                          <Text type="secondary" className="text-[10px]">
                            Kemarin
                          </Text>
                        </div>
                        <Text type="secondary" className="mt-0.5 block text-[11px]">
                          Template <strong>Garden Evening</strong> telah diajukan ke kurator.
                        </Text>
                      </div>
                    ),
                  },
                  {
                    color: "#267044",
                    children: (
                      <div>
                        <div className="flex items-center justify-between">
                          <Text strong className="text-xs text-[#267044]">
                            Template Approved
                          </Text>
                          <Text type="secondary" className="text-[10px]">
                            3 hari lalu
                          </Text>
                        </div>
                        <Text type="secondary" className="mt-0.5 block text-[11px]">
                          <strong>Botanical Wedding</strong> disetujui dan aktif di katalog publik.
                        </Text>
                      </div>
                    ),
                  },
                  {
                    color: "gray",
                    children: (
                      <div>
                        <div className="flex items-center justify-between">
                          <Text strong className="text-xs text-[#3A2313]">
                            Draft Dibuat
                          </Text>
                          <Text type="secondary" className="text-[10px]">
                            5 hari lalu
                          </Text>
                        </div>
                        <Text type="secondary" className="mt-0.5 block text-[11px]">
                          Inisialisasi tema Botanical Wedding v1.0 pada Page Builder.
                        </Text>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>

            {/* Quick Actions Shortcuts */}
            <Card
              title={
                <span className="text-xs font-semibold uppercase tracking-wider text-[#765D48]">
                  Quick Actions
                </span>
              }
              className="border-[#EBD9BE] bg-[#FFF8EE]/60"
              styles={{ body: { padding: "12px 16px" } }}
            >
              <div className="grid grid-cols-1 gap-2">
                <Link href="/designer/templates/create">
                  <Button
                    block
                    type="dashed"
                    icon={<PlusOutlined />}
                    className="!justify-start text-xs hover:!border-[#FCB040] hover:!text-[#9A5A00]"
                  >
                    Buat Template Baru
                  </Button>
                </Link>
                <Link href="/designer/templates">
                  <Button
                    block
                    type="text"
                    icon={<FolderOpenOutlined />}
                    className="!justify-start text-xs hover:!bg-[#FDEBD3]"
                  >
                    Kelola Semua Template ({totalTemplates})
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
