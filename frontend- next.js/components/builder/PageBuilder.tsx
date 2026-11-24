"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { getTemplateBySlug } from "@/app/(designer)/designer/templates/themes/registry";
import {
  CraftContainer,
  CraftCoverSection,
  CraftOpeningSection,
  CraftBrideGroomSection,
  CraftEventDetailsSection,
  CraftCountdownSection,
  CraftStorySection,
  CraftGallerySection,
  CraftRsvpSection,
  CraftDigitalGiftSection,
  CraftClosingSection,
  CraftBaliContainer,
  CraftBaliCoverSection,
  CraftBaliOpeningSection,
  CraftBaliCoupleSection,
  CraftBaliEventDetailsSection,
  CraftBaliCountdownSection,
  CraftBaliStorySection,
  CraftBaliGallerySection,
  CraftBaliRsvpSection,
  CraftBaliVoiceNoteSection,
  CraftBaliWishesSection,
  CraftBaliGiftSection,
  CraftBaliClosingSection,
  CraftEmeraldContainer,
  CraftEmeraldCoverSection,
  CraftEmeraldOpeningSection,
  CraftEmeraldCoupleSection,
  CraftEmeraldEventDetailsSection,
  CraftEmeraldCountdownSection,
  CraftEmeraldRsvpSection,
  CraftEmeraldGiftSection,
  CraftEmeraldLocationSection,
  CraftEmeraldWishesSection,
  CraftEmeraldClosingSection,
  CraftJavaneseContainer,
  CraftJavaneseCoverSection,
  CraftJavaneseOpeningSection,
  CraftJavaneseTentangAcaraSection,
  CraftJavaneseAboutSection,
  CraftJavaneseCoupleSection,
  CraftJavaneseEventDetailsSection,
  CraftJavaneseCountdownSection,
  CraftJavaneseRundownSection,
  CraftJavaneseLocationSection,
  CraftJavaneseGallerySection,
  CraftJavaneseRsvpSection,
  CraftJavaneseVoiceNoteSection,
  CraftJavaneseWishesSection,
  CraftJavaneseGiftSection,
  CraftJavaneseClosingSection,
  BuilderLiveContext,
} from "./CraftComponents";

export type SectionKey =
  | "cover"
  | "opening"
  | "about"
  | "bride-groom"
  | "event-details"
  | "countdown"
  | "rundown"
  | "location"
  | "story"
  | "gallery"
  | "rsvp"
  | "voice-note"
  | "wishes"
  | "digital-gift"
  | "closing";

export interface PageBuilderProps {
  role: "partner" | "designer";
  initialTemplate?: string;
}

function getSectionKeyFromDisplayName(displayName: string): SectionKey | null {
  switch (displayName) {
    case "Javanese Cover":
    case "Emerald Cover":
    case "Bali Cover":
    case "Cover":
      return "cover";
    case "Javanese Opening":
      case "Emerald Opening":
    case "Bali Opening":
    case "Opening":
      return "opening";
    case "Javanese Tentang Acara":
      return "about";
    case "Javanese Couple":
    case "Emerald Couple":
    case "Bali Couple":
    case "Bride and Groom":
      return "bride-groom";
    case "Javanese Event Details":
    case "Emerald Event Details":
    case "Bali Event Details":
    case "Event Details":
      return "event-details";
    case "Javanese Location":
    case "Emerald Location":
      return "location";
    case "Javanese RSVP":
    case "Emerald RSVP":
    case "Bali RSVP":
    case "RSVP":
      return "rsvp";
    case "Javanese Wishes":
    case "Emerald Wishes":
    case "Bali Wishes":
      return "wishes";
    case "Javanese Gift":
    case "Emerald Gift":
    case "Bali Gift":
    case "Digital Gift":
      return "digital-gift";
    case "Javanese Closing":
    case "Emerald Closing":
    case "Bali Closing":
    case "Closing":
      return "closing";
    case "Javanese Countdown":
    case "Bali Countdown":
    case "Countdown":
      return "countdown";
    case "Javanese Rundown":
      return "rundown";
    case "Javanese About":
    case "Bali Story":
    case "Story":
      return "story";
    case "Javanese Gallery":
    case "Bali Gallery":
    case "Gallery":
      return "gallery";
    case "Javanese Voice Note":
    case "Bali Voice Note":
      return "voice-note";
    default:
      return null;
  }
}

// Internal editor controller component that has access to useEditor hook
function CraftSyncController({
  activeSection,
  sectionData,
  sectionsList,
  onCanvasReorder,
  onSelectSection,
  isBali,
  isEmerald,
}: {
  activeSection: SectionKey;
  sectionData: any;
  sectionsList: { key: SectionKey; label: string }[];
  onCanvasReorder?: (newOrderKeys: SectionKey[]) => void;
  onSelectSection?: (key: SectionKey) => void;
  isBali: boolean;
  isEmerald: boolean;
}) {
  const { actions, query, canvasNodeOrder, selectedNodeId } = useEditor((state) => {
    const rootNode = state.nodes["ROOT"];
    let selectedId: string | null = null;
    if (state.events.selected) {
      if (state.events.selected instanceof Set) {
        selectedId = Array.from(state.events.selected)[0] || null;
      } else if (Array.isArray(state.events.selected)) {
        selectedId = (state.events.selected as any[])[0] || null;
      } else if (typeof state.events.selected === "string") {
        selectedId = state.events.selected;
      }
    }
    return {
      canvasNodeOrder: rootNode ? rootNode.data.nodes : [],
      selectedNodeId: selectedId,
    };
  });

  // Scroll target element inside phone frame
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${activeSection}`);
      const container = document.getElementById("builder-phone-scroll-container");
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const relativeTop = elRect.top - containerRect.top + container.scrollTop;
        container.scrollTo({ top: Math.max(0, relativeTop), behavior: "smooth" });
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeSection]);

  // Synchronize canvas selection with active section in sidebar (deferred to prevent setState during render)
  const lastSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedNodeId || selectedNodeId === "ROOT" || !onSelectSection) return;
    if (lastSelectedRef.current === selectedNodeId) return;
    lastSelectedRef.current = selectedNodeId;
    try {
      const node = query.node(selectedNodeId).get();
      if (node && node.data.displayName) {
        const key = getSectionKeyFromDisplayName(node.data.displayName);
        if (key && key !== activeSection) {
          setTimeout(() => {
            onSelectSection(key);
          }, 0);
        }
      }
    } catch {
      // Safe query
    }
  }, [selectedNodeId, activeSection, onSelectSection, query]);

  // Synchronize canvas reordering (middle) to left sidebar (sectionsList, deferred)
  const lastCanvasOrderRef = useRef<string>("");
  useEffect(() => {
    if (!canvasNodeOrder || canvasNodeOrder.length === 0 || !onCanvasReorder) return;
    const currentOrderStr = canvasNodeOrder.join(",");
    if (lastCanvasOrderRef.current === currentOrderStr) return;
    lastCanvasOrderRef.current = currentOrderStr;
    const orderedKeys: SectionKey[] = [];
    canvasNodeOrder.forEach((nodeId) => {
      try {
        const node = query.node(nodeId).get();
        if (node && node.data.displayName) {
          const key = getSectionKeyFromDisplayName(node.data.displayName);
          if (key && !orderedKeys.includes(key)) {
            orderedKeys.push(key);
          }
        }
      } catch {
        // Safe access
      }
    });

    if (orderedKeys.length > 0) {
      const currentKeys = sectionsList.map((s) => s.key).join("-");
      const newKeys = orderedKeys.join("-");
      if (currentKeys !== newKeys) {
        setTimeout(() => {
          onCanvasReorder(orderedKeys);
        }, 0);
      }
    }
  }, [canvasNodeOrder, onCanvasReorder, query, sectionsList]);

  return null;
}

export function PageBuilder({ role, initialTemplate = "wedding" }: PageBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme") || initialTemplate;
  const isBali = themeParam === "bali-tropical" || themeParam === "bali";
  const isEmerald =
    themeParam === "emerald-gold-basic" ||
    themeParam === "emerald_gold_basic" ||
    themeParam === "emerald-gold";
  const isJavanese =
    themeParam === "javanesse-elegant" ||
    themeParam === "javanese-elegant" ||
    themeParam === "javanesse" ||
    themeParam === "javanese";

  // Active navigation tabs in Left Sidebar: "Konten" | "Widget"
  const [activeTab, setActiveTab] = useState<"konten" | "widget">("konten");

  // Selected Section in Left Sidebar (Default: event-details)
  const [activeSection, setActiveSection] = useState<SectionKey>("event-details");

  // Responsive active panel for mobile and tablet screens (< xl): "structure" | "canvas" | "settings"
  const [mobileActivePanel, setMobileActivePanel] = useState<"structure" | "canvas" | "settings">("canvas");

  // Track frame key version to re-render Craft canvas upon sidebar reordering
  const [frameVersion, setFrameVersion] = useState(0);

  // Handle reorder from Canvas directly
  const handleCanvasReorder = useCallback((newOrderKeys: SectionKey[]) => {
    setSectionsList((prevList) => {
      const currentKeys = prevList.map((s) => s.key).join("-");
      const newKeys = newOrderKeys.join("-");
      if (currentKeys === newKeys) return prevList;

      const keyToItem = new Map(prevList.map((item) => [item.key, item]));
      const reordered: { key: SectionKey; label: string }[] = [];
      newOrderKeys.forEach((key) => {
        const item = keyToItem.get(key);
        if (item) reordered.push(item);
      });
      prevList.forEach((item) => {
        if (!newOrderKeys.includes(item.key)) {
          reordered.push(item);
        }
      });
      return reordered;
    });
  }, []);

  // Dynamic Reorderable Sections List
  const [sectionsList, setSectionsList] = useState<{ key: SectionKey; label: string }[]>(() => {
    if (isJavanese) {
      return [
        { key: "cover", label: "Cover" },
        { key: "opening", label: "Opening (Assalamu'alaikum)" },
        { key: "about", label: "Tentang Acara (Pernikahan Nara & Dimas)" },
        { key: "bride-groom", label: "Mempelai (Kedua Mempelai)" },
        { key: "story", label: "Kisah Kami (Perjalanan Kami)" },
        { key: "event-details", label: "Detail Acara (Waktu & Tempat)" },
        { key: "countdown", label: "Hitung Mundur" },
        { key: "rundown", label: "Susunan Acara (Rundown)" },
        { key: "location", label: "Peta Lokasi" },
        { key: "gallery", label: "Galeri Momen Kami" },
        { key: "rsvp", label: "Konfirmasi Kehadiran (RSVP)" },
        { key: "voice-note", label: "Pesan Personal (Voice Note)" },
        { key: "wishes", label: "Buku Tamu (Ucapan & Doa)" },
        { key: "digital-gift", label: "Kirim Hadiah" },
        { key: "closing", label: "Penutup (Jazakumullahu Khairan)" },
      ];
    }
    if (isEmerald) {
      return [
        { key: "cover", label: "Cover (Art Deco)" },
        { key: "opening", label: "Opening (QS. Ar-Rum: 21)" },
        { key: "bride-groom", label: "Mempelai (Dua Hati, Satu Cerita)" },
        { key: "event-details", label: "Save The Date & Acara" },
        { key: "location", label: "Peta Lokasi" },
        { key: "gallery", label: "Galeri Momen Kami" },
        { key: "rsvp", label: "Konfirmasi Kehadiran (RSVP)" },
        { key: "voice-note", label: "Pesan Personal (Voice Note)" },
        { key: "wishes", label: "Buku Tamu (Ucapan & Doa)" },
        { key: "digital-gift", label: "Kirim Hadiah" },
        { key: "closing", label: "Penutup (Jazakumullahu Khairan)" },
      ];
    }
    if (isBali) {
      return [
        { key: "cover", label: "Cover" },
        { key: "opening", label: "Opening (Om Swastiastu)" },
        { key: "bride-groom", label: "Mempelai (Bride & Groom)" },
        { key: "event-details", label: "Rangkaian Acara" },
        { key: "countdown", label: "Countdown Hari Bahagia" },
        { key: "story", label: "Kisah Kami" },
        { key: "gallery", label: "Galeri Foto" },
        { key: "rsvp", label: "Konfirmasi Kehadiran (RSVP)" },
        { key: "voice-note", label: "Pesan Pribadi (Voice Note)" },
        { key: "wishes", label: "Ucapan & Doa" },
        { key: "digital-gift", label: "Kirim Hadiah" },
        { key: "closing", label: "Closing (Suksma)" },
      ];
    }
    return [
      { key: "cover", label: "Cover" },
      { key: "opening", label: "Opening" },
      { key: "bride-groom", label: "Bride and Groom" },
      { key: "event-details", label: "Event Details" },
      { key: "countdown", label: "Countdown" },
      { key: "story", label: "Story" },
      { key: "gallery", label: "Gallery" },
      { key: "rsvp", label: "RSVP" },
      { key: "digital-gift", label: "Digital Gift" },
      { key: "closing", label: "Closing" },
    ];
  });

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Project title & status
  const [projectTitle, setProjectTitle] = useState(() =>
    isJavanese
      ? "Javanese Elegant - Nara & Dimas"
      : isEmerald
      ? "Emerald Gold Basic - Angga & Shenina"
      : isBali
      ? "Bali Tropical - Chyntia & Rian"
      : "Mogran & Laura"
  );
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Full form data synchronized across sections
  const [sectionData, setSectionData] = useState<any>(() => {
    if (isJavanese) {
      return {
        cover: {
          theWeddingOf: "THE WEDDING OF",
          coupleTitle: "Nara & Dimas",
          eventDate: "SABTU, 20 MARET 2027",
          venue: "Masjid Al-Ikhlas · Bandung",
          inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
          inviteeName: "Nama Tamu",
          openButtonText: "BUKA UNDANGAN",
          bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          heroImage: "",
          patternWashImage: "/templates/javanesse-elegant/pattern-wash.png",
          skylineImage: "/templates/javanesse-elegant/skyline.png",
        },
        opening: {
          bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          salamTitle: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
          salamBody:
            "Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami.",
          inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
          inviteeName: "Nama Tamu",
          inviteeNote: "di tempat",
        },
        about: {
          tagline: "TENTANG ACARA",
          title: "Pernikahan Nara & Dimas",
          quote:
            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.",
          quoteSource: "QS. Ar-Rum: 21",
          badge1: "Akad di masjid",
          badge2: "Dresscode: Sage & Ivory",
        },
        couple: {
          tagline: "MEMPELAI",
          title: "Kedua Mempelai",
          introText: "",
          brideTitle: "THE BRIDE",
          brideFullName: "Nara Ayu Pramesti",
          brideParents: "Putri kedua Bapak Hartono\n& Ibu Wulandari",
          brideInstagram: "",
          brideImage: "",
          groomTitle: "THE GROOM",
          groomFullName: "Dimas Adi Pratama",
          groomParents: "Putra pertama Bapak Slamet Widodo\n& Ibu Sri Rahayu",
          groomInstagram: "",
          groomImage: "",
        },
        story: {
          tagline: "PERJALANAN KAMI",
          heading: "Kisah Kami",
          storyBertemu:
            "Kami dipertemukan dalam sebuah kajian di kampus. Dari obrolan sederhana, tumbuh rasa saling percaya hingga kami memantapkan niat untuk menyempurnakan separuh agama.",
          storyDekat:
            "Seiring berjalannya waktu dan restu kedua keluarga, kedekatan kami semakin bertumbuh dalam komitmen untuk saling melengkapi dan membimbing menuju ridha-Nya.",
          storyMelamar:
            "Dengan memohon doa restu orang tua dan bimbingan Allah SWT, niat suci kami diikat dalam prosesi lamaran hangat yang menjadi awal langkah menuju pelaminan.",
          quoteText:
            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.",
          quoteSource: "QS. Ar-Rum: 21",
        },
        eventDetails: {
          tagline: "DETAIL ACARA",
          title: "Waktu & Tempat",
          akadTitle: "Akad Nikah",
          akadDate: "SABTU, 20 MARET 2027",
          akadTime: "08.00 – 10.00 WIB",
          akadVenue: "Masjid Al-Ikhlas",
          akadAddress: "Jl. Cendana No. 5, Bandung",
          resepsiTitle: "Resepsi",
          resepsiDate: "SABTU, 20 MARET 2027",
          resepsiTime: "11.00 – 14.00 WIB",
          resepsiVenue: "Gedung Serbaguna Al-Hidayah",
          resepsiAddress: "Jl. Cendana No. 9, Bandung",
        },
        countdown: {
          tagline: "MENUJU HARI BAHAGIA",
          title: "Hitung Mundur",
          targetDate: "2027-03-20T08:00",
          days: "151",
          hours: "20",
          minutes: "15",
          seconds: "39",
        },
        rundown: {
          tagline: "RUNDOWN",
          title: "Susunan Acara",
          items: [
            { time: "07.30", title: "Registrasi Tamu", desc: "Penerimaan tamu dan buku tamu" },
            { time: "08.00", title: "Akad Nikah", desc: "Ijab kabul di masjid" },
            { time: "10.00", title: "Sesi Foto", desc: "Foto bersama keluarga" },
            { time: "11.00", title: "Resepsi Dibuka", desc: "Penyambutan tamu undangan" },
            { time: "12.00", title: "Santap Siang", desc: "Hidangan dan ramah tamah" },
            { time: "14.00", title: "Doa Penutup", desc: "Acara selesai" },
          ],
        },
        location: {
          tagline: "LOKASI ACARA",
          title: "Peta Lokasi",
          venueName: "Masjid Al-Ikhlas",
          address: "Jl. Cendana No. 5, Bandung 40111",
          mapsUrl: "https://maps.google.com",
        },
        gallery: {
          tagline: "GALERI",
          title: "Momen Kami",
          videoUrl: "",
          images: [],
        },
        rsvp: {
          tagline: "KONFIRMASI",
          title: "Konfirmasi Kehadiran",
          deadline: "Mohon konfirmasi sebelum 10 Maret 2027",
        },
        voiceNote: {
          tagline: "FITUR TAMBAHAN",
          title: "Pesan Personal",
          desc: "Tinggalkan ucapan dalam rekaman suara atau video singkat, maksimal 10 detik.",
        },
        wishes: {
          tagline: "BUKU TAMU",
          title: "Ucapan & Doa",
          introText: "Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai.",
        },
        gift: {
          tagline: "INFORMASI TAMBAHAN",
          title: "Kirim Hadiah",
          introText:
            "Kehadiran dan doa Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:",
          bankName: "BCA",
          accountHolder: "Dimas Adi Pratama",
          accountNumber: "1234 5678 90",
          bank1Name: "BCA",
          bank1Holder: "Dimas Adi Pratama",
          bank1Account: "1234 5678 90",
        },
        closing: {
          title: "Jazakumullahu Khairan",
          message:
            "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.",
          coupleName: "Nara & Dimas",
          dresscode: "Dresscode: Sage & Ivory",
          eventNotes: "Mohon hadir 15 menit sebelum acara dimulai.",
          contactPerson: "Kontak panitia: 0812-3456-7890",
          skylineImage: "/templates/javanesse-elegant/skyline.png",
        },
      };
    }
    if (isEmerald) {
      return {
        cover: {
          theWeddingOf: "THE WEDDING OF",
          groomName: "ANGGA",
          brideName: "SHENINA",
          eventDate: "SABTU · 12 DESEMBER 2026",
          inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
          inviteeName: "Nama Tamu",
          heroImage: "/templates/emerald-gold-basic/thumbnail.png",
        },
        opening: {
          bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          quoteTitle: "BISMILLAHIRRAHMANIRRAHIM",
          quoteMessage:
            "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya.",
          surahCitation: "QS. AR-RUM : 21",
        },
        brideGroom: {
          sectionTitle: "MEMPELAI",
          heading: "Dua Hati, Satu Cerita",
          brideSubtitle: "THE BRIDE",
          brideName: "Shenina Syawalita Cinnamon",
          brideBio: "Putri dari Bpk. Nama & Ibu Nama",
          brideImage: "",
          groomSubtitle: "THE GROOM",
          groomName: "Angga Aldi Yunanda",
          groomBio: "Putra dari Bpk. Nama & Ibu Nama",
          groomImage: "",
        },
        eventDetails: {
          saveTheDateTitle: "SAVE THE DATE",
          dayName: "SABTU",
          dateDay: "12",
          monthYear: "DESEMBER 2026",
          countDays: "15",
          countHours: "20",
          countMinutes: "15",
          countSeconds: "39",
          akadTitle: "AKAD NIKAH",
          akadTime: "08.00 WIB",
          akadLocation: "Masjid Al-Ikhlasiah, Bogor",
          resepsiTitle: "RESEPSI",
          resepsiTime: "11.00 WIB – selesai",
          resepsiLocation: "Nama Gedung, Bogor",
        },
        location: {
          sectionTitle: "LOKASI ACARA",
          heading: "Peta Lokasi",
          venueName: "Masjid Al-Ikhlasiah",
          venueAddress: "Jl. Contoh No. 7, Kota Bogor, Jawa Barat",
          buttonText: "LIHAT LOKASI",
          mapUrl: "https://maps.google.com",
        },
        countdown: {
          countdownTitle: "COUNTDOWN HARI BAHAGIA",
          targetDate: "2026-12-12T08:00:00+07:00",
        },
        rsvp: {
          sectionTitle: "RSVP",
          heading: "Konfirmasi Kehadiran",
          subtitle: "Mohon kabari kami kehadiran Anda melalui formulir berikut.",
          submitButtonText: "KIRIM KONFIRMASI",
        },
        wishes: {
          sectionTitle: "DOA & UCAPAN",
          heading: "Doa dan Ucapan",
          subtitle: "Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai.",
          buttonText: "KIRIM UCAPAN",
        },
        digitalGift: {
          badge: "HADIAH DIGITAL",
          heading: "Tanda Kasih",
          subtitle: "Doa restu Anda adalah hadiah terindah.\nNamun jika ingin berbagi tanda kasih, dapat melalui:",
          bank1Name: "BANK BCA",
          bank1Acc: "1234 5678 90",
          bank1Holder: "a.n. Angga Aldi Yunanda",
          bank1ButtonText: "SALIN NOMOR",
          bank2Name: "E-WALLET / DANA",
          bank2Acc: "0812 3456 7890",
          bank2Holder: "a.n. Shenina Syawalita",
          bank2ButtonText: "SALIN NOMOR",
          giftAddressTitle: "ALAMAT PENGIRIMAN KADO",
          giftAddress: "Jl. Contoh No. 7, Kota Bogor, Jawa Barat",
        },
        closing: {
          heading: "Terima Kasih",
          message:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
          monogram: "A & S",
          coupleNames: "ANGGA & SHENINA",
          eventDate: "",
        },
        voiceNote: undefined,
      };
    }

    if (isBali) {
      return {
        cover: {
          tagline: "OM SWASTIASTU",
          theWeddingOf: "THE WEDDING OF",
          coupleTitle: "Chyntia & Rian",
          eventDate: "MINGGU · 22 NOVEMBER 2026",
          locationShort: "The Kayana Sunset Garden, Badung, Bali",
          inviteeName: "Tamu Undangan",
          heroImage: "/templates/wedding/couple-main.jpg",
        },
        opening: {
          quoteTitle: "Om Swastiastu",
          quoteMessage:
            "Atas asung kerta wara nugraha Ida Sang Hyang Widhi Wasa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari pernikahan kami.",
          gapuraImage: "/templates/bali-tropical/gapura-full.png",
        },
        brideGroom: {
          brideName: "Ni Putu Chyntia Dewi, S.Ked",
          brideBio: "Putri pertama dari Bapak I Wayan Suartana & Ibu Ni Ketut Murniati",
          groomName: "I Made Rian Arisatya, S.T",
          groomBio: "Putra pertama dari Bapak I Made Hendra & Ibu Ni Luh Sukerti",
        },
        eventDetails: {
          pawiwahanName: "Pawiwahan (Akad Nikah)",
          pawiwahanDate: "Minggu, 22 November 2026",
          pawiwahanTime: "09.00 - 11.00 WITA",
          pawiwahanLocation: "Bale Banjar Adat & Kediaman",
          pawiwahanAddress: "Jl. Raya Seminyak No. 88, Badung, Bali",
          resepsiName: "Resepsi",
          resepsiDate: "Minggu, 22 November 2026",
          resepsiTime: "18.00 WITA - Selesai",
          resepsiLocation: "The Kayana Sunset Garden Villa",
          resepsiAddress: "Jl. Petitenget No. 100, Badung, Bali",
        },
        countdown: {
          countdownTitle: "COUNTDOWN HARI BAHAGIA",
          targetDate: "2026-11-22T09:00:00+08:00",
        },
        story: {
          storyTitle: "KISAH KAMI",
          storyMessage:
            "Kami bertemu pada sebuah momen sederhana. Dari obrolan ringan, tumbuhlah rasa yang kini kami bawa ke pelaminan dalam ikatan suci Dharma.",
        },
        gallery: {
          galleryTitle: "GALERI",
          gallerySubtitle: "Potret kebersamaan dan momen sakral kami berdua.",
        },
        rsvp: {
          rsvpTitle: "KONFIRMASI KEHADIRAN",
          rsvpDeadline: "Mohon konfirmasi kehadiran sebelum 15 November 2026",
          submitButtonText: "KIRIM KONFIRMASI",
        },
        voiceNote: {
          voiceTitle: "PESAN PRIBADI",
          voiceSubtitle: "Rekam pesan suara atau video singkat untuk kedua mempelai (maks. 10 detik)",
          submitButtonText: "KIRIM BERSAMA RSVP",
        },
        wishes: {
          wishesTitle: "UCAPAN & DOA",
          submitButtonText: "KIRIM UCAPAN",
        },
        digitalGift: {
          giftTitle: "KIRIM HADIAH",
          giftSubtitle:
            "Kehadiran Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:",
          bankName: "[NAMA BANK]",
          accountNumber: "[NOMOR REKENING]",
          accountHolder: "Pramarta Chyntia Andita",
          buttonText: "SALIN NOMOR REKENING",
        },
        closing: {
          closingTitle: "Suksma",
          closingSubtitle: "TERIMA KASIH",
          closingMessage:
            "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
          coupleNames: "Chyntia & Rian",
          mantra: "OM SHANTI, SHANTI, SHANTI, OM",
        },
      };
    }

    return {
      cover: {
        monogram: "M / L",
        coupleNames: "MOGRAN & LAURA",
        inviteeName: "Caine",
        subtitle: "We would be delighted to have you with us as we celebrate the beginning of our forever.",
        date: "20 Januari 2027",
      },
      opening: {
        quoteTitle: "Two Hearts, One Journey",
        quoteMessage: "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
        coupleSign: "MOGRAN & LAURA",
      },
      brideGroom: {
        groomName: "Mogran Arisatya, S.T",
        groomParents: "Putra pertama dari Bapak Hendra & Ibu Sukerti",
        brideName: "Laura Chyntia, S.Ked",
        brideParents: "Putri pertama dari Bapak Suartana & Ibu Murniati",
      },
      eventDetails: {
        eventName: "Akad dan resepsi",
        eventDate: "20 Januari 2027",
        eventTime: "10.00 - 13.00 WITA",
        eventLocation: "Jl Pererenan, Canggu",
      },
      countdown: {
        countdownTitle: "Menuju Hari Bahagia",
        targetDate: "2027-01-20T10:00:00",
      },
      story: {
        storyTitle: "Kisah Kami",
        storyMessage:
          "Pertemuan sederhana yang bermula dari tatap pertama, tumbuh menjadi persahabatan, hingga akhirnya bermuara pada janji suci pernikahan seumur hidup.",
      },
      gallery: {
        galleryTitle: "Galeri Momen",
        gallerySubtitle: "Potret kebersamaan dan kenangan indah kami berdua.",
      },
      rsvp: {
        rsvpTitle: "Konfirmasi Kehadiran",
        rsvpDeadline: "Mohon konfirmasi kehadiran sebelum 10 Januari 2027",
        submitButtonText: "Kirim Konfirmasi",
      },
      digitalGift: {
        giftTitle: "Tanda Kasih Digital",
        giftSubtitle: "Bila berkenan memberikan tanda kasih digital untuk kedua mempelai:",
        bankName: "Bank BCA",
        accountNumber: "7720918231",
        accountHolder: "Mogran Arisatya",
      },
      closing: {
        closingTitle: "Terima Kasih",
        closingMessage:
          "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.",
        signature: "Mogran & Laura",
      },
      voiceNote: undefined,
      wishes: undefined,
    };
  });

  // Widget settings
  const [widgets, setWidgets] = useState([
    { id: "music", name: "Pemutar Musik Latar", active: true, icon: "��" },
    { id: "maps", name: "Navigasi Google Maps", active: true, icon: "��" },
    { id: "guestbook", name: "Buku Tamu & Ucapan", active: true, icon: "��" },
    { id: "stream", name: "Live Streaming (Zoom/YT)", active: false, icon: "��" },
    { id: "weather", name: "Prakiraan Cuaca Lokasi", active: false, icon: "⛅" },
    { id: "qris", name: "Amplop Digital QRIS", active: true, icon: "��" },
  ]);

  // Back link URL based on role
  const backUrl = role === "partner" ? "/templates" : "/designer/templates";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncPartnerInvitation = (invStatus: "Draft" | "Published") => {
    if (role === "partner" && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("inviteu_partner_invitations_v5");
        const list = raw ? JSON.parse(raw) : [];
        const templateName =
          initialTemplate === "javanesse-elegant" || initialTemplate === "javanese-elegant"
            ? "Javanese Elegant"
            : initialTemplate === "emerald-gold-basic"
            ? "Emerald Gold Basic"
            : initialTemplate === "bali-tropical"
            ? "Bali Tropical"
            : "Botanical Sage";
        const templateCover =
          initialTemplate === "emerald-gold-basic"
            ? "/templates/wedding/emerald-main.jpg"
            : "/templates/wedding/couple-main.jpg";

        const existingIdx = list.findIndex(
          (item: any) => item.title?.toLowerCase() === projectTitle.trim().toLowerCase()
        );

        const entry = {
          id: existingIdx >= 0 ? list[existingIdx].id : `inv-${Date.now()}`,
          title: projectTitle.trim() || "Undangan Baru",
          template: templateName,
          cover: templateCover,
          eventDate: "28 Des 2026",
          status: invStatus,
          expiration: "28 Jun 2027",
          rsvpCount: invStatus === "Published" ? (existingIdx >= 0 ? list[existingIdx].rsvpCount || 12 : 12) : 0,
          rsvpSummary: {
            hadir: invStatus === "Published" ? 12 : 0,
            tidakHadir: 0,
            belumMerespons: 0,
          },
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...entry };
        } else {
          list.unshift(entry);
        }
        localStorage.setItem("inviteu_partner_invitations_v5", JSON.stringify(list));
      } catch (err) {
        console.error("Failed to sync partner invitation:", err);
      }
    }
  };

  const handleSaveDraft = () => {
    setStatus("Draft");
    syncPartnerInvitation("Draft");
    triggerToast("Draf berhasil disimpan! Urutan dan skema data siap digunakan.");
  };

  const handlePublish = () => {
    setStatus("Published");
    syncPartnerInvitation("Published");
    triggerToast("Undangan berhasil di-Publish! Tautan aktif siap dibagikan.");
  };

  const toggleWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  };

  // Drag and Drop handlers for section reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...sectionsList];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, movedItem);

    setSectionsList(updated);
    setFrameVersion((v) => v + 1);
    setActiveSection(movedItem.key);
    setDraggedIndex(null);
    setDragOverIndex(null);
    triggerToast(`Urutan diubah: "${movedItem.label}" dipindahkan`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // One-click move up/down helper
  const moveSection = (fromIndex: number, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= sectionsList.length) return;

    const updated = [...sectionsList];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    setSectionsList(updated);
    setFrameVersion((v) => v + 1);
    setActiveSection(movedItem.key);
    triggerToast(`Urutan diubah: "${movedItem.label}" dipindahkan ke ${direction === "up" ? "atas" : "bawah"}`);
  };

  // Render Craft.js section based on key and theme
  const renderCraftSection = (key: SectionKey) => {
    if (isJavanese) {
      switch (key) {
        case "cover":
          return <CraftJavaneseCoverSection key="cover" {...sectionData.cover} />;
        case "opening":
          return <CraftJavaneseOpeningSection key="opening" {...sectionData.opening} />;
        case "about":
          return <CraftJavaneseTentangAcaraSection key="about" {...sectionData.about} />;
        case "story":
          return <CraftJavaneseAboutSection key="story" {...sectionData.story} />;
        case "bride-groom":
          return <CraftJavaneseCoupleSection key="bride-groom" {...sectionData.couple} />;
        case "event-details":
          return <CraftJavaneseEventDetailsSection key="event-details" {...sectionData.eventDetails} />;
        case "countdown":
          return <CraftJavaneseCountdownSection key="countdown" {...sectionData.countdown} />;
        case "rundown":
          return <CraftJavaneseRundownSection key="rundown" {...sectionData.rundown} />;
        case "location":
          return <CraftJavaneseLocationSection key="location" {...sectionData.location} />;
        case "gallery":
          return <CraftJavaneseGallerySection key="gallery" {...sectionData.gallery} />;
        case "rsvp":
          return <CraftJavaneseRsvpSection key="rsvp" {...sectionData.rsvp} />;
        case "voice-note":
          return <CraftJavaneseVoiceNoteSection key="voice-note" {...sectionData.voiceNote} />;
        case "wishes":
          return <CraftJavaneseWishesSection key="wishes" {...sectionData.wishes} />;
        case "digital-gift":
          return <CraftJavaneseGiftSection key="digital-gift" {...sectionData.gift} />;
        case "closing":
          return <CraftJavaneseClosingSection key="closing" {...sectionData.closing} />;
        default:
          return null;
      }
    }
    if (isEmerald) {
      switch (key) {
        case "cover":
          return <CraftEmeraldCoverSection key="cover" {...sectionData.cover} />;
        case "opening":
          return <CraftEmeraldOpeningSection key="opening" {...sectionData.opening} />;
        case "bride-groom":
          return <CraftEmeraldCoupleSection key="bride-groom" {...sectionData.brideGroom} />;
        case "event-details":
          return <CraftEmeraldEventDetailsSection key="event-details" {...sectionData.eventDetails} />;
        case "location":
          return <CraftEmeraldLocationSection key="location" {...sectionData.location} />;
        case "rsvp":
          return <CraftEmeraldRsvpSection key="rsvp" {...sectionData.rsvp} />;
        case "wishes":
          return <CraftEmeraldWishesSection key="wishes" {...sectionData.wishes} />;
        case "digital-gift":
          return <CraftEmeraldGiftSection key="digital-gift" {...sectionData.digitalGift} />;
        case "closing":
          return <CraftEmeraldClosingSection key="closing" {...sectionData.closing} />;
        default:
          return null;
      }
    }
    if (isBali) {
      switch (key) {
        case "cover":
          return <CraftBaliCoverSection key="cover" {...sectionData.cover} />;
        case "opening":
          return <CraftBaliOpeningSection key="opening" {...sectionData.opening} />;
        case "bride-groom":
          return <CraftBaliCoupleSection key="bride-groom" {...sectionData.brideGroom} />;
        case "event-details":
          return <CraftBaliEventDetailsSection key="event-details" {...sectionData.eventDetails} />;
        case "countdown":
          return <CraftBaliCountdownSection key="countdown" {...sectionData.countdown} />;
        case "story":
          return <CraftBaliStorySection key="story" {...sectionData.story} />;
        case "gallery":
          return <CraftBaliGallerySection key="gallery" {...sectionData.gallery} />;
        case "rsvp":
          return <CraftBaliRsvpSection key="rsvp" {...sectionData.rsvp} />;
        case "voice-note":
          return <CraftBaliVoiceNoteSection key="voice-note" {...sectionData.voiceNote} />;
        case "wishes":
          return <CraftBaliWishesSection key="wishes" {...sectionData.wishes} />;
        case "digital-gift":
          return <CraftBaliGiftSection key="digital-gift" {...sectionData.digitalGift} />;
        case "closing":
          return <CraftBaliClosingSection key="closing" {...sectionData.closing} />;
        default:
          return null;
      }
    }

    // Default Wedding (Botanical Sage Green / Mogran & Laura)
    switch (key) {
      case "cover":
        return <CraftCoverSection key="cover" {...sectionData.cover} />;
      case "opening":
        return <CraftOpeningSection key="opening" {...sectionData.opening} />;
      case "bride-groom":
        return <CraftBrideGroomSection key="bride-groom" {...sectionData.brideGroom} />;
      case "event-details":
        return <CraftEventDetailsSection key="event-details" {...sectionData.eventDetails} />;
      case "countdown":
        return <CraftCountdownSection key="countdown" {...sectionData.countdown} />;
      case "story":
        return <CraftStorySection key="story" {...sectionData.story} />;
      case "gallery":
        return <CraftGallerySection key="gallery" {...sectionData.gallery} />;
      case "rsvp":
        return <CraftRsvpSection key="rsvp" {...sectionData.rsvp} />;
      case "digital-gift":
        return <CraftDigitalGiftSection key="digital-gift" {...sectionData.digitalGift} />;
      case "closing":
        return <CraftClosingSection key="closing" {...sectionData.closing} />;
      default:
        return null;
    }
  };

  // Render Section in Full Preview Modal based on key
  const renderPreviewSection = (key: SectionKey) => {
    if (isJavanese) {
      switch (key) {
        case "cover":
          return <CraftJavaneseCoverSection key="cover" {...sectionData.cover} />;
        case "opening":
          return <CraftJavaneseOpeningSection key="opening" {...sectionData.opening} />;
        case "about":
          return <CraftJavaneseTentangAcaraSection key="about" {...sectionData.about} />;
        case "story":
          return <CraftJavaneseAboutSection key="story" {...sectionData.story} />;
        case "bride-groom":
          return <CraftJavaneseCoupleSection key="bride-groom" {...sectionData.couple} />;
        case "event-details":
          return <CraftJavaneseEventDetailsSection key="event-details" {...sectionData.eventDetails} />;
        case "countdown":
          return <CraftJavaneseCountdownSection key="countdown" {...sectionData.countdown} />;
        case "rundown":
          return <CraftJavaneseRundownSection key="rundown" {...sectionData.rundown} />;
        case "location":
          return <CraftJavaneseLocationSection key="location" {...sectionData.location} />;
        case "gallery":
          return <CraftJavaneseGallerySection key="gallery" {...sectionData.gallery} />;
        case "rsvp":
          return <CraftJavaneseRsvpSection key="rsvp" {...sectionData.rsvp} />;
        case "voice-note":
          return <CraftJavaneseVoiceNoteSection key="voice-note" {...sectionData.voiceNote} />;
        case "wishes":
          return <CraftJavaneseWishesSection key="wishes" {...sectionData.wishes} />;
        case "digital-gift":
          return <CraftJavaneseGiftSection key="digital-gift" {...sectionData.gift} />;
        case "closing":
          return <CraftJavaneseClosingSection key="closing" {...sectionData.closing} />;
        default:
          return null;
      }
    }
    if (isEmerald) {
      switch (key) {
        case "cover":
          return (
            <div key="cover" className="relative min-h-[858px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25] text-white">
              {/* Concentric Double Gold Borders */}
              <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
              <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

              {/* 4 Art Deco Corner Motifs */}
              <div className="absolute top-[16px] left-[16px] z-20 pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute top-[16px] right-[16px] z-20 scale-x-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute bottom-[16px] left-[16px] z-20 scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute bottom-[16px] right-[16px] z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>

              {/* Sunburst Fan & Header */}
              <div className="relative z-20 pt-6 flex flex-col items-center">
                <svg viewBox="0 0 100 50" className="w-28 h-14 text-[#c8a34e] stroke-current fill-none pointer-events-none mb-2 opacity-95">
                  <path d="M5 48 A 45 45 0 0 1 95 48" strokeWidth="1.5" />
                  <path d="M15 48 A 35 35 0 0 1 85 48" strokeWidth="1.2" />
                  <path d="M25 48 A 25 25 0 0 1 75 48" strokeWidth="1.2" />
                  <path d="M35 48 A 15 15 0 0 1 65 48" strokeWidth="1.2" />
                  <line x1="0" y1="48" x2="100" y2="48" strokeWidth="1.5" />
                  <line x1="50" y1="48" x2="50" y2="3" strokeWidth="1.2" />
                  <line x1="50" y1="48" x2="20" y2="15" strokeWidth="1.2" />
                  <line x1="50" y1="48" x2="80" y2="15" strokeWidth="1.2" />
                  <line x1="50" y1="48" x2="33" y2="8" strokeWidth="1.2" />
                  <line x1="50" y1="48" x2="67" y2="8" strokeWidth="1.2" />
                </svg>
                <p className="text-[11px] tracking-[0.35em] uppercase text-[#c8a34e] font-medium" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.cover.theWeddingOf}
                </p>
              </div>

              {/* Arch Photo Frame */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <div className="relative w-[190px] sm:w-[210px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#0c3c2d] p-1 shadow-2xl flex items-center justify-center">
                  <div className="relative w-full h-full rounded-t-full border border-[#c8a34e]/40 overflow-hidden flex flex-col items-center justify-center bg-[#0c3c2d]">
                    {sectionData.cover.heroImage ? (
                      <img src={sectionData.cover.heroImage} alt="Foto Pasangan" className="w-full h-full object-cover opacity-60" />
                    ) : null}
                    <div className="relative z-10 flex flex-col items-center space-y-1.5 text-[#c8a34e]">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-current fill-none" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[11px] uppercase tracking-widest font-serif">Ganti foto</span>
                    </div>
                  </div>
                </div>
                <div className="my-2 select-none">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#c8a34e] fill-current">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-medium" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.cover.brideName}
                </p>
              </div>

              {/* Names & Event Date */}
              <div className="relative z-20 pb-4 flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl text-white font-extrabold tracking-[0.1em] uppercase leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {sectionData.cover.groomName}
                </h1>
                <div className="my-1.5">
                  <span className="text-3xl text-[#c8a34e] italic font-serif leading-none">&amp;</span>
                </div>
                <h1 className="text-3xl sm:text-4xl text-white font-extrabold tracking-[0.1em] uppercase leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {sectionData.cover.brideName}
                </h1>
                <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#c8a34e] font-medium pt-3" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.cover.eventDate}
                </p>
                <div className="flex items-center justify-center space-x-2 my-2 max-w-[120px] mx-auto opacity-80">
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                  <span className="text-[#c8a34e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                </div>
                <p className="text-[10px] text-zinc-300 tracking-wider font-light mt-1">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                <p className="text-sm font-bold text-white tracking-wide mt-0.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.cover.inviteeName}
                </p>
              </div>
            </div>
          );
        case "opening":
          return (
            <div key="opening" className="min-h-[667px] w-full max-w-[390px] mx-auto text-center relative bg-white text-[#0f4a38] overflow-hidden flex flex-col justify-between items-center px-4 pt-12 pb-10">
              <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-10 h-10 text-[#c8a34e] stroke-current fill-none">
                  <path d="M2 58 V2 H58" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="2" y1="2" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="2" y1="2" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="2" y1="2" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute top-2.5 right-2.5 z-10 scale-x-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-10 h-10 text-[#c8a34e] stroke-current fill-none">
                  <path d="M2 58 V2 H58" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="2" y1="2" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="2" y1="2" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="2" y1="2" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="relative z-20 flex flex-col items-center my-auto px-2">
                <p className="text-xl sm:text-2xl font-serif text-[#0f4a38] tracking-widest mb-4">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <div className="flex items-center justify-center space-x-2 my-2 max-w-[140px] mx-auto">
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                  <span className="text-[#c8a34e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                </div>
                <p className="text-xs sm:text-[13px] text-[#4a5a52] italic max-w-xs mx-auto leading-relaxed mt-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  "{sectionData.opening.quoteMessage}"
                </p>
                <p className="text-[11px] tracking-[0.28em] uppercase text-[#c8a34e] font-semibold mt-4" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.opening.surahCitation}
                </p>
              </div>
            </div>
          );
        case "bride-groom":
          return (
            <div
              key="bride-groom"
              className="min-h-[1024px] w-full max-w-[390px] mx-auto text-center bg-[#F8F5EC] text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center px-4 pt-12 pb-12"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              <div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.brideGroom.sectionTitle || "MEMPELAI"}
                </p>
                <h2 className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {sectionData.brideGroom.heading || "Dua Hati, Satu Cerita"}
                </h2>
                <div className="flex items-center justify-center space-x-2 my-3 max-w-[150px] mx-auto">
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                  <span className="text-[#c8a34e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                </div>
              </div>

              {/* 1. THE BRIDE */}
              <div className="flex flex-col items-center">
                <div className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden">
                  {sectionData.brideGroom.brideImage ? (
                    <img src={sectionData.brideGroom.brideImage} alt={sectionData.brideGroom.brideName} className="w-full h-full object-cover rounded-t-full" />
                  ) : (
                    <div className="flex flex-col items-center space-y-1 text-[#0b4a3a]">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ganti foto</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.brideGroom.brideSubtitle || "THE BRIDE"}
                </p>
                <h3 className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {sectionData.brideGroom.brideName}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {sectionData.brideGroom.brideBio}
                </p>
              </div>

              {/* Gold Ampersand */}
              <div className="my-5">
                <span className="text-4xl sm:text-5xl text-[#c8a34e] italic font-normal inline-block select-none" style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}>
                  &amp;
                </span>
              </div>

              {/* 2. THE GROOM */}
              <div className="flex flex-col items-center">
                <div className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden">
                  {sectionData.brideGroom.groomImage ? (
                    <img src={sectionData.brideGroom.groomImage} alt={sectionData.brideGroom.groomName} className="w-full h-full object-cover rounded-t-full" />
                  ) : (
                    <div className="flex flex-col items-center space-y-1 text-[#0b4a3a]">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Ganti foto</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.brideGroom.groomSubtitle || "THE GROOM"}
                </p>
                <h3 className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {sectionData.brideGroom.groomName}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {sectionData.brideGroom.groomBio}
                </p>
              </div>
            </div>
          );
        case "event-details":
          return (
            <div
              key="event-details"
              className="min-h-[858px] w-full max-w-[390px] mx-auto text-center bg-[#072f25] text-white relative overflow-hidden flex flex-col justify-between items-center px-4 pt-[85px] pb-[80px]"
            >
              {/* Concentric Double Gold Borders */}
              <div className="absolute inset-[10px] border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
              <div className="absolute inset-[16px] border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

              {/* 4 Art Deco Corner Motifs */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute top-4 right-4 z-20 scale-x-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute bottom-4 left-4 z-20 scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute bottom-4 right-4 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-between">
                <div>
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {sectionData.eventDetails.saveTheDateTitle || "SAVE THE DATE"}
                  </p>
                  <h2
                    className="text-xl sm:text-2xl font-bold text-white tracking-[0.25em] mt-3 mb-1 uppercase"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {sectionData.eventDetails.dayName || "SABTU"}
                  </h2>
                  <div
                    className="text-5xl sm:text-[54px] font-bold text-[#c59b4e] my-1 leading-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {sectionData.eventDetails.dateDay || "12"}
                  </div>
                  <p
                    className="text-xs sm:text-sm tracking-[0.25em] uppercase text-white font-semibold mt-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {sectionData.eventDetails.monthYear || "DESEMBER 2026"}
                  </p>

                  <div className="flex items-center justify-center space-x-2 my-4 w-full max-w-[186px] mx-auto">
                    <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                    <span className="text-[#c59b4e] text-xs">◆</span>
                    <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                  </div>
                </div>

                {/* 4 Countdown Boxes (331px width, 4x 76px boxes, 9px gap) */}
                <div className="flex justify-center gap-[9px] w-[331px] max-w-full mx-auto my-3">
                  <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                    <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {sectionData.eventDetails.countDays || "15"}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                      HARI
                    </span>
                  </div>
                  <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                    <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {sectionData.eventDetails.countHours || "20"}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                      JAM
                    </span>
                  </div>
                  <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                    <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {sectionData.eventDetails.countMinutes || "15"}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                      MENIT
                    </span>
                  </div>
                  <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                    <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {sectionData.eventDetails.countSeconds || "39"}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                      DETIK
                    </span>
                  </div>
                </div>

                {/* Event Cards (Double border, 334px width, 148px height) */}
                <div className="w-[334px] max-w-full mx-auto space-y-3 mt-3">
                  <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
                    <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
                    <p
                      className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {sectionData.eventDetails.akadTitle || "AKAD NIKAH"}
                    </p>
                    <h3
                      className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {sectionData.eventDetails.akadTime || "08.00 WIB"}
                    </h3>
                    <p
                      className="text-xs sm:text-sm text-[#e2cfab]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {sectionData.eventDetails.akadLocation || "Masjid Al-Ikhlasiah, Bogor"}
                    </p>
                  </div>

                  <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
                    <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
                    <p
                      className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {sectionData.eventDetails.resepsiTitle || "RESEPSI"}
                    </p>
                    <h3
                      className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {sectionData.eventDetails.resepsiTime || "11.00 WIB – selesai"}
                    </h3>
                    <p
                      className="text-xs sm:text-sm text-[#e2cfab]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {sectionData.eventDetails.resepsiLocation || "Nama Gedung, Bogor"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        case "location":
          return (
            <div
              key="location"
              className="min-h-[667px] w-full max-w-[390px] mx-auto text-center bg-white text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center px-4 pt-[83px] pb-[81px]"
            >
              <div>
                <p
                  className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {sectionData.location?.sectionTitle || "LOKASI ACARA"}
                </p>
                <h2
                  className="text-3xl sm:text-[34px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {sectionData.location?.heading || "Peta Lokasi"}
                </h2>
                <div className="flex items-center justify-center space-x-2 my-4 w-full max-w-[170px] mx-auto">
                  <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                  <span className="text-[#c59b4e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                </div>
              </div>

              {/* Map Placeholder Card (Matches User Image: 334x220 px) */}
              <div className="w-[334px] max-w-full h-[220px] border-[1.5px] border-[#c59b4e] bg-[#f8f5ec] mx-auto my-3 flex flex-col items-center justify-center relative p-3">
                <div className="w-[146px] h-[146px] rounded-full bg-[#c69c4f] flex items-center justify-center text-[#0b4a3a] shadow-inner">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-current fill-none" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p
                  className="text-xs sm:text-[13px] text-[#4a5a52] mt-2 font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Letakkan peta lokasi
                </p>
              </div>

              {/* Venue Name & Address */}
              <div>
                <h3
                  className="text-2xl sm:text-[26px] font-bold text-[#0b4a3a]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {sectionData.location?.venueName || "Masjid Al-Ikhlasiah"}
                </h3>
                <p
                  className="text-xs sm:text-sm text-[#4a5a52] mt-1 mb-5 max-w-xs mx-auto"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {sectionData.location?.venueAddress || "Jl. Contoh No. 7, Kota Bogor, Jawa Barat"}
                </p>
                <a
                  href={sectionData.location?.mapUrl || "https://maps.google.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border-[1.5px] border-[#0b4a3a] text-[#0b4a3a] px-7 py-2.5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#0b4a3a] hover:text-white transition-all shadow-xs"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ◆ {sectionData.location?.buttonText || "LIHAT LOKASI"} ◆
                </a>
              </div>
            </div>
          );
        case "rsvp":
          return (
            <div key="rsvp" className="px-5 py-9 text-center bg-[#0f4a38] text-white relative overflow-hidden">
              <div className="absolute inset-2 border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
              <div className="absolute inset-3 border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />
              <div className="relative z-20 px-2">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold pt-1" style={{ fontFamily: "'Cinzel', serif" }}>{sectionData.rsvp.sectionTitle}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{sectionData.rsvp.heading}</h2>
                <p className="text-xs sm:text-sm text-[#e2cfab] italic mb-5 max-w-xs mx-auto" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{sectionData.rsvp.subtitle}</p>
                <div className="bg-white text-[#0f4a38] p-5 shadow-2xl max-w-[310px] mx-auto text-left space-y-3">
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase block mb-1" style={{ fontFamily: "'Cinzel', serif" }}>NAMA</label>
                    <input type="text" readOnly placeholder="Nama lengkap" className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase block mb-1" style={{ fontFamily: "'Cinzel', serif" }}>NOMOR WHATSAPP</label>
                    <input type="text" readOnly placeholder="Nomor WhatsApp" className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3 py-2 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <span className="bg-[#c59b4e] text-white py-2 text-[10px] font-bold text-center">◆ YA, HADIR ◆</span>
                    <span className="border border-[#0f4a38] text-[#0f4a38] py-2 text-[10px] font-bold text-center">◆ TIDAK HADIR ◆</span>
                  </div>
                  <div className="w-full bg-[#c59b4e] text-white py-2.5 text-xs font-bold text-center uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                    ◆ {sectionData.rsvp.submitButtonText} ◆
                  </div>
                </div>
              </div>
            </div>
          );
        case "wishes":
          return (
            <div
              key="wishes"
              className="min-h-[858px] w-full max-w-[390px] mx-auto px-4 py-12 text-center bg-[#F8F5EC] text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              <div className="w-full flex flex-col items-center">
                <p
                  className="text-[11px] tracking-[0.3em] uppercase text-[#c8a34e] font-semibold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {sectionData.wishes?.sectionTitle || "DOA & UCAPAN"}
                </p>
                <h2
                  className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {sectionData.wishes?.heading || "Doa dan Ucapan"}
                </h2>
                <div className="flex items-center justify-center space-x-2 my-2.5 max-w-[150px] mx-auto">
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                  <span className="text-[#c8a34e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                </div>
                <p
                  className="text-xs sm:text-[13px] text-[#0b4a3a]/85 italic mb-6 max-w-[280px] mx-auto leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {sectionData.wishes?.subtitle || "Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai."}
                </p>

                {/* Form Card */}
                <div className="w-full max-w-[335px] bg-white border border-[#c8a34e] p-4 sm:p-5 text-left space-y-4 shadow-sm rounded-none">
                  <div>
                    <label
                      className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#0b4a3a] uppercase block mb-1"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      NAMA
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Nama Anda"
                      className="w-full bg-[#f8f5ec] border border-[#c8a34e]/70 px-3.5 py-2.5 text-xs text-[#0b4a3a] placeholder:text-[#0b4a3a]/50 placeholder:italic focus:outline-none rounded-none"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#0b4a3a] uppercase block mb-1"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      UCAPAN
                    </label>
                    <textarea
                      rows={4}
                      readOnly
                      placeholder="Tulis ucapan di sini..."
                      className="w-full bg-[#f8f5ec] border border-[#c8a34e]/70 px-3.5 py-2.5 text-xs text-[#0b4a3a] placeholder:text-[#0b4a3a]/50 placeholder:italic focus:outline-none resize-none h-[100px] rounded-none"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    />
                  </div>
                  <div
                    className="w-full bg-[#c8a34e] text-[#0b4a3a] py-3 text-xs font-bold tracking-[0.2em] shadow-md uppercase text-center rounded-none flex items-center justify-center space-x-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <span>◆</span>
                    <span>{sectionData.wishes?.buttonText || "KIRIM UCAPAN"}</span>
                    <span>◆</span>
                  </div>
                </div>

                {/* Wish Cards */}
                <div className="w-full max-w-[335px] mt-4 space-y-3 text-left">
                  <div className="bg-white border-l-[3px] border-l-[#c8a34e] border-t border-r border-b border-[#e4dab8] p-3.5 sm:p-4 text-left shadow-xs rounded-none">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#0b4a3a] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                      KELUARGA DARI DEPOK
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#0b4a3a]/85 italic mt-1.5 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah.
                    </p>
                  </div>
                  <div className="bg-white border-l-[3px] border-l-[#c8a34e] border-t border-r border-b border-[#e4dab8] p-3.5 sm:p-4 text-left shadow-xs rounded-none">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#0b4a3a] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                      REKAN KERJA
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#0b4a3a]/85 italic mt-1.5 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      Happy wedding! Semoga bahagia selalu dan segera diberi momongan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        case "digital-gift":
          return (
            <div key="digital-gift" className="relative min-h-[897px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25] text-white">
              <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
              <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

              <div className="absolute top-[16px] left-[16px] z-20 pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute top-[16px] right-[16px] z-20 scale-x-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute bottom-[16px] left-[16px] z-20 scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="absolute bottom-[16px] right-[16px] z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c8a34e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="42" y2="42" strokeWidth="1.5" />
                  <line x1="4" y1="4" x2="48" y2="24" strokeWidth="1.2" />
                  <line x1="4" y1="4" x2="24" y2="48" strokeWidth="1.2" />
                </svg>
              </div>

              <div className="relative z-20 w-full px-2 pt-14 pb-4 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[12px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                    {sectionData.digitalGift.badge || "HADIAH DIGITAL"}
                  </p>
                  <h2 className="text-[34px] sm:text-[36px] font-bold text-white mt-3 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {sectionData.digitalGift.heading || "Tanda Kasih"}
                  </h2>
                  <div className="flex items-center justify-center space-x-2 my-3 max-w-[170px] mx-auto">
                    <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                    <span className="text-[#c8a34e] text-xs">◆</span>
                    <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                  </div>
                  <p className="text-[#e2cfab] italic mb-6 max-w-[320px] mx-auto leading-[1.6] whitespace-pre-line text-center" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px" }}>
                    {sectionData.digitalGift.subtitle}
                  </p>
                </div>

                <div className="space-y-4 w-[334px] max-w-full mx-auto my-auto">
                  <div className="w-[334px] max-w-full h-[204px] border-[1.5px] border-[#c8a34e] p-5 relative bg-[#0b4a3a] text-center flex flex-col justify-between items-center shadow-lg">
                    <div className="absolute inset-[6px] border border-[#818146]/70 pointer-events-none" />
                    <p className="text-[12px] font-semibold text-[#c8a34e] uppercase tracking-[0.25em]" style={{ fontFamily: "'Cinzel', serif" }}>{sectionData.digitalGift.bank1Name}</p>
                    <p className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{sectionData.digitalGift.bank1Acc}</p>
                    <p className="text-[14px] text-[#e2cfab] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{sectionData.digitalGift.bank1Holder}</p>
                    <span className="inline-block w-[198px] h-[48px] leading-[48px] bg-[#c89d47] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md uppercase" style={{ fontFamily: "'Cinzel', serif" }}>◆ {sectionData.digitalGift.bank1ButtonText || "SALIN NOMOR"} ◆</span>
                  </div>
                  <div className="w-[334px] max-w-full h-[204px] border-[1.5px] border-[#c8a34e] p-5 relative bg-[#0b4a3a] text-center flex flex-col justify-between items-center shadow-lg">
                    <div className="absolute inset-[6px] border border-[#818146]/70 pointer-events-none" />
                    <p className="text-[12px] font-semibold text-[#c8a34e] uppercase tracking-[0.25em]" style={{ fontFamily: "'Cinzel', serif" }}>{sectionData.digitalGift.bank2Name}</p>
                    <p className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{sectionData.digitalGift.bank2Acc}</p>
                    <p className="text-[14px] text-[#e2cfab] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{sectionData.digitalGift.bank2Holder}</p>
                    <span className="inline-block w-[198px] h-[48px] leading-[48px] bg-[#c89d47] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md uppercase" style={{ fontFamily: "'Cinzel', serif" }}>◆ {sectionData.digitalGift.bank2ButtonText || "SALIN NOMOR"} ◆</span>
                  </div>
                </div>

                <div className="pt-6 pb-6">
                  <p className="text-[11px] tracking-[0.28em] uppercase text-[#c8a34e] font-semibold mb-1.5" style={{ fontFamily: "'Cinzel', serif" }}>{sectionData.digitalGift.giftAddressTitle || "ALAMAT PENGIRIMAN KADO"}</p>
                  <p className="text-[14px] sm:text-[15px] text-[#e2cfab] max-w-[280px] mx-auto leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{sectionData.digitalGift.giftAddress || "Jl. Contoh No. 7, Kota Bogor, Jawa Barat"}</p>
                </div>
              </div>
            </div>
          );
        case "closing":
          return (
            <div
              key="closing"
              className="min-h-[1018px] w-full max-w-[390px] mx-auto text-center relative bg-[#0b4a3a] text-white overflow-hidden flex flex-col justify-between items-center px-4 py-12"
            >
              <div className="absolute inset-[10px] border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
              <div className="absolute inset-[16px] border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute top-4 right-4 z-20 scale-x-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute bottom-4 left-4 z-20 scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="absolute bottom-4 right-4 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
                <svg viewBox="0 0 60 60" className="w-12 h-12 text-[#c59b4e] stroke-current fill-none">
                  <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
                  <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
                  <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-4">
                <div className="flex justify-center mb-4">
                  <svg viewBox="0 0 100 52" className="w-24 h-12 text-[#c59b4e] stroke-current fill-none">
                    <line x1="4" y1="50" x2="96" y2="50" strokeWidth="1.5" />
                    <path d="M10 50 A 40 40 0 0 1 90 50" strokeWidth="1.5" />
                    <path d="M22 50 A 28 28 0 0 1 78 50" strokeWidth="1.2" />
                    <path d="M34 50 A 16 16 0 0 1 66 50" strokeWidth="1.2" />
                    <line x1="50" y1="50" x2="50" y2="10" strokeWidth="1.2" />
                    <line x1="50" y1="50" x2="39.6" y2="11.4" strokeWidth="1.2" />
                    <line x1="50" y1="50" x2="60.4" y2="11.4" strokeWidth="1.2" />
                    <line x1="50" y1="50" x2="30.0" y2="15.4" strokeWidth="1.2" />
                    <line x1="50" y1="50" x2="70.0" y2="15.4" strokeWidth="1.2" />
                  </svg>
                </div>
                <h2
                  className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {sectionData.closing.thankYouTitle || sectionData.closing.heading || "Terima Kasih"}
                </h2>
                <div className="flex items-center justify-center space-x-2 my-4 w-full max-w-[170px] mx-auto">
                  <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                  <span className="text-[#c59b4e] text-xs">◆</span>
                  <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                </div>
                <p
                  className="text-xs sm:text-[13px] text-[#e2cfab] italic my-4 leading-relaxed max-w-[310px] mx-auto"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  "{sectionData.closing.thankYouMessage || sectionData.closing.message || "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}"
                </p>
                <div
                  className="text-4xl sm:text-5xl text-[#c59b4e] italic font-serif my-6 font-normal"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {sectionData.closing.closingSignature || sectionData.closing.monogram || "A & S"}
                </div>
                <p
                  className="text-xs tracking-[0.25em] uppercase text-white font-semibold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {sectionData.closing.coupleNames || "ANGGA & SHENINA"}
                </p>
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    if (isBali) {
      switch (key) {
        case "cover":
          return (
            <div key="cover" className="py-6 border-b border-[#d7ab58]/30">
              <p className="text-xs uppercase tracking-[0.3em] text-[#d7ab58]">
                {sectionData.cover.tagline}
              </p>
              <h2 className="text-4xl text-[#d7ab58] my-2 font-normal" style={{ fontFamily: "'Pinyon Script', cursive" }}>
                {sectionData.cover.coupleTitle}
              </h2>
              <p className="text-xs text-[#e8c97e]">{sectionData.cover.eventDate}</p>
            </div>
          );
        case "opening":
          return (
            <div key="opening" className="py-6 border-b border-[#d7ab58]/30">
              <h3 className="text-3xl text-[#d7ab58]" style={{ fontFamily: "'Pinyon Script', cursive" }}>
                {sectionData.opening.quoteTitle}
              </h3>
              <p className="text-xs text-[#f3eee6]/90 max-w-xs mx-auto italic mt-2">
                {sectionData.opening.quoteMessage}
              </p>
            </div>
          );
        case "bride-groom":
          return (
            <div key="bride-groom" className="py-6 border-b border-[#d7ab58]/30 space-y-4">
              <div>
                <p className="text-sm font-bold text-[#d7ab58]" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.brideGroom.brideName}
                </p>
                <p className="text-[11px] text-[#e8c97e] italic">{sectionData.brideGroom.brideBio}</p>
              </div>
              <span className="text-2xl text-[#d7ab58]">&amp;</span>
              <div>
                <p className="text-sm font-bold text-[#d7ab58]" style={{ fontFamily: "'Cinzel', serif" }}>
                  {sectionData.brideGroom.groomName}
                </p>
                <p className="text-[11px] text-[#e8c97e] italic">{sectionData.brideGroom.groomBio}</p>
              </div>
            </div>
          );
        case "event-details":
          return (
            <div key="event-details" className="py-6 border-b border-[#d7ab58]/30 space-y-3">
              <div className="bg-[#162e21] border border-[#d7ab58]/40 p-4 rounded-xl">
                <p className="font-semibold text-xs text-[#d7ab58]">{sectionData.eventDetails.pawiwahanName}</p>
                <p className="text-xs text-[#f3eee6] mt-1">{sectionData.eventDetails.pawiwahanDate}</p>
                <p className="text-[11px] text-[#e8c97e]">{sectionData.eventDetails.pawiwahanTime}</p>
                <p className="text-xs text-[#d7ab58] mt-1">{sectionData.eventDetails.pawiwahanLocation}</p>
              </div>
              <div className="bg-[#162e21] border border-[#d7ab58]/40 p-4 rounded-xl">
                <p className="font-semibold text-xs text-[#d7ab58]">{sectionData.eventDetails.resepsiName}</p>
                <p className="text-xs text-[#f3eee6] mt-1">{sectionData.eventDetails.resepsiDate}</p>
                <p className="text-[11px] text-[#e8c97e]">{sectionData.eventDetails.resepsiTime}</p>
                <p className="text-xs text-[#d7ab58] mt-1">{sectionData.eventDetails.resepsiLocation}</p>
              </div>
            </div>
          );
        case "digital-gift":
          return (
            <div key="digital-gift" className="py-6 border-b border-[#d7ab58]/30">
              <p className="text-xs uppercase tracking-widest text-[#d7ab58]">{sectionData.digitalGift.giftTitle}</p>
              <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-xl p-4 my-2">
                <p className="text-xs text-[#d7ab58]">{sectionData.digitalGift.bankName} a.n {sectionData.digitalGift.accountHolder}</p>
                <p className="text-xl font-mono text-[#d7ab58] my-1 tracking-wider">{sectionData.digitalGift.accountNumber}</p>
              </div>
            </div>
          );
        case "closing":
          return (
            <div key="closing" className="py-6">
              <h3 className="text-3xl text-[#d7ab58]" style={{ fontFamily: "'Pinyon Script', cursive" }}>
                {sectionData.closing.closingTitle}
              </h3>
              <p className="text-xs text-[#f3eee6]/90 max-w-xs mx-auto italic mt-2">
                {sectionData.closing.closingMessage}
              </p>
              <p className="text-2xl text-[#d7ab58] mt-3" style={{ fontFamily: "'Pinyon Script', cursive" }}>
                {sectionData.closing.coupleNames}
              </p>
              <p className="text-[10px] tracking-widest text-[#d7ab58] uppercase mt-2">
                {sectionData.closing.mantra}
              </p>
            </div>
          );
        default:
          return (
            <div key={key} className="py-4 border-b border-[#d7ab58]/20 text-xs text-[#e8c97e]">
              [{key.toUpperCase()}]
            </div>
          );
      }
    }

    // Wedding preview
    switch (key) {
      case "cover":
        return (
          <div key="cover" className="pt-8 pb-4 border-b border-[#e5edd8]">
            <span className="text-2xl text-[#6b7b5b] italic font-serif">
              {sectionData.cover.monogram}
            </span>
            <h2 className="text-xl font-bold tracking-widest text-[#334626] uppercase mt-2">
              {sectionData.cover.coupleNames}
            </h2>
            <p className="text-xs text-[#526343] italic mt-2 max-w-xs mx-auto">
              {sectionData.cover.subtitle}
            </p>
            <p className="text-[11px] tracking-widest text-[#718260] uppercase mt-3">
              {sectionData.cover.date}
            </p>
          </div>
        );
      case "opening":
        return (
          <div key="opening" className="py-6 border-b border-[#e5edd8]">
            <p className="text-sm font-medium text-[#2d3f1d] italic">
              {sectionData.opening.quoteTitle}
            </p>
            <p className="text-xs text-[#637552] italic max-w-xs mx-auto mt-2 leading-relaxed">
              {sectionData.opening.quoteMessage}
            </p>
            <p className="text-xs tracking-widest text-[#4a5f36] uppercase mt-3">
              {sectionData.opening.coupleSign}
            </p>
          </div>
        );
      case "bride-groom":
        return (
          <div key="bride-groom" className="py-6 border-b border-[#e5edd8] space-y-4">
            <div>
              <p className="font-bold text-[#2d3f1d]">{sectionData.brideGroom.groomName}</p>
              <p className="text-[11px] text-[#637552] italic">{sectionData.brideGroom.groomParents}</p>
            </div>
            <span className="text-base text-[#718260] italic block">&amp;</span>
            <div>
              <p className="font-bold text-[#2d3f1d]">{sectionData.brideGroom.brideName}</p>
              <p className="text-[11px] text-[#637552] italic">{sectionData.brideGroom.brideParents}</p>
            </div>
          </div>
        );
      case "event-details":
        return (
          <div key="event-details" className="py-6 border-b border-[#e5edd8] space-y-2">
            <h3 className="font-bold text-base text-[#2d3f1d]">
              {sectionData.eventDetails.eventName}
            </h3>
            <p className="text-xs text-[#384c2a] font-semibold">
              {sectionData.eventDetails.eventDate} · {sectionData.eventDetails.eventTime}
            </p>
            <p className="text-xs text-[#637552]">
              {sectionData.eventDetails.eventLocation}
            </p>
          </div>
        );
      case "countdown":
        return (
          <div key="countdown" className="py-6 border-b border-[#e5edd8]">
            <p className="text-xs uppercase tracking-widest text-[#718260] font-semibold mb-3">
              {sectionData.countdown.countdownTitle}
            </p>
            <div className="flex justify-center gap-3 text-xs text-[#384c2a] font-mono font-bold">
              <span className="bg-[#eef3e8] px-2 py-1 rounded-md">74 Hari</span>
              <span className="bg-[#eef3e8] px-2 py-1 rounded-md">14 Jam</span>
              <span className="bg-[#eef3e8] px-2 py-1 rounded-md">32 Menit</span>
            </div>
          </div>
        );
      case "story":
        return (
          <div key="story" className="py-6 border-b border-[#e5edd8]">
            <p className="text-xs uppercase tracking-widest text-[#718260] font-semibold mb-2">
              {sectionData.story.storyTitle}
            </p>
            <p className="text-xs text-[#526343] italic max-w-xs mx-auto leading-relaxed">
              "{sectionData.story.storyMessage}"
            </p>
          </div>
        );
      case "gallery":
        return (
          <div key="gallery" className="py-6 border-b border-[#e5edd8]">
            <p className="text-xs uppercase tracking-widest text-[#718260] font-semibold mb-1">
              {sectionData.gallery.galleryTitle}
            </p>
            <p className="text-[11px] text-[#637552] italic mb-3">
              {sectionData.gallery.gallerySubtitle}
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-zinc-200 rounded-lg overflow-hidden" />
              ))}
            </div>
          </div>
        );
      case "rsvp":
        return (
          <div key="rsvp" className="py-6 border-b border-[#e5edd8]">
            <p className="text-xs uppercase tracking-widest text-[#718260] font-semibold mb-1">
              {sectionData.rsvp.rsvpTitle}
            </p>
            <p className="text-[11px] text-[#637552] italic mb-2">
              {sectionData.rsvp.rsvpDeadline}
            </p>
            <span className="inline-block bg-[#384c2a] text-white px-4 py-1.5 rounded-full text-xs font-semibold">
              {sectionData.rsvp.submitButtonText}
            </span>
          </div>
        );
      case "digital-gift":
        return (
          <div key="digital-gift" className="py-6 border-b border-[#e5edd8]">
            <p className="text-xs uppercase tracking-widest text-[#718260] font-semibold mb-1">
              {sectionData.digitalGift.giftTitle}
            </p>
            <div className="bg-[#eef3e8] border border-[#ccdcc1] rounded-xl p-3 max-w-[260px] mx-auto my-2">
              <p className="text-xs font-bold text-[#384c2a]">{sectionData.digitalGift.bankName}</p>
              <p className="text-sm font-mono font-semibold text-zinc-800">{sectionData.digitalGift.accountNumber}</p>
              <p className="text-[11px] text-[#637552] italic">a.n. {sectionData.digitalGift.accountHolder}</p>
            </div>
          </div>
        );
      case "closing":
        return (
          <div key="closing" className="py-6">
            <h3 className="text-base font-bold text-[#2d3f1d]">
              {sectionData.closing.closingTitle}
            </h3>
            <p className="text-xs text-[#526343] italic max-w-xs mx-auto mt-2 leading-relaxed">
              {sectionData.closing.closingMessage}
            </p>
            <p className="text-sm font-serif italic text-[#384c2a] mt-3">
              {sectionData.closing.signature}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#2D1C15] select-none font-sans">
      <Editor
        resolver={{
          CraftContainer,
          CraftCoverSection,
          CraftOpeningSection,
          CraftBrideGroomSection,
          CraftEventDetailsSection,
          CraftCountdownSection,
          CraftStorySection,
          CraftGallerySection,
          CraftRsvpSection,
          CraftDigitalGiftSection,
          CraftClosingSection,
          CraftBaliContainer,
          CraftBaliCoverSection,
          CraftBaliOpeningSection,
          CraftBaliCoupleSection,
          CraftBaliEventDetailsSection,
          CraftBaliCountdownSection,
          CraftBaliStorySection,
          CraftBaliGallerySection,
          CraftBaliRsvpSection,
          CraftBaliVoiceNoteSection,
          CraftBaliWishesSection,
          CraftBaliGiftSection,
          CraftBaliClosingSection,
          CraftEmeraldContainer,
          CraftEmeraldCoverSection,
          CraftEmeraldOpeningSection,
          CraftEmeraldCoupleSection,
          CraftEmeraldEventDetailsSection,
          CraftEmeraldCountdownSection,
          CraftEmeraldRsvpSection,
          CraftEmeraldGiftSection,
          CraftEmeraldLocationSection,
          CraftEmeraldWishesSection,
          CraftEmeraldClosingSection,
          CraftJavaneseContainer,
          CraftJavaneseCoverSection,
          CraftJavaneseOpeningSection,
          CraftJavaneseTentangAcaraSection,
          CraftJavaneseAboutSection,
          CraftJavaneseCoupleSection,
          CraftJavaneseEventDetailsSection,
          CraftJavaneseCountdownSection,
          CraftJavaneseRundownSection,
          CraftJavaneseLocationSection,
  CraftJavaneseGallerySection,
          CraftJavaneseRsvpSection,
  CraftJavaneseVoiceNoteSection,
          CraftJavaneseWishesSection,
          CraftJavaneseGiftSection,
          CraftJavaneseClosingSection,
        }}
      >
        <CraftSyncController
          activeSection={activeSection}
          sectionData={sectionData}
          sectionsList={sectionsList}
          onCanvasReorder={handleCanvasReorder}
          onSelectSection={setActiveSection}
          isBali={isBali}
          isEmerald={isEmerald}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2D1C15] text-[#FDFCFB] px-5 py-2.5 rounded-full shadow-2xl border border-amber-500/50 text-xs font-medium flex items-center space-x-2 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 1. TOP HEADER TOOLBAR                                             */}
        {/* ================================================================= */}
        <header className="h-14 bg-[#2D1C15] text-white flex items-center justify-between px-3 sm:px-6 border-b border-[#432A20] shrink-0 z-40">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Back Button */}
            <Link
              href={backUrl}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors shrink-0"
              title="Kembali ke Katalog Desain"
            >
              <span className="text-lg">‹</span>
            </Link>

            {/* Editable Title */}
            <div className="flex items-center space-x-2 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  autoFocus
                  className="bg-black/30 border border-amber-500/60 rounded px-2 py-0.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[140px] sm:max-w-[240px]"
                />
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center space-x-1.5 cursor-pointer group min-w-0"
                >
                  <span className="font-bold text-xs sm:text-base text-zinc-100 group-hover:text-amber-300 transition-colors truncate max-w-[110px] sm:max-w-[200px] md:max-w-none">
                    {projectTitle}
                  </span>
                  <span className="text-[10px] sm:text-xs text-zinc-400 group-hover:text-amber-300 shrink-0">
                    ✎
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <span
                className={`text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                  status === "Draft"
                    ? "bg-[#E8C28E]/20 text-[#E8C28E] border-[#E8C28E]/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
            >
              Save<span className="hidden sm:inline"> Draft</span>
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="bg-[#E89F3C] hover:bg-[#d68f30] text-black text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              Publish
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* 2. THREE-COLUMN WORKSPACE                                         */}
        {/* ================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* ============================================================= */}
          {/* 2.A LEFT SIDEBAR: DARK BROWN (#2D1C15)                        */}
          {/* ============================================================= */}
          <aside className={`w-full xl:w-64 bg-[#2D1C15] text-white flex flex-col shrink-0 border-r border-[#432A20] z-20 ${
            mobileActivePanel === "structure" ? "flex" : "hidden xl:flex"
          }`}>
            {/* Navigation Tabs */}
            <div className="flex border-b border-[#432A20] px-4 pt-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("konten")}
                className={`pb-2.5 px-3 transition-colors relative cursor-pointer ${
                  activeTab === "konten" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Konten
                {activeTab === "konten" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("widget")}
                className={`pb-2.5 px-3 transition-colors relative cursor-pointer ${
                  activeTab === "widget" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Widget
                {activeTab === "widget" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                )}
              </button>
            </div>

            {/* Content List Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-amber-900/50 pb-24 xl:pb-3">
              {activeTab === "konten" ? (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold px-2 py-1 flex items-center justify-between">
                    <span>Struktur Halaman</span>
                    <span className="text-[9px] text-amber-300 font-mono">Bisa Diurutkan ⠿</span>
                  </p>

                  {sectionsList.map((sec, index) => {
                    const isActive = activeSection === sec.key;
                    const isDragging = draggedIndex === index;
                    const isOver = dragOverIndex === index;

                    return (
                      <div
                        key={sec.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setActiveSection(sec.key);
                          if (typeof window !== "undefined" && window.innerWidth < 1280) {
                            setMobileActivePanel("canvas");
                          }
                          setTimeout(() => {
                            const el = document.getElementById(`section-${sec.key}`);
                            const container = document.getElementById("builder-phone-scroll-container");
                            if (el && container) {
                              const containerRect = container.getBoundingClientRect();
                              const elRect = el.getBoundingClientRect();
                              const relativeTop = elRect.top - containerRect.top + container.scrollTop;
                              container.scrollTo({ top: Math.max(0, relativeTop), behavior: "smooth" });
                            }
                          }, 30);
                        }}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all select-none ${
                          isActive
                            ? "bg-[#E89F3C] text-black font-bold shadow-md"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white"
                        } ${isDragging ? "opacity-40 scale-95" : ""} ${
                          isOver ? "border-t-2 border-amber-300 bg-white/10" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span
                            className={`cursor-grab active:cursor-grabbing text-xs ${
                              isActive ? "text-black/60" : "text-zinc-500 group-hover:text-amber-300"
                            }`}
                            title="Tahan & Tarik untuk memindahkan urutan"
                          >
                            ⠿
                          </span>
                          <span className="truncate">{sec.label}</span>
                        </div>

                        {/* One-click Up/Down Reorder Arrows */}
                        <div
                          className={`flex items-center space-x-0.5 opacity-80 group-hover:opacity-100 ${
                            isActive ? "text-black" : "text-zinc-400"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => moveSection(index, "up", e)}
                            className="p-1 hover:scale-125 disabled:opacity-20 disabled:hover:scale-100 cursor-pointer transition-transform"
                            title="Pindah ke atas"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === sectionsList.length - 1}
                            onClick={(e) => moveSection(index, "down", e)}
                            className="p-1 hover:scale-125 disabled:opacity-20 disabled:hover:scale-100 cursor-pointer transition-transform"
                            title="Pindah ke bawah"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 p-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold px-1">
                    Widget Interaktif
                  </p>
                  {widgets.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{w.icon}</span>
                        <span>{w.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleWidget(w.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          w.active ? "bg-[#E89F3C]" : "bg-zinc-600"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            w.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom info tag */}
            <div className="p-3 border-t border-[#432A20] text-[10px] text-zinc-400 text-center">
              Craft.js Interactive Builder · {isJavanese ? "Javanese Elegant" : isEmerald ? "Emerald Gold Basic" : isBali ? "Bali Tropical Luxury" : "Botanical Sage Green"}
            </div>
          </aside>

          {/* ============================================================= */}
          {/* 2.B CENTER CANVAS (Warm Beige / Cream #F4EDE4)                 */}
          {/* ============================================================= */}
          <main className={`flex-1 bg-[#F4EDE4] flex items-center justify-center p-2 sm:p-6 md:p-8 pb-24 xl:pb-8 overflow-y-auto relative ${
            mobileActivePanel === "canvas" ? "flex" : "hidden xl:flex"
          }`}>
            {/* Subtle background dotted texture */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#8d7465 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Quick Action Button for Mobile/Tablet: Jump straight to Edit Form */}
            <button
              type="button"
              onClick={() => setMobileActivePanel("settings")}
              className="xl:hidden fixed top-16 right-4 z-30 bg-[#2D1C15]/90 hover:bg-[#2D1C15] text-amber-300 border border-amber-500/50 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-xs flex items-center gap-1.5 cursor-pointer animate-fadeIn"
            >
              <span>⚙️</span>
              <span>Edit Bagian Ini</span>
            </button>

            {/* Smartphone Mockup (Black bezel, rounded chassis) - Fully responsive width */}
            <div className="relative z-10 w-[280px] xs:w-[300px] sm:w-[380px] md:w-[414px] h-[550px] sm:h-[780px] md:h-[844px] max-h-[70vh] sm:max-h-[90vh] bg-black rounded-[38px] sm:rounded-[52px] p-2 sm:p-3 shadow-2xl flex flex-col border-[2.5px] border-zinc-800 my-auto transition-all duration-300">
              {/* Inner Smartphone Screen */}
              <div
                className={`relative w-full h-full rounded-[30px] sm:rounded-[38px] overflow-hidden flex flex-col ${
                  isEmerald
                    ? "bg-[#0f4a38]"
                    : isBali
                    ? "bg-[#102218]"
                    : isJavanese
                    ? "bg-[#243320]"
                    : "bg-[#fcfaf7]"
                }`}
              >
                {/* Top iOS Status Bar & Dynamic Island */}
                <div
                  className={`h-7 sm:h-9 px-4 sm:px-6 pt-1.5 sm:pt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold backdrop-blur-xs select-none shrink-0 z-30 ${
                    isEmerald
                      ? "bg-[#0f4a38]/90 text-[#c59b4e]"
                      : isBali
                      ? "bg-[#102218]/90 text-[#e8c97e]"
                      : isJavanese
                      ? "bg-[#243320]/90 text-[#c5a059]"
                      : "bg-white/80 text-zinc-700"
                  }`}
                >
                  <span>9:41</span>
                  <div className="w-16 sm:w-20 h-3.5 sm:h-4 bg-black rounded-full flex items-center justify-end px-1.5 space-x-1">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-900" />
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>5G</span>
                    <div
                      className={`w-3.5 sm:w-4 h-2 border rounded-2xs p-[1px] flex ${
                        isEmerald
                          ? "border-[#c59b4e]"
                          : isBali
                          ? "border-[#e8c97e]"
                          : isJavanese
                          ? "border-[#c5a059]"
                          : "border-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-full h-full ${
                          isEmerald
                            ? "bg-[#c59b4e]"
                            : isBali
                            ? "bg-[#e8c97e]"
                            : isJavanese
                            ? "bg-[#c5a059]"
                            : "bg-zinc-700"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Craft.js Scrollable Content Frame (Rendered in dynamic order) */}
                <div id="builder-phone-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">
                  <BuilderLiveContext.Provider value={{ sectionData, activeSection, setSectionData }}>
                    <Frame key={`craft-frame-${themeParam}-${frameVersion}`}>
                      <Element is={isJavanese ? CraftJavaneseContainer : isEmerald ? CraftEmeraldContainer : isBali ? CraftBaliContainer : CraftContainer} canvas>
                        {sectionsList.map((sec) => renderCraftSection(sec.key))}
                      </Element>
                    </Frame>
                  </BuilderLiveContext.Provider>
                </div>
              </div>
            </div>
          </main>

          {/* ============================================================= */}
          {/* 2.C RIGHT SIDEBAR: SETTINGS PANEL (Crisp White #FFFFFF)       */}
          {/* ============================================================= */}
          <aside className={`w-full xl:w-80 bg-white text-zinc-900 border-l border-zinc-200 flex flex-col shrink-0 h-full overflow-hidden z-20 ${
            mobileActivePanel === "settings" ? "flex" : "hidden xl:flex"
          }`}>
            <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
                  {sectionsList.find((s) => s.key === activeSection)?.label || "Pengaturan"}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">
                  Ubah teks dan konten untuk bagian ini
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] sm:text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                  Live Edit
                </span>
                <button
                  type="button"
                  onClick={() => setMobileActivePanel("canvas")}
                  className="xl:hidden text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title="Lihat Hasil di Canvas"
                >
                  📱 Canvas
                </button>
              </div>
            </div>

            {/* Dynamic Form based on activeSection & template theme */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* ========================================================= */}
              {/* 1. EVENT DETAILS FORM                                      */}
              {/* ========================================================= */}
              {activeSection === "event-details" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-amber-900">
                          Judul &amp; Tagline Bagian
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Tagline Atas
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.tagline || "DETAIL ACARA"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, tagline: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Judul Utama
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.title || "Waktu & Tempat"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, title: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                      </div>

                      {/* Akad Nikah Card */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Akad Nikah
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Judul Acara</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.akadTitle || "Akad Nikah"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadTitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Hari &amp; Tanggal</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.akadDate || "SABTU, 20 MARET 2027"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadDate: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Waktu</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.akadTime || "08.00 – 10.00 WIB"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Tempat / Gedung</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.akadVenue || "Masjid Al-Ikhlas"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadVenue: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Alamat Lengkap</label>
                          <textarea
                            rows={2}
                            value={sectionData.eventDetails?.akadAddress || "Jl. Cendana No. 5, Bandung"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadAddress: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>
                      </div>

                      {/* Resepsi Card */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Resepsi
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Judul Acara</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.resepsiTitle || "Resepsi"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiTitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Hari &amp; Tanggal</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.resepsiDate || "SABTU, 20 MARET 2027"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiDate: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Waktu</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.resepsiTime || "11.00 – 14.00 WIB"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Tempat / Gedung</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails?.resepsiVenue || "Gedung Serbaguna Al-Hidayah"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiVenue: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Alamat Lengkap</label>
                          <textarea
                            rows={2}
                            value={sectionData.eventDetails?.resepsiAddress || "Jl. Cendana No. 9, Bandung"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiAddress: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                        <p className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                          Save The Date
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Hari</label>
                            <input
                              type="text"
                              value={sectionData.eventDetails.dayName || "SABTU"}
                              onChange={(e) =>
                                setSectionData((prev: any) => ({
                                  ...prev,
                                  eventDetails: { ...prev.eventDetails, dayName: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Tanggal</label>
                            <input
                              type="text"
                              value={sectionData.eventDetails.dateDay || "12"}
                              onChange={(e) =>
                                setSectionData((prev: any) => ({
                                  ...prev,
                                  eventDetails: { ...prev.eventDetails, dateDay: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Bulan &amp; Tahun</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.monthYear || "DESEMBER 2026"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, monthYear: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-3">
                        <p className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                          Acara 1: Akad Nikah
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Waktu</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.akadTime}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Lokasi</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.akadLocation}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, akadLocation: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-3">
                        <p className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                          Acara 2: Resepsi
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Waktu</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiTime}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Lokasi</label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiLocation}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiLocation: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>
                    </>
                  ) : isBali ? (
                    <>
                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-3">
                        <p className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                          Acara 1: Pawiwahan (Akad)
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Nama Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.pawiwahanName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, pawiwahanName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Tanggal Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.pawiwahanDate}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, pawiwahanDate: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Waktu Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.pawiwahanTime}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, pawiwahanTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Tempat / Gedung
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.pawiwahanLocation}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, pawiwahanLocation: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Alamat Lengkap
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.eventDetails.pawiwahanAddress}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, pawiwahanAddress: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-3">
                        <p className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                          Acara 2: Resepsi
                        </p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Nama Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Tanggal Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiDate}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiDate: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Waktu Acara
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiTime}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiTime: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Tempat / Gedung
                          </label>
                          <input
                            type="text"
                            value={sectionData.eventDetails.resepsiLocation}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiLocation: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                            Alamat Lengkap
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.eventDetails.resepsiAddress}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                eventDetails: { ...prev.eventDetails, resepsiAddress: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama event
                        </label>
                        <input
                          type="text"
                          value={sectionData.eventDetails.eventName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              eventDetails: { ...prev.eventDetails, eventName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanggal
                        </label>
                        <input
                          type="text"
                          value={sectionData.eventDetails.eventDate}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              eventDetails: { ...prev.eventDetails, eventDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Waktu
                        </label>
                        <input
                          type="text"
                          value={sectionData.eventDetails.eventTime}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              eventDetails: { ...prev.eventDetails, eventTime: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Lokasi
                        </label>
                        <input
                          type="text"
                          value={sectionData.eventDetails.eventLocation}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              eventDetails: { ...prev.eventDetails, eventLocation: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* LOCATION FORM                                              */}
              {/* ========================================================= */}
              {activeSection === "location" && sectionData.location && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Tagline Atas</label>
                        <input
                          type="text"
                          value={sectionData.location?.tagline || "LOKASI ACARA"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Judul Section</label>
                        <input
                          type="text"
                          value={sectionData.location?.title || "Peta Lokasi"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Nama Tempat / Masjid</label>
                        <input
                          type="text"
                          value={sectionData.location?.venueName || "Masjid Al-Ikhlas"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, venueName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Alamat Lengkap</label>
                        <textarea
                          rows={3}
                          value={sectionData.location?.address || "Jl. Cendana No. 5, Bandung 40111"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, address: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Link Google Maps</label>
                        <input
                          type="text"
                          value={sectionData.location?.mapsUrl || "https://maps.google.com"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, mapsUrl: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Tagline / Badge (Atas)</label>
                        <input
                          type="text"
                          value={sectionData.location.sectionTitle || "LOKASI ACARA"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, sectionTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Judul Section</label>
                        <input
                          type="text"
                          value={sectionData.location.heading || "Peta Lokasi"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, heading: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Nama Tempat / Masjid / Gedung</label>
                        <input
                          type="text"
                          value={sectionData.location.venueName || "Masjid Al-Ikhlasiah"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, venueName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Alamat Lengkap</label>
                        <textarea
                          rows={3}
                          value={sectionData.location.venueAddress || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, venueAddress: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Teks Tombol</label>
                        <input
                          type="text"
                          value={sectionData.location.buttonText || "LIHAT LOKASI"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, buttonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Tautan Google Maps</label>
                        <input
                          type="text"
                          value={sectionData.location.mapUrl || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, mapUrl: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Judul Section</label>
                        <input
                          type="text"
                          value={sectionData.location.heading}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, heading: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Nama Tempat / Gedung</label>
                        <input
                          type="text"
                          value={sectionData.location.venueName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, venueName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Alamat Lengkap</label>
                        <textarea
                          rows={3}
                          value={sectionData.location.venueAddress}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, venueAddress: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Tautan Google Maps</label>
                        <input
                          type="text"
                          value={sectionData.location.mapUrl}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              location: { ...prev.location, mapUrl: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. COVER FORM                                              */}
              {/* ========================================================= */}
              {activeSection === "cover" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Basmalah (Arab)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={sectionData.cover?.bismillah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, bismillah: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Label Atas (Small Caps)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.theWeddingOf || "THE WEDDING OF"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, theWeddingOf: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pasangan / Judul Cover
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.coupleTitle || "Nara & Dimas"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, coupleTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanggal Acara
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.eventDate || "SABTU, 20 MARET 2027"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, eventDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tempat / Kota
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.venue || "Masjid Al-Ikhlas · Bandung"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, venue: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kepada Yth. (Badge)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.inviteeBadge || "Kepada Yth. Bapak/Ibu/Saudara/i"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeBadge: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Tamu Undangan
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.inviteeName || "Nama Tamu"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Tombol Buka
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover?.openButtonText || "BUKA UNDANGAN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, openButtonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Label Atas (Small Caps)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.theWeddingOf}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, theWeddingOf: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                            Nama Pria
                          </label>
                          <input
                            type="text"
                            value={sectionData.cover.groomName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                cover: { ...prev.cover, groomName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                            Nama Wanita
                          </label>
                          <input
                            type="text"
                            value={sectionData.cover.brideName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                cover: { ...prev.cover, brideName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanggal Acara
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.eventDate}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, eventDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kepada Yth. (Badge)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.inviteeBadge}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeBadge: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Tamu Undangan
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.inviteeName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : isBali ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline Pembuka
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.tagline}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Sub-Tagline
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.theWeddingOf}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, theWeddingOf: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pasangan (Pinyon Script)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.coupleTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, coupleTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanggal Pernikahan
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.eventDate}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, eventDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Lokasi Singkat
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.locationShort}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, locationShort: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Placeholder Tamu Undangan
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.inviteeName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Inisial / Monogram
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.monogram}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, monogram: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Mempelai
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.coupleNames}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, coupleNames: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Tamu Undangan (Placeholder)
                        </label>
                        <input
                          type="text"
                          value={sectionData.cover.inviteeName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, inviteeName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kalimat Pengantar (Subtitle)
                        </label>
                        <textarea
                          rows={3}
                          value={sectionData.cover.subtitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              cover: { ...prev.cover, subtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. OPENING FORM                                            */}
              {/* ========================================================= */}
              {activeSection === "opening" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Basmalah (Arab)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={sectionData.opening?.bismillah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, bismillah: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Salam Pembuka (Heading)
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening?.salamTitle || "Assalamu'alaikum Warahmatullahi Wabarakatuh"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, salamTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Undangan (Body)
                        </label>
                        <textarea
                          rows={3}
                          value={sectionData.opening?.salamBody || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, salamBody: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Badge Kartu Tamu
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening?.inviteeBadge || "Kepada Yth. Bapak/Ibu/Saudara/i"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, inviteeBadge: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Tamu Undangan
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening?.inviteeName || "Nama Tamu"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, inviteeName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Keterangan Tempat
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening?.inviteeNote || "di tempat"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, inviteeNote: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kaligrafi Bismillah (Arab)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={sectionData.opening.bismillah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, bismillah: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-serif text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Ayat Suci / Pesan Pembuka
                        </label>
                        <textarea
                          rows={4}
                          value={sectionData.opening.quoteMessage}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, quoteMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kutipan Surah (Citation)
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening.surahCitation || "QS. AR-RUM : 21"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, surahCitation: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Quote / Doa Pembuka
                        </label>
                        <input
                          type="text"
                          value={sectionData.opening.quoteTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, quoteTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Isi Doa Restu / Pesan
                        </label>
                        <textarea
                          rows={4}
                          value={sectionData.opening.quoteMessage}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              opening: { ...prev.opening, quoteMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TENTANG ACARA (ABOUT) FORM                                */}
              {/* ========================================================= */}
              {activeSection === "about" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={sectionData.about?.tagline || "TENTANG ACARA"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Acara (Heading)
                        </label>
                        <input
                          type="text"
                          value={sectionData.about?.title || "Pernikahan Nara & Dimas"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kutipan Ayat (Quote)
                        </label>
                        <textarea
                          rows={4}
                          value={
                            sectionData.about?.quote ||
                            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang."
                          }
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, quote: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Sumber Kutipan
                        </label>
                        <input
                          type="text"
                          value={sectionData.about?.quoteSource || "QS. Ar-Rum: 21"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, quoteSource: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Badge Informasi 1
                        </label>
                        <input
                          type="text"
                          value={sectionData.about?.badge1 || "Akad di masjid"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, badge1: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Badge Informasi 2
                        </label>
                        <input
                          type="text"
                          value={sectionData.about?.badge2 || "Dresscode: Sage & Ivory"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              about: { ...prev.about, badge2: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. BRIDE & GROOM FORM                                      */}
              {/* ========================================================= */}
              {activeSection === "bride-groom" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-amber-900">
                          Judul & Tagline Bagian
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Tagline Atas
                          </label>
                          <input
                            type="text"
                            value={sectionData.couple?.tagline || "MEMPELAI"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, tagline: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Judul Utama
                          </label>
                          <input
                            type="text"
                            value={sectionData.couple?.title || "Kedua Mempelai"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, title: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                      </div>

                      {/* Mempelai Wanita */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Mempelai Wanita
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Nama Lengkap
                          </label>
                          <input
                            type="text"
                            value={sectionData.couple?.brideFullName || "Nara Ayu Pramesti"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, brideFullName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Orang Tua
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.couple?.brideParents || "Putri kedua Bapak Hartono\n& Ibu Wulandari"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, brideParents: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>
                      </div>

                      {/* Mempelai Pria */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Mempelai Pria
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Nama Lengkap
                          </label>
                          <input
                            type="text"
                            value={sectionData.couple?.groomFullName || "Dimas Adi Pratama"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, groomFullName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Orang Tua
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.couple?.groomParents || "Putra pertama Bapak Slamet Widodo\n& Ibu Sri Rahayu"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                couple: { ...prev.couple, groomParents: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      {/* Section Heading Settings */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-emerald-900">
                          Judul & Tagline Bagian
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Tagline / Small Caps
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.sectionTitle ?? "MEMPELAI"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, sectionTitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Judul Utama
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.heading ?? "Dua Hati, Satu Cerita"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, heading: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>

                      {/* 1. Mempelai Wanita (The Bride - First) */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-emerald-900">
                            Mempelai Wanita (The Bride)
                          </label>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">Urutan #1</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Label Subtitle
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.brideSubtitle ?? "THE BRIDE"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, brideSubtitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Nama Mempelai Wanita
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.brideName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, brideName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Info Orang Tua / Keterangan
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.brideGroom.brideBio}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, brideBio: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Foto Mempelai Wanita (URL atau Upload)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="https://... atau upload file"
                              value={sectionData.brideGroom.brideImage || ""}
                              onChange={(e) =>
                                setSectionData((prev: any) => ({
                                  ...prev,
                                  brideGroom: { ...prev.brideGroom, brideImage: e.target.value },
                                }))
                              }
                              className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                            />
                            <label className="cursor-pointer px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg border border-zinc-300 transition-colors whitespace-nowrap">
                              Pilih File
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        setSectionData((prev: any) => ({
                                          ...prev,
                                          brideGroom: { ...prev.brideGroom, brideImage: ev.target!.result as string },
                                        }));
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 2. Mempelai Pria (The Groom - Second) */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-emerald-900">
                            Mempelai Pria (The Groom)
                          </label>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">Urutan #2</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Label Subtitle
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.groomSubtitle ?? "THE GROOM"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, groomSubtitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Nama Mempelai Pria
                          </label>
                          <input
                            type="text"
                            value={sectionData.brideGroom.groomName}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, groomName: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Info Orang Tua / Keterangan
                          </label>
                          <textarea
                            rows={2}
                            value={sectionData.brideGroom.groomBio}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                brideGroom: { ...prev.brideGroom, groomBio: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Foto Mempelai Pria (URL atau Upload)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="https://... atau upload file"
                              value={sectionData.brideGroom.groomImage || ""}
                              onChange={(e) =>
                                setSectionData((prev: any) => ({
                                  ...prev,
                                  brideGroom: { ...prev.brideGroom, groomImage: e.target.value },
                                }))
                              }
                              className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                            />
                            <label className="cursor-pointer px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg border border-zinc-300 transition-colors whitespace-nowrap">
                              Pilih File
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        setSectionData((prev: any) => ({
                                          ...prev,
                                          brideGroom: { ...prev.brideGroom, groomImage: ev.target!.result as string },
                                        }));
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : isBali ? (
                    <>
                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Mempelai Wanita
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.brideName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, brideName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <textarea
                          rows={2}
                          value={sectionData.brideGroom.brideBio}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, brideBio: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>

                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Mempelai Pria
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.groomName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, groomName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <textarea
                          rows={2}
                          value={sectionData.brideGroom.groomBio}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, groomBio: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Mempelai Pria & Gelar
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.groomName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, groomName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Orang Tua Mempelai Pria
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.groomParents}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, groomParents: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Mempelai Wanita & Gelar
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.brideName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, brideName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Orang Tua Mempelai Wanita
                        </label>
                        <input
                          type="text"
                          value={sectionData.brideGroom.brideParents}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              brideGroom: { ...prev.brideGroom, brideParents: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. COUNTDOWN FORM                                          */}
              {/* ========================================================= */}
              {activeSection === "countdown" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.countdown?.tagline || "MENUJU HARI BAHAGIA"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              countdown: { ...prev.countdown, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Hitung Mundur
                        </label>
                        <input
                          type="text"
                          value={sectionData.countdown?.title || "Hitung Mundur"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              countdown: { ...prev.countdown, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanggal & Waktu Target
                        </label>
                        <input
                          type="datetime-local"
                          value={sectionData.countdown?.targetDate ? sectionData.countdown.targetDate.slice(0, 16) : "2027-03-20T08:00"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              countdown: { ...prev.countdown, targetDate: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                        Judul Countdown
                      </label>
                      <input
                        type="text"
                        value={sectionData.countdown?.countdownTitle || sectionData.countdown?.title || ""}
                        onChange={(e) =>
                          setSectionData((prev: any) => ({
                            ...prev,
                            countdown: { ...prev.countdown, countdownTitle: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 5.B RUNDOWN FORM                                          */}
              {/* ========================================================= */}
              {activeSection === "rundown" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.rundown?.tagline || "RUNDOWN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rundown: { ...prev.rundown, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Susunan Acara
                        </label>
                        <input
                          type="text"
                          value={sectionData.rundown?.title || "Susunan Acara"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rundown: { ...prev.rundown, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>

                      <div className="pt-2 border-t border-zinc-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-zinc-800">
                            Daftar Jadwal Acara ({sectionData.rundown?.items?.length || 0})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [
                                ...(sectionData.rundown?.items || []),
                                { time: "00.00", title: "Acara Baru", desc: "Deskripsi acara" },
                              ];
                              setSectionData((prev: any) => ({
                                ...prev,
                                rundown: { ...prev.rundown, items: newItems },
                              }));
                            }}
                            className="text-[11px] font-semibold text-[#8a6b2d] hover:text-[#5a441b] flex items-center gap-1 cursor-pointer"
                          >
                            + Tambah Acara
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(sectionData.rundown?.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-600">Acara #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = sectionData.rundown.items.filter((_: any, i: number) => i !== idx);
                                    setSectionData((prev: any) => ({
                                      ...prev,
                                      rundown: { ...prev.rundown, items: newItems },
                                    }));
                                  }}
                                  className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  Hapus
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                  <label className="block text-[10px] text-zinc-500 mb-0.5">Waktu</label>
                                  <input
                                    type="text"
                                    value={item.time}
                                    onChange={(e) => {
                                      const newItems = [...sectionData.rundown.items];
                                      newItems[idx] = { ...newItems[idx], time: e.target.value };
                                      setSectionData((prev: any) => ({
                                        ...prev,
                                        rundown: { ...prev.rundown, items: newItems },
                                      }));
                                    }}
                                    className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] text-zinc-500 mb-0.5">Nama Acara</label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const newItems = [...sectionData.rundown.items];
                                      newItems[idx] = { ...newItems[idx], title: e.target.value };
                                      setSectionData((prev: any) => ({
                                        ...prev,
                                        rundown: { ...prev.rundown, items: newItems },
                                      }));
                                    }}
                                    className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-500 mb-0.5">Keterangan Singkat</label>
                                <input
                                  type="text"
                                  value={item.desc}
                                  onChange={(e) => {
                                    const newItems = [...sectionData.rundown.items];
                                    newItems[idx] = { ...newItems[idx], desc: e.target.value };
                                    setSectionData((prev: any) => ({
                                      ...prev,
                                      rundown: { ...prev.rundown, items: newItems },
                                    }));
                                  }}
                                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      Rundown hanya tersedia untuk tema Javanese Elegant.
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 6. STORY FORM                                              */}
              {/* ========================================================= */}
              {activeSection === "story" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.story?.tagline || "PERJALANAN KAMI"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              story: { ...prev.story, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Bagian
                        </label>
                        <input
                          type="text"
                          value={sectionData.story?.heading || "Kisah Kami"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              story: { ...prev.story, heading: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>

                      {/* 3 Story Tabs Content */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-zinc-800">
                          Konten Tab Cerita
                        </label>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            1. Cerita: Bertemu
                          </label>
                          <textarea
                            rows={3}
                            value={
                              sectionData.story?.storyBertemu ||
                              "Kami dipertemukan dalam sebuah kajian di kampus. Dari obrolan sederhana, tumbuh rasa saling percaya hingga kami memantapkan niat untuk menyempurnakan separuh agama."
                            }
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                story: { ...prev.story, storyBertemu: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            2. Cerita: Dekat
                          </label>
                          <textarea
                            rows={3}
                            value={
                              sectionData.story?.storyDekat ||
                              "Seiring berjalannya waktu dan restu kedua keluarga, kedekatan kami semakin bertumbuh dalam komitmen untuk saling melengkapi dan membimbing menuju ridha-Nya."
                            }
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                story: { ...prev.story, storyDekat: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            3. Cerita: Melamar
                          </label>
                          <textarea
                            rows={3}
                            value={
                              sectionData.story?.storyMelamar ||
                              "Dengan memohon doa restu orang tua dan bimbingan Allah SWT, niat suci kami diikat dalam prosesi lamaran hangat yang menjadi awal langkah menuju pelaminan."
                            }
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                story: { ...prev.story, storyMelamar: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Kisah Kami
                        </label>
                        <input
                          type="text"
                          value={sectionData.story?.storyTitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              story: { ...prev.story, storyTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Narasi Cerita
                        </label>
                        <textarea
                          rows={5}
                          value={sectionData.story?.storyMessage || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              story: { ...prev.story, storyMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 7. GALLERY FORM                                            */}
              {/* ========================================================= */}
              {/* ========================================================= */}
              {/* GALERI FORM                                               */}
              {/* ========================================================= */}
              {activeSection === "gallery" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.gallery?.tagline || "GALERI"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gallery: { ...prev.gallery, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Galeri
                        </label>
                        <input
                          type="text"
                          value={sectionData.gallery?.title || "Momen Kami"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gallery: { ...prev.gallery, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          URL Video Dokumentasi (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="https://youtube.com/..."
                          value={sectionData.gallery?.videoUrl || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gallery: { ...prev.gallery, videoUrl: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>

                      <div className="pt-2 border-t border-zinc-200">
                        <label className="block text-xs font-bold text-zinc-800 mb-2">
                          Foto Kubah Lengkung (6 Foto)
                        </label>
                        <div className="space-y-2.5">
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <span className="text-[11px] font-semibold text-zinc-500 w-12 shrink-0">
                                Foto #{idx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`/templates/wedding/gallery-${idx + 1}.jpg atau URL`}
                                value={sectionData.gallery?.images?.[idx] || ""}
                                onChange={(e) => {
                                  const currentImages = [...(sectionData.gallery?.images || [])];
                                  currentImages[idx] = e.target.value;
                                  setSectionData((prev: any) => ({
                                    ...prev,
                                    gallery: { ...prev.gallery, images: currentImages },
                                  }));
                                }}
                                className="flex-1 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Galeri
                        </label>
                        <input
                          type="text"
                          value={sectionData.gallery?.galleryTitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gallery: { ...prev.gallery, galleryTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Sub-judul Galeri
                        </label>
                        <input
                          type="text"
                          value={sectionData.gallery?.gallerySubtitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gallery: { ...prev.gallery, gallerySubtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 8. RSVP FORM                                               */}
              {/* ========================================================= */}
              {activeSection === "rsvp" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp?.tagline || "KONFIRMASI"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Section
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp?.title || "Konfirmasi Kehadiran"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Batas Waktu Konfirmasi
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp?.deadline || sectionData.rsvp?.deadlineText || "Mohon konfirmasi sebelum 10 Maret 2027"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, deadline: e.target.value, deadlineText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Badge (Atas)
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp.sectionTitle || "RSVP"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, sectionTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul RSVP
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp.heading || "Konfirmasi Kehadiran"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, heading: e.target.value, rsvpTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kalimat Petunjuk Formulir
                        </label>
                        <textarea
                          rows={2}
                          value={sectionData.rsvp.subtitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, subtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Tombol Kirim
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp.submitButtonText || "KIRIM KONFIRMASI"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, submitButtonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul RSVP
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp.rsvpTitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, rsvpTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Batas Waktu Konfirmasi
                        </label>
                        <input
                          type="text"
                          value={sectionData.rsvp.rsvpDeadline || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              rsvp: { ...prev.rsvp, rsvpDeadline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 9. VOICE NOTE / PESAN PERSONAL                             */}
              {/* ========================================================= */}
              {activeSection === "voice-note" && sectionData.voiceNote && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.voiceNote?.tagline || "FITUR TAMBAHAN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Section
                        </label>
                        <input
                          type="text"
                          value={sectionData.voiceNote?.title || "Pesan Personal"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Petunjuk / Keterangan Rekaman
                        </label>
                        <textarea
                          rows={2}
                          value={sectionData.voiceNote?.desc || "Tinggalkan ucapan dalam rekaman suara atau video singkat, maksimal 10 detik."}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, desc: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Pesan Suara / Video
                        </label>
                        <input
                          type="text"
                          value={sectionData.voiceNote.voiceTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, voiceTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Keterangan Durasi (Maks. 10 Detik)
                        </label>
                        <input
                          type="text"
                          value={sectionData.voiceNote.voiceSubtitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, voiceSubtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Tombol Kirim
                        </label>
                        <input
                          type="text"
                          value={sectionData.voiceNote.submitButtonText}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              voiceNote: { ...prev.voiceNote, submitButtonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 10. WISHES / UCAPAN & DOA (BALI / JAVANESE)                */}
              {/* ========================================================= */}
              {activeSection === "wishes" && sectionData.wishes && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes?.tagline || "BUKU TAMU"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Section
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes?.title || "Ucapan & Doa"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Badge (Atas)
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes.sectionTitle || "DOA & UCAPAN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, sectionTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Bagian Ucapan
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes.heading || "Doa dan Ucapan"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, heading: e.target.value, wishesTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kalimat Pengantar Ucapan
                        </label>
                        <textarea
                          rows={2}
                          value={sectionData.wishes.subtitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, subtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Tombol Kirim
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes.buttonText || sectionData.wishes.submitButtonText || "KIRIM UCAPAN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, buttonText: e.target.value, submitButtonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Ucapan &amp; Doa
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes.wishesTitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, wishesTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Tombol Kirim Ucapan
                        </label>
                        <input
                          type="text"
                          value={sectionData.wishes.submitButtonText || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              wishes: { ...prev.wishes, submitButtonText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 11. DIGITAL GIFT / KIRIM HADIAH FORM                       */}
              {/* ========================================================= */}
              {activeSection === "digital-gift" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Label Atas
                        </label>
                        <input
                          type="text"
                          value={sectionData.gift?.tagline || "INFORMASI TAMBAHAN"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gift: { ...prev.gift, tagline: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Section
                        </label>
                        <input
                          type="text"
                          value={sectionData.gift?.title || "Kirim Hadiah"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gift: { ...prev.gift, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Teks Pengantar
                        </label>
                        <textarea
                          rows={3}
                          value={
                            sectionData.gift?.introText ??
                            "Kehadiran dan doa Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:"
                          }
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              gift: { ...prev.gift, introText: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>

                      {/* Detail Rekening Penerima */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Rekening Penerima Hadiah
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Nama Bank</label>
                          <input
                            type="text"
                            value={sectionData.gift?.bankName || sectionData.gift?.bank1Name || "BCA"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                gift: { ...prev.gift, bankName: e.target.value, bank1Name: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Atas Nama</label>
                          <input
                            type="text"
                            value={sectionData.gift?.accountHolder || sectionData.gift?.bank1Holder || "Dimas Adi Pratama"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                gift: { ...prev.gift, accountHolder: e.target.value, bank1Holder: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            value={sectionData.gift?.accountNumber || sectionData.gift?.bank1Account || "1234 5678 90"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                gift: { ...prev.gift, accountNumber: e.target.value, bank1Account: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tagline / Badge (Atas)
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.badge || "HADIAH DIGITAL"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, badge: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Bagian Hadiah
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.heading || sectionData.digitalGift.giftTitle || "Tanda Kasih"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, heading: e.target.value, giftTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Kalimat Pengantar Hadiah (Ukuran Font 18)
                        </label>
                        <textarea
                          rows={3}
                          value={sectionData.digitalGift.subtitle || sectionData.digitalGift.giftSubtitle || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: {
                                ...prev.digitalGift,
                                subtitle: e.target.value,
                                giftSubtitle: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>

                      {/* Card 1: Bank BCA */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-emerald-900">Rekening 1 (Bank)</p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nama Bank</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank1Name || "BANK BCA"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank1Name: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank1Acc || "1234 5678 90"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank1Acc: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Atas Nama</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank1Holder || "a.n. Angga Aldi Yunanda"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank1Holder: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Teks Tombol Salin</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank1ButtonText || "SALIN NOMOR"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank1ButtonText: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>

                      {/* Card 2: E-Wallet / DANA */}
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-emerald-900">Rekening 2 (E-Wallet / Bank Lain)</p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nama E-Wallet / Bank</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank2Name || "E-WALLET / DANA"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank2Name: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nomor Akun / HP</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank2Acc || "0812 3456 7890"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank2Acc: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Atas Nama</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank2Holder || "a.n. Shenina Syawalita"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank2Holder: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Teks Tombol Salin</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.bank2ButtonText || "SALIN NOMOR"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, bank2ButtonText: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                      </div>

                      {/* Alamat Pengiriman Kado Fisik */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-amber-900">Alamat Pengiriman Kado Fisik</p>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Judul Kado Fisik</label>
                          <input
                            type="text"
                            value={sectionData.digitalGift.giftAddressTitle || "ALAMAT PENGIRIMAN KADO"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, giftAddressTitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Alamat Lengkap</label>
                          <textarea
                            rows={2}
                            value={sectionData.digitalGift.giftAddress || "Jl. Contoh No. 7, Kota Bogor, Jawa Barat"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, giftAddress: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Bagian Hadiah
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.giftTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, giftTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      {isBali && (
                        <div>
                          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                            Kalimat Pengantar Hadiah
                          </label>
                          <textarea
                            rows={3}
                            value={sectionData.digitalGift.giftSubtitle}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                digitalGift: { ...prev.digitalGift, giftSubtitle: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.bankName}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, bankName: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.accountNumber}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, accountNumber: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pemilik Rekening
                        </label>
                        <input
                          type="text"
                          value={sectionData.digitalGift.accountHolder}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              digitalGift: { ...prev.digitalGift, accountHolder: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 12. CLOSING FORM                                           */}
              {/* ========================================================= */}
              {activeSection === "closing" && (
                <div className="space-y-4 animate-fadeIn">
                  {isJavanese ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Penutup
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing?.title || "Jazakumullahu Khairan"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, title: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Pesan Penutup
                        </label>
                        <textarea
                          rows={3}
                          value={
                            sectionData.closing?.message ??
                            "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh."
                          }
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, message: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pasangan
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing?.coupleName || sectionData.closing?.familySignature || "Nara & Dimas"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, coupleName: e.target.value, familySignature: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                        />
                      </div>

                      {/* Box Informasi Tambahan */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-800">
                          Informasi Tambahan
                        </label>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Dresscode</label>
                          <input
                            type="text"
                            value={sectionData.closing?.dresscode || "Dresscode: Sage & Ivory"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                closing: { ...prev.closing, dresscode: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Catatan Waktu</label>
                          <input
                            type="text"
                            value={sectionData.closing?.eventNotes || "Mohon hadir 15 menit sebelum acara dimulai."}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                closing: { ...prev.closing, eventNotes: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Kontak Panitia</label>
                          <input
                            type="text"
                            value={sectionData.closing?.contactPerson || "Kontak panitia: 0812-3456-7890"}
                            onChange={(e) =>
                              setSectionData((prev: any) => ({
                                ...prev,
                                closing: { ...prev.closing, contactPerson: e.target.value },
                              }))
                            }
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
                          />
                        </div>
                      </div>
                    </>
                  ) : isEmerald ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Penutup
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.heading || sectionData.closing.closingTitle || "Terima Kasih"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, heading: e.target.value, closingTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Doa &amp; Kalimat Penutup
                        </label>
                        <textarea
                          rows={4}
                          value={sectionData.closing.message || sectionData.closing.closingMessage || ""}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, message: e.target.value, closingMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Inisial Monogram (A &amp; S)
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.monogram || "A & S"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, monogram: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pasangan (All Caps)
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.coupleNames || "ANGGA & SHENINA"}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, coupleNames: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                        />
                      </div>
                    </>
                  ) : isBali ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Penutup
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.closingTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, closingTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Doa &amp; Kalimat Penutup
                        </label>
                        <textarea
                          rows={4}
                          value={sectionData.closing.closingMessage}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, closingMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Nama Pasangan (Pinyon Script)
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.coupleNames}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, coupleNames: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Mantra / Salam Suci
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.mantra}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, mantra: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Judul Penutup
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.closingTitle}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, closingTitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Doa &amp; Kalimat Penutup
                        </label>
                        <textarea
                          rows={4}
                          value={sectionData.closing.closingMessage}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, closingMessage: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                          Tanda Tangan Mempelai
                        </label>
                        <input
                          type="text"
                          value={sectionData.closing.signature}
                          onChange={(e) =>
                            setSectionData((prev: any) => ({
                              ...prev,
                              closing: { ...prev.closing, signature: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Panel Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between pb-24 xl:pb-4">
              <span className="text-[11px] text-zinc-500">
                Tersinkronisasi otomatis
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveDraft();
                    if (typeof window !== "undefined" && window.innerWidth < 1280) {
                      setMobileActivePanel("canvas");
                    }
                  }}
                  className="bg-[#2D1C15] text-white hover:bg-black px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActivePanel("canvas")}
                  className="xl:hidden bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Lihat Canvas →
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ================================================================= */}
        {/* Mobile & Tablet Floating Docked Navigation Bar (< xl)             */}
        {/* ================================================================= */}
        <div className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#1e130e]/95 backdrop-blur-md border border-amber-500/40 rounded-full p-1.5 shadow-2xl flex items-center gap-1 select-none">
          <button
            type="button"
            onClick={() => setMobileActivePanel("structure")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mobileActivePanel === "structure"
                ? "bg-[#E89F3C] text-black shadow-md font-bold"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <span>☰</span>
            <span>Struktur</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActivePanel("canvas")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mobileActivePanel === "canvas"
                ? "bg-[#E89F3C] text-black shadow-md font-bold"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <span>📱</span>
            <span>Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActivePanel("settings")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mobileActivePanel === "settings"
                ? "bg-[#E89F3C] text-black shadow-md font-bold"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <span>⚙️</span>
            <span>Edit Konten</span>
          </button>
        </div>
      </Editor>

      {/* ================================================================= */}
      {/* 3. FULL PREVIEW MODAL                                             */}
      {/* ================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
              isEmerald
                ? "bg-[#072f25] text-white"
                : isBali
                ? "bg-[#102218] text-[#f3eee6]"
                : isJavanese
                ? "bg-[#273422] text-[#f8f5ec]"
                : "bg-white text-zinc-900"
            }`}
          >
            <div className="bg-[#2D1C15] text-white px-5 py-3 flex items-center justify-between text-xs border-b border-[#432A20]">
              <span className="font-semibold">
                Pratinjau Undangan: {projectTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-white/80 hover:text-white text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div
              className={`flex-1 overflow-y-auto no-scrollbar p-4 ${
                isEmerald ? "bg-[#0f4a38]" : isBali ? "bg-[#102218]" : isJavanese ? "bg-[#273422]" : "bg-[#fcfaf7]"
              }`}
            >
              <BuilderLiveContext.Provider value={{ sectionData }}>
                <div className="space-y-6 text-center">
                  {sectionsList.map((sec) => renderPreviewSection(sec.key))}
                </div>
              </BuilderLiveContext.Provider>
            </div>
            <div
              className={`p-4 border-t flex justify-end ${
                isEmerald
                  ? "bg-[#0b382b] border-[#c59b4e]/30"
                  : isBali
                  ? "bg-[#162e21] border-[#d7ab58]/20"
                  : isJavanese
                  ? "bg-[#1f2a1b] border-[#c5a059]/30"
                  : "bg-zinc-50 border-zinc-100"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className={`${
                  isEmerald
                    ? "bg-[#c59b4e] text-[#0f4a38] hover:bg-[#d6aa57]"
                    : isBali
                    ? "bg-[#d7ab58] text-[#102218] hover:bg-[#e8c97e]"
                    : isJavanese
                    ? "bg-[#c5a059] text-[#1d2719] hover:bg-[#d4b068]"
                    : "bg-[#d7ab58] text-white"
                } px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors`}
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
