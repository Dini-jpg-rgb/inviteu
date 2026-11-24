"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { emeraldGoldBasicTheme } from "../themes/emerald-gold-basic";
import { TemplateTheme } from "../themes/wedding";

interface EmeraldGoldBasicInvitationProps {
  themeData?: TemplateTheme;
  guestName?: string;
}

// Reusable Art Deco Corner Ornament Component
function ArtDecoCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={`w-11 h-11 text-[#c59b4e] stroke-current fill-none pointer-events-none select-none ${className}`}
    >
      <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M16 44 V16 H44" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
    </svg>
  );
}

// Reusable Art Deco Semicircle Sunburst / Fan Ornament
function ArtDecoSunburst({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 50"
      className={`w-28 h-14 text-[#c59b4e] stroke-current fill-none pointer-events-none select-none ${className}`}
    >
      {/* Outer arched boundaries */}
      <path d="M5 48 A 45 45 0 0 1 95 48" strokeWidth="1.5" />
      <path d="M15 48 A 35 35 0 0 1 85 48" strokeWidth="1.2" />
      <path d="M25 48 A 25 25 0 0 1 75 48" strokeWidth="1.2" />
      <path d="M35 48 A 15 15 0 0 1 65 48" strokeWidth="1.2" />
      <line x1="0" y1="48" x2="100" y2="48" strokeWidth="1.5" />

      {/* Radiating rays */}
      <line x1="50" y1="48" x2="50" y2="3" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="20" y2="15" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="80" y2="15" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="33" y2="8" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="67" y2="8" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="10" y2="28" strokeWidth="1.2" />
      <line x1="50" y1="48" x2="90" y2="28" strokeWidth="1.2" />
    </svg>
  );
}

export function EmeraldGoldBasicInvitation({
  themeData = emeraldGoldBasicTheme,
  guestName = "Nama Tamu",
}: EmeraldGoldBasicInvitationProps) {
  const { content } = themeData;

  // Cover opening state
  const [isOpen, setIsOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPresence, setRsvpPresence] = useState<"Hadir" | "Tidak Hadir">("Hadir");
  const [guestCount, setGuestCount] = useState(2);
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Copy Feedback
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Wishes Form State
  const [wishName, setWishName] = useState("");
  const [wishMsg, setWishMsg] = useState("");
  const [wishesList, setWishesList] = useState([
    { name: "KELUARGA DARI DEPOK", message: "Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah." },
    { name: "REKAN KERJA", message: "Happy wedding! Semoga bahagia selalu dan segera diberi momongan." }
  ]);
  const [wishSuccess, setWishSuccess] = useState(false);

  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMsg.trim()) return;
    setWishesList((prev) => [{ name: wishName, message: wishMsg }, ...prev]);
    setWishName("");
    setWishMsg("");
    setWishSuccess(true);
    setTimeout(() => setWishSuccess(false), 3000);
  };

  // Live Countdown (12 Desember 2026)
  const [timeLeft, setTimeLeft] = useState({
    days: 403,
    hours: 18,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const target = new Date("2026-12-12T10:00:00+07:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInvitation = () => {
    setIsOpen(true);
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleCopy = (acc: string, bank: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpSuccess(true);
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  return (
    <div
      className="w-full min-h-full bg-[#0f4a38] text-white relative font-serif select-none"
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {/* ============================================================== */}
      {/* 1. COVER SCREEN (MATCHES USER IMAGE 100% ACCURATELY)           */}
      {/* ============================================================== */}
      <section className="relative min-h-[858px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25]">
        {/* Double Gold Concentric Frame */}
        <div className="absolute inset-2 border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
        <div className="absolute inset-3 border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

        {/* 4 Art Deco Corner Motifs */}
        <div className="absolute top-3 left-3 z-20">
          <ArtDecoCorner />
        </div>
        <div className="absolute top-3 right-3 z-20 scale-x-[-1]">
          <ArtDecoCorner />
        </div>
        <div className="absolute bottom-3 left-3 z-20 scale-y-[-1]">
          <ArtDecoCorner />
        </div>
        <div className="absolute bottom-3 right-3 z-20 scale-x-[-1] scale-y-[-1]">
          <ArtDecoCorner />
        </div>

        {/* Top Header & Art Deco Sunburst Fan */}
        <div className="relative z-20 pt-6 flex flex-col items-center">
          <ArtDecoSunburst className="mb-2 opacity-95" />
          <p
            className="text-[11px] tracking-[0.35em] uppercase text-[#c59b4e] font-medium"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            THE WEDDING OF
          </p>
        </div>

        {/* Arch Photo Frame (With "Ganti foto" or Hero Photo) */}
        <div className="relative z-20 my-2 flex flex-col items-center">
          <div className="relative w-[190px] sm:w-[210px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c59b4e] bg-[#0c3c2d] p-1 shadow-2xl flex items-center justify-center">
            <div className="relative w-full h-full rounded-t-full border border-[#c59b4e]/40 overflow-hidden flex flex-col items-center justify-center bg-[#0c3c2d]">
              {content.heroImage ? (
                <>
                  <Image
                    src={content.heroImage}
                    alt="Foto Pasangan"
                    fill
                    priority
                    className="object-cover opacity-60 hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c3c2d] via-transparent to-transparent pointer-events-none" />
                </>
              ) : null}

              {/* Photo Icon & "Ganti foto" matching screenshot */}
              <div className="relative z-10 flex flex-col items-center space-y-1.5 text-[#c59b4e]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 stroke-current fill-none"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span
                  className="text-xs text-[#e8c97e] font-serif italic tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Ganti foto
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Couple Names (ANGGA & SHENINA) */}
        <div className="relative z-20 space-y-0.5 text-center px-4 w-full">
          <h1
            className="text-3xl sm:text-4xl text-white font-extrabold tracking-[0.1em] uppercase leading-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {content.couple.groom || "ANGGA"}
          </h1>

          <div className="py-0.5">
            <span
              className="text-3xl sm:text-4xl text-[#c59b4e] font-normal leading-none inline-block italic"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              &amp;
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl text-white font-extrabold tracking-[0.1em] uppercase leading-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {content.couple.bride || "SHENINA"}
          </h1>

          {/* Date */}
          <p
            className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#c59b4e] font-medium pt-3"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            SABTU · 12 DESEMBER 2026
          </p>

          {/* Horizontal Divider with Centered Diamond ◆ */}
          <div className="flex items-center justify-center space-x-2 my-2 max-w-[200px] mx-auto">
            <div className="flex-1 h-[1px] bg-[#c59b4e]/70" />
            <span className="text-[#c59b4e] text-xs">◆</span>
            <div className="flex-1 h-[1px] bg-[#c59b4e]/70" />
          </div>

          {/* Recipient Greeting */}
          <p
            className="text-xs text-[#e2cfab] tracking-wider pt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {content.invitationNote.badge || "Kepada Yth. Bapak/Ibu/Saudara/i"}
          </p>
          <p
            className="text-lg font-bold text-white tracking-wide pb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {guestName}
          </p>
        </div>

        {/* Action Button: ◆ BUKA UNDANGAN ◆ */}
        <div className="relative z-20 w-full max-w-[280px] pb-6">
          <button
            type="button"
            onClick={handleOpenInvitation}
            className="w-full bg-[#c89d47] hover:bg-[#d4a853] active:scale-95 text-[#0f4a38] font-bold text-xs tracking-[0.22em] py-3.5 shadow-[0_8px_20px_rgba(197,155,78,0.35)] transition-all flex items-center justify-center space-x-2.5 cursor-pointer uppercase select-none"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>◆</span>
            <span>BUKA UNDANGAN</span>
            <span>◆</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. SCROLLABLE INVITATION CONTENT (AFTER OPENING)                */}
      {/* ============================================================== */}
      <div
        ref={mainContentRef}
        className={`relative bg-[#0f4a38] transition-all duration-700 ${
          isOpen ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        {/* Subtle Gold Frame Lines for main content */}
        <div className="absolute inset-y-0 left-3 w-[1px] bg-[#c59b4e]/30 pointer-events-none" />
        <div className="absolute inset-y-0 right-3 w-[1px] bg-[#c59b4e]/30 pointer-events-none" />

        {/* 2.1 OPENING / AYAT SECTION (Exact match to User Reference Image) */}
        <section className="min-h-[667px] w-full max-w-[390px] mx-auto text-center relative z-10 bg-white text-[#0f4a38] overflow-hidden flex flex-col justify-between items-center px-4 pt-12 pb-10 shadow-sm">
          {/* Top Left Art Deco Corner Accent */}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <svg viewBox="0 0 60 60" className="w-10 h-10 text-[#c59b4e] stroke-current fill-none">
              <path d="M2 58 V2 H58" strokeWidth="1.5" strokeLinecap="square" />
              <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
              <line x1="2" y1="2" x2="42" y2="42" strokeWidth="1.5" />
              <line x1="2" y1="2" x2="48" y2="24" strokeWidth="1.2" />
              <line x1="2" y1="2" x2="24" y2="48" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Top Right Art Deco Corner Accent */}
          <div className="absolute top-2.5 right-2.5 z-10 scale-x-[-1] pointer-events-none">
            <svg viewBox="0 0 60 60" className="w-10 h-10 text-[#c59b4e] stroke-current fill-none">
              <path d="M2 58 V2 H58" strokeWidth="1.5" strokeLinecap="square" />
              <path d="M10 50 V10 H50" strokeWidth="1.2" strokeLinecap="square" />
              <line x1="2" y1="2" x2="42" y2="42" strokeWidth="1.5" />
              <line x1="2" y1="2" x2="48" y2="24" strokeWidth="1.2" />
              <line x1="2" y1="2" x2="24" y2="48" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Top Center Sunburst Fan Ornament */}
          <div className="flex justify-center mb-3 pt-1">
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
              <line x1="50" y1="50" x2="21.7" y2="21.7" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="78.3" y2="21.7" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="15.4" y2="30.0" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="84.6" y2="30.0" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="11.4" y2="39.6" strokeWidth="1.2" />
              <line x1="50" y1="50" x2="88.6" y2="39.6" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Arabic Calligraphy (Basmalah) in Deep Emerald Green */}
          <div className="my-2">
            <p
              className="text-3xl sm:text-4xl text-[#0f4a38] font-serif leading-relaxed select-none"
              dir="rtl"
              style={{ fontFamily: "'Amiri', 'Lateef', 'Scheherazade New', 'Traditional Arabic', serif" }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>

          {/* Gold Divider with Center Diamond */}
          <div className="flex items-center justify-center space-x-2 my-4 max-w-[150px] mx-auto">
            <div className="flex-1 h-[1px] bg-[#c59b4e]" />
            <span className="text-[#c59b4e] text-xs">◆</span>
            <div className="flex-1 h-[1px] bg-[#c59b4e]" />
          </div>

          {/* Ayat Message in Italic Serif */}
          <p
            className="text-xs sm:text-[13px] text-[#0f4a38] italic leading-relaxed max-w-[310px] mx-auto px-2 font-serif font-normal"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
          >
            "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya."
          </p>

          {/* Surah Citation in Gold Tracking */}
          <p
            className="text-[11px] tracking-[0.28em] uppercase text-[#c59b4e] font-semibold mt-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            QS. AR-RUM : 21
          </p>
        </section>

        {/* 2.2 MEMPELAI (Dua Hati, Satu Cerita - Matches User Reference Image) */}
        <section className="min-h-[1024px] w-full max-w-[390px] mx-auto text-center relative z-10 bg-[#F8F5EC] text-[#0b4a3a] flex flex-col justify-between items-center px-4 pt-12 pb-12" style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}>
          <div>
            <p
              className="text-[11px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              MEMPELAI
            </p>
            <h2
              className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Dua Hati, Satu Cerita
            </h2>

            {/* Gold Divider with Diamond */}
            <div className="flex items-center justify-center space-x-2 my-3 max-w-[150px] mx-auto">
              <div className="flex-1 h-[1px] bg-[#c8a34e]" />
              <span className="text-[#c8a34e] text-xs">◆</span>
              <div className="flex-1 h-[1px] bg-[#c8a34e]" />
            </div>
          </div>

          {/* 1. THE BRIDE */}
          <div className="flex flex-col items-center">
            <div className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden">
              <div className="flex flex-col items-center space-y-1 text-[#0b4a3a]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Ganti foto
                </span>
              </div>
            </div>

            <p
              className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              THE BRIDE
            </p>
            <h3
              className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Shenina Syawalita Cinnamon
            </h3>
            <p
              className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Putri dari Bpk. Harris Cinnamon &amp; Ibu Fitria
            </p>
          </div>

          {/* Gold Ampersand */}
          <div className="my-5">
            <span
              className="text-4xl sm:text-5xl text-[#c8a34e] italic font-normal inline-block select-none"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
            >
              &amp;
            </span>
          </div>

          {/* 2. THE GROOM */}
          <div className="flex flex-col items-center">
            <div className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden">
              <div className="flex flex-col items-center space-y-1 text-[#0b4a3a]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Ganti foto
                </span>
              </div>
            </div>

            <p
              className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              THE GROOM
            </p>
            <h3
              className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Angga Aldi Yunanda
            </h3>
            <p
              className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Putra dari Bpk. Muhammad Yuli &amp; Ibu Yulie Hertin
            </p>
          </div>
        </section>

        {/* 2.3 SAVE THE DATE & RANGKAIAN ACARA (Matches User Reference Image: 390x858 px) */}
        <section className="min-h-[858px] w-full max-w-[390px] mx-auto text-center relative z-10 bg-[#072f25] text-white overflow-hidden flex flex-col justify-between items-center px-4 pt-[85px] pb-[80px]">
          {/* Concentric Double Gold Borders */}
          <div className="absolute inset-[10px] border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
          <div className="absolute inset-[16px] border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

          {/* 4 Art Deco Corners */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute top-4 right-4 z-20 scale-x-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-4 left-4 z-20 scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-4 right-4 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>

          <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-between">
            {/* Header: Save The Date */}
            <div>
              <p
                className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SAVE THE DATE
              </p>
              <h2
                className="text-xl sm:text-2xl font-bold text-white tracking-[0.25em] mt-3 mb-1 uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SABTU
              </h2>
              <div
                className="text-5xl sm:text-[54px] font-bold text-[#c59b4e] my-1 leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                12
              </div>
              <p
                className="text-xs sm:text-sm tracking-[0.25em] uppercase text-white font-semibold mt-2"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                DESEMBER 2026
              </p>

              {/* Gold Divider with Diamond */}
              <div className="flex items-center justify-center space-x-2 my-4 w-full max-w-[186px] mx-auto">
                <div className="flex-1 h-[1px] bg-[#c59b4e]" />
                <span className="text-[#c59b4e] text-xs">◆</span>
                <div className="flex-1 h-[1px] bg-[#c59b4e]" />
              </div>
            </div>

            {/* 4 Countdown Boxes */}
            <div className="flex justify-center gap-[9px] w-[331px] max-w-full mx-auto my-3">
              <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  15
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  HARI
                </span>
              </div>
              <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  20
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  JAM
                </span>
              </div>
              <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  15
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  MENIT
                </span>
              </div>
              <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
                <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                  39
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                  DETIK
                </span>
              </div>
            </div>

            {/* Event Cards */}
            <div className="w-[334px] max-w-full mx-auto space-y-3 mt-3">
              {/* Card 1: AKAD NIKAH */}
              <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
                <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
                <p
                  className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  AKAD NIKAH
                </p>
                <h3
                  className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  08.00 WIB
                </h3>
                <p
                  className="text-xs sm:text-sm text-[#e2cfab]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Masjid Al-Ikhlasiah, Bogor
                </p>
              </div>

              {/* Card 2: RESEPSI */}
              <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
                <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
                <p
                  className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  RESEPSI
                </p>
                <h3
                  className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  11.00 WIB – selesai
                </h3>
                <p
                  className="text-xs sm:text-sm text-[#e2cfab]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Nama Gedung, Bogor
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2.4 PETA LOKASI (Matches User Reference Image: 390x667 px) */}
        <section className="min-h-[667px] w-full max-w-[390px] mx-auto text-center relative z-10 bg-white text-[#0b4a3a] overflow-hidden flex flex-col justify-between items-center px-4 pt-[83px] pb-[81px]">
          <div>
            <p
              className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              LOKASI ACARA
            </p>
            <h2
              className="text-3xl sm:text-[34px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Peta Lokasi
            </h2>

            {/* Gold Divider with Diamond */}
            <div className="flex items-center justify-center space-x-2 my-4 w-full max-w-[170px] mx-auto">
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
              <span className="text-[#c59b4e] text-xs">◆</span>
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
            </div>
          </div>

          {/* Map Card with Circle */}
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

          <div>
            <h3
              className="text-2xl sm:text-[26px] font-bold text-[#0b4a3a]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Masjid Al-Ikhlasiah
            </h3>
            <p
              className="text-xs sm:text-sm text-[#4a5a52] mt-1.5 leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Jl. Contoh No. 7, Kota Bogor, Jawa Barat
            </p>
          </div>

          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[270px] max-w-full h-[52px] flex items-center justify-center border-[1.5px] border-[#0b4a3a] text-[#0b4a3a] hover:bg-[#0b4a3a] hover:text-white text-xs font-bold tracking-[0.25em] transition-colors cursor-pointer mt-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ◆ LIHAT LOKASI ◆
          </a>
        </section>

        {/* 2.5 RSVP (Matches User Reference Image 5) */}
        <section className="min-h-[636px] w-full max-w-[390px] mx-auto px-5 py-8 text-center relative z-10 bg-[#0b4a3a] text-white overflow-hidden flex flex-col justify-between items-center">
          <div className="absolute inset-2 border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
          <div className="absolute inset-3 border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

          {/* 4 Art Deco Corners */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute top-3 right-3 z-20 scale-x-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-3 left-3 z-20 scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-3 right-3 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>

          <div className="relative z-20 px-2">
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold pt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              RSVP
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mt-1 mb-2 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Konfirmasi Kehadiran
            </h2>

            <div className="flex items-center justify-center space-x-2 my-3 max-w-[150px] mx-auto">
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
              <span className="text-[#c59b4e] text-xs">◆</span>
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
            </div>

            <p
              className="text-xs sm:text-sm text-[#e2cfab] italic mb-5 max-w-xs mx-auto leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Mohon kabari kami kehadiran Anda melalui formulir berikut.
            </p>

            {/* White Form Card */}
            <form onSubmit={handleRsvpSubmit} className="bg-white text-[#0f4a38] p-5 sm:p-6 shadow-2xl max-w-[310px] mx-auto text-left space-y-3.5">
              <div>
                <label
                  className="text-[10px] font-bold tracking-[0.2em] text-[#0f4a38] uppercase block mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  NAMA
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap"
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                />
              </div>

              <div>
                <label
                  className="text-[10px] font-bold tracking-[0.2em] text-[#0f4a38] uppercase block mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  NOMOR WHATSAPP
                </label>
                <input
                  type="tel"
                  placeholder="Nomor WhatsApp"
                  value={rsvpNotes}
                  onChange={(e) => setRsvpNotes(e.target.value)}
                  className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                />
              </div>

              <div>
                <label
                  className="text-[10px] font-bold tracking-[0.2em] text-[#0f4a38] uppercase block mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  JUMLAH TAMU
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#c59b4e]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRsvpPresence("Hadir")}
                  className={`py-2.5 px-1 text-[10px] sm:text-[11px] font-bold tracking-wider cursor-pointer transition-all ${
                    rsvpPresence === "Hadir"
                      ? "bg-[#c59b4e] text-white shadow-sm"
                      : "bg-white border-[1.5px] border-[#0f4a38] text-[#0f4a38]"
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span>◆ YA, HADIR ◆</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpPresence("Tidak Hadir")}
                  className={`py-2.5 px-1 text-[10px] sm:text-[11px] font-bold tracking-wider cursor-pointer transition-all ${
                    rsvpPresence === "Tidak Hadir"
                      ? "bg-[#c59b4e] text-white shadow-sm"
                      : "bg-white border-[1.5px] border-[#0f4a38] text-[#0f4a38]"
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span>◆ TIDAK HADIR ◆</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#c59b4e] text-white py-3 text-xs font-bold tracking-[0.15em] shadow-md mt-2 flex items-center justify-center space-x-1 hover:bg-[#b88c3f] transition-colors cursor-pointer"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span>◆ KIRIM KONFIRMASI ◆</span>
              </button>

              {rsvpSuccess && (
                <p className="text-[11px] text-emerald-800 text-center font-bold pt-2">
                  ✓ Konfirmasi kehadiran Anda berhasil dikirim!
                </p>
              )}
            </form>
          </div>
        </section>

        {/* 2.6 DOA & UCAPAN (Matches User Reference Image 1) */}
        <section
          className="min-h-[858px] w-full max-w-[390px] mx-auto px-4 py-12 text-center relative z-10 bg-[#F8F5EC] text-[#0b4a3a] overflow-hidden flex flex-col justify-between items-center"
          style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
        >
          <div className="w-full flex flex-col items-center">
            {/* Top Header */}
            <div>
              <p
                className="text-[11px] tracking-[0.3em] uppercase text-[#c8a34e] font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                DOA &amp; UCAPAN
              </p>
              <h2
                className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Doa dan Ucapan
              </h2>

              {/* Gold Divider with Diamond */}
              <div className="flex items-center justify-center space-x-2 my-2.5 max-w-[150px] mx-auto">
                <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                <span className="text-[#c8a34e] text-xs">◆</span>
                <div className="flex-1 h-[1px] bg-[#c8a34e]" />
              </div>

              <p
                className="text-xs sm:text-[13px] text-[#0b4a3a]/85 italic mb-6 max-w-[280px] mx-auto leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai.
              </p>
            </div>

            {/* Wishes Form Card */}
            <form
              onSubmit={handleWishSubmit}
              className="w-full max-w-[335px] bg-white border border-[#c8a34e] p-4 sm:p-5 text-left space-y-4 shadow-sm rounded-none"
            >
              <div>
                <label
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#0b4a3a] uppercase block mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  NAMA
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Anda"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  className="w-full bg-[#f8f5ec] border border-[#c8a34e]/70 px-3.5 py-2.5 text-xs text-[#0b4a3a] placeholder:text-[#0b4a3a]/50 placeholder:italic focus:outline-none focus:border-[#c8a34e] rounded-none"
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
                  required
                  placeholder="Tulis ucapan di sini..."
                  value={wishMsg}
                  onChange={(e) => setWishMsg(e.target.value)}
                  className="w-full bg-[#f8f5ec] border border-[#c8a34e]/70 px-3.5 py-2.5 text-xs text-[#0b4a3a] placeholder:text-[#0b4a3a]/50 placeholder:italic focus:outline-none focus:border-[#c8a34e] resize-none h-[100px] rounded-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#c8a34e] hover:bg-[#b8913d] text-[#0b4a3a] py-3 text-xs font-bold tracking-[0.2em] shadow-md transition-all uppercase flex items-center justify-center space-x-1.5 rounded-none cursor-pointer"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <span>◆</span>
                <span>KIRIM UCAPAN</span>
                <span>◆</span>
              </button>

              {wishSuccess && (
                <p className="text-[11px] text-[#0b4a3a] text-center font-bold">
                  ✓ Ucapan Anda telah tersampaikan!
                </p>
              )}
            </form>

            {/* List of Wishes */}
            <div className="w-full max-w-[335px] mt-4 space-y-3 text-left">
              {wishesList.map((w, idx) => (
                <div
                  key={idx}
                  className="bg-white border-l-[3px] border-l-[#c8a34e] border-t border-r border-b border-[#e4dab8] p-3.5 sm:p-4 text-left shadow-xs rounded-none"
                >
                  <p
                    className="text-[11px] font-bold tracking-[0.2em] text-[#0b4a3a] uppercase"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {w.name}
                  </p>
                  <p
                    className="text-xs sm:text-[13px] text-[#0b4a3a]/85 italic mt-1.5 leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

                {/* 2.7 HADIAH DIGITAL - TANDA KASIH (Exact Match to User Reference Image 390x897) */}
        <section className="relative min-h-[897px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25] text-white select-none">
          {/* Concentric Double Gold Borders (Inset 10px & 16px) */}
          <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
          <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

          {/* 4 Art Deco Corners */}
          <div className="absolute top-[16px] left-[16px] z-20 pointer-events-none">
            <ArtDecoCorner className="w-12 h-12" />
          </div>
          <div className="absolute top-[16px] right-[16px] z-20 scale-x-[-1] pointer-events-none">
            <ArtDecoCorner className="w-12 h-12" />
          </div>
          <div className="absolute bottom-[16px] left-[16px] z-20 scale-y-[-1] pointer-events-none">
            <ArtDecoCorner className="w-12 h-12" />
          </div>
          <div className="absolute bottom-[16px] right-[16px] z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
            <ArtDecoCorner className="w-12 h-12" />
          </div>

          <div className="relative z-20 w-full px-2 pt-14 pb-4 flex flex-col justify-between h-full">
            {/* Top Header */}
            <div>
              <p
                className="text-[12px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                HADIAH DIGITAL
              </p>

              <h2
                className="text-[34px] sm:text-[36px] font-bold text-white mt-3 mb-2 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Tanda Kasih
              </h2>

              <div className="flex items-center justify-center space-x-2 my-3 max-w-[170px] mx-auto">
                <div className="flex-1 h-[1px] bg-[#c8a34e]" />
                <span className="text-[#c8a34e] text-xs">◆</span>
                <div className="flex-1 h-[1px] bg-[#c8a34e]" />
              </div>

              {/* Subtitle with size 18 as requested */}
              <p
                className="text-[#e2cfab] italic mb-6 max-w-[320px] mx-auto leading-[1.6] whitespace-pre-line text-center"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px" }}
              >
                Doa restu Anda adalah hadiah terindah.{"\n"}Namun jika ingin berbagi tanda kasih, dapat melalui:
              </p>
            </div>

            {/* 2 Double Gold Outline Cards (334px width x 204px height, bg #0b4a3a) */}
            <div className="space-y-4 w-[334px] max-w-full mx-auto my-auto">
              {/* Card 1: Bank BCA */}
              <div className="w-[334px] max-w-full h-[204px] border-[1.5px] border-[#c8a34e] p-5 relative bg-[#0b4a3a] text-center flex flex-col justify-between items-center shadow-lg">
                <div className="absolute inset-[6px] border border-[#818146]/70 pointer-events-none" />
                <p
                  className="text-[12px] font-semibold text-[#c8a34e] uppercase tracking-[0.25em]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  BANK BCA
                </p>
                <p
                  className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  1234 5678 90
                </p>
                <p
                  className="text-[14px] text-[#e2cfab] font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  a.n. Angga Aldi Yunanda
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy("1234567890", "BCA")}
                  className="w-[198px] h-[48px] bg-[#c8a34e] hover:bg-[#d6aa57] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md flex items-center justify-center space-x-1.5 uppercase select-none cursor-pointer transition-colors"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span>◆</span>
                  <span>{copiedBank === "BCA" ? "TERSALIN!" : "SALIN NOMOR"}</span>
                  <span>◆</span>
                </button>
              </div>

              {/* Card 2: E-WALLET / DANA */}
              <div className="w-[334px] max-w-full h-[204px] border-[1.5px] border-[#c8a34e] p-5 relative bg-[#0b4a3a] text-center flex flex-col justify-between items-center shadow-lg">
                <div className="absolute inset-[6px] border border-[#818146]/70 pointer-events-none" />
                <p
                  className="text-[12px] font-semibold text-[#c8a34e] uppercase tracking-[0.25em]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  E-WALLET / DANA
                </p>
                <p
                  className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  0812 3456 7890
                </p>
                <p
                  className="text-[14px] text-[#e2cfab] font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  a.n. Shenina Syawalita
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy("081234567890", "DANA")}
                  className="w-[198px] h-[48px] bg-[#c8a34e] hover:bg-[#d6aa57] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md flex items-center justify-center space-x-1.5 uppercase select-none cursor-pointer transition-colors"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span>◆</span>
                  <span>{copiedBank === "DANA" ? "TERSALIN!" : "SALIN NOMOR"}</span>
                  <span>◆</span>
                </button>
              </div>
            </div>

            {/* Bottom Physical Gift Address */}
            <div className="pt-6 pb-6">
              <p
                className="text-[11px] tracking-[0.28em] uppercase text-[#c8a34e] font-semibold mb-1.5"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ALAMAT PENGIRIMAN KADO
              </p>
              <p
                className="text-[14px] sm:text-[15px] text-[#e2cfab] max-w-[280px] mx-auto leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Jl. Contoh No. 7, Kota Bogor, Jawa Barat
              </p>
            </div>
          </div>
        </section>

        {/* 2.8 TERIMA KASIH (Matches User Reference Image 1: 390x636 px) */}
        <section className="min-h-[1018px] w-full max-w-[390px] mx-auto text-center relative z-10 bg-[#0b4a3a] text-white overflow-hidden flex flex-col justify-between items-center px-4 py-12">
          {/* Concentric Double Gold Borders */}
          <div className="absolute inset-[10px] border-[1.5px] border-[#c59b4e] pointer-events-none z-10" />
          <div className="absolute inset-[16px] border-[1px] border-[#c59b4e]/70 pointer-events-none z-10" />

          {/* 4 Art Deco Corners */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute top-4 right-4 z-20 scale-x-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-4 left-4 z-20 scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>
          <div className="absolute bottom-4 right-4 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
            <ArtDecoCorner />
          </div>

          <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-4">
            {/* Sunburst Fan Ornament */}
            <div className="flex justify-center mb-5">
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
                <line x1="50" y1="50" x2="21.7" y2="21.7" strokeWidth="1.2" />
                <line x1="50" y1="50" x2="78.3" y2="21.7" strokeWidth="1.2" />
              </svg>
            </div>

            <h2
              className="text-3xl sm:text-[34px] font-bold text-white mb-4 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Terima Kasih
            </h2>

            <div className="flex items-center justify-center space-x-2 mb-6 w-full max-w-[170px] mx-auto">
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
              <span className="text-[#c59b4e] text-xs">◆</span>
              <div className="flex-1 h-[1px] bg-[#c59b4e]" />
            </div>

            <p
              className="text-xs sm:text-[13px] text-[#e2cfab] italic mb-10 max-w-[280px] mx-auto leading-[1.75]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
            </p>

            {/* Monogram A & S */}
            <div
              className="text-4xl sm:text-[44px] text-[#c59b4e] mb-4 select-none leading-none"
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
              }}
            >
              A &amp; S
            </div>

            <p
              className="text-[11px] tracking-[0.3em] uppercase text-white font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ANGGA &amp; SHENINA
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

