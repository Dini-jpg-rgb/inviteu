"use client";

import React, { useMemo, useState } from "react";
import {
  AppstoreOutlined,
  BookOutlined,
  BorderOutlined,
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  ColumnHeightOutlined,
  ContainerOutlined,
  CrownOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FontSizeOutlined,
  GiftOutlined,
  HeartOutlined,
  InsertRowBelowOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  ReadOutlined,
  SearchOutlined,
  UserAddOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Select,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import type { TabsProps, UploadProps } from "antd";
import {
  BuilderElement,
  BuilderNode,
  ElementType,
  WidgetType,
} from "./model";
import {
  BuilderAsset,
  BuilderAssetType,
  createBuilderAsset,
  getUploadedFontFamily,
  validateBuilderAsset,
} from "./assets";
import styles from "./AssetPanel.module.css";

const { Dragger } = Upload;
const { Text } = Typography;

type AssetCategory =
  | "layout"
  | "basic"
  | "widgets"
  | "sections"
  | "fonts"
  | "upload"
  | "uploaded";

interface AssetPanelProps {
  assets: BuilderAsset[];
  selectedNode: BuilderNode | null;
  isReadOnly: boolean;
  mode: "add" | "elements" | "widgets" | "uploads";
  onAddSection: () => void;
  onAddElement: (type: ElementType, sectionId?: string, parentContainerId?: string) => void;
  onAddWidget: (type: WidgetType, sectionId?: string, parentContainerId?: string) => void;
  onUploadAsset: (asset: BuilderAsset) => void;
  onUseAsset: (asset: BuilderAsset) => void;
  onRenameAsset: (assetId: string, name: string) => void;
  onDeleteAsset: (assetId: string) => void;
  isAssetUsed: (asset: BuilderAsset) => boolean;
  getReferencingTemplates?: (asset: BuilderAsset) => string[];
}

interface AssetOption {
  label: string;
  description: string;
  icon: React.ReactNode;
  action: string;
}

const assetOptions: Partial<Record<AssetCategory, AssetOption[]>> = {
  layout: [
    {
      label: "Container",
      description: "Wadah tata letak utama dengan kontrol Flexbox atau Grid.",
      icon: <ContainerOutlined />,
      action: "container",
    },
    {
      label: "Nested Container",
      description: "Container bertingkat di dalam container untuk layout yang lebih kaya.",
      icon: <AppstoreOutlined />,
      action: "nested_container",
    },
  ],
  basic: [
    {
      label: "Heading",
      description: "Judul heading (H1 - H6) dengan ukuran dan bobot tegas.",
      icon: <FontSizeOutlined />,
      action: "heading",
    },
    {
      label: "Text",
      description: "Paragraf teks biasa, deskripsi, atau pesan pembuka.",
      icon: <FileTextOutlined />,
      action: "text",
    },
    {
      label: "Image",
      description: "Gambar atau foto tunggal dengan opsi aspect-ratio & focal point.",
      icon: <PictureOutlined />,
      action: "image",
    },
    {
      label: "Button",
      description: "Tombol interaktif dengan teks label dan tautan link.",
      icon: <BorderOutlined />,
      action: "button",
    },
    {
      label: "Divider",
      description: "Garis pemisah antar section atau elemen.",
      icon: <InsertRowBelowOutlined />,
      action: "divider",
    },
    {
      label: "Spacer",
      description: "Ruang pemisah vertikal dengan ketinggian yang dapat disesuaikan.",
      icon: <ColumnHeightOutlined />,
      action: "spacer",
    },
    {
      label: "Icon",
      description: "Simbol grafis vektor (cinta, tanggal, pin lokasi, musik, dll).",
      icon: <HeartOutlined />,
      action: "icon",
    },
  ],
  widgets: [
    {
      label: "Cover & Hero",
      description: "Header visual utama, foto cover & nama mempelai.",
      icon: <CrownOutlined />,
      action: "cover",
    },
    {
      label: "Event Details",
      description: "Waktu, tanggal acara, gedung dan alamat lengkap.",
      icon: <CalendarOutlined />,
      action: "event_details",
    },
    {
      label: "Gallery",
      description: "Koleksi foto pre-wedding & momen bahagia.",
      icon: <PictureOutlined />,
      action: "gallery",
    },
    {
      label: "Story / Timeline",
      description: "Perjalanan kisah cinta kedua mempelai.",
      icon: <ReadOutlined />,
      action: "story",
    },
    {
      label: "Countdown",
      description: "Widget hitung mundur interaktif hari bahagia.",
      icon: <ClockCircleOutlined />,
      action: "countdown",
    },
    {
      label: "Music Player",
      description: "Pemutar musik latar romantis dengan kontrol audio.",
      icon: <CustomerServiceOutlined />,
      action: "music",
    },
    {
      label: "RSVP Form",
      description: "Formulir konfirmasi kehadiran tamu secara langsung.",
      icon: <UserAddOutlined />,
      action: "rsvp",
    },
    {
      label: "Guestbook",
      description: "Buku tamu dan ucapan doa restu.",
      icon: <BookOutlined />,
      action: "guestbook",
    },
    {
      label: "Digital Gift",
      description: "Informasi hadiah digital dan nomor rekening.",
      icon: <GiftOutlined />,
      action: "digital_gift",
    },
    {
      label: "Video Greeting (Add-on)",
      description: "Fitur Add-on: Video ucapan sinematik.",
      icon: <VideoCameraOutlined />,
      action: "video_greeting",
    },
  ],
  sections: [
    {
      label: "Blank section",
      description: "Section kosong baru untuk menyusun konten.",
      icon: <InsertRowBelowOutlined />,
      action: "section",
    },
  ],
};

const assetTypeLabels: Record<BuilderAssetType, string> = {
  image: "Image",
  video: "Video",
  font: "Font",
};

const categoryLabels: Record<AssetCategory, string> = {
  layout: "Layout",
  basic: "Basic Elements",
  widgets: "InviteU Widgets",
  sections: "Sections",
  fonts: "Fonts",
  uploaded: "Uploaded assets",
  upload: "Upload",
};

const uploadAccept =
  ".jpg,.jpeg,.png,.webp,.gif,.avif,.mp4,.webm,.woff,.woff2,.ttf,.otf";

function isTypographyElement(
  node: BuilderNode | null
): node is BuilderElement {
  return (
    node?.kind === "element" &&
    (node.elementType === "text" || node.elementType === "button")
  );
}

export function AssetPanel(props: AssetPanelProps) {
  const {
    assets,
    selectedNode,
    isReadOnly,
    mode,
    onAddSection,
    onAddElement,
    onAddWidget,
    onUploadAsset,
    onUseAsset,
    onRenameAsset,
    onDeleteAsset,
    isAssetUsed,
  } = props;
  const { message } = AntdApp.useApp();
  const initialCategory: AssetCategory =
    mode === "uploads"
      ? "uploaded"
      : mode === "widgets"
      ? "widgets"
      : "layout";
  const [category, setCategory] = useState<AssetCategory>(initialCategory);
  const [search, setSearch] = useState("");
  const [uploadedType, setUploadedType] = useState<BuilderAssetType | "all">(
    "all"
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<BuilderAsset | null>(null);
  const [renamingAsset, setRenamingAsset] = useState<BuilderAsset | null>(null);
  const [renamedValue, setRenamedValue] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadQueue, setUploadQueue] = useState<
    Array<{
      uid: string;
      name: string;
      percent: number;
      status: "uploading" | "done" | "error";
      error?: string;
      file: File;
    }>
  >([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const customFolders = ["Pernikahan", "Venue", "Dekorasi"];

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesCategory =
        category === "uploaded" ||
        (category === "fonts" && asset.type === "font");
      const matchesType =
        category !== "uploaded" ||
        uploadedType === "all" ||
        asset.type === uploadedType;
      const matchesFolder =
        selectedFolder === "all" ||
        (selectedFolder === "uncategorized" && !asset.folder) ||
        asset.folder === selectedFolder;
      const matchesSearch =
        !query ||
        asset.name.toLowerCase().includes(query) ||
        asset.fileName.toLowerCase().includes(query);
      return matchesCategory && matchesType && matchesFolder && matchesSearch;
    });
  }, [assets, category, search, selectedFolder, uploadedType]);

  const validateUpload: UploadProps["beforeUpload"] = (file) => {
    const validationError = validateBuilderAsset(file);
    if (validationError) {
      setUploadError(validationError);
      message.error(validationError);
      return Upload.LIST_IGNORE;
    }
    setUploadError("");
    return true;
  };

  const uploadAsset: UploadProps["customRequest"] = ({
    file,
    onProgress,
    onSuccess,
    onError,
  }) => {
    if (!(file instanceof File)) {
      const error = new Error("File upload tidak valid.");
      setUploadError(error.message);
      onError?.(error);
      return;
    }

    const fileUid = `${Date.now()}-${file.name}`;
    setUploadQueue((prev) => [
      ...prev,
      {
        uid: fileUid,
        name: file.name,
        percent: 0,
        status: "uploading",
        file,
      },
    ]);

    let progress = 0;
    const progressTimer = window.setInterval(() => {
      progress = Math.min(progress + 25, 100);
      onProgress?.({ percent: progress });
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.uid === fileUid ? { ...item, percent: progress } : item
        )
      );

      if (progress === 100) {
        window.clearInterval(progressTimer);
        let previewUrl = "";
        try {
          previewUrl = URL.createObjectURL(file);
          const newAsset = createBuilderAsset(file, previewUrl);
          if (selectedFolder !== "all" && selectedFolder !== "uncategorized") {
            newAsset.folder = selectedFolder;
          }
          onUploadAsset(newAsset);
          onSuccess?.({ local: true });
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.uid === fileUid ? { ...item, status: "done" } : item
            )
          );
        } catch (error) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          const uploadErr =
            error instanceof Error ? error : new Error("Upload gagal.");
          setUploadError(uploadErr.message);
          onError?.(uploadErr);
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.uid === fileUid
                ? { ...item, status: "error", error: uploadErr.message }
                : item
            )
          );
        }
      }
    }, 120);
  };

  const handleRetryUpload = (uid: string) => {
    const queueItem = uploadQueue.find((item) => item.uid === uid);
    if (!queueItem || !queueItem.file) return;
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.uid === uid
          ? { ...item, percent: 0, status: "uploading", error: undefined }
          : item
      )
    );

    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(progress + 30, 100);
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, percent: progress } : item
        )
      );
      if (progress === 100) {
        window.clearInterval(timer);
        try {
          const previewUrl = URL.createObjectURL(queueItem.file);
          const asset = createBuilderAsset(queueItem.file, previewUrl);
          if (selectedFolder !== "all" && selectedFolder !== "uncategorized") {
            asset.folder = selectedFolder;
          }
          onUploadAsset(asset);
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.uid === uid ? { ...item, status: "done" } : item
            )
          );
          message.success(`Berhasil upload ulang: ${queueItem.name}`);
        } catch (e) {
          const err = e instanceof Error ? e.message : "Retry gagal";
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.uid === uid
                ? { ...item, status: "error", error: err }
                : item
            )
          );
        }
      }
    }, 100);
  };

  const handleAdd = (action: string) => {
    if (action === "section") {
      onAddSection();
    } else if (action === "nested_container") {
      if (selectedNode?.kind === "element" && selectedNode.elementType === "container") {
        onAddElement("container", selectedNode.parentSectionId, selectedNode.id);
        message.success("Nested container ditambahkan ke dalam container");
      } else {
        onAddElement("container");
        message.info("Container ditambahkan. Pilih container untuk menyisipkan nested container.");
      }
    } else if (
      [
        "heading",
        "text",
        "image",
        "video",
        "shape",
        "button",
        "divider",
        "spacer",
        "icon",
        "container",
      ].includes(action)
    ) {
      if (selectedNode?.kind === "element" && selectedNode.elementType === "container") {
        onAddElement(action as ElementType, selectedNode.parentSectionId, selectedNode.id);
      } else {
        onAddElement(action as ElementType);
      }
    } else {
      if (selectedNode?.kind === "element" && selectedNode.elementType === "container") {
        onAddWidget(action as WidgetType, selectedNode.parentSectionId, selectedNode.id);
      } else {
        onAddWidget(action as WidgetType);
      }
    }
  };

  const addCategories: {
    key: AssetCategory;
    label: string;
    icon: React.ReactNode;
  }[] = useMemo(() => {
    if (mode === "widgets") {
      return [{ key: "widgets", label: "Widgets", icon: <ContainerOutlined /> }];
    }
    if (mode === "elements") {
      return [
        { key: "layout", label: "Layout", icon: <ContainerOutlined /> },
        { key: "basic", label: "Basic Elements", icon: <FontSizeOutlined /> },
        { key: "sections", label: "Section", icon: <InsertRowBelowOutlined /> },
      ];
    }
    return [
      { key: "layout", label: "Layout", icon: <ContainerOutlined /> },
      { key: "basic", label: "Basic Elements", icon: <FontSizeOutlined /> },
      { key: "widgets", label: "Widgets", icon: <ContainerOutlined /> },
      { key: "sections", label: "Sections", icon: <InsertRowBelowOutlined /> },
      { key: "fonts", label: "Brand", icon: <FileTextOutlined /> },
    ];
  }, [mode]);

  const addCategoryItems: TabsProps["items"] = addCategories.map((item) => ({
    key: item.key,
    label: (
      <span className={styles.categoryTabLabel}>
        {item.icon}
        {item.label}
      </span>
    ),
  }));

  const categoryAssets = categoryOptions(category);
  const visibleOptions = categoryAssets.filter((option) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      option.label.toLowerCase().includes(query) ||
      option.description.toLowerCase().includes(query)
    );
  });

  const canUseAsset = (asset: BuilderAsset) =>
    !isReadOnly &&
    (asset.type !== "font" || isTypographyElement(selectedNode));

  const getUseAssetLabel = (asset: BuilderAsset) => {
    if (asset.type === "font") return "Apply font";
    if (
      asset.type === "image" &&
      selectedNode?.kind === "element" &&
      selectedNode.elementType === "video"
    ) {
      return "Set video poster";
    }
    if (
      selectedNode?.kind === "element" &&
      selectedNode.elementType === asset.type
    ) {
      return `Replace ${asset.type}`;
    }
    return `Add ${asset.type}`;
  };

  const handleRename = () => {
    const nextName = renamedValue.trim();
    if (!renamingAsset || !nextName) {
      message.error("Nama aset tidak boleh kosong.");
      return;
    }
    onRenameAsset(renamingAsset.id, nextName);
    setRenamingAsset(null);
    message.success("Nama aset diperbarui.");
  };

  const renderAsset = (asset: BuilderAsset) => {
    const isSelected = selectedAssetId === asset.id;
    const used = isAssetUsed(asset);
  const referencingTemplates = props.getReferencingTemplates
    ? props.getReferencingTemplates(asset)
    : [];
  const referencingMsg = referencingTemplates.length
    ? `Aset ini sedang digunakan di template: ${referencingTemplates.join(", ")}. Hapus referensinya terlebih dahulu.`
    : "Lepaskan aset dari elemen sebelum menghapusnya.";

  return (
    <Card
      key={asset.id}
      size="small"
      className={`${styles.libraryAsset} ${isSelected ? styles.libraryAssetSelected : ""}`}
      onClick={() => setSelectedAssetId(asset.id)}
    >
      <button
        type="button"
        className={styles.libraryThumbnail}
        aria-label={`Preview ${asset.name}`}
        onClick={(event) => {
          event.stopPropagation();
          setPreviewAsset(asset);
        }}
      >
        {asset.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : asset.type === "video" ? (
          <PlaySquareOutlined className="text-2xl text-[#9A5A00]" />
        ) : (
          <span className="text-lg font-semibold tracking-wider text-[#9A5A00]">Aa</span>
        )}
      </button>
      <Text strong className="block truncate text-[11px]" title={asset.name}>
        {asset.name}
      </Text>
      <Text type="secondary" className="block truncate text-[10px]">
        {assetTypeLabels[asset.type]} {asset.folder ? `· [${asset.folder}]` : ""} ·{" "}
        {(asset.fileSize / (1024 * 1024)).toFixed(1)} MB
      </Text>
      <div className={styles.assetActions}>
        <Tooltip title="Preview">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            aria-label={`Preview ${asset.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setPreviewAsset(asset);
            }}
          />
        </Tooltip>
        <Tooltip title="Rename">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            aria-label={`Rename ${asset.name}`}
            disabled={isReadOnly}
            onClick={(event) => {
              event.stopPropagation();
              setRenamingAsset(asset);
              setRenamedValue(asset.name);
            }}
          />
        </Tooltip>
        <Tooltip title={used ? referencingMsg : "Delete"}>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            aria-label={`Delete ${asset.name}`}
            disabled={used || isReadOnly}
            onClick={(event) => {
              event.stopPropagation();
              if (used) {
                Modal.warning({
                  title: "Aset Sedang Digunakan",
                  content: referencingMsg,
                });
                return;
              }
              Modal.confirm({
                title: "Hapus aset ini?",
                content: `${asset.name} akan dihapus dari library lokal.`,
                okText: "Hapus",
                okType: "danger",
                cancelText: "Batal",
                onOk: () => {
                  onDeleteAsset(asset.id);
                  if (selectedAssetId === asset.id) {
                    setSelectedAssetId(null);
                  }
                },
              });
            }}
          />
        </Tooltip>
      </div>
    </Card>
  );
  };

  const showAssetLibrary = mode === "uploads" || category === "fonts";
  const selectedTypeSupported =
    selectedAsset?.type === "font"
      ? isTypographyElement(selectedNode)
      : selectedAsset &&
        ((selectedNode?.kind === "element" &&
          selectedNode.elementType === selectedAsset.type) ||
          (selectedAsset.type === "image" &&
            selectedNode?.kind === "element" &&
            selectedNode.elementType === "video"));

  return (
    <div className={styles.panel}>
      {(mode === "add" || mode === "elements") && (
        <div className={styles.categoryNavigation}>
          <Tabs
            activeKey={category}
            onChange={(key) => {
              setCategory(key as AssetCategory);
              setSearch("");
            }}
            items={addCategoryItems}
            className={styles.categoryTabs}
          />
        </div>
      )}
      <div className={styles.assetContent}>
        <div className={styles.panelHeading}>
          <Text strong className={styles.panelTitle}>
            {mode === "uploads"
              ? "Uploads"
              : mode === "widgets"
              ? "Widgets InviteU"
              : categoryLabels[category]}
          </Text>
          <Text type="secondary" className={styles.panelDescription}>
            {mode === "uploads"
              ? "Kelola file gambar, video, dan custom font."
              : mode === "widgets"
              ? "Pilih widget interaktif untuk ditambahkan ke dalam section undangan."
              : category === "sections"
                ? "Mulai dengan section undangan baru."
                : "Pilih elemen untuk ditambahkan ke tata letak undangan."}
          </Text>
        </div>

        {(showAssetLibrary || mode === "add" || mode === "elements" || mode === "widgets") && (
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              showAssetLibrary
                ? "Cari uploads & media..."
                : mode === "widgets"
                ? "Cari widget InviteU..."
                : "Cari elemen desain..."
            }
            size="small"
          />
        )}

        {mode === "uploads" && (
          <div className="space-y-2">
            <div className={styles.uploadArea}>
              <Dragger
                accept={uploadAccept}
                multiple
                showUploadList={false}
                beforeUpload={validateUpload}
                customRequest={uploadAsset}
                disabled={isReadOnly}
                className={styles.uploadDragger}
              >
                <CloudUploadOutlined className={styles.uploadIcon} />
                <span className={styles.uploadTitle}>Upload files (Multiple)</span>
                <span className={styles.uploadHint}>
                  Gambar (Maks 10MB), Video (Maks 100MB, 3 mnt), Font (Maks 5MB)
                </span>
              </Dragger>
              {uploadError && (
                <Alert type="error" showIcon title={uploadError} className="!text-xs mt-1" />
              )}
            </div>

            {/* Individual Progress & Retry Queue */}
            {uploadQueue.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-[#EBD9BE] bg-[#FFF8EE]/60 p-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#3A2313]">
                  <span>Antrean Upload ({uploadQueue.length})</span>
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !text-[11px]"
                    onClick={() => setUploadQueue([])}
                  >
                    Bersihkan
                  </Button>
                </div>
                {uploadQueue.slice(-4).map((item) => (
                  <div key={item.uid} className="flex items-center justify-between gap-2">
                    <span className="truncate max-w-[140px] text-[11px] text-[#765D48]">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === "uploading" && (
                        <span className="text-[10px] text-[#9A5A00]">
                          {item.percent}%
                        </span>
                      )}
                      {item.status === "done" && (
                        <Tag color="success" className="!mr-0 !text-[9px]">
                          Selesai
                        </Tag>
                      )}
                      {item.status === "error" && (
                        <>
                          <Tag color="error" className="!mr-0 !text-[9px]">
                            Gagal
                          </Tag>
                          <Button
                            size="small"
                            type="link"
                            className="!p-0 !text-[10px] !text-[#ff4d4f]"
                            onClick={() => handleRetryUpload(item.uid)}
                          >
                            Retry
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showAssetLibrary ? (
          <>
            {mode === "uploads" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Select
                    className="flex-1"
                    size="small"
                    value={uploadedType}
                    onChange={setUploadedType}
                    options={[
                      { value: "all", label: "Semua Tipe" },
                      { value: "image", label: "Gambar Saja" },
                      { value: "video", label: "Video Saja" },
                      { value: "font", label: "Font Saja" },
                    ]}
                  />
                  <Select
                    className="flex-1"
                    size="small"
                    value={selectedFolder}
                    onChange={setSelectedFolder}
                    options={[
                      { value: "all", label: "Semua Folder" },
                      { value: "uncategorized", label: "Tanpa Folder" },
                      ...customFolders.map((f) => ({ value: f, label: f })),
                    ]}
                  />
                </div>
              </div>
            )}
            {filteredAssets.length ? (
              <div className={styles.libraryGrid}>
                {filteredAssets.map(renderAsset)}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary" className="text-xs">
                    No assets yet. Upload files to get started.
                  </Text>
                }
              />
            )}
            {selectedAsset && (
              <Button
                type="primary"
                block
                icon={selectedTypeSupported ? <CheckOutlined /> : undefined}
                disabled={!canUseAsset(selectedAsset)}
                onClick={() => onUseAsset(selectedAsset)}
              >
                {getUseAssetLabel(selectedAsset)}
              </Button>
            )}
            {selectedAsset?.type === "font" && !isTypographyElement(selectedNode) && (
              <Text type="secondary" className="block text-[10px]">
                Select a text or button element to apply this font.
              </Text>
            )}
          </>
        ) : (
          <div className={styles.optionGrid}>
            {visibleOptions.map((asset) => (
              <Tooltip key={`${asset.label}-${asset.action}`} title={asset.description}>
                <button
                  type="button"
                  className={styles.optionTile}
                  disabled={isReadOnly}
                  draggable={!isReadOnly}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/x-inviteu-element",
                      JSON.stringify({
                        action: asset.action,
                        label: asset.label,
                      })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => handleAdd(asset.action)}
                >
                  <span className={styles.optionThumbnail}>
                    {asset.icon}
                  </span>
                  <span className={styles.optionLabel}>{asset.label}</span>
                </button>
              </Tooltip>
            ))}
            {!visibleOptions.length && (
              <Text type="secondary" className="text-xs">
                No matching items.
              </Text>
            )}
          </div>
        )}
      </div>

      <Modal
        title={`Preview: ${previewAsset?.name ?? ""}`}
        open={Boolean(previewAsset)}
        onCancel={() => setPreviewAsset(null)}
        footer={null}
        width={600}
      >
        {previewAsset?.type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewAsset.previewUrl}
            alt={previewAsset.name}
            className="max-h-[60vh] max-w-full object-contain"
          />
        )}
        {previewAsset?.type === "video" && (
          <video
            src={previewAsset.previewUrl}
            controls
            playsInline
            className="max-h-[60vh] w-full"
          />
        )}
        {previewAsset?.type === "font" && (
          <div className="space-y-3">
            <Tag>{previewAsset.fileName}</Tag>
            <p
              className="break-words text-2xl"
              style={{ fontFamily: getUploadedFontFamily(previewAsset.id) }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
            <Text type="secondary" className="text-xs">
              Font dapat diterapkan pada elemen Text atau Button.
            </Text>
          </div>
        )}
      </Modal>
      <Modal
        title="Rename asset"
        open={Boolean(renamingAsset)}
        onCancel={() => setRenamingAsset(null)}
        onOk={handleRename}
        okText="Save"
        cancelText="Cancel"
      >
        <Input
          autoFocus
          maxLength={120}
          value={renamedValue}
          onChange={(event) => setRenamedValue(event.target.value)}
          onPressEnter={handleRename}
        />
      </Modal>
    </div>
  );
}

function categoryOptions(category: AssetCategory): AssetOption[] {
  return assetOptions[category] ?? [];
}
