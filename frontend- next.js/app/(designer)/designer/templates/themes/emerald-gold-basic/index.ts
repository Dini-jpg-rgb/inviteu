import rawJsonData from "./template.json";
import { TemplateTheme } from "../wedding";

export const emeraldGoldBasicTheme: TemplateTheme = {
  id: "template-emerald-gold-basic",
  slug: "emerald-gold-basic",
  name: "Emerald Gold Basic - Angga & Shenina",
  themeCategory: "Art Deco / Basic Tier",
  status: "Published",
  version: "1.0",
  createdAt: "04 Nov 2026",
  thumbnail: "/templates/emerald-gold-basic/thumbnail.png",
  description: "Desain undangan pernikahan Art Deco bertema Emerald & Gold yang megah dan elegan khusus akun Basic, menampilkan ornamen geometris emas, bingkai kubah klasik, dan tipografi serif mewah.",
  colorPalette: {
    primary: "#c59b4e",     // Art Deco Warm Gold
    secondary: "#d4a853",   // Champagne Gold
    background: "#0f4a38",  // Deep Emerald Green
    cardBg: "#145843",      // Forest Emerald Card
    text: "#ffffff",        // Crisp White
    accent: "#c59b4e",      // Gold Accent
  },
  typography: {
    serif: "'Cinzel', 'Playfair Display', Georgia, serif",
    script: "'Pinyon Script', cursive",
    body: "'Cormorant Garamond', Georgia, serif",
  },
  content: {
    monogram: {
      groomInitial: "A",
      brideInitial: "S",
      ampersand: "&",
    },
    couple: {
      groom: "ANGGA",
      bride: "SHENINA",
      groomBio: "Angga Yunanda — Putra tercinta dari Bapak Muhammad & Ibu Yuliana",
      brideBio: "Shenina Cinnamon — Putri tercinta dari Bapak Harris & Ibu Fitri",
    },
    invitationNote: {
      badge: "Kepada Yth. Bapak/Ibu/Saudara/i",
      familyName: "Nama Tamu",
      bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      message: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya.",
      citation: "QS. AR-RUM : 21",
    },
    banner: {
      tag: "THE WEDDING OF",
      message: "Dua hati yang dipersatukan dalam ikatan suci pernikahan yang abadi dan penuh keberkahan.",
      coupleTitle: "ANGGA & SHENINA",
    },
    heroImage: "/templates/wedding/couple-main.jpg",
    venue: {
      badge: "LOKASI ACARA",
      placeName: "The Tribrata Dharmawangsa",
      address: "Jl. Darmawangsa III No. 2, Kebayoran Baru, Jakarta Selatan\nDKI Jakarta - Indonesia",
      mapLinkText: "Buka Google Maps",
      mapUrl: "https://maps.google.com",
      image: "/templates/wedding/venue.jpg",
    },
    saveTheDate: {
      badge: "HARI BAHAGIA",
      monthText: "Desember",
      dateNumber: "12",
      yearText: "2026",
      isoDate: "2026-12-12T10:00:00+07:00",
    },
    dresscode: {
      title: "DRESSCODE",
      subtitle: "Emerald & Gold Formal Attire",
      palettes: [
        { name: "Deep Emerald", hex: "#0f4a38" },
        { name: "Warm Gold", hex: "#c59b4e" },
        { name: "Ivory Cream", hex: "#ffffff" },
      ],
      note: "Para tamu undangan diharapkan mengenakan pakaian bernuansa Formal Elegant bertema Emerald dan Emas.",
    },
    gallery: {
      title: "GALERI MOMEN",
      images: [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
      ],
    },
    rsvp: {
      title: "KONFIRMASI KEHADIRAN",
      subtitle: "Mohon konfirmasi kehadiran Anda sebelum 1 Desember 2026",
      fields: {
        nameLabel: "Nama Lengkap",
        presenceOptions: ["Hadir", "Tidak Hadir"],
        guestCountLabel: "Jumlah Tamu",
        notesLabel: "Ucapan & Doa",
        submitText: "KIRIM KONFIRMASI",
      },
    },
    closing: {
      title: "Terima Kasih",
      message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
      countdownTitle: "COUNTDOWN HARI BAHAGIA",
      coupleNames: "ANGGA & SHENINA",
      tagline: "Forever in Sacred Harmony",
    },
    events: [
      {
        name: "Akad Nikah",
        date: "Sabtu, 12 Desember 2026",
        time: "08.00 - 10.00 WIB",
        location: "The Grand Ballroom, The Tribrata",
        address: "Jl. Darmawangsa III No. 2, Kebayoran Baru, Jakarta Selatan",
      },
      {
        name: "Resepsi Pernikahan",
        date: "Sabtu, 12 Desember 2026",
        time: "11.00 - 14.00 WIB",
        location: "The Grand Ballroom, The Tribrata",
        address: "Jl. Darmawangsa III No. 2, Kebayoran Baru, Jakarta Selatan",
      },
    ],
    bankAccounts: [
      {
        bankName: "BCA",
        accountNumber: "8830192841",
        holderName: "Angga Yunanda",
      },
      {
        bankName: "Mandiri",
        accountNumber: "1370019284102",
        holderName: "Shenina Cinnamon",
      },
    ],
  },
  rawFigmaJson: rawJsonData,
};

export default emeraldGoldBasicTheme;

