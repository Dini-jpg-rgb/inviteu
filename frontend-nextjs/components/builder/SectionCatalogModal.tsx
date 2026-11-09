"use client";

import React, { useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  HeartOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Col, Modal, Row, Tag, Typography } from "antd";

const { Text, Title } = Typography;

export interface CatalogSectionTemplate {
  key: string;
  type: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  defaultHeight: number;
  defaultBgColor: string;
  defaultChildren: Array<{
    elementType?: "text" | "image" | "video" | "shape" | "button" | "divider";
    widgetType?: "countdown" | "rsvp" | "music" | "digital_gift";
    kind: "element" | "widget";
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    props: Record<string, string | number | boolean>;
  }>;
}

export const ADMIN_SECTION_CATALOG: CatalogSectionTemplate[] = [
  {
    key: "event_details",
    type: "event_details",
    name: "Event Details (Akad & Resepsi)",
    category: "Informasi Acara",
    badge: "Populer",
    description: "Informasi jadwal akad nikah, jam resepsi, dan peta lokasi venue acara.",
    icon: <CalendarOutlined className="text-xl text-[#9A5A00]" />,
    defaultHeight: 460,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Acara",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 40 },
        props: {
          text: "Waktu & Tempat Acara",
          fontSize: 22,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Rundown Acara",
        position: { x: 20, y: 80 },
        size: { width: 340, height: 180 },
        props: {
          text: "Akad Nikah: 08.00 - 10.00 WIB\nResepsi: 11.00 - 14.00 WIB\n\nGrand Ballroom Hotel Mulia\nJl. Asia Afrika, Senayan, Jakarta",
          fontSize: 14,
          lineHeight: 1.6,
          alignment: "center",
          color: "#765D48",
        },
      },
      {
        kind: "element",
        elementType: "button",
        name: "Tombol Google Maps",
        position: { x: 60, y: 280 },
        size: { width: 260, height: 44 },
        props: {
          text: "Petunjuk Arah (Google Maps)",
          backgroundColor: "#FCB040",
          color: "#3A2313",
          borderRadius: 8,
        },
      },
    ],
  },
  {
    key: "countdown",
    type: "countdown",
    name: "Countdown Timer (Hitung Mundur)",
    category: "Interaktif",
    description: "Penghitung mundur hari, jam, dan menit menuju hari bahagia acara.",
    icon: <ClockCircleOutlined className="text-xl text-[#9A5A00]" />,
    defaultHeight: 280,
    defaultBgColor: "#455633",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Countdown",
        position: { x: 20, y: 30 },
        size: { width: 340, height: 36 },
        props: {
          text: "Menghitung Hari Bahagia",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#fffcea",
        },
      },
      {
        kind: "widget",
        widgetType: "countdown",
        name: "Widget Hitung Mundur",
        position: { x: 20, y: 80 },
        size: { width: 340, height: 120 },
        props: {
          eventDate: "2026-12-28T09:00:00",
          color: "#fffcea",
        },
      },
    ],
  },
  {
    key: "love_story",
    type: "love_story",
    name: "Love Story (Kisah Cinta)",
    category: "Cerita & Kenangan",
    description: "Linimasa cerita perjalanan cinta dari awal perjumpaan hingga pelaminan.",
    icon: <HeartOutlined className="text-xl text-[#B84438]" />,
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
          color: "#3A2313",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Timeline Cerita",
        position: { x: 20, y: 85 },
        size: { width: 340, height: 320 },
        props: {
          text: "2021 — Pertemuan Pertama di Kampus\nSebuah sapaan sederhana menjadi awal dari kisah panjang.\n\n2024 — Mengikat Komitmen\nDi hadapan keluarga, kami memutuskan melangkah ke jenjang yang lebih serius.\n\n2026 — Menuju Pelaminan\nMemulai ibadah terindah sepanjang hidup bersama.",
          fontSize: 13,
          lineHeight: 1.7,
          alignment: "center",
          color: "#765D48",
        },
      },
    ],
  },
  {
    key: "gallery",
    type: "gallery",
    name: "Galeri Foto (Photo Gallery)",
    category: "Media",
    badge: "Wajib Foto",
    description: "Tampilan galeri album foto pre-wedding dan momen kebersamaan.",
    icon: <PictureOutlined className="text-xl text-[#9A5A00]" />,
    defaultHeight: 440,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Galeri",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Galeri Foto Bahagia",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "element",
        elementType: "image",
        name: "Foto Utama Galeri",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 260 },
        props: {
          src: "/templates/wedding/gallery-1.jpg",
          alt: "Galeri Foto Pre-wedding",
          borderRadius: 8,
          objectFit: "cover",
        },
      },
    ],
  },
  {
    key: "rsvp",
    type: "rsvp",
    name: "RSVP (Konfirmasi Kehadiran)",
    category: "Interaktif",
    badge: "Penting",
    description: "Formulir konfirmasi kehadiran tamu beserta pesan ucapan doa restu.",
    icon: <UserAddOutlined className="text-xl text-[#267044]" />,
    defaultHeight: 460,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul RSVP",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Konfirmasi Kehadiran (RSVP)",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "widget",
        widgetType: "rsvp",
        name: "Form RSVP",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 320 },
        props: {
          buttonText: "Kirim Konfirmasi",
        },
      },
    ],
  },
  {
    key: "digital_gift",
    type: "digital_gift",
    name: "Digital Gift (Tanda Kasih)",
    category: "Pembayaran & Kado",
    description: "Informasi rekening bank dan amplop digital untuk doa dan tanda kasih.",
    icon: <GiftOutlined className="text-xl text-[#9A5A00]" />,
    defaultHeight: 380,
    defaultBgColor: "rgba(255, 255, 255, 0.9)",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Digital Gift",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Tanda Kasih (Digital Gift)",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "widget",
        widgetType: "digital_gift",
        name: "Widget Kado Digital",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 240 },
        props: {
          bankName: "BCA",
          accountNumber: "1234 5678 90",
          accountHolder: "InviteU Couple",
        },
      },
    ],
  },
  {
    key: "dresscode",
    type: "dresscode",
    name: "Dresscode & Panduan Acara",
    category: "Informasi Acara",
    description: "Panduan busana tamu, warna tema acara, dan aturan protokol kesehatan.",
    icon: <CheckCircleOutlined className="text-xl text-[#9A5A00]" />,
    defaultHeight: 320,
    defaultBgColor: "#FFF8EE",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Dresscode",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Dresscode Acara",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "element",
        elementType: "text",
        name: "Panduan Busana",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 160 },
        props: {
          text: "Busana: Pakaian Formal / Batik / Earth Tone\n\nUntuk menjaga keindahan suasana pernikahan kami, para tamu disarankan mengenakan pakaian bernuansa Sage Green, Cream, atau Cokelat.",
          fontSize: 13,
          lineHeight: 1.6,
          alignment: "center",
          color: "#765D48",
        },
      },
    ],
  },
  {
    key: "video_greeting",
    type: "video_greeting",
    name: "Video Greeting & Streaming",
    category: "Media",
    description: "Pemutar video pre-wedding atau siaran langsung (live stream) prosesi akad.",
    icon: <PlayCircleOutlined className="text-xl text-[#B84438]" />,
    defaultHeight: 360,
    defaultBgColor: "#ffffff",
    defaultChildren: [
      {
        kind: "element",
        elementType: "text",
        name: "Judul Video",
        position: { x: 20, y: 25 },
        size: { width: 340, height: 36 },
        props: {
          text: "Live Streaming & Video Momen",
          fontSize: 20,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        kind: "element",
        elementType: "video",
        name: "Video Pemutar",
        position: { x: 20, y: 75 },
        size: { width: 340, height: 200 },
        props: {
          src: "",
          poster: "/templates/wedding/venue.jpg",
          borderRadius: 8,
        },
      },
    ],
  },
];

interface SectionCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSection: (section: CatalogSectionTemplate) => void;
}

export function SectionCatalogModal({
  open,
  onClose,
  onSelectSection,
}: SectionCatalogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: "Semua Section" },
    { key: "Informasi Acara", label: "Informasi Acara" },
    { key: "Interaktif", label: "Interaktif" },
    { key: "Cerita & Kenangan", label: "Cerita & Kenangan" },
    { key: "Media", label: "Media & Foto" },
    { key: "Pembayaran & Kado", label: "Kado & Hadiah" },
  ];

  const filteredCatalog =
    selectedCategory === "all"
      ? ADMIN_SECTION_CATALOG
      : ADMIN_SECTION_CATALOG.filter((s) => s.category === selectedCategory);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <Title level={4} className="!mb-0 text-[#3A2313]">
            Katalog Section Admin InviteU
          </Title>
          <Text type="secondary" className="text-xs">
            Pilih section template siap pakai untuk ditambahkan di antara Cover dan Penutup.
          </Text>
        </div>
      }
      width={780}
      footer={null}
      styles={{ body: { padding: "16px 20px" } }}
    >
      {/* Category Filter Pills */}
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

      {/* Grid of Sections */}
      <div className="max-h-[460px] overflow-y-auto pr-1">
        <Row gutter={[12, 12]}>
          {filteredCatalog.map((item) => (
            <Col xs={24} sm={12} key={item.key}>
              <Card
                hoverable
                className="h-full border-[#EBD9BE] transition-all hover:border-[#FCB040]"
                styles={{ body: { padding: 14 } }}
                onClick={() => {
                  onSelectSection(item);
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
                        <Tag color="gold" className="!mr-0 !text-[10px]">
                          {item.badge}
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[#765D48]">
                      {item.description}
                    </Text>
                    <div className="mt-3 flex items-center justify-between">
                      <Tag className="!mr-0 !text-[10px] text-[#765D48]">
                        {item.category}
                      </Tag>
                      <Button
                        size="small"
                        type="link"
                        icon={<PlusOutlined />}
                        className="!px-0 !text-xs !text-[#9A5A00]"
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Modal>
  );
}
