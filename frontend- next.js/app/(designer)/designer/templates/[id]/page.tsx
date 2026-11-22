"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Trash2,
  Monitor,
  Edit,
  AlertCircle,
  FileEdit,
  Maximize2,
  Smartphone,
  Send,
  Tablet,
} from "lucide-react";
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
      <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs py-12 text-center">
        <Empty description="Template tidak ditemukan pada data sesi ini.">
          <Link href="/designer/templates">
            <Button
              type="primary"
              icon={<ArrowLeft size={16} strokeWidth={1.8} />}
              className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
            >
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
              <Button
                type="primary"
                icon={<Edit size={15} strokeWidth={1.8} />}
                className="mt-2 !bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
              >
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
                <Button
                  type="primary"
                  icon={<Edit size={15} strokeWidth={1.8} />}
                  className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
                >
                  {hasRejectionOrRevision
                    ? "Kembali Mengedit di Builder"
                    : "Edit di Builder"}
                </Button>
              </Link>
            )}

            {(isDraft || isRejected || isRevision) && (
              <Button
                icon={<Send size={15} strokeWidth={1.8} />}
                className="!rounded-lg"
                onClick={handleSubmitForReview}
              >
                Submit for Review
              </Button>
            )}

            {isPublished && (
              <Button
                type="primary"
                icon={<FileEdit size={15} strokeWidth={1.8} />}
                onClick={handleCreateRevision}
                className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
              >
                Create Revision
              </Button>
            )}

            <Button icon={<Copy size={15} strokeWidth={1.8} />} className="!rounded-lg" onClick={handleDuplicate}>
              Duplicate
            </Button>

            {!isLocked && (
              <Button danger icon={<Trash2 size={15} strokeWidth={1.8} />} className="!rounded-lg" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </Space>
        }
      />

      {/* 2. Status Banners: Revision / Rejected Catatan Admin */}
      {hasRejectionOrRevision && (
        <Card
          className="rounded-[10px] border-[#F8C8C4] bg-[#FFF8F7] shadow-xs"
          styles={{ body: { padding: "16px 20px" } }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} strokeWidth={1.8} className="mt-0.5 text-[#CB3025] shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <Text strong className="text-sm text-[#CB3025]">
                    Status: Memerlukan Revisi dari Desainer
                  </Text>
                  <Tag color="error" className="!rounded-[4px]">Catatan Kurator</Tag>
                </div>
                <div className="mt-1.5 rounded-lg border border-[#F8C8C4] bg-white p-3 text-xs text-[#CB3025]">
                  <Text strong className="block text-[#CB3025]">
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
                icon={<Edit size={15} strokeWidth={1.8} />}
                className="shrink-0 !rounded-lg"
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
          icon={<Clock size={16} strokeWidth={1.8} />}
          className="!rounded-[10px]"
          title="Template Dalam Antrean Review"
          description="Template ini sedang ditinjau oleh tim kurator InviteU. Selama proses peninjauan, template terkunci dari perubahan untuk menjaga konsistensi kurasi."
        />
      )}

      {isPublished && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircle2 size={16} strokeWidth={1.8} />}
          className="!rounded-[10px]"
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
                <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
                  Informasi Template
                </span>
                <div className="flex items-center gap-2">
                  <Tag color="blue" className="!mr-0 font-mono !rounded-[4px]">
                    v{template.version || "1.0"}
                  </Tag>
                  <DesignerStatusTag status={template.status} />
                </div>
              </div>
            }
            className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs"
            styles={{ body: { padding: 16 } }}
          >
            {/* Thumbnail Display */}
            {template.thumbnail && !thumbnailError ? (
              <div className="relative mb-4 aspect-video overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-[#F7F6F4]">
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
              <div className="mb-4 flex aspect-video items-center justify-center rounded-[10px] border border-dashed border-[#EAE5DF] bg-[#F7F6F4] text-xs text-[#99918A]">
                Thumbnail belum tersedia
              </div>
            )}

            <Title level={5} className="!mb-1 !font-['Playfair_Display'] !text-[#422B1C] !text-[17px]">
              {template.name}
            </Title>
            <Text className="block text-xs leading-relaxed text-[#99918A]">
              {template.description || "Belum ada deskripsi untuk template ini."}
            </Text>

            <Divider className="my-3 border-[#EAE5DF]" />

            {/* Metadata Descriptions */}
            <Descriptions
              column={1}
              size="small"
              styles={{ label: { width: "120px", color: "#99918A" } }}
              items={[
                {
                  key: "category",
                  label: "Kategori",
                  children: (
                    <Text strong className="text-xs text-[#422B1C]">
                      {template.category_name}
                    </Text>
                  ),
                },
                {
                  key: "style",
                  label: "Gaya Desain",
                  children: (
                    <Tag className="!mr-0 text-xs !rounded-[4px]">{template.style}</Tag>
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
                    <Text className="text-xs text-[#99918A]">
                      {formatDate(template.created_at)}
                    </Text>
                  ),
                },
                {
                  key: "updated",
                  label: "Terakhir Diedit",
                  children: (
                    <Text className="text-xs text-[#99918A]">
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
                <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
                  Feedback per Section
                </span>
                <Text className="text-xs text-[#99918A]">
                  {sectionFeedbacks.filter((s) => s.status === "issue").length}{" "}
                  catatan
                </Text>
              </div>
            }
            className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs"
            styles={{ body: { padding: "12px 16px" } }}
          >
            <div className="space-y-2.5">
              {sectionFeedbacks.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-2.5 text-xs transition-colors ${
                    item.status === "issue"
                      ? "border-[#F8C8C4] bg-[#FFF8F7]"
                      : "border-[#EAE5DF] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <Text strong className="text-xs text-[#422B1C]">
                      {item.sectionName}
                    </Text>
                    {item.status === "issue" ? (
                      <Tag color="error" className="!mr-0 !text-[10px] !rounded-[4px]">
                        Perlu Perbaikan
                      </Tag>
                    ) : (
                      <Tag color="success" className="!mr-0 !text-[10px] !rounded-[4px]">
                        Lulus Evaluasi
                      </Tag>
                    )}
                  </div>
                  <Text
                    className="mt-1 block text-[11px] leading-relaxed text-[#99918A]"
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
              <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
                Riwayat Pengajuan & Keputusan Admin
              </span>
            }
            className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs"
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Timeline
              className="!text-xs"
              items={reviewHistory.map((item) => ({
                color:
                  item.status === "approved"
                    ? "#258447"
                    : item.status === "rejected"
                      ? "#CB3025"
                      : item.status === "in_review"
                        ? "#FFAD38"
                        : "#99918A",
                content: (
                  <div>
                    <div className="flex items-center justify-between">
                      <Text strong className="text-xs text-[#422B1C]">
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-[#99918A]">
                        {item.date}
                      </Text>
                    </div>
                    <Text className="block text-[11px] text-[#99918A]">
                      Oleh: {item.actor}
                    </Text>
                    {item.note && (
                      <div className="mt-1 rounded-md border border-[#EAE5DF] bg-[#FFF8EE] p-2 text-[11px] italic text-[#422B1C]">
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
                <Smartphone size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
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
                    icon: <Smartphone size={14} strokeWidth={1.8} />,
                    label: "Phone Frame",
                  },
                  {
                    value: "mobile",
                    label: "Mobile (390px)",
                  },
                  {
                    value: "tablet",
                    icon: <Tablet size={14} strokeWidth={1.8} />,
                    label: "Tablet (768px)",
                  },
                  {
                    value: "desktop",
                    icon: <Monitor size={14} strokeWidth={1.8} />,
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
                icon={<Maximize2 size={14} strokeWidth={1.8} />}
                aria-label="Preview layar penuh"
                onClick={() => setIsFullscreen(true)}
              />
            </Space>
          }
          className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs"
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex min-h-[580px] items-start justify-center overflow-auto rounded-[10px] bg-[#F7F6F4] p-4">
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
              <div className="w-[390px] max-w-full overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-md">
                <div className="border-b border-[#EAE5DF] bg-[#FFF8EE] px-3 py-1.5 text-center text-[11px] font-medium text-[#422B1C]">
                  Mobile Screen (390px) · inviteu.id/preview/{template.slug}
                </div>
                <div className="h-[680px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}

            {previewMode === "tablet" && (
              <div className="w-[768px] max-w-full overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-md">
                <div className="border-b border-[#EAE5DF] bg-[#FFF8EE] px-4 py-2 text-center text-xs font-medium text-[#422B1C]">
                  Tablet Viewport (768px) · inviteu.id/preview/{template.slug}
                </div>
                <div className="h-[720px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}

            {previewMode === "desktop" && (
              <div className="w-full max-w-[1080px] overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-md">
                <div className="border-b border-[#EAE5DF] bg-[#FFF8EE] px-4 py-2 text-center text-xs font-medium text-[#422B1C]">
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
            <Smartphone size={16} strokeWidth={1.8} className="text-[#FFAD38]" />
            <span className="font-['Playfair_Display'] text-base font-semibold text-[#422B1C]">Pratinjau Layar Penuh — {template.name}</span>
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
        <div className="flex min-h-full items-start justify-center rounded-[10px] bg-[#F7F6F4] p-4 sm:items-center sm:p-8">
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
            <div className="w-[390px] max-w-full overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-xl">
              <div className="h-[min(88vh,820px)] overflow-y-auto">
                {previewContent}
              </div>
            </div>
          )}

          {previewMode === "tablet" && (
            <div className="w-[768px] max-w-full overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-xl">
              <div className="h-[min(88vh,840px)] overflow-y-auto">
                {previewContent}
              </div>
            </div>
          )}

          {previewMode === "desktop" && (
            <div className="w-full max-w-[1200px] overflow-hidden rounded-[10px] border border-[#EAE5DF] bg-white shadow-xl">
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
