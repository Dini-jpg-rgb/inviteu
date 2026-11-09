"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  FullscreenOutlined,
  MobileOutlined,
  SendOutlined,
  TabletOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Segmented,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { DesignerPageHeader } from "../../components/DesignerPageHeader";
import { DesignerInvitationFrame } from "../../components/DesignerInvitationFrame";
import { DesignerStatusTag } from "../../components/DesignerStatusTag";
import { useDesignerTemplates } from "../../DesignerTemplatesContext";

const { Text, Title } = Typography;

type DevicePreviewMode = "phone" | "mobile" | "tablet" | "desktop";

interface SectionFeedbackItem {
  sectionName: string;
  sectionType: string;
  status: "issue" | "passed";
  note: string;
}

interface ReviewHistoryItem {
  date: string;
  title: string;
  actor: string;
  status: "approved" | "rejected" | "in_review" | "draft";
  note?: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function normalizeStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "pending_review" || normalized === "pending") {
    return "in_review";
  }
  if (normalized === "published" || normalized === "active") {
    return "approved";
  }
  if (normalized === "revisi") {
    return "revision";
  }
  return normalized;
}

export default function TemplatePreviewPage() {
  const { message } = AntdApp.useApp();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const {
    getTemplate,
    duplicateTemplate,
    createRevision,
    submitForReview,
    deleteTemplate,
  } = useDesignerTemplates();

  const template = getTemplate(id);

  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [previewMode, setPreviewMode] = useState<DevicePreviewMode>("phone");

  const status = template ? normalizeStatus(template.status) : "draft";
  const isDraft = status === "draft";
  const isPending = status === "in_review";
  const isPublished = status === "approved";
  const isRejected = status === "rejected";
  const isRevision = status === "revision";

  const isLocked = isPending;
  const isActionableForEdit = isDraft || isRejected || isRevision;
  const hasRejectionOrRevision = isRejected || isRevision || Boolean(template?.rejection_note);

  // Generate Review History timeline dynamically based on template state
  const reviewHistory = useMemo<ReviewHistoryItem[]>(() => {
    if (!template) return [];

    const history: ReviewHistoryItem[] = [];

    // Draft created
    history.push({
      date: formatDate(template.created_at),
      title: "Draft Template Diinisialisasi",
      actor: "Designer (Anda)",
      status: "draft",
      note: `Inisialisasi template versi ${template.version || "1.0"}.`,
    });

    if (isPending || isPublished || isRejected || isRevision) {
      history.push({
        date: formatDate(template.updated_at),
        title: "Template Diajukan untuk Review",
        actor: "Designer (Anda)",
        status: "in_review",
        note: "Pengajuan kurasi desain template ke Admin.",
      });
    }

    if (isPublished) {
      history.push({
        date: formatDate(template.updated_at),
        title: "Disetujui untuk Publikasi",
        actor: "Admin Kurator InviteU",
        status: "approved",
        note: "Desain telah diverifikasi dan siap digunakan oleh Partner.",
      });
    } else if (hasRejectionOrRevision) {
      history.push({
        date: formatDate(template.updated_at),
        title: "Keputusan: Perlu Revisi / Ditolak",
        actor: "Admin Kurator InviteU",
        status: "rejected",
        note:
          template.rejection_note ||
          "Terdapat catatan kurasi yang perlu diperbaiki sebelum publikasi.",
      });
    }

    return history.reverse();
  }, [template, isPending, isPublished, isRejected, isRevision, hasRejectionOrRevision]);

  // Generate section-specific feedback
  const sectionFeedbacks = useMemo<SectionFeedbackItem[]>(() => {
    if (!template) return [];

    if (isRejected || isRevision || template.rejection_note) {
      return [
        {
          sectionName: "Cover & Hero",
          sectionType: "cover",
          status: "issue",
          note: "Kontras warna teks terhadap gambar latar kurang optimal. Disarankan menaikkan ketebalan teks atau menyesuaikan overlay.",
        },
        {
          sectionName: "Event Details",
          sectionType: "event_details",
          status: "issue",
          note: "Pastikan koordinat lokasi acara dan petunjuk Google Maps terisi dengan jelas.",
        },
        {
          sectionName: "Penutup & Ucapan",
          sectionType: "quote_banner",
          status: "passed",
          note: "Format teks dan tata letak quote sudah rapi dan sesuai standar.",
        },
      ];
    }

    return template.sections.map((section) => ({
      sectionName: section.name,
      sectionType: section.type,
      status: "passed",
      note: "Section memenuhi kriteria panduan desain InviteU.",
    }));
  }, [template, isRejected, isRevision]);

  if (!template) {
    return (
      <Card className="border-[#EBD9BE] py-12 text-center">
        <Empty description="Template tidak ditemukan pada data sesi ini.">
          <Link href="/designer/templates">
            <Button type="primary" icon={<ArrowLeftOutlined />}>
              Kembali ke Template Management
            </Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  const adjustZoom = (delta: number) => {
    setZoom((curr) => Math.min(130, Math.max(40, curr + delta)));
  };

  const handleDuplicate = () => {
    const duplicatedId = duplicateTemplate(template.id);
    if (duplicatedId) {
      message.success("Template berhasil diduplikasi.");
      router.push(`/designer/templates/${duplicatedId}`);
    }
  };

  const handleCreateRevision = () => {
    const revId = createRevision(template.id);
    if (revId) {
      message.success("Revisi baru berhasil dibuat.");
      router.push(`/designer/templates/${revId}/edit`);
    }
  };

  const handleSubmitForReview = () => {
    Modal.confirm({
      title: "Submit for Review?",
      content: `Template "${template.name}" akan diajukan ke tim kurator. Status akan beralih ke Pending Review.`,
      okText: "Submit",
      cancelText: "Batal",
      onOk: () => {
        submitForReview(template.id);
        message.success("Template berhasil diajukan untuk review.");
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Hapus template?",
      content: `"${template.name}" akan dihapus dari data template Anda.`,
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteTemplate(template.id);
        message.success("Template dihapus.");
        router.push("/designer/templates");
      },
    });
  };

  // Preview component wrapper
  const previewContent = (
    <InvitationRenderer
      sections={template.sections}
      className="min-h-full space-y-4 bg-white"
      emptyState={
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Canvas template masih kosong"
          />
          {isActionableForEdit && (
            <Link href={`/designer/templates/${template.id}/edit`}>
              <Button type="primary" icon={<EditOutlined />} className="mt-2">
                Buka Builder
              </Button>
            </Link>
          )}
        </div>
      }
    />
  );

  return (
    <div className="space-y-5">
      {/* 1. Header with Breadcrumb & Contextual Actions */}
      <DesignerPageHeader
        title={template.name}
        description="Detail spesifikasi template, riwayat keputusan kurasi, dan pratinjau multi-device."
        actions={
          <Space wrap size={8}>
            {/* Action sesuai status */}
            {isActionableForEdit && (
              <Link href={`/designer/templates/${template.id}/edit`}>
                <Button type="primary" icon={<EditOutlined />}>
                  {hasRejectionOrRevision
                    ? "Kembali Mengedit di Builder"
                    : "Edit di Builder"}
                </Button>
              </Link>
            )}

            {(isDraft || isRejected || isRevision) && (
              <Button
                icon={<SendOutlined />}
                onClick={handleSubmitForReview}
              >
                Submit for Review
              </Button>
            )}

            {isPublished && (
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={handleCreateRevision}
              >
                Create Revision
              </Button>
            )}

            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              Duplicate
            </Button>

            {!isLocked && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Delete
              </Button>
            )}
          </Space>
        }
      />

      {/* 2. Status Banners: Revision / Rejected Catatan Admin */}
      {hasRejectionOrRevision && (
        <Card
          className="border-[#F3C5C0] bg-[#FFF5F4]"
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <ExclamationCircleOutlined className="mt-1 text-xl text-[#B84438]" />
              <div>
                <div className="flex items-center gap-2">
                  <Text strong className="text-sm text-[#7A2925]">
                    Status: Memerlukan Revisi dari Desainer
                  </Text>
                  <Tag color="error">Catatan Kurator</Tag>
                </div>
                <div className="mt-1.5 rounded-md border border-[#F3C5C0] bg-white/80 p-3 text-xs text-[#7A2925]">
                  <Text strong className="block text-[#7A2925]">
                    General Feedback:
                  </Text>
                  <p className="mt-1 italic leading-relaxed">
                    &quot;{template.rejection_note || "Periksa kembali kontras tipografi dan keselarasan warna sebelum mengajukan ulang."}&quot;
                  </p>
                </div>
              </div>
            </div>

            <Link href={`/designer/templates/${template.id}/edit`}>
              <Button
                type="primary"
                danger
                icon={<EditOutlined />}
                className="shrink-0"
              >
                Lanjutkan Edit di Builder
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {isPending && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          title="Template Dalam Antrean Review"
          description="Template ini sedang ditinjau oleh tim kurator InviteU. Selama proses peninjauan, template terkunci dari perubahan untuk menjaga konsistensi kurasi."
        />
      )}

      {isPublished && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          title="Template Approved & Published"
          description="Template telah aktif di katalog Partner InviteU. Untuk melakukan modifikasi, gunakan fitur 'Create Revision' agar template yang sudah digunakan Partner tidak terganggu."
        />
      )}

      {/* 3. Main Split View: Left (Details & Feedback) vs Right (Multi-device Preview) */}
      <div className="grid gap-5 xl:grid-cols-[minmax(340px,1fr)_minmax(0,1.8fr)]">
        {/* Left Column: Template Information & Feedback */}
        <div className="space-y-4">
          {/* Card: Info & Versi Template */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#3A2313]">
                  Informasi Template
                </span>
                <div className="flex items-center gap-2">
                  <Tag color="blue" className="!mr-0 font-mono">
                    v{template.version || "1.0"}
                  </Tag>
                  <DesignerStatusTag status={template.status} />
                </div>
              </div>
            }
            className="border-[#EBD9BE]"
            styles={{ body: { padding: 16 } }}
          >
            {/* Thumbnail Display */}
            {template.thumbnail && !thumbnailError ? (
              <div className="relative mb-4 aspect-video overflow-hidden rounded-lg border border-[#EBD9BE] bg-[#FDEBD3]">
                <Image
                  src={template.thumbnail}
                  alt={`Thumbnail ${template.name}`}
                  fill
                  sizes="(max-width: 1280px) 100vw, 40vw"
                  loading="eager"
                  className="object-cover"
                  unoptimized
                  onError={() => setThumbnailError(true)}
                />
              </div>
            ) : (
              <div className="mb-4 flex aspect-video items-center justify-center rounded-lg border border-dashed border-[#EBD9BE] bg-[#FFF8EE] text-xs text-[#765D48]">
                Thumbnail belum tersedia
              </div>
            )}

            <Title level={5} className="!mb-1">
              {template.name}
            </Title>
            <Text type="secondary" className="block text-xs leading-relaxed">
              {template.description || "Belum ada deskripsi untuk template ini."}
            </Text>

            <Divider className="my-3 border-[#EBD9BE]" />

            {/* Metadata Descriptions */}
            <Descriptions
              column={1}
              size="small"
              styles={{ label: { width: "120px", color: "#765D48" } }}
              items={[
                {
                  key: "category",
                  label: "Kategori",
                  children: (
                    <Text strong className="text-xs text-[#3A2313]">
                      {template.category_name}
                    </Text>
                  ),
                },
                {
                  key: "style",
                  label: "Gaya Desain",
                  children: (
                    <Tag className="!mr-0 text-xs">{template.style}</Tag>
                  ),
                },
                {
                  key: "slug",
                  label: "Template Slug",
                  children: (
                    <Text code className="text-xs">
                      {template.slug}
                    </Text>
                  ),
                },
                {
                  key: "colors",
                  label: "Palet Warna",
                  children: (
                    <Space size={8}>
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: template.primaryColor }}
                        title={`Primary: ${template.primaryColor}`}
                      />
                      <Text className="text-xs">{template.primaryColor}</Text>
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: template.secondaryColor }}
                        title={`Secondary: ${template.secondaryColor}`}
                      />
                      <Text className="text-xs">{template.secondaryColor}</Text>
                    </Space>
                  ),
                },
                {
                  key: "created",
                  label: "Dibuat",
                  children: (
                    <Text className="text-xs text-[#765D48]">
                      {formatDate(template.created_at)}
                    </Text>
                  ),
                },
                {
                  key: "updated",
                  label: "Terakhir Diedit",
                  children: (
                    <Text className="text-xs text-[#765D48]">
                      {formatDate(template.updated_at)}
                    </Text>
                  ),
                },
              ]}
            />
          </Card>

          {/* Card: Section-Specific Feedback */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#3A2313]">
                  Feedback per Section
                </span>
                <Text type="secondary" className="text-xs">
                  {sectionFeedbacks.filter((s) => s.status === "issue").length}{" "}
                  catatan
                </Text>
              </div>
            }
            className="border-[#EBD9BE]"
            styles={{ body: { padding: "12px 16px" } }}
          >
            <div className="space-y-2.5">
              {sectionFeedbacks.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-2.5 text-xs transition-colors ${
                    item.status === "issue"
                      ? "border-[#F3C5C0] bg-[#FFF5F4]"
                      : "border-[#EBD9BE] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <Text strong className="text-xs text-[#3A2313]">
                      {item.sectionName}
                    </Text>
                    {item.status === "issue" ? (
                      <Tag color="error" className="!mr-0 !text-[10px]">
                        Perlu Perbaikan
                      </Tag>
                    ) : (
                      <Tag color="success" className="!mr-0 !text-[10px]">
                        Lulus Evaluasi
                      </Tag>
                    )}
                  </div>
                  <Text
                    type="secondary"
                    className="mt-1 block text-[11px] leading-relaxed text-[#765D48]"
                  >
                    {item.note}
                  </Text>
                </div>
              ))}
            </div>
          </Card>

          {/* Card: Riwayat Pengajuan & Keputusan Admin */}
          <Card
            title={
              <span className="text-sm font-semibold text-[#3A2313]">
                Riwayat Pengajuan & Keputusan Admin
              </span>
            }
            className="border-[#EBD9BE]"
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Timeline
              className="!text-xs"
              items={reviewHistory.map((item) => ({
                color:
                  item.status === "approved"
                    ? "#267044"
                    : item.status === "rejected"
                      ? "#B84438"
                      : item.status === "in_review"
                        ? "#9A5A00"
                        : "gray",
                children: (
                  <div>
                    <div className="flex items-center justify-between">
                      <Text strong className="text-xs text-[#3A2313]">
                        {item.title}
                      </Text>
                      <Text type="secondary" className="text-[10px]">
                        {item.date}
                      </Text>
                    </div>
                    <Text type="secondary" className="block text-[11px] text-[#765D48]">
                      Oleh: {item.actor}
                    </Text>
                    {item.note && (
                      <div className="mt-1 rounded bg-[#FFF8EE] p-2 text-[11px] italic text-[#765D48]">
                        &quot;{item.note}&quot;
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </div>

        {/* Right Column: Multi-device Live Preview */}
        <Card
          title={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Space size={6}>
                <MobileOutlined className="text-[#9A5A00]" />
                <span className="text-sm font-semibold text-[#3A2313]">
                  Pratinjau Undangan
                </span>
              </Space>

              {/* Multi-device switcher: Phone, Mobile, Tablet, Desktop */}
              <Segmented
                value={previewMode}
                onChange={(val) => setPreviewMode(val as DevicePreviewMode)}
                options={[
                  {
                    value: "phone",
                    icon: <MobileOutlined />,
                    label: "Phone Frame",
                  },
                  {
                    value: "mobile",
                    label: "Mobile (390px)",
                  },
                  {
                    value: "tablet",
                    icon: <TabletOutlined />,
                    label: "Tablet (768px)",
                  },
                  {
                    value: "desktop",
                    icon: <DesktopOutlined />,
                    label: "Desktop",
                  },
                ]}
              />
            </div>
          }
          extra={
            <Space size={4}>
              {previewMode === "phone" && (
                <Button.Group size="small">
                  <Button onClick={() => adjustZoom(-10)}>-</Button>
                  <Button onClick={() => setZoom(100)}>{zoom}%</Button>
                  <Button onClick={() => adjustZoom(10)}>+</Button>
                </Button.Group>
              )}
              <Button
                size="small"
                icon={<FullscreenOutlined />}
                aria-label="Preview layar penuh"
                onClick={() => setIsFullscreen(true)}
              />
            </Space>
          }
          className="border-[#EBD9BE]"
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex min-h-[580px] items-start justify-center overflow-auto rounded-lg bg-[#FDEBD3]/40 p-4">
            {previewMode === "phone" && (
              <DesignerInvitationFrame
                url={`inviteu.id/preview/${template.slug}`}
                title={template.name}
                zoom={zoom}
              >
                {previewContent}
              </DesignerInvitationFrame>
            )}

            {previewMode === "mobile" && (
              <div className="w-[390px] max-w-full overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-md">
                <div className="border-b border-[#EBD9BE] bg-[#FFF8EE] px-3 py-1.5 text-center text-[11px] text-[#765D48]">
                  Mobile Screen (390px) · inviteu.id/preview/{template.slug}
                </div>
                <div className="h-[680px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}

            {previewMode === "tablet" && (
              <div className="w-[768px] max-w-full overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-md">
                <div className="border-b border-[#EBD9BE] bg-[#FFF8EE] px-4 py-2 text-center text-xs text-[#765D48]">
                  Tablet Viewport (768px) · inviteu.id/preview/{template.slug}
                </div>
                <div className="h-[720px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}

            {previewMode === "desktop" && (
              <div className="w-full max-w-[1080px] overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-md">
                <div className="border-b border-[#EBD9BE] bg-[#FFF8EE] px-4 py-2 text-center text-xs text-[#765D48]">
                  Desktop Viewport (100%) · inviteu.id/preview/{template.slug}
                </div>
                <div className="h-[760px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 4. Fullscreen Modal Preview */}
      <Modal
        open={isFullscreen}
        title={
          <Space>
            <MobileOutlined />
            <span>Pratinjau Layar Penuh — {template.name}</span>
          </Space>
        }
        onCancel={() => setIsFullscreen(false)}
        footer={null}
        width="100vw"
        centered={false}
        styles={{
          wrapper: { padding: 0 },
          container: {
            height: "100dvh",
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
          },
          body: { flex: 1, minHeight: 0, overflow: "auto", padding: 16 },
        }}
      >
        <div className="flex min-h-full items-start justify-center rounded-lg bg-[#FDEBD3] p-4 sm:items-center sm:p-8">
          {previewMode === "phone" && (
            <DesignerInvitationFrame
              url={`inviteu.id/preview/${template.slug}`}
              title={template.name}
              zoom={zoom}
            >
              {previewContent}
            </DesignerInvitationFrame>
          )}

          {previewMode === "mobile" && (
            <div className="w-[390px] max-w-full overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-xl">
              <div className="h-[min(88vh,820px)] overflow-y-auto">
                {previewContent}
              </div>
            </div>
          )}

          {previewMode === "tablet" && (
            <div className="w-[768px] max-w-full overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-xl">
              <div className="h-[min(88vh,840px)] overflow-y-auto">
                {previewContent}
              </div>
            </div>
          )}

          {previewMode === "desktop" && (
            <div className="w-full max-w-[1200px] overflow-hidden rounded-xl border border-[#EBD9BE] bg-white shadow-xl">
              <div className="h-[min(88vh,880px)] overflow-y-auto">
                {previewContent}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
