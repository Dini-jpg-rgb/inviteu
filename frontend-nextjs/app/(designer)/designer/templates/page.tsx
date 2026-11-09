"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppstoreOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FormOutlined,
  MoreOutlined,
  PlusOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Modal,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { DesignerPageHeader } from "../components/DesignerPageHeader";
import {
  LocalDesignerTemplate,
  useDesignerTemplates,
} from "../DesignerTemplatesContext";
import { DesignerStatusTag } from "../components/DesignerStatusTag";
import styles from "../../designer-workspace.module.css";

const { Text, Title } = Typography;

const PAGE_SIZE = 9;
type StatusFilter =
  | "all"
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "revision";
type SortOption =
  | "created_desc"
  | "updated_desc"
  | "name_asc"
  | "name_desc";

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

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

// Helper untuk menu aksi sesuai status template
function getActionItems(
  template: LocalDesignerTemplate,
  callbacks: {
    onDuplicate: (template: LocalDesignerTemplate) => void;
    onCreateRevision: (template: LocalDesignerTemplate) => void;
    onSubmit: (template: LocalDesignerTemplate) => void;
    onDelete: (template: LocalDesignerTemplate) => void;
  }
): MenuProps["items"] {
  const status = normalizeStatus(template.status);
  const isDraft = status === "draft";
  const isPublished = status === "approved";
  const isRejected = status === "rejected";
  const isRevision = status === "revision";

  const canEdit = isDraft || isRejected || isRevision;
  const canSubmit = isDraft || isRejected || isRevision;
  const canCreateRevision = isPublished || isRejected || isRevision;
  const canDelete = isDraft || isRejected || isRevision;

  return [
    {
      key: "preview",
      icon: <EyeOutlined />,
      label: <Link href={`/designer/templates/${template.id}`}>Preview</Link>,
    },
    ...(canEdit
      ? [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: (
              <Link href={`/designer/templates/${template.id}/edit`}>
                Edit di Builder
              </Link>
            ),
          },
        ]
      : []),
    {
      key: "duplicate",
      icon: <CopyOutlined />,
      label: "Duplicate",
      onClick: () => callbacks.onDuplicate(template),
    },
    ...(canCreateRevision
      ? [
          {
            key: "create-revision",
            icon: <FormOutlined />,
            label: "Create Revision",
            onClick: () => callbacks.onCreateRevision(template),
          },
        ]
      : []),
    ...(canSubmit
      ? [
          {
            key: "submit",
            icon: <SendOutlined />,
            label: "Submit for Review",
            onClick: () => callbacks.onSubmit(template),
          },
        ]
      : []),
    ...(canDelete
      ? [
          { type: "divider" as const },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            danger: true,
            label: "Delete",
            onClick: () => callbacks.onDelete(template),
          },
        ]
      : []),
  ];
}

// 1. Grid View Template Card Component
function TemplateCard({
  template,
  preloadThumbnail,
  onDuplicate,
  onCreateRevision,
  onDelete,
  onSubmit,
}: {
  template: LocalDesignerTemplate;
  preloadThumbnail: boolean;
  onDuplicate: (template: LocalDesignerTemplate) => void;
  onCreateRevision: (template: LocalDesignerTemplate) => void;
  onDelete: (template: LocalDesignerTemplate) => void;
  onSubmit: (template: LocalDesignerTemplate) => void;
}) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const status = normalizeStatus(template.status);
  const isEditable = status === "draft" || status === "rejected" || status === "revision";

  const actionItems = getActionItems(template, {
    onDuplicate,
    onCreateRevision,
    onSubmit,
    onDelete,
  });

  return (
    <Card
      hoverable
      className="h-full overflow-hidden border-[#EBD9BE] transition-all hover:border-[#FCB040]"
      styles={{ body: { padding: 16 } }}
      cover={
        <Link
          href={`/designer/templates/${template.id}`}
          aria-label={`Preview ${template.name}`}
          className="block"
        >
          <div className={styles.templateThumbnail}>
            {template.thumbnail && !thumbnailError ? (
              <Image
                src={template.thumbnail}
                alt={`Thumbnail ${template.name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={preloadThumbnail ? "eager" : "lazy"}
                className="object-cover"
                unoptimized
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#765D48]">
                Thumbnail belum tersedia
              </div>
            )}
            <div className="absolute right-2.5 top-2.5 z-10">
              <DesignerStatusTag status={template.status} />
            </div>
          </div>
        </Link>
      }
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/designer/templates/${template.id}`}>
            <Title
              level={5}
              className="!mb-0.5 !truncate !text-[15px] hover:!text-[#9A5A00]"
            >
              {template.name}
            </Title>
          </Link>
          <Text type="secondary" className="block truncate text-xs">
            {template.category_name} · {template.style}
          </Text>
        </div>
        <Dropdown menu={{ items: actionItems }} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            aria-label={`Aksi untuk ${template.name}`}
          />
        </Dropdown>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#EBD9BE] pt-2.5 text-xs">
        <Text type="secondary" className="truncate text-[11px]">
          Diedit: {formatUpdatedAt(template.updated_at)}
        </Text>
        <Space size={4}>
          {isEditable ? (
            <Link href={`/designer/templates/${template.id}/edit`}>
              <Button type="link" size="small" className="!px-1.5 !text-xs !text-[#9A5A00]">
                Edit
              </Button>
            </Link>
          ) : (
            <Link href={`/designer/templates/${template.id}`}>
              <Button type="link" size="small" className="!px-1.5 !text-xs">
                Detail
              </Button>
            </Link>
          )}
        </Space>
      </div>
    </Card>
  );
}

// 2. Main Page Component
export default function DesignerTemplatesPage() {
  const { message } = AntdApp.useApp();
  const router = useRouter();
  const {
    templates,
    duplicateTemplate,
    createRevision,
    deleteTemplate,
    submitForReview,
  } = useDesignerTemplates();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("updated_desc");
  const [page, setPage] = useState(1);

  // Kategori unik untuk dropdown filter
  const categories = useMemo(
    () => [...new Set(templates.map((t) => t.category_name))],
    [templates]
  );
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filtering & Sorting
  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(query) ||
        template.slug.toLowerCase().includes(query);

      const status = normalizeStatus(template.status);
      let matchesStatus = true;
      if (statusFilter === "draft") matchesStatus = status === "draft";
      else if (statusFilter === "in_review") matchesStatus = status === "in_review";
      else if (statusFilter === "approved") matchesStatus = status === "approved";
      else if (statusFilter === "rejected") matchesStatus = status === "rejected";
      else if (statusFilter === "revision") {
        matchesStatus =
          status === "revision" ||
          (status === "rejected" && Boolean(template.rejection_note));
      }

      const matchesCategory =
        categoryFilter === "all" || template.category_name === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "created_desc":
          return (
            new Date(b.created_at || b.updated_at).getTime() -
            new Date(a.created_at || a.updated_at).getTime()
          );
        case "updated_desc":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });
  }, [templates, search, statusFilter, categoryFilter, sortOption]);

  // Actions handlers
  const handleDuplicate = (template: LocalDesignerTemplate) => {
    const newId = duplicateTemplate(template.id);
    if (newId) {
      message.success(`Template berhasil diduplikasi.`);
    }
  };

  const handleCreateRevision = (template: LocalDesignerTemplate) => {
    const newId = createRevision(template.id);
    if (newId) {
      message.success(`Revisi baru untuk "${template.name}" berhasil dibuat.`);
      router.push(`/designer/templates/${newId}/edit`);
    }
  };

  const handleDelete = (template: LocalDesignerTemplate) => {
    Modal.confirm({
      title: "Hapus template?",
      content: `"${template.name}" akan dihapus dari data template Anda.`,
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () => {
        deleteTemplate(template.id);
        message.success("Template berhasil dihapus.");
      },
    });
  };

  const handleSubmit = (template: LocalDesignerTemplate) => {
    Modal.confirm({
      title: "Submit for Review?",
      content: `Template "${template.name}" akan diajukan ke tim kurator untuk diperiksa. Status akan berubah menjadi Pending Review.`,
      okText: "Submit",
      cancelText: "Batal",
      onOk: () => {
        submitForReview(template.id);
        message.success("Template berhasil diajukan untuk review.");
      },
    });
  };

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Table Columns for List View
  const listColumns: ColumnsType<LocalDesignerTemplate> = [
    {
      title: "Template",
      key: "template",
      render: (_, template) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#EBD9BE] bg-[#FFF8EE]">
            {template.thumbnail ? (
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-[#765D48]">
                IU
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/designer/templates/${template.id}`}
              className="block truncate font-semibold text-[#3A2313] hover:!text-[#9A5A00]"
            >
              {template.name}
            </Link>
            <Text type="secondary" className="block truncate text-xs">
              {template.category_name} · {template.style}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => <DesignerStatusTag status={status} />,
    },
    {
      title: "Terakhir Diedit",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 200,
      responsive: ["md"],
      render: (dateStr: string) => (
        <Text className="text-xs text-[#765D48]">
          {formatUpdatedAt(dateStr)}
        </Text>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      align: "right",
      width: 140,
      render: (_, template) => {
        const status = normalizeStatus(template.status);
        const isEditable =
          status === "draft" || status === "rejected" || status === "revision";
        const actionItems = getActionItems(template, {
          onDuplicate: handleDuplicate,
          onCreateRevision: handleCreateRevision,
          onSubmit: handleSubmit,
          onDelete: handleDelete,
        });

        return (
          <Space size={4}>
            {isEditable ? (
              <Link href={`/designer/templates/${template.id}/edit`}>
                <Button size="small" type="primary" icon={<EditOutlined />}>
                  Edit
                </Button>
              </Link>
            ) : (
              <Link href={`/designer/templates/${template.id}`}>
                <Button size="small" icon={<EyeOutlined />}>
                  Preview
                </Button>
              </Link>
            )}
            <Dropdown menu={{ items: actionItems }} trigger={["click"]}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header & Primary CTA */}
      <DesignerPageHeader
        title="Template Management"
        description="Kelola, pratinjau, dan ajukan template undangan digital Anda."
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/designer/templates/create")}
          >
            Create New Template
          </Button>
        }
      />

      {/* 2. Filter & Controls Bar */}
      <Card className="border-[#EBD9BE]" styles={{ body: { padding: "14px 16px" } }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          {/* Search Box */}
          <Col xs={24} sm={10} md={7}>
            <Input.Search
              allowClear
              placeholder="Cari nama template..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Col>

          {/* Status Filter */}
          <Col xs={12} sm={7} md={5}>
            <Select
              className="w-full"
              value={statusFilter}
              onChange={(val: StatusFilter) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "draft", label: "Draft" },
                { value: "in_review", label: "Pending Review" },
                { value: "revision", label: "Revision" },
                { value: "approved", label: "Published" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </Col>

          {/* Sorting */}
          <Col xs={12} sm={7} md={5}>
            <Select
              className="w-full"
              value={sortOption}
              onChange={(val: SortOption) => {
                setSortOption(val);
                setPage(1);
              }}
              options={[
                { value: "updated_desc", label: "Last Edited" },
                { value: "created_desc", label: "Newest" },
                { value: "name_asc", label: "Name (A–Z)" },
                { value: "name_desc", label: "Name (Z–A)" },
              ]}
            />
          </Col>

          {/* Category Filter */}
          <Col xs={14} sm={7} md={4}>
            <Select
              className="w-full"
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Semua Kategori" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </Col>

          {/* View Mode Switcher (Grid vs List) */}
          <Col xs={10} sm={5} md={3} className="text-right">
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "grid" | "list")}
              options={[
                {
                  value: "grid",
                  icon: <AppstoreOutlined />,
                  label: "Grid",
                },
                {
                  value: "list",
                  icon: <UnorderedListOutlined />,
                  label: "List",
                },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 3. Main Templates Display: Grid or List */}
      {paginatedTemplates.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className={styles.templateGrid}>
              {paginatedTemplates.map((template, index) => (
                <div key={template.id} className="min-w-0">
                  <TemplateCard
                    template={template}
                    preloadThumbnail={index === 0}
                    onDuplicate={handleDuplicate}
                    onCreateRevision={handleCreateRevision}
                    onDelete={handleDelete}
                    onSubmit={handleSubmit}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card
              className="overflow-hidden border-[#EBD9BE]"
              styles={{ body: { padding: 0 } }}
            >
              <Table<LocalDesignerTemplate>
                rowKey="id"
                columns={listColumns}
                dataSource={paginatedTemplates}
                pagination={false}
              />
            </Card>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#EBD9BE] pt-4">
            <Text type="secondary" className="text-xs">
              Menampilkan {paginatedTemplates.length} dari{" "}
              {filteredTemplates.length} template
            </Text>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredTemplates.length}
              showSizeChanger={false}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        </>
      ) : (
        <Card className="border-[#EBD9BE] py-12 text-center">
          <Empty
            description={
              templates.length
                ? "Tidak ada template yang cocok dengan filter pencarian Anda."
                : "Belum ada template yang dibuat."
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/designer/templates/create")}
            >
              Buat Template Baru
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
}
