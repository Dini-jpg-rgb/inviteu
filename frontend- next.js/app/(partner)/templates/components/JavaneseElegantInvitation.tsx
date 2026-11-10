"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Reusable Islamic 8-Pointed Star Top Border Pattern
export function JavaneseTopBorder({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden flex justify-center items-center py-2 select-none pointer-events-none ${className}`}>
      <div className="flex space-x-2 sm:space-x-3 items-center opacity-85">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="stroke-[#c5a059]" strokeWidth="1.2">
              <rect x="6" y="6" width="16" height="16" />
              <rect x="6" y="6" width="16" height="16" transform="rotate(45 14 14)" />
            </svg>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="stroke-[#c5a059] mt-0.5" strokeWidth="1.2">
              <polyline points="1,1 5,5 9,1" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reusable 8-Pointed Star Center Divider
export function JavaneseStarDivider({ color = "#c5a059" }: { color?: string }) {
  return (
    <div className="flex items-center justify-center space-x-3 my-3 max-w-[170px] mx-auto select-none">
      <div className="flex-1 h-[1px]" style={{ backgroundColor: color }} />
      <div className="relative flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.2">
          <rect x="4" y="4" width="12" height="12" />
          <rect x="4" y="4" width="12" height="12" transform="rotate(45 10 10)" />
          <circle cx="10" cy="10" r="1.5" fill={color} />
        </svg>
      </div>
      <div className="flex-1 h-[1px]" style={{ backgroundColor: color }} />
    </div>
  );
}

// Bottom Mosque Silhouette Graphic
export function MosqueSilhouette({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full select-none pointer-events-none overflow-hidden ${className}`}>
      <svg viewBox="0 0 390 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-[#182314] fill-current">
        {/* Left Minaret */}
        <rect x="25" y="25" width="14" height="60" />
        <path d="M25 25 Q32 10 39 25 Z" />
        <line x1="32" y1="10" x2="32" y2="4" stroke="#c5a059" strokeWidth="1.5" />

        {/* Small Left Dome */}
        <path d="M60 85 V52 C60 38 78 28 92 28 C106 28 124 38 124 85 Z" />
        <path d="M78 85 V60 C78 52 85 46 92 46 C99 46 106 52 106 85 Z" fill="#202c1c" stroke="#c5a059" strokeWidth="1" />

        {/* Central Large Dome */}
        <path d="M140 85 V45 C140 22 170 12 195 5 C220 12 250 22 250 85 Z" />
        <path d="M175 85 V55 C175 42 185 32 195 32 C205 32 215 42 215 85 Z" fill="#202c1c" stroke="#c5a059" strokeWidth="1.2" />
        <line x1="195" y1="5" x2="195" y2="0" stroke="#c5a059" strokeWidth="2" />

        {/* Small Right Dome */}
        <path d="M266 85 V52 C266 38 284 28 298 28 C312 28 330 38 330 85 Z" />
        <path d="M284 85 V60 C284 52 291 46 298 46 C305 46 312 52 312 85 Z" fill="#202c1c" stroke="#c5a059" strokeWidth="1" />

        {/* Right Minaret */}
        <rect x="351" y="25" width="14" height="60" />
        <path d="M351 25 Q358 10 365 25 Z" />
        <line x1="358" y1="10" x2="358" y2="4" stroke="#c5a059" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// Reusable Islamic Pointed Arch Dome Frame (Matches Reference 1)
export function JavanesePointedArchFrame({
  children,
  className = "",
  width = 196,
  height = 290,
}: {
  children?: React.ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 196 290"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        fill="none"
      >
        <defs>
          <linearGradient id="javanesePointedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8a9170" />
            <stop offset="100%" stopColor="#3c4b2e" />
          </linearGradient>
        </defs>

        {/* Outer Gold Border */}
        <path
          d="M 10 284 L 186 284 L 186 120 C 186 65 146 25 98 8 C 50 25 10 65 10 120 Z"
          stroke="#b8913e"
          strokeWidth="1.2"
        />

        {/* Inner Gold Border & Fill */}
        <path
          d="M 18 276 L 178 276 L 178 122 C 178 73 142 39 98 24 C 54 39 18 73 18 122 Z"
          fill="url(#javanesePointedGradient)"
          stroke="#b8913e"
          strokeWidth="1"
        />
      </svg>

      {/* Content / Photo inside Pointed Arch Dome */}
      <div
        className="relative z-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          clipPath:
            "path('M 18 276 L 178 276 L 178 122 C 178 73 142 39 98 24 C 54 39 18 73 18 122 Z')",
        }}
      >
        {children}
      </div>
    </div>
  );
}


// Reusable Islamic Pointed Arch Dome Frame for Gallery Photos (Matches Ref 337x1024)
export function JavaneseGalleryPointedArchFrame({
  src,
  alt = "Galeri Momen",
  className = "",
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full aspect-[164/215] flex items-center justify-center select-none group ${className}`}>
      {/* Pointed Arch SVG Frame */}
      <svg
        viewBox="0 0 164 215"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        fill="none"
      >
        <path
          d="M 2 213 L 162 213 L 162 90 C 162 48 126 18 82 2 C 38 18 2 48 2 90 Z"
          stroke="#b8913e"
          strokeWidth="1.2"
        />
      </svg>

      {/* Frame Content: Photo or Gradient Placeholder */}
      <div
        className="relative z-0 w-full h-full overflow-hidden flex items-center justify-center"
        style={{
          clipPath:
            "path('M 2 213 L 162 213 L 162 90 C 162 48 126 18 82 2 C 38 18 2 48 2 90 Z')",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 390px) 164px, 164px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#85926c] to-[#3e4d2e] flex flex-col items-center justify-center text-[#e4e9d3]/60 group-hover:text-[#e4e9d3] transition-colors">
            <svg
              className="w-8 h-8 stroke-current fill-none opacity-40 mb-1"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-[10px] tracking-wider font-sans uppercase opacity-50">
              Ganti Foto
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export interface JavaneseElegantInvitationProps {
  guestName?: string;
  brideName?: string;
  brideParents?: string;
  groomName?: string;
  groomParents?: string;
  theWeddingOf?: string;
  bismillah?: string;
  eventDate?: string;
  venue?: string;
  openButtonText?: string;
  heroImage?: string;
  patternWashImage?: string;
  skylineImage?: string;
  storyBertemu?: string;
  storyDekat?: string;
  storyMelamar?: string;
  akadTitle?: string;
  akadDate?: string;
  akadTime?: string;
  akadVenue?: string;
  akadAddress?: string;
  resepsiTitle?: string;
  resepsiDate?: string;
  resepsiTime?: string;
  resepsiVenue?: string;
  resepsiAddress?: string;
  countdownTagline?: string;
  countdownTitle?: string;
  rundownTagline?: string;
  rundownTitle?: string;
  rundownItems?: Array<{ time: string; title: string; desc: string }>;
  locationTagline?: string;
  locationTitle?: string;
  locationVenue?: string;
  locationAddress?: string;
  locationMapsUrl?: string;
  galleryTagline?: string;
  galleryTitle?: string;
  galleryVideoUrl?: string;
  galleryImages?: string[];
  rsvpTagline?: string;
  rsvpTitle?: string;
  rsvpDeadline?: string;
  voiceNoteTagline?: string;
  voiceNoteTitle?: string;
  voiceNoteDesc?: string;
  wishesTagline?: string;
  wishesTitle?: string;
  wishesIntroText?: string;
  giftTagline?: string;
  giftTitle?: string;
  giftIntroText?: string;
  giftBankName?: string;
  giftAccountHolder?: string;
  giftAccountNumber?: string;
  closingTitle?: string;
  closingMessage?: string;
  closingCouple?: string;
  closingDresscode?: string;
  closingNotes?: string;
  closingContact?: string;
  closingSkyline?: string;
}

export function JavaneseElegantInvitation({
  guestName = "Nama Tamu",
  theWeddingOf = "THE WEDDING OF",
  bismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  eventDate = "SABTU, 20 MARET 2027",
  venue = "Masjid Al-Ikhlas · Bandung",
  openButtonText = "BUKA UNDANGAN",
  heroImage = "",
  patternWashImage = "/templates/javanesse-elegant/pattern-wash.png",
  skylineImage = "/templates/javanesse-elegant/skyline.png",
  brideName = "Nara Ayu Pramesti",
  brideParents = "Putri kedua Bapak Hartono\n& Ibu Wulandari",
  groomName = "Dimas Adi Pratama",
  groomParents = "Putra pertama Bapak Slamet Widodo\n& Ibu Sri Rahayu",
  storyBertemu = "Kami dipertemukan dalam sebuah kajian di kampus. Dari obrolan sederhana, tumbuh rasa saling percaya hingga kami memantapkan niat untuk menyempurnakan separuh agama.",
  storyDekat = "Seiring berjalannya waktu dan restu kedua keluarga, kedekatan kami semakin bertumbuh dalam komitmen untuk saling melengkapi dan membimbing menuju ridha-Nya.",
  storyMelamar = "Dengan memohon doa restu orang tua dan bimbingan Allah SWT, niat suci kami diikat dalam prosesi lamaran hangat yang menjadi awal langkah menuju pelaminan.",
  akadTitle = "Akad Nikah",
  akadDate = "SABTU, 20 MARET 2027",
  akadTime = "08.00 – 10.00 WIB",
  akadVenue = "Masjid Al-Ikhlas",
  akadAddress = "Jl. Cendana No. 5, Bandung",
  resepsiTitle = "Resepsi",
  resepsiDate = "SABTU, 20 MARET 2027",
  resepsiTime = "11.00 – 14.00 WIB",
  resepsiVenue = "Gedung Serbaguna Al-Hidayah",
  resepsiAddress = "Jl. Cendana No. 9, Bandung",
  countdownTagline = "MENUJU HARI BAHAGIA",
  countdownTitle = "Hitung Mundur",
  rundownTagline = "RUNDOWN",
  rundownTitle = "Susunan Acara",
  rundownItems = [
    { time: "07.30", title: "Registrasi Tamu", desc: "Penerimaan tamu dan buku tamu" },
    { time: "08.00", title: "Akad Nikah", desc: "Ijab kabul di masjid" },
    { time: "10.00", title: "Sesi Foto", desc: "Foto bersama keluarga" },
    { time: "11.00", title: "Resepsi Dibuka", desc: "Penyambutan tamu undangan" },
    { time: "12.00", title: "Santap Siang", desc: "Hidangan dan ramah tamah" },
    { time: "14.00", title: "Doa Penutup", desc: "Acara selesai" },
  ],
  locationTagline = "LOKASI ACARA",
  locationTitle = "Peta Lokasi",
  locationVenue = "Masjid Al-Ikhlas",
  locationAddress = "Jl. Cendana No. 5, Bandung 40111",
  locationMapsUrl = "https://maps.google.com",
  galleryTagline = "GALERI",
  galleryTitle = "Momen Kami",
  galleryVideoUrl = "",
  galleryImages = [],
  rsvpTagline = "KONFIRMASI",
  rsvpTitle = "Konfirmasi Kehadiran",
  rsvpDeadline = "Mohon konfirmasi sebelum 10 Maret 2027",
  voiceNoteTagline = "FITUR TAMBAHAN",
  voiceNoteTitle = "Pesan Personal",
  voiceNoteDesc = "Tinggalkan ucapan dalam rekaman suara atau video singkat, maksimal 10 detik.",
  wishesTagline = "BUKU TAMU",
  wishesTitle = "Ucapan & Doa",
  wishesIntroText = "Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai.",
  giftTagline = "INFORMASI TAMBAHAN",
  giftTitle = "Kirim Hadiah",
  giftIntroText = "Kehadiran dan doa Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:",
  giftBankName = "BCA",
  giftAccountHolder = "Dimas Adi Pratama",
  giftAccountNumber = "1234 5678 90",
  closingTitle = "Jazakumullahu Khairan",
  closingMessage = "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.",
  closingCouple = "Nara & Dimas",
  closingDresscode = "Dresscode: Sage & Ivory",
  closingNotes = "Mohon hadir 15 menit sebelum acara dimulai.",
  closingContact = "Kontak panitia: 0812-3456-7890",
  closingSkyline = "/templates/javanesse-elegant/skyline.png",
}: JavaneseElegantInvitationProps) {
  // State for opening invitation
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Story tab state ("bertemu" | "dekat" | "melamar")
  const [activeStoryTab, setActiveStoryTab] = useState<"bertemu" | "dekat" | "melamar">("bertemu");

  // Voice note tab state ("suara" | "video") & recording state
  const [voiceTab, setVoiceTab] = useState<"suara" | "video">("suara");
  const [isRecording, setIsRecording] = useState(false);

  // Form states
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpWhatsapp, setRsvpWhatsapp] = useState("");
  const [rsvpGuests, setRsvpGuests] = useState("1");
  const [rsvpStatus, setRsvpStatus] = useState<"hadir" | "tidak">("hadir");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Wishes state
  const [wishName, setWishName] = useState("");
  const [wishMsg, setWishMsg] = useState("");
  const [wishesList, setWishesList] = useState([
    {
      name: "Bu Retno",
      message: "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair.",
    },
    {
      name: "Mas Dimas",
      message: "Semoga sakinah, mawaddah, warahmah selalu ya!",
    },
  ]);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Countdown timer (20 Maret 2027)
  const [timeLeft, setTimeLeft] = useState({ days: 120, hours: 14, minutes: 22, seconds: 40 });

  useEffect(() => {
    const targetDate = new Date("2027-03-20T08:00:00+07:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle open invitation
  const handleOpenInvitation = () => {
    setIsOpen(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setTimeout(() => {
      document.getElementById("section-opening")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpSuccess(true);
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMsg.trim()) return;
    setWishesList((prev) => [{ name: wishName.trim().toUpperCase(), message: wishMsg.trim() }, ...prev]);
    setWishName("");
    setWishMsg("");
    setWishSuccess(true);
    setTimeout(() => setWishSuccess(false), 4000);
  };

  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(id);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const openGoogleCalendar = (
    title: string,
    dateStart: string,
    dateEnd: string,
    location: string
  ) => {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dateStart}/${dateEnd}&details=${encodeURIComponent(
      "Undangan Pernikahan Nara & Dimas"
    )}&location=${encodeURIComponent(location)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="relative w-full max-w-[390px] mx-auto min-h-screen bg-[#243320] text-[#f8f5ec] shadow-2xl selection:bg-[#c5a059] selection:text-[#1e2918] overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background audio element */}
      <audio ref={audioRef} loop src="/templates/wedding/audio-placeholder.mp3" preload="none" />

      {/* Floating Music Button */}
      <button
        type="button"
        onClick={toggleAudio}
        aria-label="Toggle musik latar"
        className={`fixed top-4 right-4 z-50 w-8 h-8 rounded-full border border-[#b8913e] bg-[#1e2918]/60 backdrop-blur-xs flex items-center justify-center text-[#b8913e] shadow-lg transition-transform ${
          isPlaying ? "animate-spin" : ""
        }`}
        style={{ animationDuration: "6s" }}
      >
        <span className="text-xs select-none">♪</span>
      </button>

      {/* 1. COVER / HERO SECTION - Ref Image: 390x780 px */}
      <section
        id="section-cover"
        className="relative min-h-[780px] w-full flex flex-col justify-between items-center text-center px-4 pt-3 pb-0 bg-[#243320] text-[#f8f5ec] overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Top Pattern Wash Asset (390 x 330 px) */}
        <div className="absolute top-0 left-0 w-full h-[330px] pointer-events-none select-none z-0 overflow-hidden">
          <img
            src={patternWashImage}
            alt="Islamic Pattern Wash"
            className="w-full h-full object-cover object-top block opacity-95"
          />
        </div>

        {/* Top Islamic Geometric Pattern Strip */}
        <div className="relative z-10 w-full opacity-90">
          <JavaneseTopBorder />
        </div>

        {/* Header symbols & Basmalah */}
        <div className="flex flex-col items-center mt-1 z-10">
          {/* Crescent & 8-Pointed Star (Gold) */}
          <div className="flex items-center space-x-1.5 text-[#b8913e] mb-1 opacity-95">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#b8913e" className="text-[#b8913e]">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.31 0 4.43-.79 6.13-2.12-5.46-.35-9.8-4.88-9.8-10.42 0-3.32 1.57-6.28 4-8.15C13.52 2.11 12.77 2 12 2z" />
            </svg>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="#b8913e">
              <rect x="4" y="4" width="12" height="12" />
              <rect x="4" y="4" width="12" height="12" transform="rotate(45 10 10)" />
            </svg>
          </div>

          {/* Arabic Basmalah (Font: Amiri) */}
          <p
            className="text-xl sm:text-2xl text-[#f8f4e8] tracking-normal mb-1 font-normal select-none"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {bismillah}
          </p>

          {/* Small Caps Tagline */}
          <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-[#b8913e] font-semibold font-sans">
            {theWeddingOf}
          </p>
        </div>

        {/* Pointed Dome Arch Photo Frame (210 x 260 px) */}
        <div className="relative my-2 z-10 w-[210px] h-[260px] flex items-center justify-center">
          {/* Double Gold Line SVG Outline */}
          <svg
            viewBox="0 0 210 260"
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            fill="none"
          >
            {/* Outer Border */}
            <path
              d="M 2 258 L 2 120 C 2 60 55 18 105 2 C 155 18 208 60 208 120 L 208 258 Z"
              stroke="#b8913e"
              strokeWidth="1.5"
            />
            {/* Inner Border */}
            <path
              d="M 7 253 L 7 122 C 7 65 57 23 105 7 C 153 23 203 65 203 122 L 203 253 Z"
              stroke="#b8913e"
              strokeWidth="1"
              strokeOpacity="0.75"
            />
          </svg>

          {/* Inside Content with Clipped Path */}
          <div
            className="relative w-full h-full overflow-hidden flex items-center justify-center z-10"
            style={{
              clipPath:
                "path('M 2 258 L 2 120 C 2 60 55 18 105 2 C 155 18 208 60 208 120 L 208 258 Z')",
            }}
          >
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Foto Pasangan"
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center text-[#e4e9d3]/70 p-4"
                style={{
                  background: "linear-gradient(180deg, #5b6b44 0%, #293825 100%)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 stroke-[#b8913e] fill-none opacity-80 mb-1"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span
                  className="text-xs text-[#e4e9d3] mt-1"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  Nara &amp; Dimas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Couple Names (Amiri Font) */}
        <div className="z-10 mt-1">
          <h1
            className="text-3xl sm:text-[38px] font-bold text-white tracking-wide leading-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Nara <span className="text-[#b8913e] font-normal italic">&amp;</span> Dimas
          </h1>

          {/* Event Date */}
          <p className="text-xs sm:text-[12px] font-semibold tracking-[0.2em] text-[#b8913e] uppercase mt-1.5 font-sans">
            {eventDate}
          </p>

          {/* Venue Location */}
          <p className="text-xs text-[#e4e9d3] mt-1 font-sans">
            {venue}
          </p>
        </div>

        {/* Guest Badge (Capsule / Pill) */}
        <div className="z-10 mt-3 w-full max-w-[270px]">
          <div className="rounded-full py-2 px-5 border border-[#b8913e] bg-[#1e2918]/70 backdrop-blur-xs text-center shadow-xs">
            <p className="text-[10px] text-[#b8913e] font-sans font-medium">
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p
              className="text-sm font-bold text-[#f8f5ec] mt-0.5"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {guestName}
            </p>
          </div>
        </div>

        {/* Button "BUKA UNDANGAN" */}
        <div className="z-10 mt-3 mb-2">
          <button
            type="button"
            onClick={handleOpenInvitation}
            className="rounded-full py-3 px-8 bg-[#b8913e] hover:bg-[#a68032] text-[#2f3b22] font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all w-[210px] flex items-center justify-center cursor-pointer font-sans"
          >
            {openButtonText}
          </button>
        </div>

        {/* Mosque Skyline Asset at bottom (390 x 120 px) */}
        <div className="w-full mt-auto relative z-10 pointer-events-none select-none">
          <img
            src={skylineImage}
            alt="Skyline Masjid"
            className="w-full h-[120px] object-cover object-top block"
          />
        </div>
      </section>

<section
        id="section-opening"
        className="relative min-h-[521px] w-full flex flex-col justify-between items-center text-center px-4 pt-4 pb-8 bg-[#273422]"
      >
        {/* Top Islamic Geometric Pattern */}
        <JavaneseTopBorder />

        <div className="w-full flex flex-col items-center my-auto">
          {/* Arabic Basmalah (Font: Amiri) */}
          <p
            className="text-2xl sm:text-3xl text-[#c5a059] tracking-normal mb-1 font-normal select-none"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          {/* 8-pointed star divider */}
          <JavaneseStarDivider color="#c5a059" />

          {/* Greeting Heading (Font: Amiri) */}
          <h2
            className="text-xl sm:text-[24px] font-bold text-[#c5a059] leading-snug mt-2 mb-2"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Assalamu&apos;alaikum<br />Warahmatullahi Wabarakatuh
          </h2>

          {/* Body invitation text (Font: Inter) */}
          <p className="text-xs sm:text-[13px] text-[#f8f5ec] leading-relaxed max-w-[310px] mx-auto text-center mt-2 mb-6 font-sans font-normal opacity-95">
            Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami.
          </p>

          {/* Large Oval/Capsule Guest Box (Matches Ref 3: #e5e8db) */}
          <div className="w-full max-w-[290px] rounded-[38px] bg-[#e4e9d3] px-7 py-5 text-center shadow-md border border-[#c5a059]/40">
            <p className="text-[11px] text-[#4a5843] font-sans font-medium">
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p
              className="text-xl sm:text-2xl font-bold text-[#1d2719] mt-1"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {guestName}
            </p>
            <p className="text-xs text-[#4a5843] italic mt-1 font-sans">
              di tempat
            </p>
          </div>
        </div>
      </section>

<section
        id="section-about"
        className="relative min-h-[514px] w-full flex flex-col justify-between items-center text-center px-4 pt-8 pb-8 bg-[#dce3d2] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          {/* Tagline Small Caps (Font: Inter) */}
          <p className="text-[11px] tracking-[0.25em] font-bold uppercase text-[#a6833b] font-sans">
            TENTANG ACARA
          </p>

          {/* Heading (Font: Amiri) */}
          <h2
            className="text-2xl sm:text-[28px] font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Pernikahan Nara &amp; Dimas
          </h2>

          {/* Star Divider in Gold */}
          <JavaneseStarDivider color="#a6833b" />

          {/* Quote Card (Matches Ref 4: Rounded-2xl White Card with Gold Border) */}
          <div className="w-full max-w-[335px] rounded-[22px] bg-white border border-[#c5a059] p-6 shadow-sm text-center mt-3">
            <p
              className="text-xs sm:text-[13px] text-[#273422] leading-relaxed italic"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.&rdquo;
            </p>
            <p className="text-[11px] font-bold tracking-wider uppercase text-[#a6833b] mt-4 font-sans">
              QS. Ar-Rum: 21
            </p>
          </div>

          {/* Two Pill Badges Side-by-Side (Matches Ref 4) */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <div className="rounded-full px-4 py-2 border border-[#4a5843] bg-[#dce3d2] text-[#273422] text-xs font-medium font-sans">
              Akad di masjid
            </div>
            <div className="rounded-full px-4 py-2 border border-[#4a5843] bg-[#dce3d2] text-[#273422] text-xs font-medium font-sans">
              Dresscode: Sage &amp; Ivory
            </div>
          </div>
        </div>
      </section>

<section
        id="section-couple"
        className="relative min-h-[1136px] w-full flex flex-col justify-between items-center text-center px-4 py-12 bg-[#f8f4e8] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            MEMPELAI
          </p>
          <h2
            className="text-3xl font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Kedua Mempelai
          </h2>
          <JavaneseStarDivider color="#a6833b" />

          {/* Mempelai Wanita (Nara) */}
          <div className="flex flex-col items-center mt-4">
            <JavanesePointedArchFrame width={196} height={290}>
              <div className="w-full h-full flex flex-col items-center justify-center text-[#c5a059]">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none opacity-60" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </JavanesePointedArchFrame>

            <h3
              className="text-2xl font-bold text-[#1d2a1b] mt-3.5"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {brideName}
            </h3>
            <div className="text-xs text-[#55664d] mt-1.5 leading-relaxed font-sans">
              {brideParents.split("\n").map((line: string, idx: number) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>

          {/* Ampersand Divider */}
          <div className="my-4 select-none">
            <span
              className="text-3xl text-[#b8913e] italic font-normal inline-block"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              &amp;
            </span>
          </div>

          {/* Mempelai Pria (Dimas) */}
          <div className="flex flex-col items-center">
            <JavanesePointedArchFrame width={196} height={290}>
              <div className="w-full h-full flex flex-col items-center justify-center text-[#c5a059]">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none opacity-60" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </JavanesePointedArchFrame>

            <h3
              className="text-2xl font-bold text-[#1d2a1b] mt-3.5"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {groomName}
            </h3>
            <div className="text-xs text-[#55664d] mt-1.5 leading-relaxed font-sans">
              {groomParents.split("\n").map((line: string, idx: number) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

<section
        id="section-story"
        className="relative min-h-[451px] w-full flex flex-col justify-between items-center text-center px-4 py-8 bg-[#e4e9d3] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            PERJALANAN KAMI
          </p>
          <h2
            className="text-3xl font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Kisah Kami
          </h2>
          <JavaneseStarDivider color="#a6833b" />

          {/* 3 Interactive Story Tabs */}
          <div className="flex items-center justify-center gap-2.5 my-3.5 font-sans">
            <button
              type="button"
              onClick={() => setActiveStoryTab("bertemu")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeStoryTab === "bertemu"
                  ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                  : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22] hover:bg-[#d8dfcc]"
              }`}
            >
              Bertemu
            </button>
            <button
              type="button"
              onClick={() => setActiveStoryTab("dekat")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeStoryTab === "dekat"
                  ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                  : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22] hover:bg-[#d8dfcc]"
              }`}
            >
              Dekat
            </button>
            <button
              type="button"
              onClick={() => setActiveStoryTab("melamar")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeStoryTab === "melamar"
                  ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                  : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22] hover:bg-[#d8dfcc]"
              }`}
            >
              Melamar
            </button>
          </div>

          {/* White Card Box with Gold Border */}
          <div className="w-full max-w-[342px] rounded-[24px] bg-white border border-[#b8913e] p-6 shadow-sm text-center">
            <p
              className="text-xs sm:text-[13px] text-[#273422] leading-relaxed italic"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {activeStoryTab === "bertemu"
                ? storyBertemu
                : activeStoryTab === "dekat"
                ? storyDekat
                : storyMelamar}
            </p>
          </div>
        </div>
      </section>

<section
        id="section-events"
        className="relative min-h-[801px] w-full flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#c5a059] font-bold font-sans">
            DETAIL ACARA
          </p>
          <h2
            className="text-3xl font-bold text-[#f8f5ec] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            Waktu &amp; Tempat
          </h2>
          <JavaneseStarDivider color="#c5a059" />

          <div className="w-full max-w-[342px] space-y-4 mt-3">
            {/* Card 1: Akad Nikah */}
            <div className="bg-[#5b6b3a] border border-[#b8913e] rounded-[24px] p-6 text-center shadow-md">
              <h3
                className="text-2xl font-bold text-[#e0c27d]"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {akadTitle}
              </h3>
              <p className="text-xs font-bold text-white tracking-[0.15em] uppercase mt-2.5 font-sans">
                {akadDate}
              </p>
              <p className="text-xs text-[#e4e9d3] mt-1 font-sans">
                {akadTime}
              </p>
              <p className="text-xs text-[#e4e9d3] mt-2.5 font-sans font-medium">
                {akadVenue}
              </p>
              <p className="text-xs text-[#d4dcc9] italic mt-0.5 font-sans">
                {akadAddress}
              </p>

              <div className="flex items-center justify-center gap-2.5 mt-5 font-sans">
                <button
                  type="button"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(akadVenue + " " + akadAddress)}`, "_blank")}
                  className="rounded-full py-2.5 px-6 bg-[#b8913e] hover:bg-[#a68032] text-[#1e2918] font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Buka Peta
                </button>
                <button
                  type="button"
                  onClick={() => openGoogleCalendar(akadTitle, "20270320T010000Z", "20270320T030000Z", akadVenue + ", " + akadAddress)}
                  className="rounded-full py-2.5 px-5 bg-transparent hover:bg-white/10 border border-[#b8913e] text-[#e4e9d3] font-bold text-xs transition-all cursor-pointer"
                >
                  Simpan Kalender
                </button>
              </div>
            </div>

            {/* Card 2: Resepsi */}
            <div className="bg-[#5b6b3a] border border-[#b8913e] rounded-[24px] p-6 text-center shadow-md">
              <h3
                className="text-2xl font-bold text-[#e0c27d]"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {resepsiTitle}
              </h3>
              <p className="text-xs font-bold text-white tracking-[0.15em] uppercase mt-2.5 font-sans">
                {resepsiDate}
              </p>
              <p className="text-xs text-[#e4e9d3] mt-1 font-sans">
                {resepsiTime}
              </p>
              <p className="text-xs text-[#e4e9d3] mt-2.5 font-sans font-medium">
                {resepsiVenue}
              </p>
              <p className="text-xs text-[#d4dcc9] italic mt-0.5 font-sans">
                {resepsiAddress}
              </p>

              <div className="flex items-center justify-center gap-2.5 mt-5 font-sans">
                <button
                  type="button"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(resepsiVenue + " " + resepsiAddress)}`, "_blank")}
                  className="rounded-full py-2.5 px-6 bg-[#b8913e] hover:bg-[#a68032] text-[#1e2918] font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Buka Peta
                </button>
                <button
                  type="button"
                  onClick={() => openGoogleCalendar(resepsiTitle, "20270320T040000Z", "20270320T070000Z", resepsiVenue + ", " + resepsiAddress)}
                  className="rounded-full py-2.5 px-5 bg-transparent hover:bg-white/10 border border-[#b8913e] text-[#e4e9d3] font-bold text-xs transition-all cursor-pointer"
                >
                  Simpan Kalender
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

<section
        id="section-countdown"
        className="relative min-h-[305px] w-full flex flex-col justify-center items-center text-center px-4 py-8 bg-[#f8f4e8] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            {countdownTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#2f3b22] mt-1 mb-4 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {countdownTitle}
          </h2>

          <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-1">
            {/* Hari */}
            <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
              <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-medium text-[#f8f4e8] mt-1 font-sans">
                Hari
              </span>
            </div>
            {/* Jam */}
            <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
              <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-medium text-[#f8f4e8] mt-1 font-sans">
                Jam
              </span>
            </div>
            {/* Menit */}
            <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
              <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-medium text-[#f8f4e8] mt-1 font-sans">
                Menit
              </span>
            </div>
            {/* Detik */}
            <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
              <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-medium text-[#f8f4e8] mt-1 font-sans">
                Detik
              </span>
            </div>
          </div>
        </div>
      </section>

<section
        id="section-rundown"
        className="relative min-h-[645px] w-full flex flex-col justify-between items-center text-center px-4 py-10 bg-[#e4e9d3] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            {rundownTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {rundownTitle}
          </h2>
          <JavaneseStarDivider color="#a6833b" />

          {/* Timeline List */}
          <div className="w-full max-w-[342px] mt-6 relative text-left">
            {/* Continuous Vertical Line precisely at x=107px (offset by 92px in container) */}
            <div className="absolute left-[92px] top-3 bottom-5 w-[1.5px] bg-[#c9b275]" />

            <div className="space-y-6">
              {rundownItems.map((item: any, idx: number) => (
                <div key={idx} className="relative flex items-start">
                  {/* Time Column (Left) */}
                  <div className="w-[82px] pr-3 text-right shrink-0">
                    <span
                      className="text-lg font-bold text-[#2f3b22] tracking-wide inline-block"
                      style={{ fontFamily: "'Amiri', serif" }}
                    >
                      {item.time}
                    </span>
                  </div>

                  {/* Diamond Marker (Center on Line) */}
                  <div className="relative z-10 flex items-center justify-center w-[20px] pt-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 bg-[#b8913e] rotate-45 shadow-xs" />
                  </div>

                  {/* Event Details (Right) */}
                  <div className="flex-1 pl-3 pt-0.5">
                    <h4
                      className="text-base sm:text-[17px] font-bold text-[#2f3b22] leading-tight"
                      style={{ fontFamily: "'Amiri', serif" }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#55664d] mt-1 font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. PETA LOKASI SECTION (Matches Ref: 390 x 645 Ratio)          */}
      {/* ============================================================== */}
      <section
        id="section-location"
        className="relative min-h-[645px] w-full flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold font-sans">
            {locationTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#f8f4e8] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {locationTitle}
          </h2>
          <JavaneseStarDivider color="#b8913e" />

          {/* Venue & Address */}
          <div className="mt-2 mb-3 text-center">
            <h3
              className="text-lg font-bold text-[#f8f4e8]"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {locationVenue}
            </h3>
            <p className="text-xs text-[#e4e9d3] mt-1 font-sans max-w-[280px] mx-auto leading-relaxed">
              {locationAddress}
            </p>
          </div>

          {/* Stylized Map Card (Matches Exact Reference) */}
          <div className="w-full max-w-[342px] h-[240px] rounded-2xl overflow-hidden border border-[#b8913e] relative shadow-md bg-[#e7e9d6] my-2 select-none">
            <svg
              viewBox="0 0 342 240"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background */}
              <rect width="342" height="240" fill="#e7e9d6" />

              {/* Park green zone on upper right */}
              <rect x="215" y="40" width="90" height="60" rx="16" fill="#ccd6ac" />

              {/* River light blue stream curving through lower section */}
              <path
                d="M 0 165 C 80 165, 120 148, 180 148 C 240 148, 280 138, 342 138 L 342 172 C 280 172, 240 182, 180 182 C 120 182, 80 198, 0 198 Z"
                fill="#b4cbdb"
              />

              {/* Grid of streets (soft white lines) */}
              <line x1="60" y1="0" x2="72" y2="240" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
              <line x1="245" y1="0" x2="260" y2="240" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
              <line x1="0" y1="65" x2="210" y2="52" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
              <line x1="0" y1="130" x2="342" y2="108" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
              <line x1="185" y1="130" x2="315" y2="190" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />

              {/* Main wide street passing under pin */}
              <line x1="120" y1="0" x2="158" y2="240" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />

              {/* Shadow under Map Pin */}
              <ellipse cx="145" cy="142" rx="10" ry="4" fill="#000000" fillOpacity="0.2" />

              {/* Teardrop Map Pin */}
              <g transform="translate(145, 115)">
                <path
                  d="M 0 -38 C -14 -38, -25 -27, -25 -13 C -25 5, 0 25, 0 25 C 0 25, 25 5, 25 -13 C 25 -27, 14 -38, 0 -38 Z"
                  fill="#b8913e"
                  stroke="#2f3b22"
                  strokeWidth="1.5"
                />
                <circle cx="0" cy="-13" r="5.5" fill="#2f3b22" />
              </g>

              {/* Callout Tooltip Badge next to pin */}
              <g transform="translate(175, 92)">
                <rect x="0" y="0" width="94" height="26" rx="13" fill="#ffffff" stroke="#b8913e" strokeWidth="1" />
                <text
                  x="47"
                  y="17"
                  fill="#2f3b22"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="'Inter', sans-serif"
                >
                  {locationVenue}
                </text>
              </g>
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col items-center mt-3 space-y-2.5">
            {/* Button 1: Solid Gold */}
            <a
              href={locationMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[300px] h-[46px] rounded-full bg-[#b8913e] hover:bg-[#a68032] text-[#2f3b22] font-semibold text-xs flex items-center justify-center shadow-md transition-all font-sans cursor-pointer"
            >
              Buka di Google Maps
            </a>

            {/* Button 2: Outline Gold */}
            <button
              type="button"
              onClick={() => copyToClipboard(locationAddress, "location-address")}
              className="w-full max-w-[300px] h-[46px] rounded-full bg-transparent border border-[#b8913e] hover:bg-[#b8913e]/10 text-[#e3cb8b] font-semibold text-xs flex items-center justify-center transition-all font-sans cursor-pointer"
            >
              {copiedBank === "location-address" ? "Alamat Berhasil Disalin ✓" : "Salin Alamat"}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. GALERI MOMEN KAMI (Matches Ref: 337 x 1024 Ratio)          */}
      {/* ============================================================== */}
      <section
        id="section-gallery"
        className="relative min-h-[1100px] w-full flex flex-col justify-between items-center text-center px-4 py-10 bg-[#f8f4e8] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            {galleryTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {galleryTitle}
          </h2>
          <JavaneseStarDivider color="#a6833b" />

          {/* Video Dokumentasi Card */}
          <div className="w-full max-w-[342px] h-[155px] rounded-2xl overflow-hidden relative border border-[#a6833b]/60 shadow-md flex flex-col items-center justify-center my-3 bg-gradient-to-b from-[#64744d] via-[#4d5c38] to-[#28351e] group select-none">
            {/* Play Button */}
            <a
              href={galleryVideoUrl || "#"}
              target={galleryVideoUrl ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-label="Putar video dokumentasi"
              className="w-14 h-14 rounded-full border border-[#d4b97a] bg-[#1e2918]/60 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform cursor-pointer"
            >
              <svg className="w-5 h-5 text-[#d4b97a] fill-current ml-0.5" viewBox="0 0 24 24">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            </a>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e3cb8b] uppercase mt-3 font-sans">
              VIDEO DOKUMENTASI
            </p>
          </div>

          {/* 6 Arched Pointed Dome Photo Frames Grid */}
          <div className="w-full max-w-[342px] mx-auto grid grid-cols-2 gap-3.5 mt-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <JavaneseGalleryPointedArchFrame
                key={idx}
                src={galleryImages[idx]}
                alt={`Momen Kami ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 11. RSVP / KONFIRMASI KEHADIRAN (Matches Ref: 390 x 530 Ratio) */}
      {/* ============================================================== */}
      <section
        id="section-rsvp"
        className="relative min-h-[530px] w-full flex flex-col justify-between items-center text-center px-4 py-8 bg-[#e4e9d3] text-[#1d2a1b]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold font-sans">
            {rsvpTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {rsvpTitle}
          </h2>
          <p
            className="text-[13px] text-[#55664d] italic mt-2 mb-4 font-normal"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {rsvpDeadline}
          </p>

          {/* Form Card (White with gold border) */}
          <form
            onSubmit={handleRsvpSubmit}
            className="w-full max-w-[342px] rounded-[24px] bg-white border border-[#b8913e] p-6 shadow-sm select-none"
          >
            {/* Field: Nama */}
            <div className="text-center">
              <label className="text-[11px] font-bold tracking-[0.2em] text-[#2f3b22] uppercase block mb-2 font-sans">
                NAMA
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full rounded-2xl border border-[#55664d]/60 px-4 py-2.5 text-center text-xs text-[#2f3b22] placeholder-[#889980] focus:outline-none focus:border-[#b8913e] font-sans"
              />
            </div>

            {/* Attendance Toggle: Hadir / Tidak Hadir */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setRsvpStatus("hadir")}
                className={`py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer font-sans ${
                  rsvpStatus === "hadir"
                    ? "bg-[#b8913e] text-[#2f3b22] shadow-xs"
                    : "bg-white border border-[#55664d] text-[#2f3b22]"
                }`}
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => setRsvpStatus("tidak")}
                className={`py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer font-sans ${
                  rsvpStatus === "tidak"
                    ? "bg-[#b8913e] text-[#2f3b22] shadow-xs"
                    : "bg-white border border-[#55664d] text-[#2f3b22]"
                }`}
              >
                Tidak Hadir
              </button>
            </div>

            {/* Field: Jumlah Tamu */}
            <div className="text-center mt-4">
              <label className="text-[11px] font-bold tracking-[0.2em] text-[#2f3b22] uppercase block mb-2 font-sans">
                JUMLAH TAMU
              </label>
              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(rsvpGuests, 10) || 1;
                    if (current > 1) setRsvpGuests(String(current - 1));
                  }}
                  className="w-8 h-8 rounded-full border border-[#55664d] flex items-center justify-center text-sm text-[#2f3b22] hover:bg-zinc-100 transition-colors cursor-pointer font-sans"
                >
                  −
                </button>
                <span
                  className="text-2xl font-bold italic text-[#2f3b22] w-8 text-center"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  {rsvpGuests}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(rsvpGuests, 10) || 1;
                    if (current < 10) setRsvpGuests(String(current + 1));
                  }}
                  className="w-8 h-8 rounded-full border border-[#55664d] flex items-center justify-center text-sm text-[#2f3b22] hover:bg-zinc-100 transition-colors cursor-pointer font-sans"
                >
                  +
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-[46px] rounded-full bg-[#b8913e] hover:bg-[#a68032] text-[#2f3b22] font-semibold text-xs flex items-center justify-center shadow-md transition-all font-sans cursor-pointer mt-5"
            >
              Kirim Konfirmasi
            </button>

            {rsvpSuccess && (
              <p className="text-[11px] text-emerald-800 text-center font-bold mt-2 font-sans">
                ✓ Konfirmasi kehadiran Anda berhasil terkirim!
              </p>
            )}
          </form>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 12. PESAN PERSONAL / VOICE NOTE (Matches Ref: 390 x 744 Ratio) */}
      {/* ============================================================== */}
      <section
        id="section-voice-note"
        className="relative min-h-[744px] w-full flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec]"
      >
        <div className="w-full flex flex-col items-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold font-sans">
            {voiceNoteTagline}
          </p>
          <h2
            className="text-3xl font-bold text-[#f8f4e8] mt-1 mb-1 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {voiceNoteTitle}
          </h2>
          <JavaneseStarDivider color="#b8913e" />

          <p className="text-xs text-[#e4e9d3] max-w-[280px] mx-auto text-center leading-relaxed mt-1 font-sans">
            {voiceNoteDesc}
          </p>

          {/* Badge */}
          <div className="inline-block mt-3 px-4 py-1 rounded-full border border-[#957b37] bg-[#232d19] text-[11px] font-semibold text-[#b8913e] select-none font-sans">
            Terbuka setelah RSVP dikirim
          </div>

          {/* Main Recorder Card */}
          <div className="w-full max-w-[342px] min-h-[460px] rounded-[24px] bg-[#566638] border border-[#957b37] p-6 flex flex-col items-center justify-between text-center relative shadow-lg mt-4 select-none">
            {/* Pill Capsule Toggle (Suara / Video) */}
            <div className="w-[220px] h-[38px] rounded-full border border-[#957b37] bg-transparent p-0.5 flex items-center font-sans">
              <button
                type="button"
                onClick={() => setVoiceTab("suara")}
                className={`w-[110px] h-full rounded-full font-semibold text-xs flex items-center justify-center transition-all cursor-pointer ${
                  voiceTab === "suara"
                    ? "bg-[#b8913e] text-[#2f3b22] shadow-xs"
                    : "bg-transparent text-[#e3cb8b]"
                }`}
              >
                Suara
              </button>
              <button
                type="button"
                onClick={() => setVoiceTab("video")}
                className={`flex-1 h-full rounded-full font-semibold text-xs flex items-center justify-center transition-all cursor-pointer ${
                  voiceTab === "video"
                    ? "bg-[#b8913e] text-[#2f3b22] shadow-xs"
                    : "bg-transparent text-[#e3cb8b]"
                }`}
              >
                Video
              </button>
            </div>

            {/* Mic Record Button */}
            <div className="my-5 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsRecording((prev) => !prev)}
                className={`w-24 h-24 rounded-full border-2 border-[#b8913e] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform bg-[#5b6b3a]/50 shadow-inner ${
                  isRecording ? "animate-pulse ring-4 ring-[#b8913e]/40" : ""
                }`}
                aria-label="Rekam pesan"
              >
                <svg
                  className="w-8 h-8 text-[#b8913e] fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>

              {/* Timer */}
              <div
                className="text-4xl font-bold text-white tracking-widest mt-4"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {isRecording ? "00:08" : "00:10"}
              </div>

              {/* Waveform Dots */}
              <div className="flex items-center justify-center space-x-1.5 mt-4">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 h-1 rounded-full ${
                      isRecording && i < 6 ? "bg-white" : "bg-[#b8913e]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center font-sans">
              <p className="text-xs text-[#f8f5ec]">
                {isRecording ? "Sedang merekam... Ketuk untuk berhenti." : "Ketuk untuk mulai merekam."}
              </p>
              <p className="text-xs text-[#e4e9d3]/80 mt-0.5">
                Browser akan meminta izin mikrofon.
              </p>

              {/* Link to Text Message */}
              <button
                type="button"
                onClick={() => {
                  document.getElementById("section-wishes")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="block text-xs italic text-[#e3cb8b] hover:text-white underline cursor-pointer mt-3 mx-auto transition-colors font-sans"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                Lebih suka mengetik? Tulis pesan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. UCAPAN & DOA (BUKU TAMU) - Ref Image: 390x696 px */}
      <section
        id="section-wishes"
        className="relative min-h-[696px] w-full flex flex-col items-center text-center px-4 pt-12 pb-10 bg-[#f8f4e8] text-[#2f3b22]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full flex flex-col items-center">
          {/* Small Caps Tagline */}
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold font-sans">
            {wishesTagline}
          </p>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-[34px] font-bold text-[#2f3b22] mt-1 mb-2 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {wishesTitle}
          </h2>

          <JavaneseStarDivider color="#b8913e" />

          {/* Form Card (Sage Green Background #e4e9d3) */}
          <form
            onSubmit={handleWishSubmit}
            className="w-full max-w-[340px] bg-[#e4e9d3] rounded-[24px] p-5 text-left space-y-4 shadow-xs font-sans mt-5"
          >
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#2f3b22] uppercase block mb-1.5">
                NAMA
              </label>
              <input
                type="text"
                required
                placeholder="Nama"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                className="w-full rounded-[14px] bg-white border border-[#bfc8a5] px-4 py-2.5 text-xs text-[#2f3b22] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#b8913e]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#2f3b22] uppercase block mb-1.5">
                UCAPAN
              </label>
              <textarea
                rows={3}
                required
                placeholder="Tulis ucapan untuk kedua mempelai"
                value={wishMsg}
                onChange={(e) => setWishMsg(e.target.value)}
                className="w-full rounded-[14px] bg-white border border-[#bfc8a5] px-4 py-2.5 text-xs text-[#2f3b22] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#b8913e] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[#b8913e] hover:bg-[#a68032] text-[#2f3b22] py-3 text-xs font-semibold tracking-wide uppercase shadow-xs transition-all cursor-pointer"
            >
              Kirim Ucapan
            </button>

            {wishSuccess && (
              <p className="text-[11px] text-emerald-800 text-center font-bold">
                ✓ Ucapan Anda telah terkirim!
              </p>
            )}
          </form>

          {/* List of Wishes (Vertical Gold Line Accent) */}
          <div className="w-full max-w-[340px] mt-6 space-y-4 text-left font-sans">
            {wishesList.map((w, idx) => (
              <div
                key={idx}
                className="border-l-2 border-[#b8913e] pl-3 py-0.5 text-left"
              >
                <h4
                  className="text-sm font-bold text-[#2f3b22] leading-tight"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  {w.name}
                </h4>
                <p className="text-xs text-[#5b6b3a] mt-0.5 leading-relaxed font-sans">
                  {w.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. KIRIM HADIAH / DIGITAL GIFT - Ref Image: 390x535 px */}
      <section
        id="section-gift"
        className="relative min-h-[535px] w-full flex flex-col items-center text-center px-4 pt-12 pb-10 bg-[#ede6d2] text-[#2f3b22]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full flex flex-col items-center">
          {/* Small Caps Tagline */}
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-medium font-sans">
            {giftTagline}
          </p>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-[34px] font-bold text-[#2f3b22] mt-1 mb-2 tracking-tight"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {giftTitle}
          </h2>

          <JavaneseStarDivider color="#b8913e" />

          {/* Description */}
          <p className="text-xs text-[#22281a] max-w-[290px] mx-auto text-center leading-relaxed mt-4 mb-6 font-sans whitespace-pre-line">
            {giftIntroText}
          </p>

          {/* Main Dark Green Gift Card (#2f3b22) */}
          <div className="w-full max-w-[340px] rounded-[24px] bg-[#2f3b22] p-6 text-center shadow-md font-sans">
            <p className="text-xs text-[#e4e9d3] font-normal tracking-wide">
              {giftBankName} a.n {giftAccountHolder}
            </p>

            <div
              className="text-3xl font-bold text-[#e3cb8b] tracking-widest my-4 select-all"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {giftAccountNumber}
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(giftAccountNumber.replace(/\s+/g, ""), "main")}
              className="mx-auto rounded-full bg-[#b8913e] hover:bg-[#a68032] text-[#2f3b22] px-8 py-2.5 text-xs font-semibold tracking-normal shadow-xs transition-all cursor-pointer flex items-center justify-center"
            >
              {copiedBank === "main" ? "✓ Tersalin!" : "Salin Nomor Rekening"}
            </button>
          </div>
        </div>
      </section>

      {/* 14. PENUTUP / CLOSING - Ref Image: 390x656 px */}
      <section
        id="section-closing"
        className="relative min-h-[656px] w-full flex flex-col justify-between items-center text-center px-4 pt-12 pb-0 bg-[#2f3b22] text-[#f8f4e8] overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full flex flex-col items-center z-20">
          {/* Main Title (Amiri Font, Light Gold) */}
          <h2
            className="text-3xl sm:text-[34px] font-bold text-[#e3cb8b] tracking-wide mb-2"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {closingTitle}
          </h2>

          <JavaneseStarDivider color="#b8913e" />

          {/* Closing Message */}
          <p className="text-xs text-[#e4e9d3] max-w-[290px] mx-auto leading-relaxed mt-3 mb-4 font-sans whitespace-pre-line text-center">
            {closingMessage}
          </p>

          {/* Couple Names */}
          <h3
            className="text-3xl font-bold text-[#f8f4e8] tracking-wide my-3"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {closingCouple.includes("&") ? (
              <>
                {closingCouple.split("&")[0].trim()}{" "}
                <span className="text-[#b8913e] font-normal italic">&amp;</span>{" "}
                {closingCouple.split("&")[1].trim()}
              </>
            ) : (
              closingCouple
            )}
          </h3>

          {/* Information Card (Border Gold, Rounded 20px) */}
          <div className="w-full max-w-[300px] mx-auto rounded-[20px] border border-[#b8913e] px-4 py-4 text-center space-y-1.5 font-sans my-3 bg-[#2f3b22]/60 shadow-xs">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#b8913e] font-bold block mb-1">
              INFORMASI TAMBAHAN
            </span>
            <p
              className="text-sm text-[#f8f4e8] font-medium"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {closingDresscode}
            </p>
            <p className="text-xs text-[#e4e9d3] leading-relaxed">
              {closingNotes}
            </p>
            <p className="text-xs text-[#e4e9d3]">
              {closingContact}
            </p>
          </div>
        </div>

        {/* Mosque Skyline Image at bottom (390 x 120 px) */}
        <div className="w-full mt-auto relative z-10 pointer-events-none select-none">
          <img
            src={closingSkyline}
            alt="Skyline Masjid"
            className="w-full h-[120px] object-cover object-top block"
          />
        </div>
      </section>
    </div>
  );
}
