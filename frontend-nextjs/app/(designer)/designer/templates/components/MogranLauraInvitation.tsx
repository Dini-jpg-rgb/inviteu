"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { weddingTheme, TemplateTheme } from "../themes/wedding";

interface MogranLauraInvitationProps {
  themeData?: TemplateTheme;
}

export function MogranLauraInvitation({ themeData = weddingTheme }: MogranLauraInvitationProps) {
  const { content, colorPalette } = themeData;

  // Form State
  const [guestName, setGuestName] = useState("");
  const [presence, setPresence] = useState<"Hadir" | "Tidak Hadir">("Hadir");
  const [guestCount, setGuestCount] = useState("2");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Gallery Lightbox Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Live Countdown Timer (Target: 28 Desember 2026)
  const [timeLeft, setTimeLeft] = useState({
    days: 74,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    const targetDate = new Date("2026-12-28T09:00:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert("Silakan masukkan nama Anda terlebih dahulu.");
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div
      className="w-full min-h-full font-serif text-[#24380f] select-text relative pb-16"
      style={{
        backgroundColor: colorPalette.background,
        fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ============================================================== */}
      {/* 1. HEADER & HERO COVER SECTION                                */}
      {/* ============================================================== */}
      <section className="relative px-6 pt-16 pb-12 text-center overflow-hidden">
        {/* Botanical leaf decorations on top sides */}
        <div className="absolute top-2 left-2 w-24 h-48 opacity-40 pointer-events-none">
          <svg viewBox="0 0 100 200" fill="none" className="w-full h-full text-[#6f7f5f]">
            <path
              d="M10 10 C 30 50, 60 40, 70 80 C 80 120, 20 150, 40 190"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M25 40 Q 55 35 60 55 Q 35 60 25 40 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M50 75 Q 85 80 80 100 Q 55 95 50 75 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M30 130 Q 60 145 50 165 Q 25 150 30 130 Z"
              fill="currentColor"
              opacity="0.6"
            />
          </svg>
        </div>
        <div className="absolute top-2 right-2 w-24 h-48 opacity-40 pointer-events-none -scale-x-100">
          <svg viewBox="0 0 100 200" fill="none" className="w-full h-full text-[#6f7f5f]">
            <path
              d="M10 10 C 30 50, 60 40, 70 80 C 80 120, 20 150, 40 190"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M25 40 Q 55 35 60 55 Q 35 60 25 40 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M50 75 Q 85 80 80 100 Q 55 95 50 75 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <path
              d="M30 130 Q 60 145 50 165 Q 25 150 30 130 Z"
              fill="currentColor"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Monogram "M / L" */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span
            className="text-4xl text-[#6f7f5f]"
            style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
          >
            {content.monogram.groomInitial}
          </span>
          <span className="text-xl text-[#d9d1cf] font-light rotate-12">/</span>
          <span
            className="text-4xl text-[#6f7f5f]"
            style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
          >
            {content.monogram.brideInitial}
          </span>
        </div>

        {/* Couple Big Names */}
        <h1 className="text-3xl sm:text-4xl tracking-[0.2em] font-normal text-[#455633] mb-1">
          {content.couple.groom}
        </h1>
        <div
          className="text-4xl text-[#6f7f5f] my-1"
          style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
        >
          {content.monogram.ampersand}
        </div>
        <h1 className="text-3xl sm:text-4xl tracking-[0.2em] font-normal text-[#455633] mb-8">
          {content.couple.bride}
        </h1>

        {/* A Special Invitation Note */}
        <div className="max-w-[280px] mx-auto space-y-2">
          <p className="text-xs tracking-[0.25em] uppercase text-[#6f7f5f] font-medium">
            {content.invitationNote.badge}
          </p>
          <p className="text-xl text-[#24380f] font-serif italic">
            {content.invitationNote.familyName}
          </p>
          <p className="text-[13px] leading-relaxed text-[#6f7f5f] font-normal">
            {content.invitationNote.message}
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. QUOTE BANNER (Forest Green Textured Block)                  */}
      {/* ============================================================== */}
      <section className="bg-[#455633] text-[#ececdf] px-6 py-8 text-center relative shadow-inner">
        <div className="border border-[#6f7f5f]/40 p-5 rounded-sm">
          <h2 className="text-lg tracking-wider font-normal mb-2 text-[#fffcea]">
            {content.banner.tag}
          </h2>
          <p className="text-xs leading-relaxed text-[#e4e3d7] font-light max-w-[280px] mx-auto mb-4">
            {content.banner.message}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm tracking-widest text-[#fffcea] uppercase">
            <span>{content.couple.groom}</span>
            <span
              className="text-lg lowercase text-[#cfcaa3]"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              &
            </span>
            <span>{content.couple.bride}</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. HERO COUPLE PHOTO                                          */}
      {/* ============================================================== */}
      <section className="relative w-full h-[420px] bg-zinc-100 overflow-hidden shadow-md">
        <Image
          src={content.heroImage}
          alt="Mogran & Laura Wedding Couple"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Soft gradient blend at edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* ============================================================== */}
      {/* 4. VENUE SECTION ("Where We Celebrate")                       */}
      {/* ============================================================== */}
      <section className="px-6 py-10 text-center flex flex-col items-center">
        {/* Section Badge */}
        <div className="inline-block bg-[#455633] text-[#fffcea] px-6 py-1.5 rounded-xs text-xs tracking-widest uppercase mb-6 shadow-sm">
          {content.venue.badge}
        </div>

        {/* Vintage Ornate Mirror Frame enclosing venue photo */}
        <div className="relative p-3 rounded-[120px] border-[5px] border-[#848858] bg-[#6f7f5f]/15 shadow-xl w-[260px] h-[340px] flex items-center justify-center mb-6">
          {/* Inner ornamental ring */}
          <div className="relative w-full h-full rounded-[110px] overflow-hidden border-[3px] border-[#e4dec3] ring-1 ring-[#455633]/20">
            <Image
              src={content.venue.image}
              alt="Wedding Venue Sangeh Bali"
              fill
              className="object-cover"
            />
          </div>

          {/* Decorative Corner flourish dots */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#848858] border-2 border-white" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#848858] border-2 border-white" />
        </div>

        {/* Venue Address Card */}
        <div className="w-full max-w-[290px] bg-[#fffcea] border border-[#d9d1cf] rounded-md p-4 text-center shadow-xs">
          <h3 className="text-xl font-normal text-[#24380f] tracking-wide mb-1">
            {content.venue.placeName}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line mb-3">
            {content.venue.address}
          </p>
          <a
            href={content.venue.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-semibold text-[#455633] hover:text-[#6f7f5f] underline tracking-wider"
          >
            {content.venue.mapLinkText}
          </a>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SAVE THE DATE & DATE SECTION                                */}
      {/* ============================================================== */}
      <section className="px-6 py-6 text-center flex flex-col items-center border-t border-[#d9d1cf]/60">
        <div className="inline-block bg-[#455633] text-[#fffcea] px-5 py-1 rounded-xs text-xs tracking-widest uppercase mb-3 shadow-xs">
          {content.saveTheDate.badge}
        </div>

        <h3
          className="text-4xl text-[#6f7f5f] mb-3"
          style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
        >
          {content.saveTheDate.monthText}
        </h3>

        {/* Circular Date Badge */}
        <div className="w-16 h-16 rounded-full border-2 border-[#455633] flex flex-col items-center justify-center bg-white shadow-sm mb-2">
          <span className="text-2xl font-bold text-[#455633] leading-none">
            {content.saveTheDate.dateNumber}
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
            {content.saveTheDate.yearText}
          </span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. DRESSCODE SECTION                                          */}
      {/* ============================================================== */}
      <section className="px-6 py-8 text-center bg-[#f9f8f3] border-y border-[#d9d1cf]/60">
        <h3
          className="text-4xl text-[#6f7f5f] mb-1"
          style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
        >
          {content.dresscode.title}
        </h3>
        <p className="text-[11px] text-zinc-500 tracking-widest uppercase mb-4">
          {content.dresscode.subtitle}
        </p>

        {/* Color Palette Swatches */}
        <div className="flex items-center justify-center space-x-2.5 max-w-[280px] mx-auto">
          {content.dresscode.palettes.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center group cursor-pointer">
              <div
                className="w-10 h-10 rounded-sm shadow-xs border border-black/10 transition-transform group-hover:scale-110"
                style={{ backgroundColor: item.hex }}
                title={item.name}
              />
              <span className="text-[9px] text-zinc-500 mt-1 max-w-[42px] truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. GALLERY SECTION                                            */}
      {/* ============================================================== */}
      <section className="px-6 py-10 text-center">
        <h3
          className="text-4xl text-[#6f7f5f] mb-6"
          style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
        >
          {content.gallery.title}
        </h3>

        {/* 2x2 Photo Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-[310px] mx-auto">
          {content.gallery.images.map((imgSrc, i) => (
            <div
              key={i}
              onClick={() => setSelectedImage(imgSrc)}
              className="relative aspect-3/4 rounded-sm overflow-hidden shadow-sm cursor-pointer border border-[#d9d1cf] hover:opacity-95 transition-opacity group"
            >
              <Image
                src={imgSrc}
                alt={`Wedding Moment ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/80 text-zinc-800 text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  🔍 Perbesar
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. RSVP INTERACTIVE FORM SECTION                              */}
      {/* ============================================================== */}
      <section className="px-6 py-10 bg-[#f4f3ec] border-t border-[#d9d1cf]/60 text-center">
        <h3 className="text-2xl font-normal text-[#455633] mb-2 tracking-wide">
          {content.rsvp.title}
        </h3>
        <p className="text-xs text-zinc-600 leading-relaxed max-w-[280px] mx-auto mb-6">
          {content.rsvp.subtitle}
        </p>

        {isSubmitted ? (
          <div className="bg-[#fffcea] border border-[#848858] p-5 rounded-md max-w-[290px] mx-auto text-center animate-fade-in shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#6f7f5f] text-white flex items-center justify-center mx-auto mb-2 text-lg">
              ✓
            </div>
            <h4 className="font-semibold text-sm text-[#455633]">Konfirmasi Diterima!</h4>
            <p className="text-xs text-zinc-600 mt-1">
              Terima kasih, <strong>{guestName}</strong>. Jawaban Anda ({presence}) telah tersimpan.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-3 text-[11px] text-[#455633] underline hover:text-[#6f7f5f]"
            >
              Kirim respon lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleRsvpSubmit} className="space-y-3.5 max-w-[290px] mx-auto text-left">
            {/* Field: Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {content.rsvp.fields.nameLabel}
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda..."
                required
                className="w-full bg-[#fffcea] border border-[#d9d1cf] rounded-sm px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#848858]"
              />
            </div>

            {/* Field: Presence Options */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Konfirmasi Kehadiran
              </label>
              <div className="grid grid-cols-2 gap-2">
                {content.rsvp.fields.presenceOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setPresence(opt as "Hadir" | "Tidak Hadir")}
                    className={`py-2 px-3 text-xs rounded-sm border transition-colors flex items-center justify-center space-x-1.5 ${
                      presence === opt
                        ? "bg-[#848858] text-white border-[#848858] shadow-xs font-medium"
                        : "bg-[#fffcea] text-zinc-700 border-[#d9d1cf] hover:bg-white"
                    }`}
                  >
                    <span className="text-[10px]">{presence === opt ? "●" : "○"}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Guest Count */}
            {presence === "Hadir" && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  {content.rsvp.fields.guestCountLabel}
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full bg-[#fffcea] border border-[#d9d1cf] rounded-sm px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#848858]"
                >
                  <option value="1">1 Orang</option>
                  <option value="2">2 Orang</option>
                  <option value="3">3 Orang</option>
                  <option value="4+">Lebih dari 3 Orang</option>
                </select>
              </div>
            )}

            {/* Field: Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                {content.rsvp.fields.notesLabel} / Ucapan & Doa
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Tulis ucapan selamat atau doa restu untuk kedua mempelai..."
                className="w-full bg-[#fffcea] border border-[#d9d1cf] rounded-sm px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#848858]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#848858] hover:bg-[#6f7f5f] text-white font-medium py-2.5 px-4 rounded-sm text-xs tracking-wider uppercase transition-colors shadow-sm"
            >
              {content.rsvp.fields.submitText}
            </button>
          </form>
        )}
      </section>

      {/* ============================================================== */}
      {/* 9. FOOTER & COUNTDOWN SECTION ("Until We Meet")               */}
      {/* ============================================================== */}
      <footer className="bg-[#455633] text-[#fffcea] px-6 py-12 text-center relative overflow-hidden">
        <h3 className="text-2xl font-normal tracking-wide mb-2">
          {content.closing.title}
        </h3>
        <p className="text-xs leading-relaxed text-[#ececdf] max-w-[280px] mx-auto mb-8 font-light whitespace-pre-line">
          {content.closing.message}
        </p>

        {/* Live Countdown Box */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#d9d1cf] mb-3">
            {content.closing.countdownTitle}
          </p>
          <div className="grid grid-cols-4 gap-2 max-w-[260px] mx-auto">
            <div className="bg-[#24380f]/60 border border-[#6f7f5f]/40 p-2 rounded-xs">
              <span className="block text-lg font-bold text-white">{timeLeft.days}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#d9d1cf]">Hari</span>
            </div>
            <div className="bg-[#24380f]/60 border border-[#6f7f5f]/40 p-2 rounded-xs">
              <span className="block text-lg font-bold text-white">{timeLeft.hours}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#d9d1cf]">Jam</span>
            </div>
            <div className="bg-[#24380f]/60 border border-[#6f7f5f]/40 p-2 rounded-xs">
              <span className="block text-lg font-bold text-white">{timeLeft.minutes}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#d9d1cf]">Menit</span>
            </div>
            <div className="bg-[#24380f]/60 border border-[#6f7f5f]/40 p-2 rounded-xs">
              <span className="block text-lg font-bold text-white">{timeLeft.seconds}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#d9d1cf]">Detik</span>
            </div>
          </div>
        </div>

        {/* Final Signatures */}
        <div className="border-t border-[#6f7f5f]/30 pt-6 max-w-[260px] mx-auto">
          <h4
            className="text-2xl text-[#fcf3dd] mb-1"
            style={{ fontFamily: "'Alex Brush', 'Pinyon Script', cursive" }}
          >
            {content.closing.coupleNames}
          </h4>
          <p className="text-[11px] text-[#ececdf]/80 tracking-widest uppercase">
            {content.closing.tagline}
          </p>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 10. GALLERY LIGHTBOX MODAL                                    */}
      {/* ============================================================== */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[340px] w-full max-h-[85vh] aspect-3/4 rounded-lg overflow-hidden bg-black shadow-2xl"
          >
            <Image
              src={selectedImage}
              alt="Enlarged Wedding Photo"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
