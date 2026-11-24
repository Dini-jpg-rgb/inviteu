"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { baliTropicalTheme } from "../themes/bali-tropical";
import { TemplateTheme } from "../themes/wedding";

interface BaliTropicalInvitationProps {
  themeData?: TemplateTheme;
  guestName?: string;
}

export function BaliTropicalInvitation({
  themeData = baliTropicalTheme,
  guestName = "Tamu Undangan",
}: BaliTropicalInvitationProps) {
  const { content, colorPalette } = themeData;

  // Cover opening state (false = cover screen, true = opened invitation)
  const [isOpen, setIsOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Music state simulation
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"Hadir" | "Tidak Hadir">("Hadir");
  const [guestCount, setGuestCount] = useState(2);
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const decrementCount = () => setGuestCount((prev) => Math.max(1, prev - 1));
  const incrementCount = () => setGuestCount((prev) => Math.min(10, prev + 1));

  // Digital Envelope & Address Copy Feedback
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Kisah Kami (Love Story) Tab State
  const [activeStoryTab, setActiveStoryTab] = useState<"Bertemu" | "Dekat" | "Melamar">("Bertemu");

  // Private Message (Voice Note / Video) State
  const [mediaMode, setMediaMode] = useState<"SUARA" | "VIDEO">("SUARA");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(7);
  const [voiceSubmitted, setVoiceSubmitted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => {
          if (prev >= 10) {
            setIsRecording(false);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (isPlayingAudio) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => {
          if (prev >= 10) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPlayingAudio]);

  const handleToggleRecord = () => {
    if (isPlayingAudio) setIsPlayingAudio(false);
    if (!isRecording) {
      setVoiceSeconds(0);
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  };

  const handleTogglePlay = () => {
    if (isRecording) setIsRecording(false);
    setIsPlayingAudio((prev) => !prev);
  };

  const handleResetRecord = () => {
    setIsRecording(false);
    setIsPlayingAudio(false);
    setVoiceSeconds(0);
  };

  const handleSubmitVoice = () => {
    setVoiceSubmitted(true);
    setTimeout(() => setVoiceSubmitted(false), 3500);
  };

  // Gallery Lightbox Modal
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Guestbook Wishes
  const [wishesList, setWishesList] = useState([
    {
      name: "Bu Retno",
      message: "Selamat menempuh hidup baru, semoga bahagia selalu.",
    },
    {
      name: "Mas Dimas",
      message: "Semoga langgeng sampai kakek nenek ya!",
    },
  ]);
  const [wishInputName, setWishInputName] = useState("");
  const [wishInputMessage, setWishInputMessage] = useState("");

  // Live Countdown Timer (Target: 22 November 2026)
  const [timeLeft, setTimeLeft] = useState({
    days: 38,
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    const target = new Date("2026-11-22T09:00:00+08:00").getTime();
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
    setIsPlayingMusic(true);
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleCopyAccount = (accNumber: string, idx: number) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyAddress = () => {
    const addressToCopy = content.venue?.address
      ? `${content.venue.placeName || ""}, ${content.venue.address}`.replace(/\n/g, ", ")
      : "The Kayana Sunset Garden Villa, Jl. Petitenget No. 100, Badung, Bali";
    navigator.clipboard.writeText(addressToCopy);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpSuccess(true);
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishInputName.trim() || !wishInputMessage.trim()) return;
    setWishesList([
      {
        name: wishInputName.trim(),
        message: wishInputMessage.trim(),
      },
      ...wishesList,
    ]);
    setWishInputName("");
    setWishInputMessage("");
  };

  // Asset paths with fallbacks
  const assets = content.assets || {
    gapuraFull: "/templates/bali-tropical/gapura-full.png",
    halfGapura: "/templates/bali-tropical/half-gapura.png",
    bungaFull: "/templates/bali-tropical/bunga-full.png",
    melati: "/templates/bali-tropical/melati.png",
    ornFlowers: "/templates/bali-tropical/orn-flowers.png",
    daunPenjorKiri: "/templates/bali-tropical/daun-penjor-kiri.png",
    daunPenjorKanan: "/templates/bali-tropical/daun-penjor-kanan.png",
    daunKiri: "/templates/bali-tropical/daun-kiri.png",
    daunKanan: "/templates/bali-tropical/daun-kanan.png",
  };

  return (
    <div
      className="w-full min-h-full font-serif select-text relative overflow-x-hidden text-[#f3eee6]"
      style={{
        backgroundColor: colorPalette.background,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ============================================================== */}
      {/* 1. COVER / SPLASH SCREEN (SESUAI DOKUMEN GAMBAR 1)            */}
      {/* ============================================================== */}
      <section className="relative min-h-[750px] flex flex-col items-center justify-between px-6 pt-10 pb-8 text-center bg-[#102218] border-b border-[#d7ab58]/30 overflow-hidden">
        {/* Daun Penjor Kanan diletakkan di Sebelah Kiri (Mepet ke Sisi Kiri Layar, Ukuran Proporsional) */}
        <div className="absolute top-0 left-0 w-[92px] sm:w-[108px] h-[250px] sm:h-[275px] pointer-events-none z-20">
          <Image
            src={assets.daunPenjorKanan || "/templates/bali-tropical/daun-penjor-kanan.png"}
            alt="Daun Penjor Kanan di Kiri"
            fill
            priority
            className="object-contain object-left-top"
          />
        </div>

        {/* Daun Penjor Kiri diletakkan di Sebelah Kanan (Mepet ke Sisi Kanan Layar, Ukuran Proporsional) */}
        <div className="absolute top-0 right-0 w-[92px] sm:w-[108px] h-[250px] sm:h-[275px] pointer-events-none z-20">
          <Image
            src={assets.daunPenjorKiri || "/templates/bali-tropical/daun-penjor-kiri.png"}
            alt="Daun Penjor Kiri di Kanan"
            fill
            priority
            className="object-contain object-right-top"
          />
        </div>

        {/* Top Header */}
        <div className="relative z-30 pt-2">
          <p
            className="text-[12px] sm:text-xs tracking-[0.38em] uppercase text-[#d7ab58] font-medium"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            OM SWASTIASTU
          </p>
        </div>

        {/* Central Golden Arch Frame Flanked by Daun Penjor */}
        <div className="relative z-10 my-1 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* Circular Backdrop Silhouette behind the arch */}
            <div className="absolute bottom-0 w-[200px] sm:w-[220px] h-[180px] sm:h-[200px] rounded-full bg-[#13271c] border border-[#d7ab58]/20 -z-0" />

            {/* The Central Golden Arch Frame */}
            <div className="relative z-10 w-[160px] sm:w-[180px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1.5 shadow-2xl flex items-center justify-center">
              <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/50 overflow-hidden flex items-center justify-center bg-[#102218]">
                <Image
                  src={content.heroImage || "/templates/wedding/couple-main.jpg"}
                  alt="Foto Pasangan"
                  fill
                  priority
                  className="object-cover opacity-60 hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102218] via-transparent to-transparent pointer-events-none" />
                <span
                  className="relative z-10 text-xs tracking-wider text-[#e8c97e]/80 font-normal italic"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Foto pasangan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Couple Title & Event Info */}
        <div className="relative z-10 space-y-1.5 w-full max-w-sm px-2">
          <p
            className="text-[11px] tracking-[0.35em] text-[#d7ab58] uppercase font-light"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            THE WEDDING OF
          </p>
          <div className="flex items-center justify-center whitespace-nowrap py-0.5">
            <h1
              className="text-4xl sm:text-[42px] text-[#d7ab58] font-normal leading-none flex items-center justify-center gap-2 sm:gap-3"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              <span>Chyntia</span>
              <span className="text-3xl sm:text-[34px] text-[#d7ab58] font-normal inline-block leading-none">&amp;</span>
              <span>Rian</span>
            </h1>
          </div>
          <p
            className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#e8c97e]/90 font-medium pt-0.5"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            MINGGU · 22 NOVEMBER 2026
          </p>
          <p
            className="text-sm sm:text-base text-[#d7ab58] italic"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            [Nama Lokasi], Bali
          </p>
        </div>

        {/* Guest Recipient Card & Open Button */}
        <div className="relative z-10 w-full max-w-[270px] space-y-3.5 pt-3">
          <div className="border border-[#d7ab58]/50 rounded-full py-2 px-4 bg-[#162e21]/80 backdrop-blur-xs text-center shadow-inner">
            <p
              className="text-[11px] text-[#e8c97e]/90 tracking-wider"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p
              className="text-base font-semibold text-[#f3eee6] tracking-wide mt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              [{guestName}]
            </p>
          </div>

          <button
            onClick={handleOpenInvitation}
            className="w-full bg-[#d7ab58] hover:bg-[#e8c97e] active:scale-95 text-[#102218] font-bold text-xs tracking-[0.22em] py-3 rounded-full shadow-[0_8px_20px_rgba(215,171,88,0.3)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>BUKA UNDANGAN</span>
            <span>✉️</span>
          </button>
        </div>

        {/* Music Simulation Indicator */}
        <div className="relative z-10 pt-2 flex items-center justify-center">
          <button
            onClick={() => setIsPlayingMusic(!isPlayingMusic)}
            className="w-7 h-7 rounded-full border border-[#d7ab58]/40 flex items-center justify-center text-[#d7ab58] hover:border-[#d7ab58] transition-colors"
            title="Music status"
          >
            <span className="text-xs">♪</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. MAIN SCROLLABLE INVITATION CONTENT                          */}
      {/* ============================================================== */}
      <div ref={mainContentRef} className="relative bg-[#102218] overflow-hidden">
        {/* Daun Atas Kiri dan Kanan Membingkai Sesuai Foto Referensi 1 */}
        <div className="absolute top-0 left-0 w-[95px] sm:w-[110px] h-[175px] sm:h-[195px] pointer-events-none z-20">
          <Image
            src={assets.daunKiri || "/templates/bali-tropical/daun-kiri.png"}
            alt="Daun Kiri"
            fill
            priority
            className="object-contain object-left-top"
          />
        </div>
        <div className="absolute top-0 right-0 w-[95px] sm:w-[110px] h-[175px] sm:h-[195px] pointer-events-none z-20">
          <Image
            src={assets.daunKanan || "/templates/bali-tropical/daun-kanan.png"}
            alt="Daun Kanan"
            fill
            priority
            className="object-contain object-right-top"
          />
        </div>

        {/* 2.1 OM SWASTIASTU & BLESSING (SESUAI FOTO 2 DENGAN JARAK PROPORSIONAL) */}
        <section className="px-6 pt-10 pb-14 sm:pb-16 text-center relative z-10">
          <h2
            className="text-4xl sm:text-5xl text-[#d7ab58] font-normal mb-1.5 leading-tight"
            style={{ fontFamily: "'Pinyon Script', cursive" }}
          >
            Om Swastiastu
          </h2>
          {/* Bunga melati dengan garis aksen emas kiri dan kanan */}
          <div className="flex items-center justify-center space-x-3 my-2.5">
            <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
            <div className="w-5 h-5 relative">
              <Image
                src={assets.melati || "/templates/bali-tropical/melati.png"}
                alt="Melati"
                fill
                className="object-contain"
              />
            </div>
            <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
          </div>
          <p
            className="text-xs sm:text-sm leading-relaxed text-[#f3eee6]/90 max-w-[260px] mx-auto font-light"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Atas asung kerta wara nugraha Ida Sang Hyang Widhi Wasa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari pernikahan kami.
          </p>
        </section>

        {/* 2.2 BALINESE GRAND GAPURA ILLUSTRATION (MEMENUHI LAYAR PENUH DENGAN JARAK YANG PAS) */}
        <section className="relative w-full px-0 pt-2 pb-0 flex flex-col items-center justify-center z-10 overflow-hidden">
          <div className="relative w-full h-[270px] sm:h-[285px]">
            <Image
              src={assets.gapuraFull || "/templates/bali-tropical/gapura-full.png"}
              alt="Gapura Bali"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>
        </section>

        {/* 2.3 MEMPELAI (BRIDE & GROOM) */}
        <section className="px-6 py-10 text-center relative z-10 space-y-8">
          {/* Section Header */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-[1px] bg-[#d7ab58]/50" />
            <div
              className="flex items-center space-x-1.5 text-xs tracking-[0.25em] uppercase text-[#d7ab58]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>MEMPELAI</span>
              <div className="w-4 h-4 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="w-10 h-[1px] bg-[#d7ab58]/50" />
          </div>

          {/* Bride Profile */}
          <div className="space-y-3 flex flex-col items-center">
            {/* Bingkai Lengkung Foto Mempelai Wanita Lebih Besar Sesuai Foto 1 */}
            <div className="relative w-[210px] sm:w-[230px] h-[290px] sm:h-[315px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1.5 shadow-2xl">
              <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/60 overflow-hidden bg-[#13271c] flex items-center justify-center">
                <Image
                  src={content.gallery.images[0] || "/templates/wedding/gallery-1.jpg"}
                  alt="Foto Mempelai Wanita"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              {/* Bunga Kamboja di Sudut Kiri Bawah Bingkai Sesuai Foto 1 */}
              <div className="absolute -bottom-4 -left-6 w-20 h-16 sm:w-24 sm:h-18 pointer-events-none z-10">
                <Image
                  src={assets.bungaFull || "/templates/bali-tropical/bunga-full.png"}
                  alt="Bunga Kamboja"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <h3
              className="text-5xl sm:text-6xl text-[#d7ab58] pt-3 font-normal"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Chyntia
            </h3>
            <p
              className="text-sm sm:text-base font-semibold uppercase tracking-[0.16em] text-[#f3eee6]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Ni Putu Chyntia Dewi, S.Ked
            </p>
            <p
              className="text-xs sm:text-sm leading-relaxed text-[#e8c97e]/90 max-w-[270px] italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Putri pertama dari pasangan<br />
              <span className="font-semibold text-[#f3eee6] not-italic">Bapak I Wayan Suartana</span> &amp; <span className="font-semibold text-[#f3eee6] not-italic">Ibu Ni Ketut Murniati</span>
            </p>
          </div>

          {/* Golden Script Ampersand */}
          <div
            className="text-4xl sm:text-5xl text-[#d7ab58] py-2 font-normal"
            style={{ fontFamily: "'Pinyon Script', cursive" }}
          >
            &amp;
          </div>

          {/* Groom Profile */}
          <div className="space-y-3 flex flex-col items-center">
            {/* Bingkai Lengkung Foto Mempelai Pria Lebih Besar Sesuai Foto 1 */}
            <div className="relative w-[210px] sm:w-[230px] h-[290px] sm:h-[315px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1.5 shadow-2xl">
              <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/60 overflow-hidden bg-[#13271c] flex items-center justify-center">
                <Image
                  src={content.gallery.images[1] || "/templates/wedding/gallery-2.jpg"}
                  alt="Foto Mempelai Pria"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              {/* Bunga Kamboja di Sudut Kanan Bawah Bingkai Sesuai Foto 1 */}
              <div className="absolute -bottom-4 -right-6 w-20 h-16 sm:w-24 sm:h-18 pointer-events-none -scale-x-100 z-10">
                <Image
                  src={assets.bungaFull || "/templates/bali-tropical/bunga-full.png"}
                  alt="Bunga Kamboja"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <h3
              className="text-5xl sm:text-6xl text-[#d7ab58] pt-3 font-normal"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Rian
            </h3>
            <p
              className="text-sm sm:text-base font-semibold uppercase tracking-[0.16em] text-[#f3eee6]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              I Made Rian Arisatya, S.T
            </p>
            <p
              className="text-xs sm:text-sm leading-relaxed text-[#e8c97e]/90 max-w-[270px] italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Putra pertama dari pasangan<br />
              <span className="font-semibold text-[#f3eee6] not-italic">Bapak I Made Hendra</span> &amp; <span className="font-semibold text-[#f3eee6] not-italic">Ibu Ni Luh Sukerti</span>
            </p>
          </div>
        </section>

        {/* 2.4 RANGKAIAN ACARA (EVENT SCHEDULE) */}
        {/* 2.4 RANGKAIAN ACARA (EVENT SCHEDULE - PERSIS FOTO REFERENSI 1) */}
        <section className="px-6 py-10 relative z-10 space-y-5">
          <div className="text-center mb-6">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              RANGKAIAN ACARA
            </h3>
            {/* Bunga melati dengan garis aksen emas kiri dan kanan */}
            <div className="flex items-center justify-center space-x-3 my-2.5">
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-5 h-5 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          {/* Event Card 1: Akad Nikah */}
          <div className="bg-[#162e21] border border-[#d7ab58]/50 rounded-2xl py-6 px-5 text-center shadow-lg relative overflow-hidden space-y-1.5">
            <h4
              className="text-4xl sm:text-5xl text-[#d7ab58] mb-1 font-normal"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Akad Nikah
            </h4>
            <p
              className="text-xs sm:text-[13px] font-medium text-[#e8c97e] uppercase tracking-[0.2em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              MINGGU, 22 NOVEMBER 2026
            </p>
            <p
              className="text-xs sm:text-[13px] font-medium text-[#f3eee6] tracking-wider"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              08.00 – 10.00 WITA
            </p>
            <p
              className="text-xs sm:text-sm text-[#d7ab58] italic pt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              [Nama Lokasi], Bali
            </p>
            <div className="pt-3 flex items-center justify-center gap-3">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-full border border-[#d7ab58] text-[#d7ab58] text-[10px] sm:text-xs tracking-wider uppercase font-semibold hover:bg-[#d7ab58]/10 transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                BUKA PETA
              </a>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] text-[10px] sm:text-xs tracking-wider uppercase font-semibold shadow-md transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SIMPAN KALENDER
              </a>
            </div>
          </div>

          {/* Event Card 2: Resepsi */}
          <div className="bg-[#162e21] border border-[#d7ab58]/50 rounded-2xl py-6 px-5 text-center shadow-lg relative overflow-hidden space-y-1.5">
            <h4
              className="text-4xl sm:text-5xl text-[#d7ab58] mb-1 font-normal"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Resepsi
            </h4>
            <p
              className="text-xs sm:text-[13px] font-medium text-[#e8c97e] uppercase tracking-[0.2em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              MINGGU, 22 NOVEMBER 2026
            </p>
            <p
              className="text-xs sm:text-[13px] font-medium text-[#f3eee6] tracking-wider"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              11.00 – 14.00 WITA
            </p>
            <p
              className="text-xs sm:text-sm text-[#d7ab58] italic pt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              [Nama Lokasi], Bali
            </p>
            <div className="pt-3 flex items-center justify-center gap-3">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-full border border-[#d7ab58] text-[#d7ab58] text-[10px] sm:text-xs tracking-wider uppercase font-semibold hover:bg-[#d7ab58]/10 transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                BUKA PETA
              </a>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] text-[10px] sm:text-xs tracking-wider uppercase font-semibold shadow-md transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SIMPAN KALENDER
              </a>
            </div>
          </div>
        </section>

        {/* 2.5 MENUJU HARI BAHAGIA (COUNTDOWN - PERSIS FOTO REFERENSI 1) */}
        <section className="px-6 py-10 relative z-10 text-center space-y-4">
          <div className="text-center mb-3">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              MENUJU HARI BAHAGIA
            </h3>
            {/* Bunga melati dengan garis aksen emas kiri dan kanan */}
            <div className="flex items-center justify-center space-x-3 my-2.5">
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-5 h-5 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-[310px] mx-auto pt-1">
            {[
              { label: "HARI", value: timeLeft.days },
              { label: "JAM", value: timeLeft.hours },
              { label: "MENIT", value: timeLeft.minutes },
              { label: "DETIK", value: timeLeft.seconds },
            ].map((box, idx) => (
              <div
                key={idx}
                className="bg-[#162e21] border border-[#d7ab58]/60 rounded-2xl py-4 px-1 shadow-md flex flex-col items-center justify-center"
              >
                <span
                  className="text-3xl sm:text-4xl text-[#d7ab58] font-normal leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {String(box.value).padStart(2, "0")}
                </span>
                <span
                  className="text-[10px] text-[#f3eee6]/80 tracking-[0.18em] uppercase font-medium mt-1.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {box.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2.6 LOKASI ACARA & MAPS */}
        <section className="px-6 py-10 relative z-10 text-center space-y-4">
          <div className="text-center mb-3">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              LOKASI ACARA
            </h3>
            <div className="flex items-center justify-center space-x-3 my-2.5">
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-5 h-5 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-10 sm:w-12 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-[#d7ab58]/50 shadow-lg">
            <Image
              src={content.venue.image || "/templates/wedding/venue.jpg"}
              alt="Lokasi Peta"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#102218]/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
              <span className="text-2xl mb-1">📍</span>
              <p className="text-xs font-semibold text-white tracking-wide">
                The Kayana Sunset Garden Villa
              </p>
              <p className="text-[10px] text-zinc-200 mt-0.5">
                Seminyak - Petitenget, Badung, Bali
              </p>
            </div>
          </div>

          <div className="space-y-3 w-full max-w-[280px] sm:max-w-[300px] mx-auto pt-2">
            <a
              href={content.venue?.mapUrl || "https://maps.google.com"}
              target="_blank"
              rel="noreferrer"
              className="block w-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] font-semibold text-xs tracking-[0.25em] py-3.5 rounded-full shadow-md transition-all duration-200 cursor-pointer text-center active:scale-[0.98]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              LIHAT LOKASI
            </a>
            <button
              onClick={handleCopyAddress}
              type="button"
              className="block w-full border border-[#d7ab58] hover:bg-[#d7ab58]/10 text-[#d7ab58] font-semibold text-xs tracking-[0.25em] py-3.5 rounded-full transition-all duration-200 cursor-pointer text-center active:scale-[0.98]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {copiedAddress ? "✓ ALAMAT TERSALIN" : "SALIN ALAMAT"}
            </button>
          </div>
        </section>

        {/* 2.7 KISAH KAMI */}
        <section className="px-6 py-10 relative z-10 text-center space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KISAH KAMI
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          {/* Three Tab Pills */}
          <div className="flex justify-center items-center gap-2.5 sm:gap-3 py-1">
            {(["Bertemu", "Dekat", "Melamar"] as const).map((tab) => {
              const isActive = activeStoryTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveStoryTab(tab)}
                  className={`px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-200 cursor-pointer ${isActive
                      ? "bg-[#d7ab58] text-[#102218] font-medium shadow-md"
                      : "border border-[#d7ab58]/60 hover:border-[#d7ab58] text-[#d7ab58] bg-transparent"
                    }`}
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Story Card Box */}
          <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto border border-[#d7ab58]/50 rounded-2xl p-6 sm:p-7 min-h-[140px] flex items-center justify-center transition-all duration-300">
            <p
              className="text-sm sm:text-base leading-relaxed text-[#f3eee6] text-center"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {activeStoryTab === "Bertemu" &&
                "Kami bertemu pada sebuah momen sederhana. Dari obrolan ringan, tumbuhlah rasa yang kini kami bawa ke pelaminan."}
              {activeStoryTab === "Dekat" &&
                "Seiring waktu berjalan, canda tawa dan percakapan sederhana mempertemukan dua hati yang saling melengkapi dalam rasa dan doa."}
              {activeStoryTab === "Melamar" &&
                "Dengan restu Ida Sang Hyang Widhi Wasa dan kedua orang tua, kami mengikat janji suci untuk melangkah bersama menuju pelaminan."}
            </p>
          </div>
        </section>

        {/* 2.8 GALERI */}
        <section className="px-6 py-10 relative z-10 space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {content.gallery.title || "GALERI"}
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          {/* 6-Photo Masonry Grid (Asymmetrical Staggered Columns matching reference) */}
          <div className="flex gap-2.5 sm:gap-3 max-w-[360px] mx-auto">
            {/* Kolom Kiri: Foto 1, Foto 3, Foto 5 */}
            <div className="flex-1 flex flex-col gap-2.5 sm:gap-3">
              {[
                {
                  src: content.gallery.images[0] || "/templates/wedding/gallery-1.jpg",
                  label: "Foto 1",
                  height: "h-[190px]",
                },
                {
                  src: content.gallery.images[2] || "/templates/wedding/gallery-3.jpg",
                  label: "Foto 3",
                  height: "h-[215px]",
                },
                {
                  src: content.gallery.images[4] || "/templates/wedding/couple-main.jpg",
                  label: "Foto 5",
                  height: "h-[205px]",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => setLightboxImg(item.src)}
                  className={`relative ${item.height} rounded-2xl overflow-hidden border border-[#d7ab58]/50 shadow-md group cursor-pointer bg-[#102218]/40 transition-all duration-300 hover:border-[#d7ab58]`}
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    🔍 Perbesar
                  </div>
                </div>
              ))}
            </div>

            {/* Kolom Kanan: Foto 2, Foto 4, Foto 6 */}
            <div className="flex-1 flex flex-col gap-2.5 sm:gap-3">
              {[
                {
                  src: content.gallery.images[1] || "/templates/wedding/gallery-2.jpg",
                  label: "Foto 2",
                  height: "h-[250px]",
                },
                {
                  src: content.gallery.images[3] || "/templates/wedding/gallery-4.jpg",
                  label: "Foto 4",
                  height: "h-[195px]",
                },
                {
                  src: content.gallery.images[5] || "/templates/wedding/venue.jpg",
                  label: "Foto 6",
                  height: "h-[165px]",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => setLightboxImg(item.src)}
                  className={`relative ${item.height} rounded-2xl overflow-hidden border border-[#d7ab58]/50 shadow-md group cursor-pointer bg-[#102218]/40 transition-all duration-300 hover:border-[#d7ab58]`}
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    🔍 Perbesar
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2.9 KONFIRMASI KEHADIRAN (RSVP) */}
        <section className="px-6 py-10 relative z-10 space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[#d7ab58] font-normal whitespace-nowrap"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KONFIRMASI KEHADIRAN
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
            <p
              className="text-xs sm:text-sm text-[#e8c97e]/90 mt-1 max-w-[320px] mx-auto italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Mohon konfirmasi kehadiran sebelum 15 November 2026
            </p>
          </div>

          <form
            onSubmit={handleRsvpSubmit}
            className="border border-[#d7ab58]/50 rounded-2xl p-6 sm:p-7 space-y-5 text-xs text-left shadow-xl max-w-[360px] mx-auto bg-[#102218]/40"
          >
            {/* Input Nama Lengkap (No label above, placeholder 'Nama lengkap') */}
            <div>
              <input
                type="text"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                placeholder="Nama lengkap"
                required
                className="w-full rounded-xl bg-[#13271c] border border-[#d7ab58]/40 px-4 py-3 text-[#f3eee6] placeholder-[#6d8276] focus:outline-none focus:border-[#d7ab58] text-sm"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              />
            </div>

            {/* Hadir / Tidak Hadir (Pill buttons, no label, no icons) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRsvpStatus("Hadir")}
                className={`py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase text-center transition-all cursor-pointer ${rsvpStatus === "Hadir"
                    ? "bg-[#d7ab58] text-[#102218] shadow-md"
                    : "bg-transparent border border-[#d7ab58]/60 hover:border-[#d7ab58] text-[#d7ab58]"
                  }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                HADIR
              </button>
              <button
                type="button"
                onClick={() => setRsvpStatus("Tidak Hadir")}
                className={`py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase text-center transition-all cursor-pointer ${rsvpStatus === "Tidak Hadir"
                    ? "bg-[#d7ab58] text-[#102218] shadow-md"
                    : "bg-transparent border border-[#d7ab58]/60 hover:border-[#d7ab58] text-[#d7ab58]"
                  }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                TIDAK HADIR
              </button>
            </div>

            {/* JUMLAH TAMU Stepper (- 2 +) */}
            {rsvpStatus === "Hadir" && (
              <div className="text-center pt-2 pb-1 space-y-3">
                <p
                  className="text-xs text-[#d7ab58] tracking-[0.25em] uppercase font-normal"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  JUMLAH TAMU
                </p>
                <div className="flex items-center justify-center gap-7 text-[#d7ab58]">
                  <button
                    type="button"
                    onClick={decrementCount}
                    className="w-8 h-8 flex items-center justify-center text-xl text-[#d7ab58] hover:text-[#e8c97e] transition-colors cursor-pointer select-none active:scale-90"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    −
                  </button>
                  <span
                    className="text-lg sm:text-xl font-medium text-[#d7ab58] min-w-[20px] text-center select-none"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={incrementCount}
                    className="w-8 h-8 flex items-center justify-center text-xl text-[#d7ab58] hover:text-[#e8c97e] transition-colors cursor-pointer select-none active:scale-90"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {rsvpSuccess && (
              <div className="p-3 rounded-full bg-[#d7ab58]/20 border border-[#d7ab58]/60 text-xs text-[#d7ab58] text-center font-medium">
                ✨ Terima kasih! Konfirmasi kehadiran Anda berhasil terkirim.
              </div>
            )}

            {/* Submit Pill Button: KIRIM KONFIRMASI */}
            <button
              type="submit"
              className="w-full bg-[#d7ab58] hover:bg-[#e8c97e] active:scale-[0.98] text-[#102218] font-semibold py-3.5 rounded-full shadow-md transition-all cursor-pointer text-xs tracking-[0.2em] uppercase text-center mt-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KIRIM KONFIRMASI
            </button>
          </form>
        </section>

        {/* 2.10 PESAN PRIBADI (VOICE NOTE / VIDEO) */}
        <section className="px-6 py-10 relative z-10 space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              PESAN PRIBADI
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
            <p
              className="text-xs sm:text-sm text-[#e8c97e]/90 mt-1 max-w-[320px] mx-auto leading-relaxed italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Rekam pesan suara atau video singkat untuk kedua mempelai (maks. 10 detik)
            </p>
          </div>

          {/* Segmented Control Pill: SUARA / VIDEO */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center p-0.5 rounded-full border border-[#d7ab58]/50 bg-[#102218]/60 shadow-sm">
              <button
                type="button"
                onClick={() => setMediaMode("SUARA")}
                className={`py-1.5 px-6 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all cursor-pointer ${mediaMode === "SUARA"
                    ? "bg-[#d7ab58] text-[#102218] shadow-md"
                    : "text-[#d7ab58] hover:text-[#e8c97e]"
                  }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SUARA
              </button>
              <button
                type="button"
                onClick={() => setMediaMode("VIDEO")}
                className={`py-1.5 px-6 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all cursor-pointer ${mediaMode === "VIDEO"
                    ? "bg-[#d7ab58] text-[#102218] shadow-md"
                    : "text-[#d7ab58] hover:text-[#e8c97e]"
                  }`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                VIDEO
              </button>
            </div>
          </div>

          {/* Card Container */}
          <div className="border border-[#d7ab58]/50 rounded-2xl p-6 sm:p-7 space-y-4 text-center shadow-xl max-w-[360px] mx-auto bg-[#102218]/40">
            {mediaMode === "SUARA" ? (
              <>
                {/* Audio Waveform Visualization */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-12 py-1">
                  {[8, 22, 16, 28, 20, 26, 14, 36, 18, 24, 32, 16, 28, 22, 12, 26, 18, 30, 20, 24, 14, 28].map(
                    (barHeight, idx) => {
                      const isPlayed = idx < Math.round((voiceSeconds / 10) * 22);
                      return (
                        <div
                          key={idx}
                          className={`w-[2.5px] sm:w-[3px] rounded-full transition-all duration-200 ${isPlayed ? "bg-[#d7ab58]" : "bg-[#253e31]"
                            }`}
                          style={{ height: `${barHeight}px` }}
                        />
                      );
                    }
                  )}
                </div>

                {/* Timer: 00:07 / 00:10 */}
                <p
                  className="text-sm sm:text-base font-medium tracking-wider text-[#d7ab58]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  00:{voiceSeconds < 10 ? `0${voiceSeconds}` : voiceSeconds} / 00:10
                </p>

                {/* Progress bar */}
                <div className="w-full h-[2px] bg-[#253e31] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d7ab58] transition-all duration-300"
                    style={{ width: `${Math.min(100, (voiceSeconds / 10) * 100)}%` }}
                  />
                </div>

                {/* Center Record Microphone Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer ${isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218]"
                      }`}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </button>
                  <p
                    className="text-xs text-[#e8c97e]/80 mt-2.5"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {isRecording ? "Sedang merekam suara..." : "Tekan untuk merekam / berhenti"}
                  </p>
                </div>

                {/* Action Buttons: REKAM ULANG and PUTAR */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetRecord}
                    className="border border-[#d7ab58]/60 hover:bg-[#d7ab58]/10 text-[#d7ab58] text-[11px] font-semibold tracking-[0.18em] uppercase py-2.5 px-4 rounded-full flex-1 transition-all cursor-pointer text-center"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    REKAM ULANG
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="border border-[#d7ab58]/60 hover:bg-[#d7ab58]/10 text-[#d7ab58] text-[11px] font-semibold tracking-[0.18em] uppercase py-2.5 px-4 rounded-full flex-1 transition-all cursor-pointer text-center"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {isPlayingAudio ? "JEDA" : "PUTAR"}
                  </button>
                </div>
              </>
            ) : (
              /* Video Mode */
              <div className="space-y-4">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#d7ab58]/40 bg-[#13271c] flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <span className="text-3xl">📹</span>
                  <p className="text-xs text-[#f3eee6]" style={{ fontFamily: "'Cinzel', serif" }}>
                    KAMERA VIDEO
                  </p>
                  <p
                    className="text-[11px] text-[#e8c97e]/80 italic"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Tekan tombol untuk merekam video ucapan singkat (maks. 10 detik)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  className="w-14 h-14 rounded-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] flex items-center justify-center mx-auto shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-red-600 block" />
                </button>
                <p
                  className="text-xs text-[#e8c97e]/80"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Maksimal durasi rekaman video 10 detik
                </p>
              </div>
            )}
          </div>

          {/* Subtext info */}
          <p
            className="text-xs text-[#e8c97e]/90 mt-2 max-w-[320px] mx-auto text-center leading-relaxed italic"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Terhubung dengan RSVP: pesan dikirim bersama konfirmasi kehadiran.
          </p>

          {/* KIRIM BERSAMA RSVP Button */}
          <button
            type="button"
            onClick={handleSubmitVoice}
            className="w-full max-w-[360px] mx-auto bg-[#d7ab58] hover:bg-[#e8c97e] active:scale-[0.98] text-[#102218] font-semibold py-3.5 rounded-full shadow-md transition-all cursor-pointer text-xs tracking-[0.2em] uppercase text-center block mt-3"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {voiceSubmitted ? "✓ PESAN TERSIMPAN BERSAMA RSVP!" : "KIRIM BERSAMA RSVP"}
          </button>
        </section>

        {/* 2.11 UCAPAN & DOA RESTU (GUESTBOOK) */}
        <section className="px-6 py-8 relative z-10 space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              UCAPAN &amp; DOA
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleAddWish}
            className="border border-[#d7ab58]/50 rounded-2xl p-5 sm:p-6 space-y-4 text-xs shadow-md max-w-[340px] sm:max-w-[360px] mx-auto bg-[#102218]/40"
          >
            <input
              type="text"
              value={wishInputName}
              onChange={(e) => setWishInputName(e.target.value)}
              placeholder="Nama"
              required
              className="w-full rounded-xl bg-[#13271c] border border-[#d7ab58]/40 px-4 py-3 text-[#f3eee6] placeholder-[#6d8276] focus:outline-none focus:border-[#d7ab58] text-sm"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            />
            <textarea
              value={wishInputMessage}
              onChange={(e) => setWishInputMessage(e.target.value)}
              rows={4}
              placeholder="Tulis ucapan untuk kedua mempelai"
              required
              className="w-full rounded-xl bg-[#13271c] border border-[#d7ab58]/40 px-4 py-3 text-[#f3eee6] placeholder-[#6d8276] focus:outline-none focus:border-[#d7ab58] text-sm resize-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            />
            <button
              type="submit"
              className="w-full bg-[#d7ab58] hover:bg-[#e8c97e] active:scale-[0.98] text-[#102218] font-semibold py-3.5 rounded-full shadow-md transition-all cursor-pointer text-xs tracking-[0.2em] uppercase text-center"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KIRIM UCAPAN
            </button>
          </form>

          {/* List of wishes without card wrappers, with divider lines */}
          <div className="max-w-[340px] sm:max-w-[360px] mx-auto pt-2">
            <div className="w-full h-[1px] bg-[#d7ab58]/30 my-4" />
            <div className="space-y-4">
              {wishesList.map((w, idx) => (
                <div key={idx} className="text-left space-y-1">
                  <h4
                    className="text-sm sm:text-base font-normal text-[#d7ab58]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {w.name}
                  </h4>
                  <p
                    className="text-xs sm:text-sm text-[#f3eee6] leading-relaxed font-normal"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {w.message}
                  </p>
                  {idx < wishesList.length - 1 && (
                    <div className="w-full h-[1px] bg-[#d7ab58]/20 pt-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2.12 HADIAH PERNIKAHAN (KIRIM HADIAH) */}
        <section className="px-6 py-8 relative z-10 space-y-4">
          <div className="text-center mb-4">
            <h3
              className="text-base sm:text-lg tracking-[0.28em] uppercase text-[#d7ab58] font-normal"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              KIRIM HADIAH
            </h3>
            <div className="flex items-center justify-center space-x-3 my-3">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-6 h-6 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
            <p
              className="text-xs sm:text-sm text-[#e8c97e]/90 mt-2 max-w-[320px] mx-auto leading-relaxed italic"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Kehadiran Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:
            </p>
          </div>

          <div className="max-w-[340px] sm:max-w-[360px] mx-auto">
            {/* Single Gift Card */}
            <div className="bg-[#102218]/40 border border-[#d7ab58]/50 rounded-2xl p-6 sm:p-7 text-center shadow-xl space-y-3">
              <p
                className="text-xs sm:text-sm text-[#e8c97e] italic"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                [NAMA BANK] a.n Pramarta Chyntia Andita
              </p>
              <h4
                className="text-base sm:text-lg text-[#d7ab58] tracking-wider font-normal my-2 whitespace-nowrap"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                [NOMOR REKENING]
              </h4>
              <button
                type="button"
                onClick={() => handleCopyAccount("[NOMOR REKENING]", 1)}
                className="mt-3 w-full py-2.5 px-6 rounded-full border border-[#d7ab58]/60 hover:bg-[#d7ab58]/10 text-[#d7ab58] text-xs font-semibold tracking-[0.18em] uppercase transition-all cursor-pointer active:scale-95 block text-center"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {copiedIndex === 1 ? "✓ NOMOR REKENING TERSALIN!" : "SALIN NOMOR REKENING"}
              </button>
            </div>
          </div>
        </section>

        {/* 2.13 CLOSING (SUKSMA) */}
        <section className="pt-10 pb-0 text-center relative z-10 overflow-hidden">
          <div className="px-6 space-y-2.5">
            <h3
              className="text-5xl sm:text-6xl text-[#d7ab58] font-normal leading-none"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Suksma
            </h3>
            <p
              className="text-xs tracking-[0.3em] uppercase text-[#d7ab58] font-normal pt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              TERIMA KASIH
            </p>
            <div className="flex items-center justify-center space-x-3 my-2">
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
              <div className="w-5 h-5 relative">
                <Image
                  src={assets.melati || "/templates/bali-tropical/melati.png"}
                  alt="Melati"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-12 sm:w-16 h-[1px] bg-[#d7ab58]/60" />
            </div>
            <p
              className="text-xs sm:text-[13px] leading-relaxed text-[#f3eee6]/90 max-w-[290px] mx-auto font-light pt-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
            </p>
          </div>

          {/* Balinese Footer Penjor Arch with Overlayed Names */}
          <div className="relative w-full h-[230px] sm:h-[250px] mt-4 flex flex-col items-center justify-center">
            {/* The Penjors, Tassels, Flowers & Bottom Bar Image */}
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src="/templates/bali-tropical/footer-gapura.png"
                alt="Footer Penjor"
                fill
                priority
                className="object-contain object-bottom"
              />
            </div>

            {/* Couple Names & Om Shanti in the center of the Penjor arch */}
            <div className="relative z-10 text-center pb-8 sm:pb-9 space-y-1">
              <h4
                className="text-4xl sm:text-5xl text-[#d7ab58] font-normal leading-none"
                style={{ fontFamily: "'Pinyon Script', cursive" }}
              >
                Chyntia &amp; Rian
              </h4>
              <p
                className="text-[10px] sm:text-xs text-[#d7ab58] uppercase tracking-[0.22em] font-medium pt-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                OM SHANTI, SHANTI, SHANTI, OM
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-sm w-full h-[450px]">
            <Image
              src={lightboxImg}
              alt="Preview"
              fill
              className="object-contain rounded-lg"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
