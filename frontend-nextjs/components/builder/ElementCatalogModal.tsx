"use client";

import React, { useState } from "react";
import {
  AppstoreOutlined,
  BorderOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  GiftOutlined,
  InsertRowBelowOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  PlusOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BuilderPropertyValue,
  BuilderSection,
  ElementType,
  WidgetType,
} from "./model";

const { Text, Title } = Typography;

export interface ElementCatalogItem {
  id: string;
  kind: "element" | "widget";
  name: string;
  category: "text" | "media" | "buttons" | "shapes" | "widgets";
  description: string;
  icon: React.ReactNode;
  elementType?: ElementType;
  widgetType?: WidgetType;
  badge?: string;
  isSingleton?: boolean; // E.g. RSVP, Music
  defaultProps?: Record<string, BuilderPropertyValue>;
  defaultSize?: { width: number; height: number };
}

export const ELEMENT_CATALOG_ITEMS: ElementCatalogItem[] = [
  // Typography
  {
    id: "text-heading",
    kind: "element",
    elementType: "text",
    name: "Judul Acara (Heading)",
    category: "text",
    description: "Teks judul berukuran besar untuk nama mempelai atau pembuka section.",
    icon: <FontSizeOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      text: "The Wedding Celebration",
      fontSize: 26,
      fontWeight: 700,
      alignment: "center",
      color: "#3A2313",
      fontFamily: "Georgia, serif",
    },
    defaultSize: { width: 340, height: 50 },
  },
  {
    id: "text-subheading",
    kind: "element",
    elementType: "text",
    name: "Subjudul (Subheading)",
    category: "text",
    description: "Teks penjelas pendamping judul untuk tanggal, tempat, atau kutipan.",
    icon: <FontSizeOutlined className="text-xl text-[#B84438]" />,
    defaultProps: {
      text: "Minggu, 28 Desember 2026",
      fontSize: 16,
      fontWeight: 600,
      alignment: "center",
      color: "#9A5A00",
    },
    defaultSize: { width: 340, height: 36 },
  },
  {
    id: "text-body",
    kind: "element",
    elementType: "text",
    name: "Paragraf / Rundown",
    category: "text",
    description: "Teks paragraf isi informasi lengkap akad, resepsi, atau cerita.",
    icon: <FontSizeOutlined className="text-xl text-[#765D48]" />,
    defaultProps: {
      text: "Tanpa mengurangi rasa hormat, kami bermaksud mengundang Anda untuk hadir pada hari bahagia kami.",
      fontSize: 13,
      lineHeight: 1.6,
      alignment: "center",
      color: "#765D48",
    },
    defaultSize: { width: 340, height: 70 },
  },
  {
    id: "text-quote",
    kind: "element",
    elementType: "text",
    name: "Ayat / Doa Restu (Quote)",
    category: "text",
    description: "Kutipan ayat suci atau doa pernikahan dengan gaya tulisan elegan.",
    icon: <FontSizeOutlined className="text-xl text-[#267044]" />,
    defaultProps: {
      text: "\"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu...\"",
      fontSize: 13,
      lineHeight: 1.7,
      alignment: "center",
      color: "#5C3500",
      fontStyle: "italic",
    },
    defaultSize: { width: 340, height: 60 },
  },

  // Media & Gallery
  {
    id: "media-image",
    kind: "element",
    elementType: "image",
    name: "Foto Tunggal (Single Image)",
    category: "media",
    description: "Menampilkan satu foto mempelai, venue acara, atau ilustrasi tema.",
    icon: <FileImageOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      src: "/templates/wedding/couple-main.jpg",
      alt: "Foto Mempelai",
      borderRadius: 12,
      objectFit: "cover",
      isGallery: false,
    },
    defaultSize: { width: 320, height: 220 },
  },
  {
    id: "media-gallery",
    kind: "element",
    elementType: "image",
    name: "Galeri Foto (Photo Gallery)",
    category: "media",
    badge: "Multi Foto",
    description: "Koleksi album foto pre-wedding dengan pilihan tata letak grid atau carousel.",
    icon: <PictureOutlined className="text-xl text-[#FCB040]" />,
    defaultProps: {
      isGallery: true,
      galleryLayout: "grid-2",
      imageCount: 4,
      images: [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
      ],
      borderRadius: 8,
    },
    defaultSize: { width: 340, height: 260 },
  },
  {
    id: "media-video",
    kind: "element",
    elementType: "video",
    name: "Video Greeting / Streaming",
    category: "media",
    description: "Pemutar video ucapan atau tautan rekaman siaran langsung pernikahan.",
    icon: <PlaySquareOutlined className="text-xl text-[#B84438]" />,
    defaultProps: {
      src: "",
      poster: "/templates/wedding/venue.jpg",
      title: "Video Momen Bahagia",
      borderRadius: 8,
      controls: true,
    },
    defaultSize: { width: 340, height: 200 },
  },

  // Buttons & Navigation
  {
    id: "btn-maps",
    kind: "element",
    elementType: "button",
    name: "Tombol Google Maps",
    category: "buttons",
    badge: "Navigasi",
    description: "Tombol petunjuk arah venue langsung membuka Google Maps tamu.",
    icon: <AppstoreOutlined className="text-xl text-[#FCB040]" />,
    defaultProps: {
      label: "Buka Petunjuk Arah (Google Maps)",
      url: "https://maps.google.com",
      backgroundColor: "#FCB040",
      color: "#3A2313",
      borderRadius: 8,
    },
    defaultSize: { width: 280, height: 44 },
  },
  {
    id: "btn-link",
    kind: "element",
    elementType: "button",
    name: "Tombol Tautan (Action Button)",
    category: "buttons",
    description: "Tombol aksi bebas untuk tautan streaming, buku tamu, atau sosmed.",
    icon: <AppstoreOutlined className="text-xl text-[#765D48]" />,
    defaultProps: {
      label: "Buka Tautan Acara",
      url: "#",
      backgroundColor: "#455633",
      color: "#ffffff",
      borderRadius: 8,
    },
    defaultSize: { width: 240, height: 42 },
  },

  // Shapes & Dividers
  {
    id: "shape-divider",
    kind: "element",
    elementType: "divider",
    name: "Garis Pembatas (Divider)",
    category: "shapes",
    description: "Garis pemisah estetis antar blok teks dan foto.",
    icon: <InsertRowBelowOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      thickness: 1,
      width: 70,
      color: "#EBD9BE",
    },
    defaultSize: { width: 300, height: 16 },
  },
  {
    id: "shape-container",
    kind: "element",
    elementType: "container",
    name: "Kotak Kontainer (Card Box)",
    category: "shapes",
    description: "Area kartu latar belakang untuk mengelompokkan elemen secara rapi.",
    icon: <BorderOutlined className="text-xl text-[#455633]" />,
    defaultProps: {
      backgroundColor: "#FFF8EE",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#EBD9BE",
      padding: 16,
    },
    defaultSize: { width: 340, height: 160 },
  },

  // Widgets
  {
    id: "widget-countdown",
    kind: "widget",
    widgetType: "countdown",
    name: "Countdown Timer",
    category: "widgets",
    description: "Penghitung mundur hari, jam, dan menit menuju hari bahagia acara.",
    icon: <CalendarOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      eventDate: "2026-12-28T09:00:00",
      title: "Menghitung Hari Bahagia",
      color: "#3A2313",
    },
    defaultSize: { width: 340, height: 110 },
  },
  {
    id: "widget-rsvp",
    kind: "widget",
    widgetType: "rsvp",
    name: "RSVP (Konfirmasi Kehadiran)",
    category: "widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Formulir interaktif tamu untuk mengirim konfirmasi hadir dan ucapan.",
    icon: <UserAddOutlined className="text-xl text-[#267044]" />,
    defaultProps: {
      title: "Konfirmasi Kehadiran",
      buttonText: "Kirim Konfirmasi",
    },
    defaultSize: { width: 340, height: 260 },
  },
  {
    id: "widget-music",
    kind: "widget",
    widgetType: "music",
    name: "Pemutar Musik Latar (BGM)",
    category: "widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Pemutar musik otomatis dengan tombol kontrol mengambang.",
    icon: <CustomerServiceOutlined className="text-xl text-[#5C3500]" />,
    defaultProps: {
      title: "Lagu Pernikahan Romantis",
      audioUrl: "",
    },
    defaultSize: { width: 300, height: 80 },
  },
  {
    id: "widget-digital-gift",
    kind: "widget",
    widgetType: "digital_gift",
    name: "Digital Gift (Amplop Digital)",
    category: "widgets",
    description: "Informasi rekening bank dan nomor e-wallet untuk kado doa restu tamu.",
    icon: <GiftOutlined className="text-xl text-[#FCB040]" />,
    defaultProps: {
      title: "Tanda Kasih (Digital Gift)",
      bankName: "BCA",
      accountNumber: "1234 5678 90",
      accountHolder: "Mogran & Laura",
    },
    defaultSize: { width: 340, height: 180 },
  },
];

interface ElementCatalogModalProps {
  open: boolean;
  sections: BuilderSection[];
  targetSectionId?: string | null;
  onClose: () => void;
  onAddElement: (item: ElementCatalogItem, targetSectionId: string) => void;
}

export function ElementCatalogModal({
  open,
  sections,
  targetSectionId,
  onClose,
  onAddElement,
}: ElementCatalogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [chosenSectionId, setChosenSectionId] = useState<string>(() => {
    return targetSectionId || sections[0]?.id || "";
  });

  const categories = [
    { key: "all", label: "Semua Elemen" },
    { key: "text", label: "Teks & Tipografi" },
    { key: "media", label: "Foto & Galeri" },
    { key: "buttons", label: "Tombol & Aksi" },
    { key: "shapes", label: "Bentuk & Pembatas" },
    { key: "widgets", label: "Widget Interaktif" },
  ];

  // Helper check for singleton duplication
  const hasExistingWidget = (type?: WidgetType) => {
    if (!type) return false;
    return sections.some((s) =>
      s.children.some((c) => c.kind === "widget" && c.widgetType === type)
    );
  };

  const filteredItems =
    selectedCategory === "all"
      ? ELEMENT_CATALOG_ITEMS
      : ELEMENT_CATALOG_ITEMS.filter((i) => i.category === selectedCategory);

  const effectiveSectionId = chosenSectionId || sections[0]?.id;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <Title level={4} className="!mb-0 text-[#3A2313]">
            Katalog Elemen & Widget Designer
          </Title>
          <Text type="secondary" className="text-xs">
            Pilih elemen yang ingin ditambahkan ke dalam section undangan.
          </Text>
        </div>
      }
      width={780}
      footer={null}
      styles={{ body: { padding: "16px 20px" } }}
    >
      {/* Target Section Selector */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF8EE] border border-[#EBD9BE] p-2.5">
        <Text strong className="text-xs text-[#3A2313]">
          Tambahkan ke Section:
        </Text>
        <Select
          value={effectiveSectionId}
          onChange={setChosenSectionId}
          className="min-w-[220px]"
          options={sections.map((s, idx) => ({
            value: s.id,
            label: `${idx + 1}. ${s.name} (${s.children.length} elemen)`,
          }))}
        />
      </div>

      {/* Category Pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <Button
            key={c.key}
            size="small"
            type={selectedCategory === c.key ? "primary" : "default"}
            className={
              selectedCategory === c.key
                ? ""
                : "!border-[#EBD9BE] !text-[#765D48] hover:!border-[#FCB040]"
            }
            onClick={() => setSelectedCategory(c.key)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Grid of Catalog Elements */}
      <div className="max-h-[460px] overflow-y-auto pr-1">
        <Row gutter={[12, 12]}>
          {filteredItems.map((item) => {
            const isBlockedDuplicate =
              item.isSingleton && hasExistingWidget(item.widgetType);

            return (
              <Col xs={24} sm={12} key={item.id}>
                <Card
                  hoverable={!isBlockedDuplicate}
                  className={`h-full border-[#EBD9BE] transition-all ${
                    isBlockedDuplicate
                      ? "opacity-60 bg-stone-50 cursor-not-allowed"
                      : "hover:border-[#FCB040]"
                  }`}
                  styles={{ body: { padding: 14 } }}
                  onClick={() => {
                    if (isBlockedDuplicate) return;
                    onAddElement(item, effectiveSectionId);
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF8EE] border border-[#EBD9BE]">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <Text strong className="truncate text-sm text-[#3A2313]">
                          {item.name}
                        </Text>
                        {item.badge && (
                          <Tag
                            color={isBlockedDuplicate ? "default" : "gold"}
                            className="!mr-0 !text-[10px]"
                          >
                            {item.badge}
                          </Tag>
                        )}
                      </div>
                      <Text
                        type="secondary"
                        className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[#765D48]"
                      >
                        {item.description}
                      </Text>

                      <div className="mt-3 flex items-center justify-between">
                        {isBlockedDuplicate ? (
                          <Text type="danger" className="text-[11px] font-medium">
                            Sudah ada di template (Hanya 1)
                          </Text>
                        ) : (
                          <>
                            <Tag className="!mr-0 !text-[10px] text-[#765D48] capitalize">
                              {item.category}
                            </Tag>
                            <Button
                              size="small"
                              type="link"
                              icon={<PlusOutlined />}
                              className="!px-0 !text-xs !text-[#9A5A00]"
                            >
                              Tambah Elemen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </Modal>
  );
}
