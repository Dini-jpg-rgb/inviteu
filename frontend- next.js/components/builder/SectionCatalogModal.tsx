"use client";

import React, { useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  HeartOutlined,
  InboxOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  TagOutlined,
  UserAddOutlined,
  CompassOutlined,
  FileDoneOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Empty, Input, Modal, Row, Tag, Tooltip, Typography } from "antd";
import { BuilderSection } from "./model";

const { Text, Title } = Typography;

export interface CatalogSectionTemplate {
  key: string;
  type: string;
  name: string;
  category: "Static Elements" | "Functional Widgets";
  description: string;
  icon: React.ReactNode;
  badge?: string;
  isAddon?: boolean;
  isSingleton?: boolean;
  isRequired?: boolean;
  defaultHeight: number;
  defaultBgColor: string;
  defaultChildren: Array<{
    elementType?: "text" | "image" | "video" | "shape" | "button" | "divider" | "container";
    widgetType?: "countdown" | "rsvp" | "music" | "digital_gift" | "event_details" | "gallery" | "guestbook" | "maps" | "video_greeting";
    kind: "element" | "widget";
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    props: Record<string, string | number | boolean>;
  }>;
}

export const ADMIN_SECTION_CATALOG: CatalogSectionTemplate[] = [
  // ─── STATIC ELEMENTS ───────────────────────────────────────────────────────
  {
    key: "cover",
    type: "cover",
    name: "Cover & Hero",
    category: "Static Elements",
    badge: "Wajib Pertama",
    isRequired: true,
    isSingleton: true,
    description: "Section pembuka utama undangan dengan judul acara, nama mempelai, dan sambutan.",
    icon: <CrownOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 520,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Undangan",
        position: { x: 20, y: 35 },
        size: { width: 340, height: 48 },
        props: {
          text: "The Wedding Celebration",
          fontSize: 24,
          fontWeight: "bold",
          alignment: "center",
          color: "#422B1C",
          fontFamily: "Georgia, serif",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Nama Mempelai",
        position: { x: 20, y: 95 },
        size: { width: 340, height: 50 },
        props: {
          text: "MOGRAN & LAURA",
          fontSize: 26,
          fontWeight: "bold",
          alignment: "center",
          color: "#FFAD38",
          fontFamily: "Georgia, serif",
        },
      },
      {
        kind: "element",
        elementType: "image",
        name: "Foto Hero Mempelai",
        position: { x: 30, y: 160 },
        size: { width: 320, height: 260 },
        props: {
          src: "/templates/wedding/couple-main.jpg",
          alt: "Foto Mempelai",
          borderRadius: 16,
          objectFit: "cover",
        },
      },
    ],
  },
  {
    key: "penutup",
    type: "penutup",
    name: "Penutup & Ucapan",
    category: "Static Elements",
    badge: "Wajib Terakhir",
    isRequired: true,
    isSingleton: true,
    description: "Section penutup dengan ungkapan syukur, salam hormat, dan terima kasih keluarga kedua mempelai.",
    icon: <FileDoneOutlined className="text-xl text-[#455633]" />,
    defaultHeight: 380,
    defaultBgColor: "#FFF8EE",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Penutup",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 40 },
        props: {
          text: "Terima Kasih",
          fontSize: 24,
          fontWeight: "bold",
          alignment: "center",
          color: "#422B1C",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Pesan Penutup",
        position: { x: 20, y: 85 },
        size: { width: 340, height: 160 },
        props: {
          text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.\n\nKami yang berbahagia,\nKeluarga Besar Mogran & Laura",
          fontSize: 13,
          lineHeight: 1.7,
          alignment: "center",
          color: "#99918A",
        },
      },
    ],
  },
  {
    key: "story",
    type: "story",
    name: "Love Story (Kisah Cinta)",
    category: "Static Elements",
    description: "Linimasa cerita perjalanan cinta dari awal perjumpaan hingga melangkah ke pelaminan.",
    icon: <HeartOutlined className="text-xl text-[#CB3025]" />,
    defaultHeight: 480,
    defaultBgColor: "#FFF8EE",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Love Story",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 40 },
        props: {
          text: "Kisah Kasih Kami",
          fontSize: 22,
          fontWeight: "bold",
          alignment: "center",
          color: "#422B1C",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Timeline Cerita",
        position: { x: 20, y: 85 },
        size: { width: 340, height: 320 },
        props: {
          text: "2021 — Pertemuan Pertama di Kampus\nSebuah sapaan sederhana menjadi awal dari kisah perjalanan panjang.\n\n2024 — Mengikat Komitmen\nDi hadapan keluarga besar, kami memutuskan melangkah ke jenjang yang lebih serius.\n\n2026 — Menuju Pelaminan\nMemulai ibadah terindah sepanjang hidup bersama dalam ikatan suci.",
          fontSize: 13,
          lineHeight: 1.6,
          alignment: "center",
          color: "#99918A",
        },
      },
    ],
  },
  {
    key: "dresscode",
    type: "dresscode",
    name: "Dress Code & Panduan",
    category: "Static Elements",
    description: "Panduan etika pakaian tamu, tema warna acara, dan aturan busana pernikahan.",
    icon: <CheckCircleOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 320,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Dress Code",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Dress Code Acara",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#422B1C",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Panduan Busana",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 160 },
        props: {
          text: "Busana: Pakaian Formal / Batik / Earth Tone\n\nUntuk menjaga keindahan suasana acara, para tamu disarankan mengenakan busana bernuansa Sage Green, Cream, atau Cokelat Elegan.",
          fontSize: 13,
          lineHeight: 1.6,
          alignment: "center",
          color: "#99918A",
        },
      },
    ],
  },
  {
    key: "wedding_hashtag",
    type: "wedding_hashtag",
    name: "Wedding Hashtag",
    category: "Static Elements",
    description: "Tagar pernikahan resmi untuk dokumentasi foto dan video tamu di Instagram & TikTok.",
    icon: <TagOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 260,
    defaultBgColor: "#F7F6F4",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Hashtag",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Abadikan Momen Anda",
          fontSize: 18,
          fontWeight: "bold",
          alignment: "center",
          color: "#422B1C",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Teks Hashtag Resmi",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 50 },
        props: {
          text: "#MogranLauraWedding",
          fontSize: 24,
          fontWeight: "bold",
          alignment: "center",
          color: "#FFAD38",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Keterangan Hashtag",
        position: { x: 20, y: 135 },
        size: { width: 340, height: 60 },
        props: {
          text: "Gunakan tagar ini saat mengunggah foto dan video momen pernikahan kami di media sosial.",
          fontSize: 12,
          lineHeight: 1.5,
          alignment: "center",
          color: "#765D48",
        },
      },
    ],
  },

  // ─── FUNCTIONAL WIDGETS ────────────────────────────────────────────────────
  {
    key: "event_details",
    type: "event_details",
    name: "Event Details (Akad & Resepsi)",
    category: "Functional Widgets",
    badge: "Populer",
    description: "Informasi jadwal akad nikah, jam resepsi, dan peta lokasi venue acara.",
    icon: <CalendarOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 460,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "event_details",
        name: "Widget Detail Acara",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 260 },
        props: {
          title: "Waktu & Tempat Acara",
          badge: "Akad & Resepsi",
          dateText: "Senin, 28 Desember 2026",
          timeText: "Akad: 08.00 WIB · Resepsi: 11.00 WIB",
          placeName: "Grand Ballroom Hotel Mulia",
          address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
          mapUrl: "https://maps.google.com",
        },
      },
    ],
  },
  {
    key: "gallery",
    type: "gallery",
    name: "Galeri Foto (Photo Gallery)",
    category: "Functional Widgets",
    badge: "Multi Layout",
    description: "Koleksi album foto pre-wedding dengan tata letak grid, carousel, atau masonry.",
    icon: <PictureOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 440,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "gallery",
        name: "Widget Galeri Foto",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 320 },
        props: {
          title: "Galeri Foto Bahagia",
          galleryLayout: "grid-2",
          columns: 2,
          imageCount: 4,
          aspectRatio: "1/1",
          borderRadius: 8,
        },
      },
    ],
  },
  {
    key: "countdown",
    type: "countdown",
    name: "Countdown Timer (Hitung Mundur)",
    category: "Functional Widgets",
    description: "Penghitung mundur hari, jam, dan menit menuju hari bahagia acara.",
    icon: <ClockCircleOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 280,
    defaultBgColor: "#455633",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "countdown",
        name: "Widget Hitung Mundur",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 180 },
        props: {
          title: "Menghitung Hari Bahagia",
          eventDate: "2026-12-28T09:00:00",
          color: "#fffcea",
        },
      },
    ],
  },
  {
    key: "music",
    type: "music",
    name: "Background Music (BGM)",
    category: "Functional Widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Pemutar musik latar otomatis dengan kontrol play/pause floating.",
    icon: <CustomerServiceOutlined className="text-xl text-[#3D2516]" />,
    defaultHeight: 240,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "music",
        name: "Pemutar Musik",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 140 },
        props: {
          title: "Musik Latar Pernikahan",
          songTitle: "A Thousand Years",
          artistName: "Christina Perri",
          audioUrl: "",
        },
      },
    ],
  },
  {
    key: "rsvp",
    type: "rsvp",
    name: "RSVP (Konfirmasi Kehadiran)",
    category: "Functional Widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Formulir interaktif tamu untuk mengirim konfirmasi kehadiran dan ucapan doa.",
    icon: <UserAddOutlined className="text-xl text-[#258447]" />,
    defaultHeight: 460,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "rsvp",
        name: "Form RSVP",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 340 },
        props: {
          title: "Konfirmasi Kehadiran (RSVP)",
          buttonLabel: "Kirim Konfirmasi",
        },
      },
    ],
  },
  {
    key: "guestbook",
    type: "guestbook",
    name: "Guestbook (Buku Tamu Digital)",
    category: "Functional Widgets",
    badge: "Maksimal 1",
    isSingleton: true,
    description: "Buku tamu digital interaktif untuk mencatat doa dan ucapan selamat dari para tamu.",
    icon: <InboxOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 460,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "guestbook",
        name: "Buku Tamu Digital",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 320 },
        props: {
          title: "Buku Tamu & Doa Restu",
          subtitle: "Tuliskan ucapan dan doa terbaik Anda untuk kedua mempelai",
          buttonLabel: "Kirim Pesan",
          showCount: true,
        },
      },
    ],
  },
  {
    key: "digital_gift",
    type: "digital_gift",
    name: "Digital Gift (Tanda Kasih)",
    category: "Functional Widgets",
    description: "Informasi rekening bank dan amplop digital untuk tanda kasih dan kado pernikahan.",
    icon: <GiftOutlined className="text-xl text-[#FFAD38]" />,
    defaultHeight: 380,
    defaultBgColor: "rgba(255, 255, 255, 0.95)",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "digital_gift",
        name: "Widget Kado Digital",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 260 },
        props: {
          title: "Tanda Kasih (Digital Gift)",
          subtitle: "Doa restu Anda adalah karunia terindah bagi kami. Bagi yang berkenan memberikan tanda kasih:",
          bankName: "BCA",
          accountNumber: "1234 5678 90",
          accountHolder: "Mogran & Laura",
          showCopyButton: true,
        },
      },
    ],
  },
  {
    key: "video_greeting",
    type: "video_greeting",
    name: "Video Greeting (Add-on)",
    category: "Functional Widgets",
    badge: "Add-on",
    isAddon: true,
    description: "Pemutar video ucapan pre-wedding atau pesan bahagia kedua mempelai.",
    icon: <PlayCircleOutlined className="text-xl text-[#B84438]" />,
    defaultHeight: 380,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "video_greeting",
        name: "Video Greeting",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 260 },
        props: {
          title: "Video Momen Bahagia",
          badge: "Add-on",
          src: "",
          poster: "/templates/wedding/venue.jpg",
          aspectRatio: "16/9",
          controls: true,
        },
      },
    ],
  },
  {
    key: "maps",
    type: "maps",
    name: "Location & Peta Google Maps",
    category: "Functional Widgets",
    description: "Peta lokasi venue terintegrasi dengan tombol navigasi petunjuk arah Google Maps.",
    icon: <CompassOutlined className="text-xl text-[#0369a1]" />,
    defaultHeight: 360,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "widget",
        widgetType: "maps",
        name: "Lokasi & Peta",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 260 },
        props: {
          title: "Lokasi Acara",
          placeName: "Grand Ballroom Hotel Mulia",
          address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
          mapUrl: "https://maps.google.com",
          buttonLabel: "Buka Petunjuk Arah (Google Maps)",
          showMapEmbed: true,
        },
      },
    ],
  },
];

interface SectionCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSection: (section: CatalogSectionTemplate) => void;
  existingSections?: BuilderSection[];
}

export function SectionCatalogModal({
  open,
  onClose,
  onSelectSection,
  existingSections = [],
}: SectionCatalogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { key: "all", label: "Semua Section" },
    { key: "Static Elements", label: "Static Elements" },
    { key: "Functional Widgets", label: "Functional Widgets" },
  ];

  // Singleton and Cover/Penutup checks
  const hasCover = existingSections.some(
    (s) => s.id === "section-cover" || s.name.toLowerCase().includes("cover")
  );
  const hasPenutup = existingSections.some(
    (s) => s.id === "section-penutup" || s.name.toLowerCase().includes("penutup")
  );
  const existingWidgetTypes = new Set<string>();
  existingSections.forEach((s) => {
    s.children.forEach((c) => {
      if (c.kind === "widget" && c.widgetType) {
        existingWidgetTypes.add(c.widgetType);
      }
    });
  });

  const filteredCatalog = ADMIN_SECTION_CATALOG.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <Title level={4} className="!mb-0 !text-[#422B1C]">
            Katalog Section &amp; Widget Admin
          </Title>
          <Text className="text-xs text-[#99918A]">
            Pilih section template siap pakai dari katalog Admin untuk ditambahkan ke canvas.
          </Text>
        </div>
      }
      width={780}
      footer={null}
      styles={{ body: { padding: "16px 20px" } }}
    >
      {/* Category Filter Pills & Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <Button
              key={c.key}
              size="small"
              type={selectedCategory === c.key ? "primary" : "default"}
              className={
                selectedCategory === c.key
                  ? "!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold"
                  : "!border-[#EAE5DF] !text-[#99918A] hover:!border-[#FFAD38] hover:!text-[#422B1C]"
              }
              onClick={() => setSelectedCategory(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <Input.Search
          size="small"
          placeholder="Cari section..."
          className="w-48"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid of Sections */}
      <div className="max-h-[460px] overflow-y-auto pr-1">
        {filteredCatalog.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada section yang sesuai dengan filter."
            className="my-8"
          />
        ) : (
          <Row gutter={[12, 12]}>
            {filteredCatalog.map((item) => {
              // Check availability / singleton restrictions
              const isCoverDisabled = item.key === "cover" && hasCover;
              const isPenutupDisabled = item.key === "penutup" && hasPenutup;
              const isSingletonDisabled =
                item.isSingleton &&
                (item.key === "rsvp" || item.key === "music" || item.key === "guestbook") &&
                existingWidgetTypes.has(item.key);

              const isDisabled =
                isCoverDisabled || isPenutupDisabled || isSingletonDisabled;

              let disabledReason = "";
              if (isCoverDisabled) disabledReason = "Cover sudah ada di posisi awal";
              else if (isPenutupDisabled) disabledReason = "Penutup sudah ada di posisi akhir";
              else if (isSingletonDisabled) disabledReason = "Maksimal 1 widget ini dalam undangan";

              return (
                <Col xs={24} sm={12} key={item.key}>
                  <Card
                    hoverable={!isDisabled}
                    className={`h-full border-[#EAE5DF] transition-all ${
                      isDisabled
                        ? "opacity-60 bg-[#f9f8f6] cursor-not-allowed"
                        : "hover:border-[#FFAD38] shadow-xs"
                    }`}
                    styles={{ body: { padding: 14 } }}
                    onClick={() => {
                      if (!isDisabled) {
                        onSelectSection(item);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Consistent Thumbnail */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FFF8EE] border border-[#EAE5DF] shadow-xs">
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <Text strong className="truncate text-sm text-[#422B1C]">
                            {item.name}
                          </Text>
                          {item.badge && (
                            <Tag
                              color={
                                item.isAddon
                                  ? "purple"
                                  : item.isRequired
                                    ? "orange"
                                    : "gold"
                              }
                              className="!mr-0 !text-[10px]"
                            >
                              {item.badge}
                            </Tag>
                          )}
                        </div>

                        <Text
                          className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[#99918A]"
                        >
                          {item.description}
                        </Text>

                        <div className="mt-3 flex items-center justify-between">
                          <Tag className="!mr-0 !text-[10px] text-[#99918A]">
                            {item.category}
                          </Tag>

                          {isDisabled ? (
                            <Tooltip title={disabledReason}>
                              <Text type="secondary" className="text-[11px] italic text-[#99918A]">
                                {disabledReason}
                              </Text>
                            </Tooltip>
                          ) : (
                            <Button
                              size="small"
                              type="link"
                              icon={<PlusOutlined />}
                              className="!px-0 !text-xs !text-[#FFAD38] hover:!text-[#D48816] font-semibold"
                            >
                              Tambah
                            </Button>
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
