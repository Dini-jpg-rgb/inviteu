"use client";

import React, { useState } from "react";
import {
  AppstoreOutlined,
  BorderOutlined,
  CalendarOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  GiftOutlined,
  HeartOutlined,
  InboxOutlined,
  InsertRowBelowOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  PlusOutlined,
  TagOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Tag,
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
  category: "static" | "widgets" | "text" | "media" | "buttons" | "shapes";
  description: string;
  icon: React.ReactNode;
  elementType?: ElementType;
  widgetType?: WidgetType;
  badge?: string;
  isAddon?: boolean;
  isSingleton?: boolean; // E.g. RSVP, Music, Guestbook
  defaultProps?: Record<string, BuilderPropertyValue>;
  defaultSize?: { width: number; height: number };
}

export const ELEMENT_CATALOG_ITEMS: ElementCatalogItem[] = [
  // ─── STATIC ELEMENTS: TYPOGRAPHY & STORY ──────────────────────────────────
  {
    id: "text-heading",
    kind: "element",
    elementType: "text",
    name: "Judul Acara (Heading)",
    category: "static",
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
    category: "static",
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
    category: "static",
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
    category: "static",
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
  {
    id: "static-story",
    kind: "element",
    elementType: "text",
    name: "Story Timeline (Cerita)",
    category: "static",
    description: "Linimasa kisah cinta perjalanan kedua mempelai dari awal bertemu hingga pelaminan.",
    icon: <HeartOutlined className="text-xl text-[#B84438]" />,
    defaultProps: {
      text: "2021 — Pertemuan Pertama\n2024 — Mengikat Komitmen Bersama\n2026 — Menuju Pelaminan Suci",
      fontSize: 13,
      lineHeight: 1.8,
      alignment: "center",
      color: "#765D48",
    },
    defaultSize: { width: 340, height: 100 },
  },
  {
    id: "static-dresscode",
    kind: "element",
    elementType: "text",
    name: "Dress Code Guide",
    category: "static",
    description: "Panduan etika busana tamu dan palet warna tema acara pernikahan.",
    icon: <CheckCircleOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      text: "Dress Code: Pakaian Formal / Batik / Earth Tone (Sage Green & Cream)",
      fontSize: 13,
      fontWeight: 500,
      alignment: "center",
      color: "#765D48",
    },
    defaultSize: { width: 340, height: 48 },
  },
  {
    id: "static-hashtag",
    kind: "element",
    elementType: "text",
    name: "Wedding Hashtag",
    category: "static",
    description: "Tagar media sosial resmi untuk dokumentasi foto tamu di Instagram & TikTok.",
    icon: <TagOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      text: "#MogranLauraWedding",
      fontSize: 22,
      fontWeight: 700,
      alignment: "center",
      color: "#9A5A00",
      fontFamily: "Georgia, serif",
    },
    defaultSize: { width: 320, height: 44 },
  },
  {
    id: "shape-divider",
    kind: "element",
    elementType: "divider",
    name: "Garis Pembatas (Divider)",
    category: "static",
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
    category: "static",
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

  // ─── FUNCTIONAL WIDGETS ────────────────────────────────────────────────────
  {
    id: "widget-event-details",
    kind: "widget",
    widgetType: "event_details",
    name: "Event Details Widget",
    category: "widgets",
    badge: "Waktu & Tempat",
    description: "Kartu informasi jadwal akad, jam resepsi, dan peta lokasi venue acara.",
    icon: <CalendarOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      title: "Waktu & Tempat Acara",
      badge: "Akad & Resepsi",
      dateText: "Senin, 28 Desember 2026",
      timeText: "Akad: 08.00 WIB · Resepsi: 11.00 WIB",
      placeName: "Grand Ballroom Hotel Mulia",
      address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
      mapUrl: "https://maps.google.com",
    },
    defaultSize: { width: 340, height: 220 },
  },
  {
    id: "widget-gallery",
    kind: "widget",
    widgetType: "gallery",
    name: "Gallery Widget (Galeri Foto)",
    category: "widgets",
    badge: "Multi Foto",
    description: "Galeri foto interaktif dengan pengaturan layout grid, carousel, dan jumlah kolom.",
    icon: <PictureOutlined className="text-xl text-[#FCB040]" />,
    defaultProps: {
      title: "Galeri Foto Bahagia",
      galleryLayout: "grid-2",
      columns: 2,
      imageCount: 4,
      aspectRatio: "1/1",
      borderRadius: 8,
    },
    defaultSize: { width: 340, height: 260 },
  },
  {
    id: "widget-countdown",
    kind: "widget",
    widgetType: "countdown",
    name: "Countdown Timer Widget",
    category: "widgets",
    description: "Penghitung mundur hari, jam, dan menit menuju hari bahagia acara.",
    icon: <CalendarOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      title: "Menghitung Hari Bahagia",
      eventDate: "2026-12-28T09:00:00",
      color: "#3A2313",
    },
    defaultSize: { width: 340, height: 140 },
  },
  {
    id: "widget-music",
    kind: "widget",
    widgetType: "music",
    name: "Music Player (BGM)",
    category: "widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Pemutar musik latar otomatis dengan tombol kontrol mengambang.",
    icon: <CustomerServiceOutlined className="text-xl text-[#5C3500]" />,
    defaultProps: {
      title: "Musik Latar Pernikahan",
      songTitle: "A Thousand Years",
      artistName: "Christina Perri",
      audioUrl: "",
    },
    defaultSize: { width: 340, height: 100 },
  },
  {
    id: "widget-rsvp",
    kind: "widget",
    widgetType: "rsvp",
    name: "RSVP Widget (Konfirmasi Hadir)",
    category: "widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Formulir interaktif tamu untuk mengirim konfirmasi kehadiran dan doa restu.",
    icon: <UserAddOutlined className="text-xl text-[#267044]" />,
    defaultProps: {
      title: "Konfirmasi Kehadiran (RSVP)",
      buttonLabel: "Kirim Konfirmasi",
    },
    defaultSize: { width: 340, height: 260 },
  },
  {
    id: "widget-guestbook",
    kind: "widget",
    widgetType: "guestbook",
    name: "Guestbook Widget (Buku Tamu)",
    category: "widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Buku tamu digital interaktif untuk menuliskan doa restu dan ucapan selamat.",
    icon: <InboxOutlined className="text-xl text-[#9A5A00]" />,
    defaultProps: {
      title: "Buku Tamu & Doa Restu",
      subtitle: "Tuliskan ucapan dan doa terbaik Anda untuk kedua mempelai",
      buttonLabel: "Kirim Ucapan",
      showCount: true,
    },
    defaultSize: { width: 340, height: 240 },
  },
  {
    id: "widget-digital-gift",
    kind: "widget",
    widgetType: "digital_gift",
    name: "Digital Gift Widget (Tanda Kasih)",
    category: "widgets",
    description: "Informasi rekening bank dan nomor dompet digital untuk tanda kasih para tamu.",
    icon: <GiftOutlined className="text-xl text-[#FCB040]" />,
    defaultProps: {
      title: "Tanda Kasih (Digital Gift)",
      subtitle: "Doa restu Anda merupakan karunia terindah bagi kami:",
      bankName: "BCA",
      accountNumber: "1234 5678 90",
      accountHolder: "Mogran & Laura",
      showCopyButton: true,
    },
    defaultSize: { width: 340, height: 180 },
  },
  {
    id: "widget-video-greeting",
    kind: "widget",
    widgetType: "video_greeting",
    name: "Video Greeting (Add-on)",
    category: "widgets",
    badge: "Add-on",
    isAddon: true,
    description: "Pemutar video ucapan pre-wedding atau pesan bahagia kedua mempelai.",
    icon: <PlaySquareOutlined className="text-xl text-[#B84438]" />,
    defaultProps: {
      title: "Video Momen Bahagia",
      src: "",
      poster: "/templates/wedding/venue.jpg",
      aspectRatio: "16/9",
      controls: true,
    },
    defaultSize: { width: 340, height: 200 },
  },
  {
    id: "widget-maps",
    kind: "widget",
    widgetType: "maps",
    name: "Location / Maps Widget",
    category: "widgets",
    description: "Peta lokasi venue terintegrasi dengan tombol petunjuk arah Google Maps.",
    icon: <CompassOutlined className="text-xl text-[#0369a1]" />,
    defaultProps: {
      title: "Lokasi Acara",
      placeName: "Grand Ballroom Hotel Mulia",
      address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
      mapUrl: "https://maps.google.com",
      buttonLabel: "Buka Petunjuk Arah (Google Maps)",
      showMapEmbed: true,
    },
    defaultSize: { width: 340, height: 190 },
  },

  // ─── MEDIA & BUTTONS ───────────────────────────────────────────────────────
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
    },
    defaultSize: { width: 320, height: 220 },
  },
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
    description: "Tombol aksi bebas untuk tautan eksternal atau buku tamu.",
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chosenSectionId, setChosenSectionId] = useState<string>(() => {
    return targetSectionId || sections[0]?.id || "";
  });

  const categories = [
    { key: "all", label: "Semua Elemen" },
    { key: "static", label: "Static Elements" },
    { key: "widgets", label: "Functional Widgets" },
    { key: "media", label: "Foto & Media" },
    { key: "buttons", label: "Tombol Aksi" },
  ];

  // Helper check for singleton duplication
  const hasExistingWidget = (type?: WidgetType) => {
    if (!type) return false;
    return sections.some((s) =>
      s.children.some((c) => c.kind === "widget" && c.widgetType === type)
    );
  };

  const filteredItems = ELEMENT_CATALOG_ITEMS.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" ||
      item.category === selectedCategory ||
      (selectedCategory === "static" && (item.category === "static" || item.category === "text" || item.category === "shapes")) ||
      (selectedCategory === "widgets" && item.category === "widgets");

    const matchesQuery =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  const effectiveSectionId = chosenSectionId || sections[0]?.id;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <Title level={4} className="!mb-0 text-[#3A2313]">
            Katalog Elemen &amp; Widget Designer
          </Title>
          <Text type="secondary" className="text-xs">
            Pilih elemen statis atau widget fungsional untuk ditambahkan ke section aktif di canvas.
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
          className="min-w-[240px]"
          options={sections.map((s, idx) => ({
            value: s.id,
            label: `${idx + 1}. ${s.name} (${s.children.length} elemen)`,
          }))}
        />
      </div>

      {/* Category Pills & Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
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
        <Input.Search
          size="small"
          placeholder="Cari elemen / widget..."
          className="w-48"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid of Catalog Elements */}
      <div className="max-h-[460px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada elemen yang sesuai dengan filter."
            className="my-8"
          />
        ) : (
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF8EE] border border-[#EBD9BE] shadow-xs">
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <Text strong className="truncate text-sm text-[#3A2313]">
                            {item.name}
                          </Text>
                          {item.badge && (
                            <Tag
                              color={
                                item.isAddon
                                  ? "purple"
                                  : isBlockedDuplicate
                                    ? "default"
                                    : "gold"
                              }
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
                              Sudah terpasang (Maks. 1)
                            </Text>
                          ) : (
                            <>
                              <Tag className="!mr-0 !text-[10px] text-[#765D48] capitalize">
                                {item.category === "static"
                                  ? "Static Element"
                                  : item.category === "widgets"
                                    ? "Functional Widget"
                                    : item.category}
                              </Tag>
                              <Button
                                size="small"
                                type="link"
                                icon={<PlusOutlined />}
                                className="!px-0 !text-xs !text-[#9A5A00]"
                              >
                                Tambah
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
        )}
      </div>
    </Modal>
  );
}
