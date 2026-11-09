import React from "react";
import {
  MasterWidget,
  SectionConfig,
  WidgetRendererProps,
  EditableFieldDef,
} from "./types";
import { FallbackWidget } from "./FallbackWidget";
import { CoverWidget } from "../widgets/CoverWidget";
import { EventDetailsWidget } from "../widgets/EventDetailsWidget";
import { GalleryWidget } from "../widgets/GalleryWidget";
import { LoveStoryWidget } from "../widgets/LoveStoryWidget";
import { CountdownWidget } from "../widgets/CountdownWidget";
import { MusicWidget } from "../widgets/MusicWidget";
import { RsvpWidget } from "../widgets/RsvpWidget";
import { DigitalGiftWidget } from "../widgets/DigitalGiftWidget";
import { VideoGreetingWidget } from "../widgets/VideoGreetingWidget";
import { DresscodeWidget } from "../widgets/DresscodeWidget";
import { QuoteBannerWidget } from "../widgets/QuoteBannerWidget";
import { TemplateTheme } from "@/app/(designer)/designer/templates/themes/registry";
import { BUILDER_COLOR_PALETTE } from "../colorPalette";

export * from "./types";
export * from "./FallbackWidget";

// Standard Global Style Controls for Editable Fields (MVP 5 - Enhanced Styling)
const COMMON_STYLE_FIELDS: EditableFieldDef[] = [
  {
    name: "alignment",
    label: "Perataan Teks",
    type: "select",
    target: "settings",
    category: "style",
    options: [
      { label: "Kiri", value: "left" },
      { label: "Tengah", value: "center" },
      { label: "Kanan", value: "right" },
    ],
  },
  {
    name: "fontFamily",
    label: "Gaya Huruf (Font)",
    type: "select",
    target: "settings",
    category: "style",
    options: [
      { label: "Serif (Elegan / Klasik)", value: "serif" },
      { label: "Sans (Modern / Bersih)", value: "sans" },
      { label: "Mono (Ketik / Vintage)", value: "mono" },
      { label: "Script (Kaligrafi Romantis)", value: "script" },
    ],
  },
  {
    name: "fontSize",
    label: "Ukuran Teks",
    type: "select",
    target: "settings",
    category: "style",
    options: [
      { label: "Kecil (S)", value: "sm" },
      { label: "Normal (M)", value: "base" },
      { label: "Besar (L)", value: "lg" },
      { label: "Ekstra Besar (XL)", value: "xl" },
    ],
  },
  {
    name: "fontWeight",
    label: "Ketebalan Teks",
    type: "select",
    target: "settings",
    category: "style",
    options: [
      { label: "Normal (400)", value: "normal" },
      { label: "Medium (500)", value: "medium" },
      { label: "Semibold (600)", value: "semibold" },
      { label: "Bold (700)", value: "bold" },
    ],
  },
  {
    name: "textColor",
    label: "Warna Teks Utama",
    type: "color",
    target: "settings",
    category: "style",
  },
  {
    name: "accentColor",
    label: "Warna Aksen / Badge",
    type: "color",
    target: "settings",
    category: "style",
  },
  {
    name: "backgroundColor",
    label: "Warna Background Section",
    type: "color",
    target: "settings",
    category: "spacing",
  },
  {
    name: "paddingY",
    label: "Ruang Spacing Vertikal (Padding)",
    type: "select",
    target: "settings",
    category: "spacing",
    options: [
      { label: "Tanpa Padding", value: "none" },
      { label: "Ringkas (S)", value: "sm" },
      { label: "Sedang (M)", value: "md" },
      { label: "Lega (L)", value: "lg" },
      { label: "Ekstra (XL)", value: "xl" },
    ],
  },
  {
    name: "borderRadius",
    label: "Kelengkungan Sudut (Radius)",
    type: "select",
    target: "settings",
    category: "spacing",
    options: [
      { label: "Tegak Lurus (0)", value: "none" },
      { label: "Sedang (MD)", value: "md" },
      { label: "Lengkung (LG)", value: "lg" },
      { label: "Ekstra Lengkung (XL)", value: "xl" },
      { label: "Kapsul (Full)", value: "full" },
    ],
  },
  {
    name: "borderWidth",
    label: "Ketebalan Garis Batas",
    type: "select",
    target: "settings",
    category: "spacing",
    options: [
      { label: "Tanpa Border", value: "none" },
      { label: "Tipis (1px)", value: "thin" },
      { label: "Sedang (2px)", value: "medium" },
      { label: "Tebal (4px)", value: "thick" },
    ],
  },
  {
    name: "borderColor",
    label: "Warna Garis Batas",
    type: "color",
    target: "settings",
    category: "spacing",
  },
  {
    name: "bgImage",
    label: "Gambar Latar (Background Image)",
    type: "image",
    target: "settings",
    category: "spacing",
  },
  {
    name: "layoutVariant",
    label: "Varian Layout",
    type: "select",
    target: "settings",
    category: "spacing",
    options: [
      { label: "Standar (Default)", value: "default" },
      { label: "Kartu Mengambang (Card)", value: "card" },
      { label: "Minimalis (Clean)", value: "minimal" },
    ],
  },
];

import { SectionProperties } from "../types";

// Helper adapter component to bridge settings & content to widget renderers
function createAdapterRenderer<T extends Record<string, unknown>>(
  Component: React.ComponentType<SectionProperties>
): React.ComponentType<WidgetRendererProps<T>> {
  return function AdaptedWidget({ settings, content }: WidgetRendererProps<T>) {
    const combined = { ...settings, ...content } as SectionProperties;
    return <Component {...combined} />;
  };
}

/**
 * MASTER WIDGET REGISTRY (MVP 3)
 * Hubungan terpadu antara identitas, nama, renderer, konfigurasi default,
 * properti konten default, dan daftar field yang dapat diedit oleh designer.
 */
export const WIDGET_REGISTRY: Record<string, MasterWidget> = {
  cover: {
    id: "cover",
    name: "Cover & Hero",
    category: "core",
    description: "Header visual utama, foto cover, nama mempelai dan pesan pembuka",
    icon: "🖼️",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      paddingY: "md",
    },
    defaultContent: {
      title: "Two Hearts, One Journey",
      subtitle: "With joyful hearts, we invite you to celebrate our new chapter.",
      coupleTitle: "MOGRAN & LAURA",
      imageUrl: "/templates/wedding/couple-main.jpg",
    },
    editableFields: [
      {
        name: "coupleTitle",
        label: "Nama Kedua Mempelai",
        type: "text",
        target: "content",
        category: "content",
        placeholder: "MOGRAN & LAURA",
      },
      {
        name: "title",
        label: "Judul Atas (Tagline)",
        type: "text",
        target: "content",
        category: "content",
        placeholder: "Two Hearts, One Journey",
      },
      {
        name: "subtitle",
        label: "Pesan Pembuka / Subtitle",
        type: "textarea",
        target: "content",
        category: "content",
      },
      {
        name: "imageUrl",
        label: "URL Foto Cover Hero",
        type: "image",
        target: "content",
        category: "content",
        placeholder: "/templates/wedding/couple-main.jpg",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(CoverWidget),
  },

  event_details: {
    id: "event_details",
    name: "Event Details",
    category: "event",
    description: "Informasi tanggal, jam acara, nama gedung/venue dan link Google Maps",
    icon: "📍",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#ffffff",
      paddingY: "md",
    },
    defaultContent: {
      badge: "Acara & Lokasi",
      placeName: "Sangeh Sanctuary Villa",
      address: "Jl. Contoh No. 123, Denpasar, Bali",
      dateText: "Senin, 28 Desember 2026",
      timeText: "09:00 - 13:00 WITA",
      mapUrl: "https://maps.google.com",
    },
    editableFields: [
      {
        name: "badge",
        label: "Label Badge",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "placeName",
        label: "Nama Gedung / Tempat",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "address",
        label: "Alamat Lengkap",
        type: "textarea",
        target: "content",
        category: "content",
      },
      {
        name: "dateText",
        label: "Hari & Tanggal Acara",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "timeText",
        label: "Waktu Acara",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "mapUrl",
        label: "Tautan Google Maps",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(EventDetailsWidget),
  },

  gallery: {
    id: "gallery",
    name: "Gallery",
    category: "media",
    description: "Koleksi foto pre-wedding dan momen bahagia mempelai",
    icon: "📸",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#faf8f5",
      paddingY: "md",
    },
    defaultContent: {
      title: "Our Moments",
      galleryImages: [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
      ],
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Galeri",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(GalleryWidget),
  },

  love_story: {
    id: "love_story",
    name: "Love Story",
    category: "core",
    description: "Timeline perjalanan romantis mempelai dari awal bertemu hingga menikah",
    icon: "📖",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      paddingY: "md",
    },
    defaultContent: {
      title: "Our Love Story",
      subtitle: "Bagaimana perjalanan cinta kami bersemi hingga menuju pelaminan.",
      milestones: [
        { id: "1", year: "2021", title: "Pertama Bertemu", story: "Berawal dari perkenalan santai di sebuah kedai kopi di Denpasar." },
        { id: "2", year: "2023", title: "Memulai Komitmen", story: "Memutuskan untuk melangkah bersama melewati suka dan duka kehidupan." },
        { id: "3", year: "2026", title: "Menuju Pelaminan", story: "Mengikat janji suci di hadapan keluarga dan sahabat tercinta." },
      ],
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Kisah Cinta",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "subtitle",
        label: "Pesan Pengantar",
        type: "textarea",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(LoveStoryWidget),
  },

  countdown: {
    id: "countdown",
    name: "Countdown",
    category: "interactive",
    description: "Hitung mundur interaktif menuju hari dan jam akad/resepsi",
    icon: "⏳",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#f9f8f6",
      paddingY: "md",
    },
    defaultContent: {
      title: "Menuju Hari Bahagia",
      subtitle: "Kami menantikan kehadiran dan doa restu Anda di hari istimewa ini.",
      days: 45,
      hours: 12,
      minutes: 30,
      seconds: 15,
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Hitung Mundur",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "subtitle",
        label: "Pesan Keterangan",
        type: "textarea",
        target: "content",
        category: "content",
      },
      {
        name: "days",
        label: "Jumlah Hari Awal",
        type: "number",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(CountdownWidget),
  },

  music: {
    id: "music",
    name: "Background Music",
    category: "media",
    description: "Pemutar audio musik latar romantis dengan kontrol putar/jeda",
    icon: "🎵",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      paddingY: "sm",
    },
    defaultContent: {
      title: "Background Music",
      songTitle: "A Thousand Years",
      artistName: "Christina Perri",
    },
    editableFields: [
      {
        name: "songTitle",
        label: "Judul Lagu",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "artistName",
        label: "Nama Musisi / Artis",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(MusicWidget),
  },

  rsvp: {
    id: "rsvp",
    name: "RSVP Form",
    category: "interactive",
    description: "Formulir konfirmasi kehadiran tamu (Hadir/Tidak Hadir) secara langsung",
    icon: "✉️",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#ffffff",
      paddingY: "md",
    },
    defaultContent: {
      title: "Will You Join Us?",
      subtitle: "Mohon konfirmasi kehadiran Anda untuk membantu persiapan jamuan kami.",
      submitButtonText: "Kirim Konfirmasi Kehadiran",
    },
    editableFields: [
      {
        name: "title",
        label: "Judul RSVP",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "subtitle",
        label: "Instruksi RSVP",
        type: "textarea",
        target: "content",
        category: "content",
      },
      {
        name: "submitButtonText",
        label: "Teks Tombol Kirim",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(RsvpWidget),
  },

  digital_gift: {
    id: "digital_gift",
    name: "Digital Gift",
    category: "interactive",
    description: "Amplop digital cashless, nomor rekening bank dan tombol salin rekening",
    icon: "🎁",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      paddingY: "md",
    },
    defaultContent: {
      title: "Tanda Kasih (Digital Gift)",
      subtitle: "Doa restu Anda merupakan karunia terindah bagi kami. Bagi yang berkenan memberikan tanda kasih:",
      bankName: "BCA",
      accountNumber: "1234 5678 90",
      accountHolder: "Mogran & Laura",
      giftNote: "Terima kasih atas kebaikan dan doa tulus Anda.",
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Amplop Digital",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "bankName",
        label: "Nama Bank / E-Wallet",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "accountNumber",
        label: "Nomor Rekening",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "accountHolder",
        label: "Nama Pemilik Rekening",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "giftNote",
        label: "Catatan Tambahan",
        type: "textarea",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(DigitalGiftWidget),
  },

  dresscode: {
    id: "dresscode",
    name: "Dresscode",
    category: "event",
    description: "Panduan palet warna busana tamu undangan sesuai tema acara",
    icon: "👗",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#f9f8f3",
      paddingY: "md",
    },
    defaultContent: {
      title: "Dresscode",
      subtitle: "InviteU Color Palette",
      palettes: [...BUILDER_COLOR_PALETTE],
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Dresscode",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "subtitle",
        label: "Sub-keterangan Palet",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: DresscodeWidget,
  },

  quote_banner: {
    id: "quote_banner",
    name: "Quote Banner",
    category: "core",
    description: "Blok kutipan romantis bertekstur dengan pesan dan nama mempelai",
    icon: "📜",
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#fffcea",
      accentColor: "#cfcaa3",
      backgroundColor: "#455633",
      paddingY: "md",
    },
    defaultContent: {
      tag: "Two Hearts, One Journey",
      message: "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
      groom: "MOGRAN",
      bride: "LAURA",
    },
    editableFields: [
      {
        name: "tag",
        label: "Tagline / Judul Kutipan",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "message",
        label: "Isi Pesan Kutipan",
        type: "textarea",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: QuoteBannerWidget,
  },

  video_greeting: {
    id: "video_greeting",
    name: "Video Greeting",
    category: "addon",
    description: "Add-On: Pemutar video sinematik ucapan selamat dan kisah mempelai",
    icon: "🎬",
    isAddon: true,
    defaultSettings: {
      alignment: "center",
      fontFamily: "serif",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      paddingY: "md",
    },
    defaultContent: {
      title: "Video Ucapan & Momen Bahagia",
      subtitle: "Saksikan ucapan hangat serta kompilasi momen spesial kami.",
      videoUrl: "https://www.youtube.com/watch?v=sample",
    },
    editableFields: [
      {
        name: "title",
        label: "Judul Video",
        type: "text",
        target: "content",
        category: "content",
      },
      {
        name: "subtitle",
        label: "Sub-keterangan Video",
        type: "textarea",
        target: "content",
        category: "content",
      },
      {
        name: "videoUrl",
        label: "URL Video (YouTube / MP4)",
        type: "text",
        target: "content",
        category: "content",
      },
      ...COMMON_STYLE_FIELDS,
    ],
    renderer: createAdapterRenderer(VideoGreetingWidget),
  },
};

/**
 * Mendapatkan definisi Master Widget berdasarkan type ID
 */
export function getWidgetDefinition(type: string): MasterWidget | undefined {
  return WIDGET_REGISTRY[type];
}

/**
 * Mengambil daftar seluruh Master Widget yang terdaftar
 */
export function getAllRegisteredWidgets(): MasterWidget[] {
  return Object.values(WIDGET_REGISTRY);
}

/**
 * Membuat sebuah Instance Section baru dari Master Widget
 * (Memisahkan Master Widget Definition dari Section Instance Template)
 */
export function createSectionInstance(type: string, sortOrder: number): SectionConfig {
  const master = getWidgetDefinition(type);
  const timestamp = Date.now();

  if (!master) {
    // Graceful creation for unknown widget
    return {
      id: `sec-unknown-${timestamp}`,
      type,
      name: `Widget ${type}`,
      sortOrder,
      visible: true,
      settings: {
        alignment: "center",
        fontFamily: "serif",
        textColor: "#24380f",
        accentColor: "#6f7f5f",
        backgroundColor: "#ffffff",
        paddingY: "md",
      },
      content: {
        title: `Widget ${type}`,
      },
    };
  }

  return {
    id: `sec-${type}-${timestamp}`,
    type: master.id,
    name: master.name,
    sortOrder,
    visible: true,
    settings: { ...master.defaultSettings },
    content: JSON.parse(JSON.stringify(master.defaultContent)),
  };
}

/**
 * Render section dengan Fallback aman jika widget tidak dikenal
 */
export function renderSectionWidget(
  section: SectionConfig,
  isEditMode: boolean = false
): React.ReactNode {
  const master = getWidgetDefinition(section.type);

  if (!master || !master.renderer) {
    return (
      <FallbackWidget
        id={section.id}
        name={section.name}
        type={section.type}
        settings={section.settings}
        content={section.content}
        isEditMode={isEditMode}
      />
    );
  }

  const RendererComponent = master.renderer;
  return (
    <RendererComponent
      id={section.id}
      name={section.name}
      settings={section.settings}
      content={section.content}
      isEditMode={isEditMode}
    />
  );
}

/**
 * Mengonversi skema TemplateTheme existing (misal weddingTheme)
 * menjadi daftar instance SectionConfig yang dapat langsung diedit di builder
 */
export function convertThemeToSections(theme: TemplateTheme): SectionConfig[] {
  const content = theme.content;
  const colors = theme.colorPalette;

  const baseSettings = {
    fontFamily: "serif" as const,
    textColor: colors.text,
    accentColor: colors.primary,
    backgroundColor: colors.background,
    paddingY: "md" as const,
  };

  return [
    {
      id: "sec-wedding-cover",
      type: "cover",
      name: "Cover & Hero",
      sortOrder: 0,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "rgba(255, 255, 255, 0.75)",
      },
      content: {
        title: content.banner?.tag || "A Special Invitation",
        subtitle: content.invitationNote?.message || "With joyful hearts, we invite you to celebrate our new chapter.",
        coupleTitle: `${content.couple?.groom} & ${content.couple?.bride}`,
        imageUrl: content.heroImage || "/templates/wedding/couple-main.jpg",
      },
    },
    {
      id: "sec-wedding-quote",
      type: "quote_banner",
      name: "Quote Banner",
      sortOrder: 1,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: colors.secondary,
        textColor: "#fffcea",
        accentColor: "#cfcaa3",
      },
      content: {
        tag: content.banner?.tag || "Two Hearts, One Journey",
        message: content.banner?.message || "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
        groom: content.couple?.groom || "MOGRAN",
        bride: content.couple?.bride || "LAURA",
      },
    },
    {
      id: "sec-wedding-event",
      type: "event_details",
      name: "Event Details",
      sortOrder: 2,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "#ffffff",
      },
      content: {
        badge: content.venue?.badge || "Where We Celebrate",
        placeName: content.venue?.placeName || "Sangeh Sanctuary Villa",
        address: content.venue?.address || "Jl. Contoh No. 123, Denpasar, Bali",
        dateText: `${content.saveTheDate?.monthText} ${content.saveTheDate?.dateNumber}, ${content.saveTheDate?.yearText}`,
        timeText: "09:00 - 13:00 WITA",
        mapUrl: content.venue?.mapUrl || "https://maps.google.com",
      },
    },
    {
      id: "sec-wedding-dresscode",
      type: "dresscode",
      name: "Dresscode",
      sortOrder: 3,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "#f9f8f3",
      },
      content: {
        title: content.dresscode?.title || "Dresscode",
        subtitle: content.dresscode?.subtitle || "Earth / Botanical Green Palette",
        palettes: content.dresscode?.palettes || [],
      },
    },
    {
      id: "sec-wedding-gallery",
      type: "gallery",
      name: "Gallery",
      sortOrder: 4,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "#faf8f5",
      },
      content: {
        title: content.gallery?.title || "Gallery",
        galleryImages: content.gallery?.images || [],
      },
    },
    {
      id: "sec-wedding-music",
      type: "music",
      name: "Background Music",
      sortOrder: 5,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      },
      content: {
        title: "Background Music",
        songTitle: "A Thousand Years",
        artistName: "Christina Perri",
      },
    },
    {
      id: "sec-wedding-rsvp",
      type: "rsvp",
      name: "RSVP Form",
      sortOrder: 6,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "#ffffff",
      },
      content: {
        title: content.rsvp?.title || "Will You Join Us?",
        subtitle: content.rsvp?.subtitle || "Mohon konfirmasi kehadiran Anda untuk membantu persiapan jamuan kami.",
        submitButtonText: content.rsvp?.fields?.submitText || "Kirim",
      },
    },
    {
      id: "sec-wedding-gift",
      type: "digital_gift",
      name: "Digital Gift",
      sortOrder: 7,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      },
      content: {
        title: "Tanda Kasih (Digital Gift)",
        subtitle: "Doa restu Anda merupakan karunia terindah bagi kami. Bagi yang berkenan memberikan tanda kasih:",
        bankName: "BCA",
        accountNumber: "1234 5678 90",
        accountHolder: "Mogran & Laura",
        giftNote: "Terima kasih atas kebaikan dan doa tulus Anda.",
      },
    },
    {
      id: "sec-wedding-countdown",
      type: "countdown",
      name: "Countdown",
      sortOrder: 8,
      visible: true,
      settings: {
        ...baseSettings,
        alignment: "center",
        backgroundColor: "#455633",
        textColor: "#fffcea",
        accentColor: "#cfcaa3",
      },
      content: {
        title: content.closing?.countdownTitle || "Countdown to Event",
        subtitle: content.closing?.message || "Forever begins here.",
        days: 74,
        hours: 14,
        minutes: 32,
        seconds: 45,
      },
    },
  ];
}
