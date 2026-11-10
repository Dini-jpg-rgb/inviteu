import rawJsonData from "./template.json";
import { TemplateTheme } from "../wedding";

export const baliTropicalTheme: TemplateTheme = {
  id: "template-bali-tropical",
  slug: "bali-tropical",
  name: "Bali Tropical - Chyntia & Rian (Exotic Emerald & Gold)",
  themeCategory: "Traditional / Bali Tropical Luxury",
  status: "Published",
  version: "1.0",
  createdAt: "28 Okt 2026",
  thumbnail: "/templates/bali-tropical/thumbnail.png",
  description: "Nuansa eksotis kemegahan Pulau Dewata dengan ornamen Gapura Bali, penjor artistik, bunga kamboja putih mekar, berpadu dengan emerald forest dan aksen emas suci.",
  colorPalette: {
    primary: "#d7ab58",     // Balinese Warm Gold
    secondary: "#e8c97e",   // Soft Champagne Gold
    background: "#102218",  // Deep Bali Forest Green (Emerald)
    cardBg: "#162e21",      // Deep Emerald Card Background
    text: "#f3eee6",        // Soft Ivory Cream
    accent: "#d7ab58",      // Gold Accent
  },
  typography: {
    serif: "'Cinzel', serif",
    script: "'Pinyon Script', cursive",
    body: "'Cormorant Garamond', Georgia, serif",
  },
  content: {
    monogram: {
      groomInitial: "R",
      brideInitial: "C",
      ampersand: "&",
    },
    couple: {
      groom: "RIAN",
      bride: "CHYNTIA",
      groomBio: "I Made Rian Arisatya, S.T — Putra pertama dari Bapak I Made Hendra & Ibu Ni Luh Sukerti",
      brideBio: "Ni Putu Chyntia Dewi, S.Ked — Putri pertama dari Bapak I Wayan Suartana & Ibu Ni Ketut Murniati",
    },
    invitationNote: {
      badge: "Pawiwahan Ageng",
      familyName: "Om Swastiastu",
      message: "Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa/Tuhan Yang Maha Esa, kami bermaksud mengundang Bapak/Ibu/Saudara/i pada Upacara Pawiwahan kami:",
    },
    banner: {
      tag: "THE WEDDING OF",
      message: "Dua insan dipersatukan dalam keharmonisan semesta dan ikatan suci Dharma.",
      coupleTitle: "CHYNTIA & RIAN",
    },
    heroImage: "/templates/wedding/couple-main.jpg",
    venue: {
      badge: "Lokasi Upacara & Resepsi",
      placeName: "The Kayana Sunset Garden Villa",
      address: "Jl. Petitenget No. 100, Badung, Bali\nPulau Dewata - Indonesia",
      mapLinkText: "Lihat Lokasi",
      mapUrl: "https://maps.google.com",
      image: "/templates/wedding/venue.jpg",
    },
    saveTheDate: {
      badge: "HARI BAHAGIA",
      monthText: "November",
      dateNumber: "22",
      yearText: "2026",
      isoDate: "2026-11-22T09:00:00+08:00",
    },
    dresscode: {
      title: "DRESSCODE",
      subtitle: "Balinese Heritage & Elegant Earthy",
      palettes: [
        { name: "Balinese Gold", hex: "#d7ab58" },
        { name: "Deep Forest", hex: "#102218" },
        { name: "Champagne Cream", hex: "#f3eee6" },
      ],
      note: "Tamu undangan diharapkan mengenakan pakaian bernuansa Tradisional Bali / Formal Elegant bernuansa warna di atas.",
    },
    story: {
      title: "KISAH KAMI",
      milestones: [
        {
          tab: "Bertemu",
          content: "Kami bertemu pada sebuah momen sederhana. Dari obrolan ringan, tumbuhlah rasa yang kini kami bawa ke pelaminan.",
        },
        {
          tab: "Dekat",
          content: "Seiring waktu berjalan, canda tawa dan percakapan sederhana mempertemukan dua hati yang saling melengkapi dalam rasa dan doa.",
        },
        {
          tab: "Melamar",
          content: "Dengan restu Ida Sang Hyang Widhi Wasa dan kedua orang tua, kami mengikat janji suci untuk melangkah bersama menuju pelaminan.",
        },
      ],
    },
    gallery: {
      title: "GALERI",
      images: [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
        "/templates/wedding/couple-main.jpg",
        "/templates/wedding/venue.jpg",
      ],
    },
    rsvp: {
      title: "KONFIRMASI KEHADIRAN",
      subtitle: "Mohon konfirmasi kehadiran sebelum 15 November 2026",
      fields: {
        nameLabel: "Nama lengkap",
        presenceOptions: ["Hadir", "Tidak Hadir"],
        guestCountLabel: "JUMLAH TAMU",
        notesLabel: "Catatan",
        submitText: "KIRIM KONFIRMASI",
      },
    },
    privateMessage: {
      title: "PESAN PRIBADI",
      subtitle: "Rekam pesan suara atau video singkat untuk kedua mempelai (maks. 10 detik)",
      maxDuration: 10,
      submitText: "KIRIM BERSAMA RSVP",
    },
    closing: {
      title: "Suksma",
      message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.\nOm Shanti Shanti Shanti Om.",
      countdownTitle: "COUNTDOWN HARI BAHAGIA",
      coupleNames: "Chyntia & Rian",
      tagline: "Forever in sacred harmony.",
    },
    events: [
      {
        name: "Pawiwahan (Akad Nikah)",
        date: "Minggu, 22 November 2026",
        time: "09.00 - 11.00 WITA",
        location: "Bale Banjar Adat & Kediaman",
        address: "Jl. Raya Seminyak No. 88, Badung, Bali",
      },
      {
        name: "Resepsi",
        date: "Minggu, 22 November 2026",
        time: "18.00 WITA - Selesai",
        location: "The Kayana Sunset Garden Villa",
        address: "Jl. Petitenget No. 100, Badung, Bali",
      },
    ],
    bankAccounts: [
      {
        bankName: "[NAMA BANK]",
        accountNumber: "[NOMOR REKENING]",
        holderName: "Pramarta Chyntia Andita",
      },
    ],
    assets: {
      gapuraFull: "/templates/bali-tropical/gapura-full.png",
      halfGapura: "/templates/bali-tropical/half-gapura.png",
      bungaFull: "/templates/bali-tropical/bunga-full.png",
      melati: "/templates/bali-tropical/melati.png",
      ornFlowers: "/templates/bali-tropical/orn-flowers.png",
      daunPenjorKiri: "/templates/bali-tropical/daun-penjor-kiri.png",
      daunPenjorKanan: "/templates/bali-tropical/daun-penjor-kanan.png",
      daunKiri: "/templates/bali-tropical/daun-kiri.png",
      daunKanan: "/templates/bali-tropical/daun-kanan.png",
      thumbnail: "/templates/bali-tropical/thumbnail.png",
    },
  },
  rawFigmaJson: rawJsonData,
};

export default baliTropicalTheme;
