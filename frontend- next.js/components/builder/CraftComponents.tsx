"use client";

import React, { useState, useContext, useRef } from "react";
import Image from "next/image";
import { useNode as useCraftNode, UserComponent } from "@craftjs/core";
import {
  JavaneseTopBorder,
  JavaneseStarDivider,
  MosqueSilhouette,
  JavanesePointedArchFrame,
} from "@/app/(partner)/templates/components/JavaneseElegantInvitation";

// Safe wrapper around useNode to allow Craft components to render both inside <Editor /> canvas and in preview modal outside <Editor />
export const useNode = <S = null>(collector?: (node: any) => S): any => {
  try {
    return useCraftNode(collector);
  } catch {
    return {
      connectors: {
        connect: (dom: any) => dom,
        drag: (dom: any) => dom,
      },
      selected: false,
      actions: {
        setProp: () => {},
      },
      ...(collector ? ({} as any) : {}),
    };
  }
};

// Live Context for seamless real-time syncing between right sidebar form and canvas
export const BuilderLiveContext = React.createContext<{
  sectionData: any;
  activeSection?: string;
  setSectionData?: React.Dispatch<React.SetStateAction<any>>;
} | null>(null);

// 1. Root Container
export const CraftContainer: UserComponent<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-full w-full bg-[#fcfaf7] font-serif text-[#24380f] ${className}`}
    >
      {children}
    </div>
  );
};

CraftContainer.craft = {
  displayName: "Container",
  rules: {
    canDrop: () => true,
  },
};

// 2. Cover Section
export interface CraftCoverProps {
  monogram?: string;
  coupleNames?: string;
  inviteeName?: string;
  subtitle?: string;
  date?: string;
}

export const CraftCoverSection: UserComponent<CraftCoverProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.cover || props;
  const monogram = data.monogram ?? props.monogram ?? "M / L";
  const coupleNames = data.coupleNames ?? props.coupleNames ?? "MOGRAN & LAURA";
  const inviteeName = data.inviteeName ?? props.inviteeName ?? "Caine";
  const subtitle = data.subtitle ?? props.subtitle ?? "We would be delighted to have you with us as we celebrate the beginning of our forever.";
  const date = data.date ?? props.date ?? "20 Januari 2027";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-cover"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative px-6 pt-12 pb-8 text-center transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      {/* Monogram */}
      <div className="mx-auto mb-3 flex items-center justify-center">
        <span
          className="text-2xl text-[#6b7b5b] italic"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {monogram}
        </span>
      </div>

      {/* Main Couple Name */}
      <h1
        className="text-2xl font-bold tracking-[0.2em] text-[#334626] uppercase mb-4"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {coupleNames}
      </h1>

      {/* Invitee Label */}
      <div className="my-4">
        <p className="text-[11px] text-[#718260] tracking-wider uppercase mb-1">
          A Special Invitation
        </p>
        <p
          className="text-lg font-serif italic text-[#334626]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {inviteeName}
        </p>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-[#526343] italic max-w-[260px] mx-auto leading-relaxed">
        {subtitle}
      </p>

      {/* Date */}
      <p className="text-[11px] tracking-widest text-[#718260] uppercase mt-3">
        {date}
      </p>
    </div>
  );
};

CraftCoverSection.craft = {
  displayName: "Cover",
  props: {
    monogram: "M / L",
    coupleNames: "MOGRAN & LAURA",
    inviteeName: "Caine",
    subtitle: "We would be delighted to have you with us as we celebrate the beginning of our forever.",
    date: "20 Januari 2027",
  },
};

// 3. Opening Section
export interface CraftOpeningProps {
  quoteTitle?: string;
  quoteMessage?: string;
  coupleSign?: string;
}

export const CraftOpeningSection: UserComponent<CraftOpeningProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.opening || props;
  const quoteTitle = data.quoteTitle ?? props.quoteTitle ?? "Two Hearts, One Journey";
  const quoteMessage = data.quoteMessage ?? props.quoteMessage ?? "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.";
  const coupleSign = data.coupleSign ?? props.coupleSign ?? "MOGRAN & LAURA";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-opening"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      {/* Dark Forest Green Banner */}
      <div className="bg-[#384c2a] text-[#f4efe8] py-8 px-6 text-center space-y-2">
        <p
          className="text-sm font-medium tracking-wide italic"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {quoteTitle}
        </p>
        <p className="text-[11px] text-[#cfdcbe] max-w-[280px] mx-auto leading-relaxed italic">
          {quoteMessage}
        </p>
        <p
          className="text-xs tracking-[0.25em] text-[#e3edd4] uppercase pt-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {coupleSign}
        </p>
      </div>

      {/* Couple Photo Area */}
      <div className="relative h-44 w-full bg-zinc-200 overflow-hidden flex items-center justify-center">
        {/* Placeholder Couple Photo */}
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/templates/wedding/couple-main.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      </div>
    </div>
  );
};

CraftOpeningSection.craft = {
  displayName: "Opening",
  props: {
    quoteTitle: "Two Hearts, One Journey",
    quoteMessage: "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
    coupleSign: "MOGRAN & LAURA",
  },
};

// 4. Bride & Groom Section
export interface CraftBrideGroomProps {
  groomName?: string;
  groomParents?: string;
  brideName?: string;
  brideParents?: string;
}

export const CraftBrideGroomSection: UserComponent<CraftBrideGroomProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.brideGroom || props;
  const groomName = data.groomName ?? props.groomName ?? "Mogran Arisatya, S.T";
  const groomParents = data.groomParents ?? props.groomParents ?? "Putra pertama dari Bapak Hendra & Ibu Sukerti";
  const brideName = data.brideName ?? props.brideName ?? "Laura Chyntia, S.Ked";
  const brideParents = data.brideParents ?? props.brideParents ?? "Putri pertama dari Bapak Suartana & Ibu Murniati";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-bride-groom"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-8 text-center space-y-6 transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-[#718260] font-semibold">
          Kedua Mempelai
        </p>
        <div className="w-10 h-[1px] bg-[#a8b898] mx-auto my-1" />
      </div>

      {/* Groom */}
      <div className="space-y-1">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#e8eedf] border border-[#a8b898] flex items-center justify-center text-xl text-[#4a5f36]">
          ��
        </div>
        <h3
          className="text-base font-bold text-[#2d3f1d]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {groomName}
        </h3>
        <p className="text-[11px] text-[#637552] italic max-w-[240px] mx-auto leading-relaxed">
          {groomParents}
        </p>
      </div>

      <span className="text-xl text-[#718260] italic block font-serif">&amp;</span>

      {/* Bride */}
      <div className="space-y-1">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#e8eedf] border border-[#a8b898] flex items-center justify-center text-xl text-[#4a5f36]">
          ��
        </div>
        <h3
          className="text-base font-bold text-[#2d3f1d]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {brideName}
        </h3>
        <p className="text-[11px] text-[#637552] italic max-w-[240px] mx-auto leading-relaxed">
          {brideParents}
        </p>
      </div>
    </div>
  );
};

CraftBrideGroomSection.craft = {
  displayName: "Bride and Groom",
  props: {
    groomName: "Mogran Arisatya, S.T",
    groomParents: "Putra pertama dari Bapak Hendra & Ibu Sukerti",
    brideName: "Laura Chyntia, S.Ked",
    brideParents: "Putri pertama dari Bapak Suartana & Ibu Murniati",
  },
};

// 5. Event Details Section (Matches User Reference Image!)
export interface CraftEventDetailsProps {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}

export const CraftEventDetailsSection: UserComponent<CraftEventDetailsProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.eventDetails || props;
  const eventName = data.eventName ?? props.eventName ?? "Akad dan resepsi";
  const eventDate = data.eventDate ?? props.eventDate ?? "20 Januari 2027";
  const eventTime = data.eventTime ?? props.eventTime ?? "10.00 - 13.00 WITA";
  const eventLocation = data.eventLocation ?? props.eventLocation ?? "Jl Pererenan, Canggu";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-event-details"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-8 text-center transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="bg-[#fffdf9] border border-[#d2dec3] rounded-2xl p-6 shadow-xs space-y-4">
        {/* Event Header */}
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#718260] font-semibold">
            Rangkaian Acara
          </p>
          <h2
            className="text-xl font-bold text-[#2d3f1d]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {eventName}
          </h2>
        </div>

        {/* Date & Time */}
        <div className="py-2 border-y border-[#e2ebd6] space-y-1">
          <p className="text-xs font-semibold text-[#384c2a] tracking-wide">
            ��️ {eventDate}
          </p>
          <p className="text-[11px] text-[#637552]">
            ⏰ {eventTime}
          </p>
        </div>

        {/* Location */}
        <div className="space-y-1 pt-1">
          <p className="text-[11px] text-[#718260] font-medium uppercase tracking-wider">
            Lokasi Acara
          </p>
          <p className="text-xs text-[#2d3f1d] font-semibold">
            {eventLocation}
          </p>
          <button
            type="button"
            className="mt-2 text-[11px] bg-[#384c2a] hover:bg-[#2b3a20] text-white py-1.5 px-4 rounded-full transition-colors inline-block"
          >
            �� Buka Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

CraftEventDetailsSection.craft = {
  displayName: "Event Details",
  props: {
    eventName: "Akad dan resepsi",
    eventDate: "20 Januari 2027",
    eventTime: "10.00 - 13.00 WITA",
    eventLocation: "Jl Pererenan, Canggu",
  },
};

// 6. Countdown Section
export interface CraftCountdownProps {
  countdownTitle?: string;
  targetDate?: string;
}

export const CraftCountdownSection: UserComponent<CraftCountdownProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.countdown || props;
  const countdownTitle = data.countdownTitle ?? props.countdownTitle ?? "Menuju Hari Bahagia";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-countdown"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-6 text-center space-y-3 transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#718260] font-semibold">
        {countdownTitle}
      </p>

      {/* Countdown Digits Grid */}
      <div className="grid grid-cols-4 gap-2 max-w-[280px] mx-auto">
        {[
          { label: "Hari", val: "74" },
          { label: "Jam", val: "14" },
          { label: "Menit", val: "32" },
          { label: "Detik", val: "45" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#eef3e8] border border-[#ccdcc1] rounded-xl p-2.5 text-center"
          >
            <span
              className="text-lg font-bold text-[#384c2a] block"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {item.val}
            </span>
            <span className="text-[10px] text-[#637552] uppercase tracking-wider block">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

CraftCountdownSection.craft = {
  displayName: "Countdown",
  props: {
    countdownTitle: "Menuju Hari Bahagia",
    targetDate: "2027-01-20T10:00:00",
  },
};

// 7. Story Section
export interface CraftStoryProps {
  storyTitle?: string;
  storyMessage?: string;
}

export const CraftStorySection: UserComponent<CraftStoryProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.story || props;
  const storyTitle = data.storyTitle ?? props.storyTitle ?? "Kisah Kami";
  const storyMessage = data.storyMessage ?? props.storyMessage ?? "Pertemuan sederhana yang bermula dari tatap pertama, tumbuh menjadi persahabatan, hingga akhirnya bermuara pada janji suci pernikahan seumur hidup.";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-story"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-6 text-center space-y-3 transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-[#718260] font-semibold">
          {storyTitle}
        </p>
        <div className="w-10 h-[1px] bg-[#a8b898] mx-auto my-1" />
      </div>

      <div className="bg-[#fffdf9] border border-[#d2dec3] rounded-2xl p-5 text-left shadow-xs space-y-2">
        <p className="text-xs text-[#445832] leading-relaxed italic">
          "{storyMessage}"
        </p>
      </div>
    </div>
  );
};

CraftStorySection.craft = {
  displayName: "Story",
  props: {
    storyTitle: "Kisah Kami",
    storyMessage: "Pertemuan sederhana yang bermula dari tatap pertama, tumbuh menjadi persahabatan, hingga akhirnya bermuara pada janji suci pernikahan seumur hidup.",
  },
};

// 8. Gallery Section
export interface CraftGalleryProps {
  galleryTitle?: string;
  gallerySubtitle?: string;
}

export const CraftGallerySection: UserComponent<CraftGalleryProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.gallery || props;
  const galleryTitle = data.galleryTitle ?? props.galleryTitle ?? "Galeri Momen";
  const gallerySubtitle = data.gallerySubtitle ?? props.gallerySubtitle ?? "Potret kebersamaan dan kenangan indah kami berdua.";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-gallery"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-6 text-center space-y-3 transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-[#718260] font-semibold">
          {galleryTitle}
        </p>
        <p className="text-[11px] text-[#637552] italic">{gallerySubtitle}</p>
      </div>

      {/* Masonry / Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square bg-zinc-200 rounded-xl overflow-hidden border border-[#ccdcc1] relative"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('/templates/wedding/gallery-${i}.jpg')`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

CraftGallerySection.craft = {
  displayName: "Gallery",
  props: {
    galleryTitle: "Galeri Momen",
    gallerySubtitle: "Potret kebersamaan dan kenangan indah kami berdua.",
  },
};

// 9. RSVP Section
export interface CraftRsvpProps {
  rsvpTitle?: string;
  rsvpDeadline?: string;
  submitButtonText?: string;
}

export const CraftRsvpSection: UserComponent<CraftRsvpProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.rsvp || props;
  const rsvpTitle = data.rsvpTitle ?? props.rsvpTitle ?? "Konfirmasi Kehadiran";
  const rsvpDeadline = data.rsvpDeadline ?? props.rsvpDeadline ?? "Mohon konfirmasi kehadiran sebelum 10 Januari 2027";
  const submitButtonText = data.submitButtonText ?? props.submitButtonText ?? "Kirim Konfirmasi";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-rsvp"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-6 text-center transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="bg-[#fffdf9] border border-[#d2dec3] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#718260] font-semibold">
            {rsvpTitle}
          </p>
          <p className="text-[11px] text-[#637552] italic">{rsvpDeadline}</p>
        </div>

        {/* Dummy Input */}
        <input
          type="text"
          placeholder="Nama Lengkap"
          disabled
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500"
        />

        {/* Attendance Buttons */}
        <div className="flex gap-2">
          <div className="flex-1 py-2 bg-[#384c2a] text-white rounded-lg text-xs font-semibold text-center">
            Hadir
          </div>
          <div className="flex-1 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-xs text-center">
            Tidak Hadir
          </div>
        </div>

        <button
          type="button"
          className="w-full bg-[#E89F3C] text-black font-semibold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors"
        >
          {submitButtonText}
        </button>
      </div>
    </div>
  );
};

CraftRsvpSection.craft = {
  displayName: "RSVP",
  props: {
    rsvpTitle: "Konfirmasi Kehadiran",
    rsvpDeadline: "Mohon konfirmasi kehadiran sebelum 10 Januari 2027",
    submitButtonText: "Kirim Konfirmasi",
  },
};

// 10. Digital Gift Section
export interface CraftDigitalGiftProps {
  giftTitle?: string;
  giftSubtitle?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export const CraftDigitalGiftSection: UserComponent<CraftDigitalGiftProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.digitalGift || props;
  const giftTitle = data.giftTitle ?? props.giftTitle ?? "Tanda Kasih Digital";
  const giftSubtitle = data.giftSubtitle ?? props.giftSubtitle ?? "Bila berkenan memberikan tanda kasih digital untuk kedua mempelai:";
  const bankName = data.bankName ?? props.bankName ?? "Bank BCA";
  const accountNumber = data.accountNumber ?? props.accountNumber ?? "7720918231";
  const accountHolder = data.accountHolder ?? props.accountHolder ?? "Mogran Arisatya";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-digital-gift"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-6 text-center transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <div className="bg-[#fffdf9] border border-[#d2dec3] rounded-2xl p-5 shadow-xs space-y-2.5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#718260] font-semibold">
          {giftTitle}
        </p>
        <p className="text-[11px] text-[#637552] italic max-w-[240px] mx-auto leading-relaxed">
          {giftSubtitle}
        </p>

        <div className="bg-[#eef3e8] border border-[#ccdcc1] rounded-xl p-3.5 space-y-1">
          <p className="text-xs font-bold text-[#384c2a]">{bankName}</p>
          <p className="text-sm font-mono tracking-wider font-semibold text-zinc-800">
            {accountNumber}
          </p>
          <p className="text-[11px] text-[#637552] italic">a.n. {accountHolder}</p>
        </div>

        <button
          type="button"
          className="w-full border border-[#384c2a] text-[#384c2a] hover:bg-[#384c2a] hover:text-white transition-colors py-2 rounded-full text-xs font-medium"
        >
          �� Salin Nomor Rekening
        </button>
      </div>
    </div>
  );
};

CraftDigitalGiftSection.craft = {
  displayName: "Digital Gift",
  props: {
    giftTitle: "Tanda Kasih Digital",
    giftSubtitle: "Bila berkenan memberikan tanda kasih digital untuk kedua mempelai:",
    bankName: "Bank BCA",
    accountNumber: "7720918231",
    accountHolder: "Mogran Arisatya",
  },
};

// 11. Closing Section
export interface CraftClosingProps {
  closingTitle?: string;
  closingMessage?: string;
  signature?: string;
}

export const CraftClosingSection: UserComponent<CraftClosingProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.closing || props;
  const closingTitle = data.closingTitle ?? props.closingTitle ?? "Terima Kasih";
  const closingMessage = data.closingMessage ?? props.closingMessage ?? "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.";
  const signature = data.signature ?? props.signature ?? "Mogran & Laura";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-closing"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 pt-6 pb-12 text-center space-y-3 transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#E89F3C] ring-offset-2" : "hover:outline hover:outline-dashed hover:outline-amber-300"
      }`}
    >
      <h3
        className="text-xl font-bold text-[#2d3f1d]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {closingTitle}
      </h3>
      <p className="text-xs text-[#526343] italic max-w-[260px] mx-auto leading-relaxed">
        {closingMessage}
      </p>
      <p
        className="text-lg font-serif italic text-[#384c2a] pt-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {signature}
      </p>
    </div>
  );
};

CraftClosingSection.craft = {
  displayName: "Closing",
  props: {
    closingTitle: "Terima Kasih",
    closingMessage: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.",
    signature: "Mogran & Laura",
  },
};



// ============================================================================
// BALI TROPICAL CRAFT COMPONENTS (Chyntia & Rian - Traditional Bali Luxury)
// ============================================================================

// 12. Bali Root Container
export const CraftBaliContainer: UserComponent<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-full w-full bg-[#102218] text-[#f3eee6] relative ${className}`}
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {children}
    </div>
  );
};

CraftBaliContainer.craft = {
  displayName: "Bali Container",
  rules: {
    canDrop: () => true,
  },
};

// 13. Bali Cover Section
export interface CraftBaliCoverProps {
  tagline?: string;
  theWeddingOf?: string;
  coupleTitle?: string;
  eventDate?: string;
  locationShort?: string;
  inviteeName?: string;
  heroImage?: string;
}

export const CraftBaliCoverSection: UserComponent<CraftBaliCoverProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.cover || props;
  const tagline = data.tagline ?? props.tagline ?? "OM SWASTIASTU";
  const theWeddingOf = data.theWeddingOf ?? props.theWeddingOf ?? "THE WEDDING OF";
  const coupleTitle = data.coupleTitle ?? props.coupleTitle ?? "Chyntia & Rian";
  const eventDate = data.eventDate ?? props.eventDate ?? "MINGGU · 22 NOVEMBER 2026";
  const locationShort = data.locationShort ?? props.locationShort ?? "Badung, Bali";
  const inviteeName = data.inviteeName ?? props.inviteeName ?? "Tamu Undangan";
  const heroImage = data.heroImage ?? props.heroImage ?? "/templates/wedding/couple-main.jpg";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-cover"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative px-4 pt-8 pb-10 text-center transition-all cursor-pointer bg-[#102218] overflow-hidden ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      {/* Daun Penjor background ornaments */}
      <div className="absolute top-0 left-0 w-20 h-28 pointer-events-none opacity-40">
        <Image
          src="/templates/bali-tropical/daun-penjor-kiri.png"
          alt="Daun Penjor Kiri"
          fill
          className="object-contain object-left-top"
        />
      </div>
      <div className="absolute top-0 right-0 w-20 h-28 pointer-events-none opacity-40">
        <Image
          src="/templates/bali-tropical/daun-penjor-kanan.png"
          alt="Daun Penjor Kanan"
          fill
          className="object-contain object-right-top"
        />
      </div>

      {/* Top Header */}
      <p
        className="text-[11px] tracking-[0.35em] uppercase text-[#d7ab58] font-medium mb-3 relative z-10"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {tagline}
      </p>

      {/* Golden Arch Frame with Hero Photo */}
      <div className="relative z-10 my-2 flex flex-col items-center">
        <div className="relative w-[150px] h-[210px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1.5 shadow-2xl flex items-center justify-center">
          <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/50 overflow-hidden bg-[#102218] flex items-center justify-center">
            <Image
              src={heroImage}
              alt="Foto Pasangan"
              fill
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102218] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Couple Title */}
      <div className="relative z-10 space-y-1 mt-3">
        <p
          className="text-[10px] tracking-[0.3em] text-[#d7ab58] uppercase font-light"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {theWeddingOf}
        </p>
        <h1
          className="text-3xl sm:text-4xl text-[#d7ab58] font-normal leading-tight"
          style={{ fontFamily: "'Pinyon Script', cursive" }}
        >
          {coupleTitle}
        </h1>
        <p
          className="text-[10px] tracking-[0.2em] uppercase text-[#e8c97e]/90 font-medium pt-1"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {eventDate}
        </p>
        <p className="text-xs text-[#d7ab58] italic">{locationShort}</p>
      </div>

      {/* Invitee Card & Button */}
      <div className="relative z-10 max-w-[240px] mx-auto mt-4 space-y-2.5">
        <div className="border border-[#d7ab58]/40 rounded-full py-1.5 px-3 bg-[#162e21]/90 text-center">
          <p className="text-[10px] text-[#e8c97e]/90">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <p className="text-xs font-semibold text-[#f3eee6] tracking-wide">[{inviteeName}]</p>
        </div>
        <div
          className="w-full bg-[#d7ab58] text-[#102218] font-bold text-[11px] tracking-[0.2em] py-2 rounded-full text-center shadow-md flex items-center justify-center space-x-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span>BUKA UNDANGAN</span>
          <span>✉️</span>
        </div>
      </div>
    </div>
  );
};

CraftBaliCoverSection.craft = {
  displayName: "Bali Cover",
  props: {
    tagline: "OM SWASTIASTU",
    theWeddingOf: "THE WEDDING OF",
    coupleTitle: "Chyntia & Rian",
    eventDate: "MINGGU · 22 NOVEMBER 2026",
    locationShort: "Badung, Bali",
    inviteeName: "Tamu Undangan",
    heroImage: "/templates/wedding/couple-main.jpg",
  },
};

// 14. Bali Opening Section
export interface CraftBaliOpeningProps {
  quoteTitle?: string;
  quoteMessage?: string;
  gapuraImage?: string;
}

export const CraftBaliOpeningSection: UserComponent<CraftBaliOpeningProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.opening || props;
  const quoteTitle = data.quoteTitle ?? props.quoteTitle ?? "Om Swastiastu";
  const quoteMessage = data.quoteMessage ?? props.quoteMessage ?? "Atas asung kerta wara nugraha Ida Sang Hyang Widhi Wasa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari pernikahan kami.";
  const gapuraImage = data.gapuraImage ?? props.gapuraImage ?? "/templates/bali-tropical/gapura-full.png";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-opening"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 pt-8 pb-4 text-center transition-all cursor-pointer bg-[#102218] relative ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <h2
        className="text-4xl text-[#d7ab58] font-normal mb-1"
        style={{ fontFamily: "'Pinyon Script', cursive" }}
      >
        {quoteTitle}
      </h2>

      {/* Melati flower divider */}
      <div className="flex items-center justify-center space-x-3 my-2.5">
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
        <div className="w-4 h-4 relative">
          <Image
            src="/templates/bali-tropical/melati.png"
            alt="Melati"
            fill
            className="object-contain"
          />
        </div>
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
      </div>

      <p className="text-xs leading-relaxed text-[#f3eee6]/90 max-w-[270px] mx-auto font-light mb-4">
        {quoteMessage}
      </p>

      {/* Grand Balinese Gapura Illustration */}
      <div className="relative w-full h-[180px] mt-2">
        <Image
          src={gapuraImage}
          alt="Gapura Bali"
          fill
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
};

CraftBaliOpeningSection.craft = {
  displayName: "Bali Opening",
  props: {
    quoteTitle: "Om Swastiastu",
    quoteMessage:
      "Atas asung kerta wara nugraha Ida Sang Hyang Widhi Wasa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari pernikahan kami.",
    gapuraImage: "/templates/bali-tropical/gapura-full.png",
  },
};

// 15. Bali Couple Section
export interface CraftBaliCoupleProps {
  brideName?: string;
  brideBio?: string;
  groomName?: string;
  groomBio?: string;
  brideImage?: string;
  groomImage?: string;
}

export const CraftBaliCoupleSection: UserComponent<CraftBaliCoupleProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.brideGroom || props;
  const brideName = data.brideName ?? props.brideName ?? "Ni Putu Chyntia Dewi, S.Ked";
  const brideBio = data.brideBio ?? props.brideBio ?? "Putri pertama dari Bapak I Wayan Suartana & Ibu Ni Ketut Murniati";
  const groomName = data.groomName ?? props.groomName ?? "I Made Rian Arisatya, S.T";
  const groomBio = data.groomBio ?? props.groomBio ?? "Putra pertama dari Bapak I Made Hendra & Ibu Ni Luh Sukerti";
  const brideImage = data.brideImage ?? props.brideImage ?? "/templates/wedding/gallery-1.jpg";
  const groomImage = data.groomImage ?? props.groomImage ?? "/templates/wedding/couple-main.jpg";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-bride-groom"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-6 py-8 text-center space-y-6 transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-center space-x-3 mb-2">
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
        <div
          className="flex items-center space-x-1.5 text-xs tracking-[0.25em] uppercase text-[#d7ab58]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span>MEMPELAI</span>
          <div className="w-3.5 h-3.5 relative">
            <Image
              src="/templates/bali-tropical/melati.png"
              alt="Melati"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
      </div>

      {/* Bride */}
      <div className="space-y-2 flex flex-col items-center">
        <div className="relative w-[150px] h-[200px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1 shadow-xl">
          <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/60 overflow-hidden bg-[#13271c]">
            <Image
              src={brideImage}
              alt="Mempelai Wanita"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-3 -left-4 w-14 h-12 pointer-events-none z-10">
            <Image
              src="/templates/bali-tropical/bunga-full.png"
              alt="Bunga Kamboja"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <h3
          className="text-sm font-semibold text-[#f3eee6] tracking-wide pt-1"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {brideName}
        </h3>
        <p className="text-[11px] text-[#e8c97e]/90 italic max-w-[240px] leading-relaxed">
          {brideBio}
        </p>
      </div>

      <div className="flex items-center justify-center my-1">
        <span
          className="text-2xl text-[#d7ab58] font-normal"
          style={{ fontFamily: "'Pinyon Script', cursive" }}
        >
          &amp;
        </span>
      </div>

      {/* Groom */}
      <div className="space-y-2 flex flex-col items-center">
        <div className="relative w-[150px] h-[200px] rounded-t-full border-[1.5px] border-[#d7ab58] bg-[#162e21] p-1 shadow-xl">
          <div className="relative w-full h-full rounded-t-full border border-[#d7ab58]/60 overflow-hidden bg-[#13271c]">
            <Image
              src={groomImage}
              alt="Mempelai Pria"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <h3
          className="text-sm font-semibold text-[#f3eee6] tracking-wide pt-1"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {groomName}
        </h3>
        <p className="text-[11px] text-[#e8c97e]/90 italic max-w-[240px] leading-relaxed">
          {groomBio}
        </p>
      </div>
    </div>
  );
};

CraftBaliCoupleSection.craft = {
  displayName: "Bali Couple",
  props: {
    brideName: "Ni Putu Chyntia Dewi, S.Ked",
    brideBio: "Putri pertama dari Bapak I Wayan Suartana & Ibu Ni Ketut Murniati",
    groomName: "I Made Rian Arisatya, S.T",
    groomBio: "Putra pertama dari Bapak I Made Hendra & Ibu Ni Luh Sukerti",
    brideImage: "/templates/wedding/gallery-1.jpg",
    groomImage: "/templates/wedding/couple-main.jpg",
  },
};

// 16. Bali Event Details Section
export interface CraftBaliEventDetailsProps {
  pawiwahanName?: string;
  pawiwahanDate?: string;
  pawiwahanTime?: string;
  pawiwahanLocation?: string;
  pawiwahanAddress?: string;
  resepsiName?: string;
  resepsiDate?: string;
  resepsiTime?: string;
  resepsiLocation?: string;
  resepsiAddress?: string;
}

export const CraftBaliEventDetailsSection: UserComponent<CraftBaliEventDetailsProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.eventDetails || props;
  const pawiwahanName = data.pawiwahanName ?? props.pawiwahanName ?? "Pawiwahan (Akad Nikah)";
  const pawiwahanDate = data.pawiwahanDate ?? props.pawiwahanDate ?? "Minggu, 22 November 2026";
  const pawiwahanTime = data.pawiwahanTime ?? props.pawiwahanTime ?? "09.00 - 11.00 WITA";
  const pawiwahanLocation = data.pawiwahanLocation ?? props.pawiwahanLocation ?? "Bale Banjar Adat & Kediaman";
  const pawiwahanAddress = data.pawiwahanAddress ?? props.pawiwahanAddress ?? "Jl. Raya Seminyak No. 88, Badung, Bali";
  const resepsiName = data.resepsiName ?? props.resepsiName ?? "Resepsi";
  const resepsiDate = data.resepsiDate ?? props.resepsiDate ?? "Minggu, 22 November 2026";
  const resepsiTime = data.resepsiTime ?? props.resepsiTime ?? "18.00 WITA - Selesai";
  const resepsiLocation = data.resepsiLocation ?? props.resepsiLocation ?? "The Kayana Sunset Garden Villa";
  const resepsiAddress = data.resepsiAddress ?? props.resepsiAddress ?? "Jl. Petitenget No. 100, Badung, Bali";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-event-details"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-8 text-center space-y-4 transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="flex items-center justify-center space-x-3 mb-2">
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
        <p
          className="text-xs uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          RANGKAIAN ACARA
        </p>
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
      </div>

      {/* Pawiwahan Card */}
      <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-2xl p-4 text-center space-y-2 shadow-lg">
        <h3
          className="text-xs uppercase tracking-[0.2em] text-[#d7ab58] font-semibold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {pawiwahanName}
        </h3>
        <div className="w-8 h-[1px] bg-[#d7ab58]/30 mx-auto" />
        <p className="text-xs font-semibold text-[#f3eee6]">{pawiwahanDate}</p>
        <p className="text-[11px] text-[#e8c97e]">⏰ {pawiwahanTime}</p>
        <p className="text-xs text-[#d7ab58] font-medium">{pawiwahanLocation}</p>
        <p className="text-[10px] text-[#f3eee6]/80 italic max-w-[220px] mx-auto">{pawiwahanAddress}</p>
      </div>

      {/* Resepsi Card */}
      <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-2xl p-4 text-center space-y-2 shadow-lg">
        <h3
          className="text-xs uppercase tracking-[0.2em] text-[#d7ab58] font-semibold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {resepsiName}
        </h3>
        <div className="w-8 h-[1px] bg-[#d7ab58]/30 mx-auto" />
        <p className="text-xs font-semibold text-[#f3eee6]">{resepsiDate}</p>
        <p className="text-[11px] text-[#e8c97e]">⏰ {resepsiTime}</p>
        <p className="text-xs text-[#d7ab58] font-medium">{resepsiLocation}</p>
        <p className="text-[10px] text-[#f3eee6]/80 italic max-w-[220px] mx-auto">{resepsiAddress}</p>
      </div>
    </div>
  );
};

CraftBaliEventDetailsSection.craft = {
  displayName: "Bali Event Details",
  props: {
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
};

// 17. Bali Countdown Section
export interface CraftBaliCountdownProps {
  countdownTitle?: string;
}

export const CraftBaliCountdownSection: UserComponent<CraftBaliCountdownProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.countdown || props;
  const countdownTitle = data.countdownTitle ?? props.countdownTitle ?? "COUNTDOWN HARI BAHAGIA";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-countdown"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center space-y-3 transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="flex items-center justify-center space-x-3 mb-1">
        <div className="w-6 h-[1px] bg-[#d7ab58]/50" />
        <p
          className="text-[11px] uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {countdownTitle}
        </p>
        <div className="w-6 h-[1px] bg-[#d7ab58]/50" />
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-[280px] mx-auto">
        {[
          { label: "Hari", val: "38" },
          { label: "Jam", val: "08" },
          { label: "Menit", val: "42" },
          { label: "Detik", val: "15" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#162e21] border border-[#d7ab58]/50 rounded-xl p-2.5 text-center shadow-md"
          >
            <span
              className="text-lg font-bold text-[#d7ab58] block leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {item.val}
            </span>
            <span className="text-[9px] text-[#e8c97e]/80 uppercase tracking-wider block mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

CraftBaliCountdownSection.craft = {
  displayName: "Bali Countdown",
  props: {
    countdownTitle: "COUNTDOWN HARI BAHAGIA",
  },
};

// 18. Bali Story Section
export interface CraftBaliStoryProps {
  storyTitle?: string;
  storyMessage?: string;
}

export const CraftBaliStorySection: UserComponent<CraftBaliStoryProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.story || props;
  const storyTitle = data.storyTitle ?? props.storyTitle ?? "KISAH KAMI";
  const storyMessage = data.storyMessage ?? props.storyMessage ?? "Kami bertemu pada sebuah momen sederhana. Dari obrolan ringan, tumbuhlah rasa yang kini kami bawa ke pelaminan dalam ikatan suci Dharma.";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-story"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center space-y-3 transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="flex items-center justify-center space-x-3 mb-1">
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
        <p
          className="text-xs uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {storyTitle}
        </p>
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
      </div>

      <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-2xl p-4 text-center shadow-md">
        <p className="text-xs text-[#f3eee6]/90 leading-relaxed italic">
          "{storyMessage}"
        </p>
      </div>
    </div>
  );
};

CraftBaliStorySection.craft = {
  displayName: "Bali Story",
  props: {
    storyTitle: "KISAH KAMI",
    storyMessage:
      "Kami bertemu pada sebuah momen sederhana. Dari obrolan ringan, tumbuhlah rasa yang kini kami bawa ke pelaminan dalam ikatan suci Dharma.",
  },
};

// 19. Bali Gallery Section
export interface CraftBaliGalleryProps {
  galleryTitle?: string;
  gallerySubtitle?: string;
}

export const CraftBaliGallerySection: UserComponent<CraftBaliGalleryProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.gallery || props;
  const galleryTitle = data.galleryTitle ?? props.galleryTitle ?? "GALERI";
  const gallerySubtitle = data.gallerySubtitle ?? props.gallerySubtitle ?? "Potret kebersamaan dan momen sakral kami berdua.";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-gallery"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center space-y-3 transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="flex items-center justify-center space-x-3 mb-1">
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
        <p
          className="text-xs uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {galleryTitle}
        </p>
        <div className="w-8 h-[1px] bg-[#d7ab58]/50" />
      </div>
      <p className="text-[11px] text-[#e8c97e]/80 italic">{gallerySubtitle}</p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl overflow-hidden border border-[#d7ab58]/40 relative bg-[#162e21]"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('/templates/wedding/gallery-${i}.jpg')`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

CraftBaliGallerySection.craft = {
  displayName: "Bali Gallery",
  props: {
    galleryTitle: "GALERI",
    gallerySubtitle: "Potret kebersamaan dan momen sakral kami berdua.",
  },
};

// 20. Bali RSVP Section
export interface CraftBaliRsvpProps {
  rsvpTitle?: string;
  rsvpDeadline?: string;
  submitButtonText?: string;
}

export const CraftBaliRsvpSection: UserComponent<CraftBaliRsvpProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.rsvp || props;
  const rsvpTitle = data.rsvpTitle ?? props.rsvpTitle ?? "KONFIRMASI KEHADIRAN";
  const rsvpDeadline = data.rsvpDeadline ?? props.rsvpDeadline ?? "Mohon konfirmasi kehadiran sebelum 15 November 2026";
  const submitButtonText = data.submitButtonText ?? props.submitButtonText ?? "KIRIM KONFIRMASI";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-rsvp"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-2xl p-5 shadow-lg space-y-3">
        <p
          className="text-xs uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {rsvpTitle}
        </p>
        <p className="text-[11px] text-[#e8c97e]/80 italic">{rsvpDeadline}</p>

        <input
          type="text"
          placeholder="Nama Lengkap"
          disabled
          className="w-full rounded-lg border border-[#d7ab58]/30 bg-[#102218] px-3 py-2 text-xs text-[#f3eee6] placeholder-[#f3eee6]/40"
        />

        <div className="flex gap-2">
          <div className="flex-1 py-1.5 bg-[#d7ab58] text-[#102218] font-bold rounded-lg text-xs text-center">
            Hadir
          </div>
          <div className="flex-1 py-1.5 border border-[#d7ab58]/40 text-[#e8c97e] rounded-lg text-xs text-center">
            Tidak Hadir
          </div>
        </div>

        <button
          type="button"
          className="w-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] font-bold py-2.5 rounded-full text-xs tracking-wider uppercase transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {submitButtonText}
        </button>
      </div>
    </div>
  );
};

CraftBaliRsvpSection.craft = {
  displayName: "Bali RSVP",
  props: {
    rsvpTitle: "KONFIRMASI KEHADIRAN",
    rsvpDeadline: "Mohon konfirmasi kehadiran sebelum 15 November 2026",
    submitButtonText: "KIRIM KONFIRMASI",
  },
};

// 21. Bali Voice Note Section (Private Message)
export interface CraftBaliVoiceNoteProps {
  voiceTitle?: string;
  voiceSubtitle?: string;
  submitButtonText?: string;
}

export const CraftBaliVoiceNoteSection: UserComponent<CraftBaliVoiceNoteProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.voiceNote || props;
  const voiceTitle = data.voiceTitle ?? props.voiceTitle ?? "PESAN PRIBADI";
  const voiceSubtitle = data.voiceSubtitle ?? props.voiceSubtitle ?? "Rekam pesan suara atau video singkat untuk kedua mempelai (maks. 10 detik)";
  const submitButtonText = data.submitButtonText ?? props.submitButtonText ?? "KIRIM BERSAMA RSVP";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-voice-note"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <div className="bg-[#162e21] border border-[#d7ab58]/40 rounded-2xl p-5 shadow-lg space-y-3">
        <p
          className="text-xs uppercase tracking-[0.25em] text-[#d7ab58] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {voiceTitle}
        </p>
        <p className="text-[11px] text-[#e8c97e]/80 italic max-w-[240px] mx-auto">
          {voiceSubtitle}
        </p>

        {/* Audio Waveform & Timer Simulation */}
        <div className="bg-[#102218] border border-[#d7ab58]/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-[#d7ab58]">00:07 / 00:10</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-4 w-1 bg-[#d7ab58] rounded-full" />
            <span className="h-6 w-1 bg-[#d7ab58] rounded-full" />
            <span className="h-3 w-1 bg-[#d7ab58] rounded-full" />
            <span className="h-5 w-1 bg-[#d7ab58] rounded-full" />
            <span className="h-2 w-1 bg-[#d7ab58] rounded-full" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-[#d7ab58] text-[#102218] font-bold py-2 rounded-lg text-xs text-center">
            �� Mulai Rekam
          </div>
          <div className="px-3 py-2 border border-[#d7ab58]/40 text-[#e8c97e] rounded-lg text-xs text-center">
            Reset
          </div>
        </div>

        <button
          type="button"
          className="w-full border border-[#d7ab58] text-[#d7ab58] font-medium py-2 rounded-full text-xs"
        >
          {submitButtonText}
        </button>
      </div>
    </div>
  );
};

CraftBaliVoiceNoteSection.craft = {
  displayName: "Bali Voice Note",
  props: {
    voiceTitle: "PESAN PRIBADI",
    voiceSubtitle: "Rekam pesan suara atau video singkat untuk kedua mempelai (maks. 10 detik)",
    submitButtonText: "KIRIM BERSAMA RSVP",
  },
};

// 22. Bali Wishes Section (Guestbook - matches User Image 1)
export interface CraftBaliWishesProps {
  wishesTitle?: string;
  submitButtonText?: string;
}

export const CraftBaliWishesSection: UserComponent<CraftBaliWishesProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.wishes || props;
  const wishesTitle = data.wishesTitle ?? props.wishesTitle ?? "UCAPAN & DOA";
  const submitButtonText = data.submitButtonText ?? props.submitButtonText ?? "KIRIM UCAPAN";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-wishes"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <h2
        className="text-lg tracking-[0.25em] uppercase text-[#d7ab58] font-medium mb-1"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {wishesTitle}
      </h2>

      {/* Melati flower divider */}
      <div className="flex items-center justify-center space-x-3 my-2.5">
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
        <div className="w-4 h-4 relative">
          <Image
            src="/templates/bali-tropical/melati.png"
            alt="Melati"
            fill
            className="object-contain"
          />
        </div>
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
      </div>

      {/* Box containing inputs */}
      <div className="border border-[#d7ab58]/30 rounded-2xl p-4 bg-[#14291e] space-y-3 shadow-md text-left">
        <input
          type="text"
          placeholder="Nama"
          disabled
          className="w-full rounded-lg border border-[#d7ab58]/20 bg-[#1a3426] px-3.5 py-2 text-xs text-[#f3eee6] placeholder-[#f3eee6]/50"
        />

        <textarea
          rows={3}
          placeholder="Tulis ucapan untuk kedua mempelai"
          disabled
          className="w-full rounded-lg border border-[#d7ab58]/20 bg-[#1a3426] px-3.5 py-2 text-xs text-[#f3eee6] placeholder-[#f3eee6]/50 resize-none"
        />

        <button
          type="button"
          className="w-full bg-[#d7ab58] hover:bg-[#e8c97e] text-[#102218] font-bold py-2.5 rounded-full text-xs tracking-wider uppercase transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {submitButtonText}
        </button>
      </div>

      {/* Comments list matching user screenshot */}
      <div className="mt-4 pt-2 text-left space-y-3 px-1">
        <div className="border-b border-[#d7ab58]/20 pb-2">
          <p className="text-xs font-semibold text-[#d7ab58]" style={{ fontFamily: "'Cinzel', serif" }}>
            Bu Retno
          </p>
          <p className="text-[11px] text-[#f3eee6]/90 mt-0.5">
            Selamat menempuh hidup baru, semoga bahagia selalu.
          </p>
        </div>

        <div className="border-b border-[#d7ab58]/20 pb-2">
          <p className="text-xs font-semibold text-[#d7ab58]" style={{ fontFamily: "'Cinzel', serif" }}>
            Mas Dimas
          </p>
          <p className="text-[11px] text-[#f3eee6]/90 mt-0.5">
            Semoga langgeng sampai kakek nenek ya!
          </p>
        </div>
      </div>
    </div>
  );
};

CraftBaliWishesSection.craft = {
  displayName: "Bali Wishes",
  props: {
    wishesTitle: "UCAPAN & DOA",
    submitButtonText: "KIRIM UCAPAN",
  },
};

// 23. Bali Digital Gift Section (Matches User Image 2 - horizontal account number, no Waktu Makan)
export interface CraftBaliGiftProps {
  giftTitle?: string;
  giftSubtitle?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  buttonText?: string;
}

export const CraftBaliGiftSection: UserComponent<CraftBaliGiftProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.digitalGift || props;
  const giftTitle = data.giftTitle ?? props.giftTitle ?? "KIRIM HADIAH";
  const giftSubtitle = data.giftSubtitle ?? props.giftSubtitle ?? "Kehadiran Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:";
  const bankName = data.bankName ?? props.bankName ?? "[NAMA BANK]";
  const accountHolder = data.accountHolder ?? props.accountHolder ?? "Pramarta Chyntia Andita";
  const accountNumber = data.accountNumber ?? props.accountNumber ?? "[NOMOR REKENING]";
  const buttonText = data.buttonText ?? props.buttonText ?? "SALIN NOMOR REKENING";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-digital-gift"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 py-6 text-center transition-all cursor-pointer bg-[#102218] ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <h2
        className="text-lg tracking-[0.25em] uppercase text-[#d7ab58] font-medium mb-1"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {giftTitle}
      </h2>

      {/* Melati flower divider */}
      <div className="flex items-center justify-center space-x-3 my-2.5">
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
        <div className="w-4 h-4 relative">
          <Image
            src="/templates/bali-tropical/melati.png"
            alt="Melati"
            fill
            className="object-contain"
          />
        </div>
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
      </div>

      <p className="text-xs text-[#f3eee6]/90 max-w-[260px] mx-auto leading-relaxed mb-4 font-light">
        {giftSubtitle}
      </p>

      {/* Rounded border box matching user's Image 2 */}
      <div className="border border-[#d7ab58]/40 rounded-2xl p-5 bg-[#14291e] space-y-3 shadow-lg">
        <p
          className="text-xs text-[#d7ab58] italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {bankName} a.n {accountHolder}
        </p>

        {/* Horizontal single line account number */}
        <h3
          className="text-xl sm:text-2xl font-normal text-[#d7ab58] tracking-wider my-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {accountNumber}
        </h3>

        <button
          type="button"
          className="border border-[#d7ab58]/60 hover:bg-[#d7ab58] hover:text-[#102218] text-[#d7ab58] text-[11px] tracking-[0.2em] font-semibold py-2 px-6 rounded-full transition-colors inline-block"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

CraftBaliGiftSection.craft = {
  displayName: "Bali Gift",
  props: {
    giftTitle: "KIRIM HADIAH",
    giftSubtitle: "Kehadiran Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:",
    bankName: "[NAMA BANK]",
    accountHolder: "Pramarta Chyntia Andita",
    accountNumber: "[NOMOR REKENING]",
    buttonText: "SALIN NOMOR REKENING",
  },
};

// 24. Bali Closing Section (Matches User Image 4)
export interface CraftBaliClosingProps {
  closingTitle?: string;
  closingSubtitle?: string;
  closingMessage?: string;
  coupleNames?: string;
  mantra?: string;
}

export const CraftBaliClosingSection: UserComponent<CraftBaliClosingProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.closing || props;
  const closingTitle = data.closingTitle ?? props.closingTitle ?? "Suksma";
  const closingSubtitle = data.closingSubtitle ?? props.closingSubtitle ?? "TERIMA KASIH";
  const closingMessage = data.closingMessage ?? props.closingMessage ?? "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.";
  const coupleNames = data.coupleNames ?? props.coupleNames ?? "Chyntia & Rian";
  const mantra = data.mantra ?? props.mantra ?? "OM SHANTI, SHANTI, SHANTI, OM";
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-closing"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`px-5 pt-8 pb-12 text-center transition-all cursor-pointer bg-[#102218] relative ${
        selected ? "ring-2 ring-[#d7ab58] ring-offset-2 ring-offset-[#102218]" : "hover:outline hover:outline-dashed hover:outline-[#d7ab58]/50"
      }`}
    >
      <h2
        className="text-4xl sm:text-5xl text-[#d7ab58] font-normal leading-tight"
        style={{ fontFamily: "'Pinyon Script', cursive" }}
      >
        {closingTitle}
      </h2>

      <p
        className="text-[11px] tracking-[0.3em] uppercase text-[#d7ab58] font-medium mt-1 mb-2"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {closingSubtitle}
      </p>

      {/* Melati flower divider */}
      <div className="flex items-center justify-center space-x-3 my-2.5">
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
        <div className="w-4 h-4 relative">
          <Image
            src="/templates/bali-tropical/melati.png"
            alt="Melati"
            fill
            className="object-contain"
          />
        </div>
        <div className="w-10 h-[1px] bg-[#d7ab58]/60" />
      </div>

      <p className="text-xs leading-relaxed text-[#f3eee6]/90 max-w-[270px] mx-auto font-light mb-4">
        {closingMessage}
      </p>

      {/* Couple Name in Pinyon Script */}
      <h3
        className="text-3xl text-[#d7ab58] font-normal my-2"
        style={{ fontFamily: "'Pinyon Script', cursive" }}
      >
        {coupleNames}
      </h3>

      <p
        className="text-[10px] tracking-[0.25em] uppercase text-[#d7ab58] font-medium mb-4"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {mantra}
      </p>

      {/* Footer Penjor and Melati Flowers Illustration */}
      <div className="relative w-full h-[120px] mt-2 flex items-end justify-center">
        <Image
          src="/templates/bali-tropical/footer-gapura.png"
          alt="Penjor dan Melati"
          fill
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
};

CraftBaliClosingSection.craft = {
  displayName: "Bali Closing",
  props: {
    closingTitle: "Suksma",
    closingSubtitle: "TERIMA KASIH",
    closingMessage: "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    coupleNames: "Chyntia & Rian",
    mantra: "OM SHANTI, SHANTI, SHANTI, OM",
  },
};


// ============================================================================
// EMERALD GOLD BASIC CRAFT COMPONENTS (Angga & Shenina - Art Deco Basic Tier)
// ============================================================================

// 25. Emerald Root Container
export const CraftEmeraldContainer: UserComponent<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-full w-full bg-[#0f4a38] text-white relative ${className}`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {children}
    </div>
  );
};

CraftEmeraldContainer.craft = {
  displayName: "Emerald Container",
  rules: {
    canDrop: () => true,
  },
};

// 26. Emerald Cover Section (Exact match to User Reference Image)
export interface CraftEmeraldCoverProps {
  theWeddingOf?: string;
  groomName?: string;
  brideName?: string;
  eventDate?: string;
  inviteeBadge?: string;
  inviteeName?: string;
  heroImage?: string;
}

export const CraftEmeraldCoverSection: UserComponent<CraftEmeraldCoverProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.cover || props;
  const theWeddingOf = data.theWeddingOf ?? props.theWeddingOf ?? "THE WEDDING OF";
  const groomName = data.groomName ?? props.groomName ?? "ANGGA";
  const brideName = data.brideName ?? props.brideName ?? "SHENINA";
  const eventDate = data.eventDate ?? props.eventDate ?? "SABTU · 12 DESEMBER 2026";
  const inviteeBadge = data.inviteeBadge ?? props.inviteeBadge ?? "Kepada Yth. Bapak/Ibu/Saudara/i";
  const inviteeName = data.inviteeName ?? props.inviteeName ?? "Nama Tamu";
  const heroImage = data.heroImage ?? props.heroImage ?? "/templates/wedding/couple-main.jpg";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-cover"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[858px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#0f4a38]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {/* Concentric Double Gold Borders */}
      <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
      <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

      {/* 4 Art Deco Corner Motifs */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M16 44 V16 H44" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute top-3 right-3 z-20 scale-x-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M16 44 V16 H44" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 z-20 scale-y-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M16 44 V16 H44" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M16 44 V16 H44" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Top Header & Art Deco Sunburst Fan */}
      <div className="relative z-20 pt-6 flex flex-col items-center">
        <svg viewBox="0 0 100 50" className="w-28 h-14 text-[#c59b4e] stroke-current fill-none pointer-events-none mb-2 opacity-95">
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
          <line x1="50" y1="48" x2="10" y2="28" strokeWidth="1.2" />
          <line x1="50" y1="48" x2="90" y2="28" strokeWidth="1.2" />
        </svg>
        <p
          className="text-[11px] tracking-[0.35em] uppercase text-[#c59b4e] font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {theWeddingOf}
        </p>
      </div>

      {/* Arch Photo Frame (Exact Match to Preview) */}
      <div className="relative z-20 my-2 flex flex-col items-center">
        <div className="relative w-[190px] sm:w-[210px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c59b4e] bg-[#0c3c2d] p-1 shadow-2xl flex items-center justify-center">
          <div className="relative w-full h-full rounded-t-full border border-[#c59b4e]/40 overflow-hidden flex flex-col items-center justify-center bg-[#0c3c2d]">
            {heroImage ? (
              <>
                <Image
                  src={heroImage}
                  alt="Foto Pasangan"
                  fill
                  priority
                  className="object-cover opacity-60 hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c3c2d] via-transparent to-transparent pointer-events-none" />
              </>
            ) : null}

            {/* Photo Icon & 'Ganti foto' matching Preview */}
            <div className="relative z-10 flex flex-col items-center space-y-1.5 text-[#c59b4e]">
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none" strokeWidth="1.5">
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
          {groomName}
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
          {brideName}
        </h1>

        {/* Date */}
        <p
          className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#c59b4e] font-medium pt-3"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {eventDate}
        </p>

        {/* Divider with Centered Diamond */}
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
          {inviteeBadge}
        </p>
        <p
          className="text-lg font-bold text-white tracking-wide pb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {inviteeName}
        </p>
      </div>

      {/* Action Button: ◆ BUKA UNDANGAN ◆ */}
      <div className="relative z-20 w-full max-w-[280px] pb-6">
        <div
          className="w-full bg-[#c89d47] hover:bg-[#d4a853] text-[#0f4a38] font-bold text-xs tracking-[0.22em] py-3.5 shadow-[0_8px_20px_rgba(197,155,78,0.35)] transition-all flex items-center justify-center space-x-2.5 cursor-pointer uppercase select-none"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span>◆</span>
          <span>BUKA UNDANGAN</span>
          <span>◆</span>
        </div>
      </div>
    </div>
  );
};

CraftEmeraldCoverSection.craft = {
  displayName: "Emerald Cover",
  props: {
    theWeddingOf: "THE WEDDING OF",
    groomName: "ANGGA",
    brideName: "SHENINA",
    eventDate: "SABTU · 12 DESEMBER 2026",
    inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
    inviteeName: "Nama Tamu",
    heroImage: "/templates/wedding/couple-main.jpg",
  },
};

// 27. Emerald Opening Section (Exact match to User Reference Image)
export interface CraftEmeraldOpeningProps {
  bismillah?: string;
  quoteTitle?: string;
  quoteMessage?: string;
  surahCitation?: string;
}

export const CraftEmeraldOpeningSection: UserComponent<CraftEmeraldOpeningProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.opening || props;
  const bismillah = data.bismillah ?? props.bismillah ?? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const quoteTitle = data.quoteTitle ?? props.quoteTitle ?? "BISMILLAHIRRAHMANIRRAHIM";
  const quoteMessage =
    data.quoteMessage ??
    props.quoteMessage ??
    "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya.";
  const surahCitation = data.surahCitation ?? props.surahCitation ?? "QS. AR-RUM : 21";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-opening"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[667px] w-full max-w-[390px] mx-auto text-center transition-all cursor-pointer bg-white text-[#0f4a38] relative overflow-hidden flex flex-col justify-between items-center px-4 pt-12 pb-10 ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-white" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
    >
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
          {bismillah}
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
        "{quoteMessage}"
      </p>

      {/* Surah Citation in Gold Tracking */}
      <p
        className="text-[11px] tracking-[0.28em] uppercase text-[#c59b4e] font-semibold mt-4"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {surahCitation}
      </p>
    </div>
  );
};

CraftEmeraldOpeningSection.craft = {
  displayName: "Emerald Opening",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    quoteTitle: "BISMILLAHIRRAHMANIRRAHIM",
    quoteMessage:
      "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya.",
    surahCitation: "QS. AR-RUM : 21",
  },
};

// 28. Emerald Couple Section (Matches User Reference Image 2)
export interface CraftEmeraldCoupleProps {
  sectionTitle?: string;
  heading?: string;
  brideSubtitle?: string;
  brideName?: string;
  brideBio?: string;
  brideImage?: string;
  groomSubtitle?: string;
  groomName?: string;
  groomBio?: string;
  groomImage?: string;
}

export const CraftEmeraldCoupleSection: UserComponent<CraftEmeraldCoupleProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.brideGroom || props;
  const sectionTitle = data.sectionTitle ?? props.sectionTitle ?? "MEMPELAI";
  const heading = data.heading ?? props.heading ?? "Dua Hati, Satu Cerita";
  const brideSubtitle = data.brideSubtitle ?? props.brideSubtitle ?? "THE BRIDE";
  const brideName = data.brideName ?? props.brideName ?? "Shenina Syawalita Cinnamon";
  const brideBio = data.brideBio ?? props.brideBio ?? "Putri dari Bpk. Nama & Ibu Nama";
  const brideImage = data.brideImage ?? props.brideImage ?? "";
  const groomSubtitle = data.groomSubtitle ?? props.groomSubtitle ?? "THE GROOM";
  const groomName = data.groomName ?? props.groomName ?? "Angga Aldi Yunanda";
  const groomBio = data.groomBio ?? props.groomBio ?? "Putra dari Bpk. Nama & Ibu Nama";
  const groomImage = data.groomImage ?? props.groomImage ?? "";

  const brideFileRef = useRef<HTMLInputElement | null>(null);
  const groomFileRef = useRef<HTMLInputElement | null>(null);

  const handleBrideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const updater = liveCtx?.setSectionData;
    if (file && updater) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updater((prev: any) => ({
            ...prev,
            brideGroom: {
              ...prev.brideGroom,
              brideImage: ev.target!.result as string,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGroomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const updater = liveCtx?.setSectionData;
    if (file && updater) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updater((prev: any) => ({
            ...prev,
            brideGroom: {
              ...prev.brideGroom,
              groomImage: ev.target!.result as string,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-bride-groom"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[1024px] w-full max-w-[390px] mx-auto text-center transition-all cursor-pointer bg-[#F8F5EC] text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center px-4 pt-12 pb-12 ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#F8F5EC]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {/* Hidden File Inputs for Interactive Photo Changes */}
      <input
        ref={brideFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBrideFileChange}
      />
      <input
        ref={groomFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGroomFileChange}
      />

      {/* Top Header */}
      <div>
        {/* Small Caps Section Title */}
        <p
          className="text-[11px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {sectionTitle}
        </p>

        {/* Main Heading */}
        <h2
          className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {heading}
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
        {/* Arched Photo Frame */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            brideFileRef.current?.click();
          }}
          title="Klik untuk ganti foto mempelai wanita"
          className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#b8913d] transition-colors"
        >
          {brideImage ? (
            <img src={brideImage} alt={brideName} className="w-full h-full object-cover rounded-t-full" />
          ) : (
            <div className="flex flex-col items-center space-y-1 text-[#0b4a3a] group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Ganti foto
              </span>
            </div>
          )}
        </div>

        <p
          className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {brideSubtitle}
        </p>
        <h3
          className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {brideName}
        </h3>
        <p
          className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {brideBio}
        </p>
      </div>

      {/* Gold Ampersand Divider */}
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
        {/* Arched Photo Frame */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            groomFileRef.current?.click();
          }}
          title="Klik untuk ganti foto mempelai pria"
          className="relative w-[170px] sm:w-[185px] h-[225px] sm:h-[245px] rounded-t-full border-[1.5px] border-[#c8a34e] bg-[#e4dab8] p-1 shadow-sm flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#b8913d] transition-colors"
        >
          {groomImage ? (
            <img src={groomImage} alt={groomName} className="w-full h-full object-cover rounded-t-full" />
          ) : (
            <div className="flex flex-col items-center space-y-1 text-[#0b4a3a] group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[12px] font-serif" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Ganti foto
              </span>
            </div>
          )}
        </div>

        <p
          className="text-[11px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-3.5"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {groomSubtitle}
        </p>
        <h3
          className="text-xl sm:text-[24px] font-bold text-[#0b4a3a] mt-1 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {groomName}
        </h3>
        <p
          className="text-xs sm:text-[13px] text-[#0b4a3a]/80 mt-1 max-w-[280px] leading-relaxed italic"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {groomBio}
        </p>
      </div>
    </div>
  );
};

CraftEmeraldCoupleSection.craft = {
  displayName: "Emerald Couple",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    sectionTitle: "MEMPELAI",
    heading: "Dua Hati, Satu Cerita",
    brideSubtitle: "THE BRIDE",
    brideName: "Shenina Syawalita Cinnamon",
    brideBio: "Putri dari Bpk. Harris Cinnamon & Ibu Fitria",
    groomSubtitle: "THE GROOM",
    groomName: "Angga Aldi Yunanda",
    groomBio: "Putra dari Bpk. Muhammad Yuli & Ibu Yulie Hertin",
  },
};

// 29. Emerald Event Details Section (Matches User Reference Image: 390x858 px)
export interface CraftEmeraldEventDetailsProps {
  saveTheDateTitle?: string;
  dayName?: string;
  dateDay?: string;
  monthYear?: string;
  countDays?: string;
  countHours?: string;
  countMinutes?: string;
  countSeconds?: string;
  akadTitle?: string;
  akadTime?: string;
  akadLocation?: string;
  resepsiTitle?: string;
  resepsiTime?: string;
  resepsiLocation?: string;
}

export const CraftEmeraldEventDetailsSection: UserComponent<CraftEmeraldEventDetailsProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.eventDetails || props;
  const saveTheDateTitle = data.saveTheDateTitle ?? props.saveTheDateTitle ?? "SAVE THE DATE";
  const dayName = data.dayName ?? props.dayName ?? "SABTU";
  const dateDay = data.dateDay ?? props.dateDay ?? "12";
  const monthYear = data.monthYear ?? props.monthYear ?? "DESEMBER 2026";
  const countDays = data.countDays ?? props.countDays ?? "15";
  const countHours = data.countHours ?? props.countHours ?? "20";
  const countMinutes = data.countMinutes ?? props.countMinutes ?? "15";
  const countSeconds = data.countSeconds ?? props.countSeconds ?? "39";
  const akadTitle = data.akadTitle ?? props.akadTitle ?? "AKAD NIKAH";
  const akadTime = data.akadTime ?? props.akadTime ?? "08.00 WIB";
  const akadLocation = data.akadLocation ?? props.akadLocation ?? "Masjid Al-Ikhlasiah, Bogor";
  const resepsiTitle = data.resepsiTitle ?? props.resepsiTitle ?? "RESEPSI";
  const resepsiTime = data.resepsiTime ?? props.resepsiTime ?? "11.00 WIB – selesai";
  const resepsiLocation = data.resepsiLocation ?? props.resepsiLocation ?? "Nama Gedung, Bogor";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-event-details"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[858px] w-full max-w-[390px] mx-auto text-center transition-all cursor-pointer bg-[#072f25] text-white relative overflow-hidden flex flex-col justify-between items-center px-4 pt-[85px] pb-[80px] ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#072f25]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
    >
      {/* Concentric Double Gold Borders (Inset 10px & 16px matching 390x858 reference) */}
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
        {/* Header: Save The Date */}
        <div>
          <p
            className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {saveTheDateTitle}
          </p>
          <h2
            className="text-xl sm:text-2xl font-bold text-white tracking-[0.25em] mt-3 mb-1 uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {dayName}
          </h2>
          <div
            className="text-5xl sm:text-[54px] font-bold text-[#c59b4e] my-1 leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {dateDay}
          </div>
          <p
            className="text-xs sm:text-sm tracking-[0.25em] uppercase text-white font-semibold mt-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {monthYear}
          </p>

          {/* Gold Divider with Diamond */}
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
              {countDays}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
              HARI
            </span>
          </div>
          <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
            <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {countHours}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
              JAM
            </span>
          </div>
          <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
            <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {countMinutes}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
              MENIT
            </span>
          </div>
          <div className="w-[76px] h-[72px] border border-[#c59b4e] flex flex-col items-center justify-center text-center bg-[#072f25]/60">
            <span className="text-xl font-bold text-[#c59b4e] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {countSeconds}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white font-semibold mt-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
              DETIK
            </span>
          </div>
        </div>

        {/* Event Cards (Double border, 334px width, 148px height) */}
        <div className="w-[334px] max-w-full mx-auto space-y-3 mt-3">
          {/* Card 1: AKAD NIKAH */}
          <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
            <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
            <p
              className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {akadTitle}
            </p>
            <h3
              className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {akadTime}
            </h3>
            <p
              className="text-xs sm:text-sm text-[#e2cfab]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {akadLocation}
            </p>
          </div>

          {/* Card 2: RESEPSI */}
          <div className="w-full h-[148px] border-[1.5px] border-[#c59b4e] p-4 text-center bg-[#072f25] relative flex flex-col items-center justify-center">
            <div className="absolute inset-[5px] border border-[#c59b4e]/70 pointer-events-none" />
            <p
              className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {resepsiTitle}
            </p>
            <h3
              className="text-2xl sm:text-[28px] font-bold text-white my-1.5 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {resepsiTime}
            </h3>
            <p
              className="text-xs sm:text-sm text-[#e2cfab]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {resepsiLocation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftEmeraldEventDetailsSection.craft = {
  displayName: "Emerald Event Details",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
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
};

// 30. Emerald Location Map Section (Matches User Reference Image: 390x667 px)
export interface CraftEmeraldLocationProps {
  sectionTitle?: string;
  heading?: string;
  venueName?: string;
  venueAddress?: string;
  buttonText?: string;
  mapUrl?: string;
}

export const CraftEmeraldLocationSection: UserComponent<CraftEmeraldLocationProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.location || props;
  const sectionTitle = data.sectionTitle ?? props.sectionTitle ?? "LOKASI ACARA";
  const heading = data.heading ?? props.heading ?? "Peta Lokasi";
  const venueName = data.venueName ?? props.venueName ?? "Masjid Al-Ikhlasiah";
  const venueAddress = data.venueAddress ?? props.venueAddress ?? "Jl. Contoh No. 7, Kota Bogor, Jawa Barat";
  const buttonText = data.buttonText ?? props.buttonText ?? "LIHAT LOKASI";
  const mapUrl = data.mapUrl ?? props.mapUrl ?? "https://maps.google.com";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-location"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[667px] w-full max-w-[390px] mx-auto text-center transition-all cursor-pointer bg-white text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center px-4 pt-[83px] pb-[81px] ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-white" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
    >
      <div>
        <p
          className="text-[11px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {sectionTitle}
        </p>
        <h2
          className="text-3xl sm:text-[34px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {heading}
        </h2>

        {/* Gold Divider with Diamond */}
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
          {venueName}
        </h3>
        <p
          className="text-xs sm:text-sm text-[#4a5a52] mt-1.5 leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {venueAddress}
        </p>
      </div>

      {/* Outline Action Button */}
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-[270px] max-w-full h-[52px] flex items-center justify-center border-[1.5px] border-[#0b4a3a] text-[#0b4a3a] hover:bg-[#0b4a3a] hover:text-white text-xs font-bold tracking-[0.25em] transition-colors cursor-pointer mt-4"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        ◆ {buttonText} ◆
      </a>
    </div>
  );
};

CraftEmeraldLocationSection.craft = {
  displayName: "Emerald Location",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    sectionTitle: "LOKASI ACARA",
    heading: "Peta Lokasi",
    venueName: "Masjid Al-Ikhlasiah",
    venueAddress: "Jl. Contoh No. 7, Kota Bogor, Jawa Barat",
    buttonText: "LIHAT LOKASI",
    mapUrl: "https://maps.google.com",
  },
};

// 31. Emerald RSVP Section (Matches User Reference Image 5)
export interface CraftEmeraldRsvpProps {
  sectionTitle?: string;
  heading?: string;
  subtitle?: string;
  submitButtonText?: string;
}

export const CraftEmeraldRsvpSection: UserComponent<CraftEmeraldRsvpProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.rsvp || props;
  const sectionTitle = data.sectionTitle ?? props.sectionTitle ?? "RSVP";
  const heading = data.heading ?? props.heading ?? "Konfirmasi Kehadiran";
  const subtitle = data.subtitle ?? props.subtitle ?? "Mohon kabari kami kehadiran Anda melalui formulir berikut.";
  const submitButtonText = data.submitButtonText ?? props.submitButtonText ?? "KIRIM KONFIRMASI";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-rsvp"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[636px] w-full max-w-[390px] mx-auto px-5 py-8 text-center transition-all cursor-pointer bg-[#0b4a3a] text-white relative overflow-hidden flex flex-col justify-between items-center ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#0f4a38]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
    >
      {/* Concentric Gold Borders */}
      <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
      <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

      {/* 4 Art Deco Corner Motifs */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute top-3 right-3 z-20 scale-x-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 z-20 scale-y-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 z-20 scale-x-[-1] scale-y-[-1] pointer-events-none">
        <svg viewBox="0 0 60 60" className="w-11 h-11 text-[#c59b4e] stroke-current fill-none">
          <path d="M4 56 V4 H56" strokeWidth="1.5" strokeLinecap="square" />
          <path d="M10 50 V10 H50" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="4" y1="4" x2="32" y2="32" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="relative z-20 px-2">
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-[#c59b4e] font-semibold pt-1"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {sectionTitle}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold text-white mt-1 mb-2 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {heading}
        </h2>

        {/* Gold Divider with Diamond */}
        <div className="flex items-center justify-center space-x-2 my-3 max-w-[150px] mx-auto">
          <div className="flex-1 h-[1px] bg-[#c59b4e]" />
          <span className="text-[#c59b4e] text-xs">◆</span>
          <div className="flex-1 h-[1px] bg-[#c59b4e]" />
        </div>

        <p
          className="text-xs sm:text-sm text-[#e2cfab] italic mb-5 max-w-xs mx-auto leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {subtitle}
        </p>

        {/* White Form Card (Matches User Reference Image 5) */}
        <div className="bg-white text-[#0f4a38] p-5 sm:p-6 shadow-2xl max-w-[310px] mx-auto text-left space-y-3.5">
          <div>
            <label
              className="text-[10px] font-bold tracking-[0.2em] text-[#0f4a38] uppercase block mb-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              NAMA
            </label>
            <input
              type="text"
              readOnly
              placeholder="Nama lengkap"
              className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
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
              type="text"
              readOnly
              placeholder="Nomor WhatsApp"
              className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
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
              type="text"
              readOnly
              placeholder="Jumlah tamu yang hadir"
              className="w-full bg-[#faf7f0] border border-[#c59b4e] px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            />
          </div>

          {/* 2 Attendance Options */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              className="bg-[#c59b4e] text-white py-2.5 px-1 text-[10px] sm:text-[11px] font-bold tracking-wider shadow-sm flex items-center justify-center space-x-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>◆ YA, HADIR ◆</span>
            </button>
            <button
              type="button"
              className="bg-white border-[1.5px] border-[#0f4a38] text-[#0f4a38] py-2.5 px-1 text-[10px] sm:text-[11px] font-bold tracking-wider flex items-center justify-center space-x-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>◆ TIDAK HADIR ◆</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className="w-full bg-[#c59b4e] text-white py-3 text-xs font-bold tracking-[0.15em] shadow-md mt-2 flex items-center justify-center space-x-1 hover:bg-[#b88c3f] transition-colors"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>◆ {submitButtonText} ◆</span>
          </button>
        </div>
      </div>
    </div>
  );
};

CraftEmeraldRsvpSection.craft = {
  displayName: "Emerald RSVP",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    sectionTitle: "RSVP",
    heading: "Konfirmasi Kehadiran",
    subtitle: "Mohon kabari kami kehadiran Anda melalui formulir berikut.",
    submitButtonText: "KIRIM KONFIRMASI",
  },
};

// 32. Emerald Wishes Section (Matches User Reference Image 1)
export interface CraftEmeraldWishesProps {
  sectionTitle?: string;
  heading?: string;
  subtitle?: string;
  buttonText?: string;
}

export const CraftEmeraldWishesSection: UserComponent<CraftEmeraldWishesProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.wishes || props;
  const sectionTitle = data.sectionTitle ?? props.sectionTitle ?? "DOA & UCAPAN";
  const heading = data.heading ?? props.heading ?? "Doa dan Ucapan";
  const subtitle = data.subtitle ?? props.subtitle ?? "Tuliskan doa dan ucapan terbaik Anda untuk kedua mempelai.";
  const buttonText = data.buttonText ?? props.buttonText ?? "KIRIM UCAPAN";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [wishesList, setWishesList] = useState([
    {
      name: "KELUARGA DARI DEPOK",
      message: "Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah.",
    },
    {
      name: "REKAN KERJA",
      message: "Happy wedding! Semoga bahagia selalu dan segera diberi momongan.",
    },
  ]);
  const [inputName, setInputName] = useState("");
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputMessage.trim()) return;
    setWishesList((prev) => [
      { name: inputName.trim().toUpperCase(), message: inputMessage.trim() },
      ...prev,
    ]);
    setInputName("");
    setInputMessage("");
  };

  return (
    <div
      id="section-wishes"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[858px] w-full max-w-[390px] mx-auto px-4 py-12 text-center transition-all cursor-pointer bg-[#F8F5EC] text-[#0b4a3a] relative overflow-hidden flex flex-col justify-between items-center ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#F8F5EC]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      <div className="w-full flex flex-col items-center">
        {/* Top Header */}
        <div>
          <p
            className="text-[11px] tracking-[0.3em] uppercase text-[#c8a34e] font-semibold"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {sectionTitle}
          </p>
          <h2
            className="text-2xl sm:text-[28px] font-bold text-[#0b4a3a] mt-2 mb-2 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {heading}
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
            {subtitle}
          </p>
        </div>

        {/* Wishes Form Card */}
        <form
          onSubmit={handleSubmit}
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
              placeholder="Nama Anda"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
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
              placeholder="Tulis ucapan di sini..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
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
            <span>{buttonText}</span>
            <span>◆</span>
          </button>
        </form>

        {/* Wishes List Feed */}
        <div className="w-full max-w-[335px] mt-4 space-y-3 text-left">
          {wishesList.map((w, i) => (
            <div
              key={i}
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
    </div>
  );
};

CraftEmeraldWishesSection.craft = {
  displayName: "Emerald Wishes",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    sectionTitle: "UCAPAN & DOA",
    heading: "Doa dan Ucapan",
    subtitle: "Berikan doa dan ucapan terbaik untuk kedua mempelai.",
    buttonText: "KIRIM UCAPAN",
  },
};

// 33. Emerald Digital Gift Section (Exact Match to User Reference Image: HADIAH DIGITAL - Tanda Kasih 390x897)
export interface CraftEmeraldGiftProps {
  badge?: string;
  heading?: string;
  subtitle?: string;
  bank1Name?: string;
  bank1Acc?: string;
  bank1Holder?: string;
  bank1ButtonText?: string;
  bank2Name?: string;
  bank2Acc?: string;
  bank2Holder?: string;
  bank2ButtonText?: string;
  giftAddressTitle?: string;
  giftAddress?: string;
}

export const CraftEmeraldGiftSection: UserComponent<CraftEmeraldGiftProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.digitalGift || props;
  const badge = data.badge ?? props.badge ?? "HADIAH DIGITAL";
  const heading = data.heading ?? props.heading ?? "Tanda Kasih";
  const subtitle =
    data.subtitle ??
    props.subtitle ??
    "Doa restu Anda adalah hadiah terindah.\nNamun jika ingin berbagi tanda kasih, dapat melalui:";
  const bank1Name = data.bank1Name ?? props.bank1Name ?? "BANK BCA";
  const bank1Acc = data.bank1Acc ?? props.bank1Acc ?? "1234 5678 90";
  const bank1Holder = data.bank1Holder ?? props.bank1Holder ?? "a.n. Angga Aldi Yunanda";
  const bank1ButtonText = data.bank1ButtonText ?? props.bank1ButtonText ?? "SALIN NOMOR";
  const bank2Name = data.bank2Name ?? props.bank2Name ?? "E-WALLET / DANA";
  const bank2Acc = data.bank2Acc ?? props.bank2Acc ?? "0812 3456 7890";
  const bank2Holder = data.bank2Holder ?? props.bank2Holder ?? "a.n. Shenina Syawalita";
  const bank2ButtonText = data.bank2ButtonText ?? props.bank2ButtonText ?? "SALIN NOMOR";
  const giftAddressTitle = data.giftAddressTitle ?? props.giftAddressTitle ?? "ALAMAT PENGIRIMAN KADO";
  const giftAddress = data.giftAddress ?? props.giftAddress ?? "Jl. Contoh No. 7, Kota Bogor, Jawa Barat";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopy = (acc: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(acc.replace(/\s+/g, ""));
      setCopiedBank(key);
      setTimeout(() => setCopiedBank(null), 2500);
    }
  };

  return (
    <div
      id="section-digital-gift"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[897px] w-full max-w-[390px] mx-auto p-4 flex flex-col justify-between items-center text-center overflow-hidden bg-[#072f25] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#072f25]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {/* Concentric Double Gold Borders (Inset 10px & 16px) */}
      <div className="absolute inset-[10px] border-[1.5px] border-[#c8a34e] pointer-events-none z-10" />
      <div className="absolute inset-[16px] border-[1px] border-[#c8a34e]/80 pointer-events-none z-10" />

      {/* 4 Art Deco Corner Motifs matching design */}
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
        {/* Top Header */}
        <div>
          <p
            className="text-[12px] tracking-[0.35em] uppercase text-[#c8a34e] font-semibold"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {badge}
          </p>

          <h2
            className="text-[34px] sm:text-[36px] font-bold text-white mt-3 mb-2 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {heading}
          </h2>

          {/* Gold Divider with Diamond */}
          <div className="flex items-center justify-center space-x-2 my-3 max-w-[170px] mx-auto">
            <div className="flex-1 h-[1px] bg-[#c8a34e]" />
            <span className="text-[#c8a34e] text-xs">◆</span>
            <div className="flex-1 h-[1px] bg-[#c8a34e]" />
          </div>

          {/* Subtitle Message with EXACT font size 18px as requested */}
          <p
            className="text-[#e2cfab] italic mb-6 max-w-[320px] mx-auto leading-[1.6] whitespace-pre-line text-center"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "18px" }}
          >
            {subtitle}
          </p>
        </div>

        {/* 2 Double Gold Outline Cards (exact 334px width x 204px height, bg #0b4a3a) */}
        <div className="space-y-4 w-[334px] max-w-full mx-auto my-auto">
          {/* Card 1: Bank BCA */}
          <div className="w-[334px] max-w-full h-[204px] border-[1.5px] border-[#c8a34e] p-5 relative bg-[#0b4a3a] text-center flex flex-col justify-between items-center shadow-lg">
            <div className="absolute inset-[6px] border border-[#818146]/70 pointer-events-none" />
            <p
              className="text-[12px] font-semibold text-[#c8a34e] uppercase tracking-[0.25em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {bank1Name}
            </p>
            <p
              className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {bank1Acc}
            </p>
            <p
              className="text-[14px] text-[#e2cfab] font-serif"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {bank1Holder}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(bank1Acc, "bank1");
              }}
              className="w-[198px] h-[48px] bg-[#c8a34e] hover:bg-[#d6aa57] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md flex items-center justify-center space-x-1.5 uppercase select-none cursor-pointer transition-colors"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>◆</span>
              <span>{copiedBank === "bank1" ? "TERSALIN!" : bank1ButtonText}</span>
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
              {bank2Name}
            </p>
            <p
              className="text-[26px] sm:text-[28px] font-bold tracking-[0.08em] text-white my-0.5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {bank2Acc}
            </p>
            <p
              className="text-[14px] text-[#e2cfab] font-serif"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {bank2Holder}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(bank2Acc, "bank2");
              }}
              className="w-[198px] h-[48px] bg-[#c8a34e] hover:bg-[#d6aa57] text-[#072f25] font-bold text-xs tracking-[0.2em] shadow-md flex items-center justify-center space-x-1.5 uppercase select-none cursor-pointer transition-colors"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>◆</span>
              <span>{copiedBank === "bank2" ? "TERSALIN!" : bank2ButtonText}</span>
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
            {giftAddressTitle}
          </p>
          <p
            className="text-[14px] sm:text-[15px] text-[#e2cfab] max-w-[280px] mx-auto leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {giftAddress}
          </p>
        </div>
      </div>
    </div>
  );
};

CraftEmeraldGiftSection.craft = {
  displayName: "Emerald Gift",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
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
};

// 34. Emerald Closing Section (Matches User Reference Image 1: 390x636 px)
export interface CraftEmeraldClosingProps {
  heading?: string;
  message?: string;
  monogram?: string;
  coupleNames?: string;
  eventDate?: string;
}

export const CraftEmeraldClosingSection: UserComponent<CraftEmeraldClosingProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.closing || props;
  const heading = data.heading ?? props.heading ?? "Terima Kasih";
  const message =
    data.message ??
    props.message ??
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.";
  const monogram = data.monogram ?? props.monogram ?? "A & S";
  const coupleNames = data.coupleNames ?? props.coupleNames ?? "ANGGA & SHENINA";
  const eventDate = data.eventDate ?? props.eventDate ?? "";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-closing"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-[1018px] w-full max-w-[390px] mx-auto text-center transition-all cursor-pointer bg-[#0b4a3a] text-white relative overflow-hidden flex flex-col justify-between items-center px-4 py-12 ${
        selected ? "ring-2 ring-[#c59b4e] ring-offset-2 ring-offset-[#0b4a3a]" : "hover:outline hover:outline-dashed hover:outline-[#c59b4e]/50"
      }`}
      style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
    >
      {/* Concentric Double Gold Borders (Inset 10px & 16px matching 390x1018 reference) */}
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

      {/* Main Content Area */}
      <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-center pt-24 pb-20 px-4">
        {/* Top Sunburst Fan */}
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 100 52" className="w-28 h-14 text-[#c8a34e] stroke-current fill-none">
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

        {/* Heading: Terima Kasih */}
        <h2
          className="text-4xl sm:text-[42px] font-bold text-white mb-4 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {heading}
        </h2>

        {/* Gold Divider with Diamond */}
        <div className="flex items-center justify-center space-x-2 mb-8 w-full max-w-[170px] mx-auto">
          <div className="flex-1 h-[1px] bg-[#c8a34e]" />
          <span className="text-[#c8a34e] text-xs">◆</span>
          <div className="flex-1 h-[1px] bg-[#c8a34e]" />
        </div>

        {/* Body Message (No quotation marks, exact 4 lines) */}
        <p
          className="text-[15px] sm:text-[16px] text-[#e2cfab] italic mb-14 max-w-[310px] mx-auto leading-[1.8]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {message}
        </p>

        {/* Monogram A & S (Italic serif, gold) */}
        <div
          className="text-6xl sm:text-[68px] text-[#c8a34e] mb-6 select-none leading-none"
          style={{
            fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
          }}
        >
          {monogram}
        </div>

        {/* Couple Names (White, uppercase, tracked) */}
        <p
          className="text-[12px] sm:text-[13px] tracking-[0.3em] uppercase text-white font-semibold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {coupleNames}
        </p>

        {/* Optional Date (Only if explicitly passed, defaults to empty for Emerald) */}
        {eventDate ? (
          <p
            className="text-[10px] tracking-[0.25em] uppercase text-[#c8a34e] font-semibold mt-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {eventDate}
          </p>
        ) : null}
      </div>
    </div>
  );
};

CraftEmeraldClosingSection.craft = {
  displayName: "Emerald Closing",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    heading: "Terima Kasih",
    message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    monogram: "A & S",
    coupleNames: "ANGGA & SHENINA",
    eventDate: "",
  },
};

export const CraftEmeraldCountdownSection = CraftEmeraldEventDetailsSection;

// ============================================================================
// 35. JAVANESE ELEGANT THEME (Craft Components)
// ============================================================================

// Javanese Root Container
export const CraftJavaneseContainer: UserComponent<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`min-h-full w-full bg-[#243320] text-[#f8f5ec] relative font-sans ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {children}
    </div>
  );
};

CraftJavaneseContainer.craft = {
  displayName: "Javanese Container",
  rules: {
    canDrop: () => true,
  },
};

// Javanese Cover Section (Matches Reference 1 & 2: 390 x 780 Ratio)
export interface CraftJavaneseCoverProps {
  theWeddingOf?: string;
  coupleTitle?: string;
  groomName?: string;
  brideName?: string;
  eventDate?: string;
  venue?: string;
  inviteeBadge?: string;
  inviteeName?: string;
  openButtonText?: string;
  bismillah?: string;
  heroImage?: string;
  patternWashImage?: string;
  skylineImage?: string;
}

export const CraftJavaneseCoverSection: UserComponent<CraftJavaneseCoverProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.cover || props;
  const theWeddingOf = data.theWeddingOf ?? props.theWeddingOf ?? "THE WEDDING OF";
  const coupleTitle = data.coupleTitle ?? props.coupleTitle ?? "Nara & Dimas";
  const eventDate = data.eventDate ?? props.eventDate ?? "SABTU, 20 MARET 2027";
  const venue = data.venue ?? props.venue ?? "Masjid Al-Ikhlas · Bandung";
  const inviteeBadge = data.inviteeBadge ?? props.inviteeBadge ?? "Kepada Yth. Bapak/Ibu/Saudara/i";
  const inviteeName = data.inviteeName ?? props.inviteeName ?? "Nama Tamu";
  const openButtonText = data.openButtonText ?? props.openButtonText ?? "BUKA UNDANGAN";
  const bismillah = data.bismillah ?? props.bismillah ?? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const heroImage = data.heroImage ?? props.heroImage;
  const patternWashImage =
    data.patternWashImage ?? props.patternWashImage ?? "/templates/javanesse-elegant/pattern-wash.png";
  const skylineImage =
    data.skylineImage ?? props.skylineImage ?? "/templates/javanesse-elegant/skyline.png";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-cover"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[780px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 pt-3 pb-0 bg-[#243320] text-[#f8f5ec] overflow-hidden transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#c5a059] ring-offset-2 ring-offset-[#243320]" : "hover:outline hover:outline-dashed hover:outline-[#c5a059]/50"
      }`}
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

      {/* Music Icon Indicator */}
      <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-[#b8913e] bg-[#1e2918]/60 flex items-center justify-center text-[#b8913e] text-[11px] pointer-events-none">
        ♪
      </div>

      {/* Header symbols & Basmalah */}
      <div className="flex flex-col items-center mt-1 z-10">
        <div className="flex items-center space-x-1.5 text-[#b8913e] mb-1 opacity-95">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#b8913e" className="text-[#b8913e]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.31 0 4.43-.79 6.13-2.12-5.46-.35-9.8-4.88-9.8-10.42 0-3.32 1.57-6.28 4-8.15C13.52 2.11 12.77 2 12 2z" />
          </svg>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="#b8913e">
            <rect x="4" y="4" width="12" height="12" />
            <rect x="4" y="4" width="12" height="12" transform="rotate(45 10 10)" />
          </svg>
        </div>

        <p
          className="text-xl sm:text-2xl text-[#f8f4e8] tracking-normal mb-1 font-normal select-none"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {bismillah}
        </p>

        <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-[#b8913e] font-semibold">
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
            <Image src={heroImage} alt="Foto Pasangan" fill priority className="object-cover" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center text-[#e4e9d3]/70 p-4"
              style={{
                background: "linear-gradient(180deg, #5b6b44 0%, #293825 100%)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-[#b8913e] fill-none opacity-80 mb-1" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span
                className="text-xs text-[#e4e9d3] mt-1"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                {coupleTitle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Couple Names */}
      <div className="z-10 mt-1">
        <h1
          className="text-3xl sm:text-[38px] font-bold text-white tracking-wide leading-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {coupleTitle.includes("&") ? (
            <>
              {coupleTitle.split("&")[0].trim()}{" "}
              <span className="text-[#b8913e] font-normal italic">&amp;</span>{" "}
              {coupleTitle.split("&")[1].trim()}
            </>
          ) : (
            coupleTitle
          )}
        </h1>

        <p className="text-xs sm:text-[12px] font-semibold tracking-[0.2em] text-[#b8913e] uppercase mt-1.5">
          {eventDate}
        </p>

        <p className="text-xs text-[#e4e9d3] mt-1">
          {venue}
        </p>
      </div>

      {/* Guest Badge (Capsule / Pill) */}
      <div className="z-10 mt-3 w-full max-w-[270px]">
        <div className="rounded-full py-2 px-5 border border-[#b8913e] bg-[#1e2918]/70 backdrop-blur-xs text-center shadow-xs">
          <p className="text-[10px] text-[#b8913e] font-medium">
            {inviteeBadge}
          </p>
          <p
            className="text-sm font-bold text-[#f8f5ec] mt-0.5"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {inviteeName}
          </p>
        </div>
      </div>

      {/* Button "BUKA UNDANGAN" */}
      <div className="z-10 mt-3 mb-2">
        <div className="rounded-full py-3 px-8 bg-[#b8913e] text-[#2f3b22] font-bold text-xs uppercase tracking-[0.2em] shadow-lg w-[210px] flex items-center justify-center">
          {openButtonText}
        </div>
      </div>

      {/* Mosque Skyline Asset at bottom (390 x 120 px) */}
      <div className="w-full mt-auto relative z-10 pointer-events-none select-none">
        <img
          src={skylineImage}
          alt="Skyline Masjid"
          className="w-full h-[120px] object-cover object-top block"
        />
      </div>
    </div>
  );
};

CraftJavaneseCoverSection.craft = {
  displayName: "Javanese Cover",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    theWeddingOf: "THE WEDDING OF",
    coupleTitle: "Nara & Dimas",
    eventDate: "SABTU, 20 MARET 2027",
    venue: "Masjid Al-Ikhlas · Bandung",
    inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
    inviteeName: "Nama Tamu",
    openButtonText: "BUKA UNDANGAN",
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  },
};

// Javanese Opening Section (Matches Reference 3: 390 x 521 Ratio)
export interface CraftJavaneseOpeningProps {
  bismillah?: string;
  salamTitle?: string;
  salamBody?: string;
  inviteeBadge?: string;
  inviteeName?: string;
  inviteeNote?: string;
}

export const CraftJavaneseOpeningSection: UserComponent<CraftJavaneseOpeningProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.opening || props;
  const bismillah = data.bismillah ?? props.bismillah ?? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const salamTitle = data.salamTitle ?? props.salamTitle ?? "Assalamu'alaikum Warahmatullahi Wabarakatuh";
  const salamBody =
    data.salamBody ??
    props.salamBody ??
    "Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami.";
  const inviteeBadge = data.inviteeBadge ?? props.inviteeBadge ?? "Kepada Yth. Bapak/Ibu/Saudara/i";
  const inviteeName = data.inviteeName ?? props.inviteeName ?? "Nama Tamu";
  const inviteeNote = data.inviteeNote ?? props.inviteeNote ?? "di tempat";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-opening"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[521px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 pt-4 pb-8 bg-[#273422] text-[#f8f5ec] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#c5a059] ring-offset-2 ring-offset-[#273422]" : "hover:outline hover:outline-dashed hover:outline-[#c5a059]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <JavaneseTopBorder />

      <div className="w-full flex flex-col items-center my-auto">
        <p
          className="text-2xl sm:text-3xl text-[#c5a059] tracking-normal mb-1 font-normal select-none"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {bismillah}
        </p>

        <JavaneseStarDivider color="#c5a059" />

        <h2
          className="text-xl sm:text-[24px] font-bold text-[#c5a059] leading-snug mt-2 mb-2"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {salamTitle}
        </h2>

        <p className="text-xs sm:text-[13px] text-[#f8f5ec] leading-relaxed max-w-[310px] mx-auto text-center mt-2 mb-6 opacity-95">
          {salamBody}
        </p>

        {/* Large Oval Guest Card (Matches Reference 3) */}
        <div className="w-full max-w-[290px] rounded-[38px] bg-[#e4e9d3] px-7 py-5 text-center shadow-md border border-[#c5a059]/40">
          <p className="text-[11px] text-[#4a5843] font-medium">
            {inviteeBadge}
          </p>
          <p
            className="text-xl sm:text-2xl font-bold text-[#1d2719] mt-1"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {inviteeName}
          </p>
          <p className="text-xs text-[#4a5843] italic mt-1">
            {inviteeNote}
          </p>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseOpeningSection.craft = {
  displayName: "Javanese Opening",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    salamTitle: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    salamBody:
      "Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami.",
    inviteeBadge: "Kepada Yth. Bapak/Ibu/Saudara/i",
    inviteeName: "Nama Tamu",
    inviteeNote: "di tempat",
  },
};

// Javanese Tentang Acara Section (Matches Reference: 390 x 514 Ratio)
export interface CraftJavaneseTentangAcaraProps {
  tagline?: string;
  title?: string;
  quote?: string;
  quoteSource?: string;
  badge1?: string;
  badge2?: string;
}

export const CraftJavaneseTentangAcaraSection: UserComponent<CraftJavaneseTentangAcaraProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.about || props;
  const tagline = data.tagline ?? props.tagline ?? "TENTANG ACARA";
  const title = data.title ?? props.title ?? "Pernikahan Nara & Dimas";
  const quote =
    data.quote ??
    props.quote ??
    "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.";
  const quoteSource = data.quoteSource ?? props.quoteSource ?? "QS. Ar-Rum: 21";
  const badge1 = data.badge1 ?? props.badge1 ?? "Akad di masjid";
  const badge2 = data.badge2 ?? props.badge2 ?? "Dresscode: Sage & Ivory";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-about"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[514px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 pt-8 pb-8 bg-[#dce3d2] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#dce3d2]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        {/* Tagline Small Caps (Font: Inter) */}
        <p className="text-[11px] tracking-[0.25em] font-bold uppercase text-[#a6833b] font-sans">
          {tagline}
        </p>

        {/* Heading (Font: Amiri) */}
        <h2
          className="text-2xl sm:text-[28px] font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>

        {/* Star Divider in Gold */}
        <JavaneseStarDivider color="#a6833b" />

        {/* Quote Card (Matches Ref 4: Rounded-2xl White Card with Gold Border) */}
        <div className="w-full max-w-[335px] rounded-[22px] bg-white border border-[#c5a059] p-6 shadow-sm text-center mt-3 font-sans">
          <p
            className="text-xs sm:text-[13px] text-[#273422] leading-relaxed italic"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            &ldquo;{quote}&rdquo;
          </p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#a6833b] mt-4 font-sans">
            {quoteSource}
          </p>
        </div>

        {/* Two Pill Badges Side-by-Side (Matches Ref 4) */}
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          {badge1 && (
            <div className="rounded-full px-4 py-2 border border-[#4a5843] bg-[#dce3d2] text-[#273422] text-xs font-medium font-sans">
              {badge1}
            </div>
          )}
          {badge2 && (
            <div className="rounded-full px-4 py-2 border border-[#4a5843] bg-[#dce3d2] text-[#273422] text-xs font-medium font-sans">
              {badge2}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CraftJavaneseTentangAcaraSection.craft = {
  displayName: "Javanese Tentang Acara",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "TENTANG ACARA",
    title: "Pernikahan Nara & Dimas",
    quote:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.",
    quoteSource: "QS. Ar-Rum: 21",
    badge1: "Akad di masjid",
    badge2: "Dresscode: Sage & Ivory",
  },
};

// Javanese About / Kisah Kami Section (Matches Reference 2: 390 x 451 Ratio)
export interface CraftJavaneseAboutProps {
  tagline?: string;
  heading?: string;
  storyBertemu?: string;
  storyDekat?: string;
  storyMelamar?: string;
}

export const CraftJavaneseAboutSection: UserComponent<CraftJavaneseAboutProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.story || props;
  const tagline = data.tagline ?? props.tagline ?? "PERJALANAN KAMI";
  const heading = data.heading ?? props.heading ?? "Kisah Kami";
  const storyBertemu =
    data.storyBertemu ??
    props.storyBertemu ??
    "Kami dipertemukan dalam sebuah kajian di kampus. Dari obrolan sederhana, tumbuh rasa saling percaya hingga kami memantapkan niat untuk menyempurnakan separuh agama.";
  const storyDekat =
    data.storyDekat ??
    props.storyDekat ??
    "Seiring berjalannya waktu dan restu kedua keluarga, kedekatan kami semakin bertumbuh dalam komitmen untuk saling melengkapi dan membimbing menuju ridha-Nya.";
  const storyMelamar =
    data.storyMelamar ??
    props.storyMelamar ??
    "Dengan memohon doa restu orang tua dan bimbingan Allah SWT, niat suci kami diikat dalam prosesi lamaran hangat yang menjadi awal langkah menuju pelaminan.";

  const [activeTab, setActiveTab] = useState<"bertemu" | "dekat" | "melamar">("bertemu");

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-story"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[451px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-8 bg-[#e4e9d3] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#e4e9d3]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] font-bold uppercase text-[#a6833b]">
          {tagline}
        </p>

        <h2
          className="text-3xl font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {heading}
        </h2>

        <JavaneseStarDivider color="#a6833b" />

        {/* 3 Story Tabs (Matches Reference 2) */}
        <div className="flex items-center justify-center gap-2.5 my-3.5">
          <button
            type="button"
            onClick={() => setActiveTab("bertemu")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "bertemu"
                ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22]"
            }`}
          >
            Bertemu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dekat")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dekat"
                ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22]"
            }`}
          >
            Dekat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("melamar")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "melamar"
                ? "bg-[#2f3b22] text-[#e4e9d3] shadow-xs"
                : "bg-[#e4e9d3] border border-[#2f3b22] text-[#2f3b22]"
            }`}
          >
            Melamar
          </button>
        </div>

        {/* Story Box Card (Matches Reference 2: Rounded-2xl White Card with Gold Border) */}
        <div className="w-full max-w-[342px] rounded-[24px] bg-white border border-[#b8913e] p-6 shadow-sm text-center">
          <p
            className="text-xs sm:text-[13px] text-[#273422] leading-relaxed italic"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {activeTab === "bertemu"
              ? storyBertemu
              : activeTab === "dekat"
              ? storyDekat
              : storyMelamar}
          </p>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseAboutSection.craft = {
  displayName: "Javanese About",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "PERJALANAN KAMI",
    heading: "Kisah Kami",
    storyBertemu:
      "Kami dipertemukan dalam sebuah kajian di kampus. Dari obrolan sederhana, tumbuh rasa saling percaya hingga kami memantapkan niat untuk menyempurnakan separuh agama.",
    storyDekat:
      "Seiring berjalannya waktu dan restu kedua keluarga, kedekatan kami semakin bertumbuh dalam komitmen untuk saling melengkapi dan membimbing menuju ridha-Nya.",
    storyMelamar:
      "Dengan memohon doa restu orang tua dan bimbingan Allah SWT, niat suci kami diikat dalam prosesi lamaran hangat yang menjadi awal langkah menuju pelaminan.",
  },
};

export const CraftJavaneseStorySection = CraftJavaneseAboutSection;

// Javanese Couple / Mempelai Section (Matches Reference 1: Light Cream Background, Ratio ~1050px)
export interface CraftJavaneseCoupleProps {
  tagline?: string;
  title?: string;
  brideFullName?: string;
  brideParents?: string;
  brideImage?: string;
  groomFullName?: string;
  groomParents?: string;
  groomImage?: string;
}

export const CraftJavaneseCoupleSection: UserComponent<CraftJavaneseCoupleProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.couple || props;
  const tagline = data.tagline ?? props.tagline ?? "MEMPELAI";
  const title = data.title ?? props.title ?? "Kedua Mempelai";
  const brideFullName = data.brideFullName ?? props.brideFullName ?? "Nara Ayu Pramesti";
  const brideParents =
    data.brideParents ??
    props.brideParents ??
    "Putri kedua Bapak Hartono\n& Ibu Wulandari";
  const brideImage = data.brideImage ?? props.brideImage;
  const groomFullName = data.groomFullName ?? props.groomFullName ?? "Dimas Adi Pratama";
  const groomParents =
    data.groomParents ??
    props.groomParents ??
    "Putra pertama Bapak Slamet Widodo\n& Ibu Sri Rahayu";
  const groomImage = data.groomImage ?? props.groomImage;

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-couple"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[1136px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-12 bg-[#f8f4e8] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#f8f4e8]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#1d2a1b] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#a6833b" />

        {/* Mempelai Wanita (Nara) */}
        <div className="flex flex-col items-center mt-4">
          <JavanesePointedArchFrame width={196} height={290}>
            {brideImage ? (
              <Image src={brideImage} alt={brideFullName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#c5a059]">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none opacity-60" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </JavanesePointedArchFrame>

          <h3
            className="text-2xl font-bold text-[#1d2a1b] mt-3.5"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {brideFullName}
          </h3>
          <div className="text-xs text-[#55664d] mt-1.5 leading-relaxed">
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
            {groomImage ? (
              <Image src={groomImage} alt={groomFullName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#c5a059]">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none opacity-60" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </JavanesePointedArchFrame>

          <h3
            className="text-2xl font-bold text-[#1d2a1b] mt-3.5"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {groomFullName}
          </h3>
          <div className="text-xs text-[#55664d] mt-1.5 leading-relaxed">
            {groomParents.split("\n").map((line: string, idx: number) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseCoupleSection.craft = {
  displayName: "Javanese Couple",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "MEMPELAI",
    title: "Kedua Mempelai",
    brideFullName: "Nara Ayu Pramesti",
    brideParents: "Putri kedua Bapak Hartono\n& Ibu Wulandari",
    groomFullName: "Dimas Adi Pratama",
    groomParents: "Putra pertama Bapak Slamet Widodo\n& Ibu Sri Rahayu",
  },
};

// Javanese Event Details Section (Matches Reference 3: 390 x 801 Ratio)
export interface CraftJavaneseEventDetailsProps {
  tagline?: string;
  title?: string;
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
}

export const CraftJavaneseEventDetailsSection: UserComponent<CraftJavaneseEventDetailsProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.eventDetails || props;
  const tagline = data.tagline ?? props.tagline ?? "DETAIL ACARA";
  const title = data.title ?? props.title ?? "Waktu & Tempat";
  const akadTitle = data.akadTitle ?? props.akadTitle ?? "Akad Nikah";
  const akadDate = data.akadDate ?? props.akadDate ?? "SABTU, 20 MARET 2027";
  const akadTime = data.akadTime ?? props.akadTime ?? "08.00 – 10.00 WIB";
  const akadVenue = data.akadVenue ?? props.akadVenue ?? "Masjid Al-Ikhlas";
  const akadAddress = data.akadAddress ?? props.akadAddress ?? "Jl. Cendana No. 5, Bandung";

  const resepsiTitle = data.resepsiTitle ?? props.resepsiTitle ?? "Resepsi";
  const resepsiDate = data.resepsiDate ?? props.resepsiDate ?? "SABTU, 20 MARET 2027";
  const resepsiTime = data.resepsiTime ?? props.resepsiTime ?? "11.00 – 14.00 WIB";
  const resepsiVenue = data.resepsiVenue ?? props.resepsiVenue ?? "Gedung Serbaguna Al-Hidayah";
  const resepsiAddress = data.resepsiAddress ?? props.resepsiAddress ?? "Jl. Cendana No. 9, Bandung";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-event"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[801px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#c5a059] ring-offset-2 ring-offset-[#2f3b22]" : "hover:outline hover:outline-dashed hover:outline-[#c5a059]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#c5a059] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#f8f5ec] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#c5a059" />

        <div className="w-full max-w-[342px] space-y-4 mt-3">
          {/* Card 1: Akad Nikah (Matches Reference 3) */}
          <div className="bg-[#5b6b3a] border border-[#b8913e] rounded-[24px] p-6 text-center shadow-md">
            <h3
              className="text-2xl font-bold text-[#e0c27d]"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {akadTitle}
            </h3>
            <p className="text-xs font-bold text-white tracking-[0.15em] uppercase mt-2.5">
              {akadDate}
            </p>
            <p className="text-xs text-[#e4e9d3] mt-1">{akadTime}</p>
            <p className="text-xs text-[#e4e9d3] mt-2.5 font-medium">{akadVenue}</p>
            <p className="text-xs text-[#d4dcc9] italic mt-0.5">{akadAddress}</p>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <div className="rounded-full py-2.5 px-6 bg-[#b8913e] text-[#1e2918] font-bold text-xs shadow-xs">
                Buka Peta
              </div>
              <div className="rounded-full py-2.5 px-5 bg-transparent border border-[#b8913e] text-[#e4e9d3] font-bold text-xs">
                Simpan Kalender
              </div>
            </div>
          </div>

          {/* Card 2: Resepsi (Matches Reference 3) */}
          <div className="bg-[#5b6b3a] border border-[#b8913e] rounded-[24px] p-6 text-center shadow-md">
            <h3
              className="text-2xl font-bold text-[#e0c27d]"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              {resepsiTitle}
            </h3>
            <p className="text-xs font-bold text-white tracking-[0.15em] uppercase mt-2.5">
              {resepsiDate}
            </p>
            <p className="text-xs text-[#e4e9d3] mt-1">{resepsiTime}</p>
            <p className="text-xs text-[#e4e9d3] mt-2.5 font-medium">{resepsiVenue}</p>
            <p className="text-xs text-[#d4dcc9] italic mt-0.5">{resepsiAddress}</p>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <div className="rounded-full py-2.5 px-6 bg-[#b8913e] text-[#1e2918] font-bold text-xs shadow-xs">
                Buka Peta
              </div>
              <div className="rounded-full py-2.5 px-5 bg-transparent border border-[#b8913e] text-[#e4e9d3] font-bold text-xs">
                Simpan Kalender
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseEventDetailsSection.craft = {
  displayName: "Javanese Event Details",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
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
};

// Javanese Location Section (Matches Reference: 390 x 645 Ratio)
export interface CraftJavaneseLocationProps {
  tagline?: string;
  title?: string;
  venueName?: string;
  address?: string;
  mapsUrl?: string;
}

export const CraftJavaneseLocationSection: UserComponent<CraftJavaneseLocationProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.location || props;
  const tagline = data.tagline ?? props.tagline ?? "LOKASI ACARA";
  const title = data.title ?? props.title ?? "Peta Lokasi";
  const venueName = data.venueName ?? props.venueName ?? "Masjid Al-Ikhlas";
  const address = data.address ?? props.address ?? "Jl. Cendana No. 5, Bandung 40111";
  const mapsUrl = data.mapsUrl ?? props.mapsUrl ?? "https://maps.google.com";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-location"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[645px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#2f3b22]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#f8f4e8] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#b8913e" />

        {/* Venue & Address */}
        <div className="mt-2 mb-3 text-center">
          <h3
            className="text-lg font-bold text-[#f8f4e8]"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {venueName}
          </h3>
          <p className="text-xs text-[#e4e9d3] mt-1 max-w-[280px] mx-auto leading-relaxed">
            {address}
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
            <rect width="342" height="240" fill="#e7e9d6" />
            <rect x="215" y="40" width="90" height="60" rx="16" fill="#ccd6ac" />
            <path
              d="M 0 165 C 80 165, 120 148, 180 148 C 240 148, 280 138, 342 138 L 342 172 C 280 172, 240 182, 180 182 C 120 182, 80 198, 0 198 Z"
              fill="#b4cbdb"
            />
            <line x1="60" y1="0" x2="72" y2="240" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            <line x1="245" y1="0" x2="260" y2="240" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
            <line x1="0" y1="65" x2="210" y2="52" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
            <line x1="0" y1="130" x2="342" y2="108" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
            <line x1="185" y1="130" x2="315" y2="190" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
            <line x1="120" y1="0" x2="158" y2="240" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
            <ellipse cx="145" cy="142" rx="10" ry="4" fill="#000000" fillOpacity="0.2" />
            <g transform="translate(145, 115)">
              <path
                d="M 0 -38 C -14 -38, -25 -27, -25 -13 C -25 5, 0 25, 0 25 C 0 25, 25 5, 25 -13 C 25 -27, 14 -38, 0 -38 Z"
                fill="#b8913e"
                stroke="#2f3b22"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="-13" r="5.5" fill="#2f3b22" />
            </g>
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
                {venueName}
              </text>
            </g>
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col items-center mt-3 space-y-2.5">
          <div className="w-full max-w-[300px] h-[46px] rounded-full bg-[#b8913e] text-[#2f3b22] font-semibold text-xs flex items-center justify-center shadow-md">
            Buka di Google Maps
          </div>
          <div className="w-full max-w-[300px] h-[46px] rounded-full bg-transparent border border-[#b8913e] text-[#e3cb8b] font-semibold text-xs flex items-center justify-center">
            Salin Alamat
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseLocationSection.craft = {
  displayName: "Javanese Location",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "LOKASI ACARA",
    title: "Peta Lokasi",
    venueName: "Masjid Al-Ikhlas",
    address: "Jl. Cendana No. 5, Bandung 40111",
    mapsUrl: "https://maps.google.com",
  },
};

// Javanese RSVP Section (Matches Reference: 390 x 530 Ratio)
export interface CraftJavaneseRsvpProps {
  tagline?: string;
  title?: string;
  deadline?: string;
}

export const CraftJavaneseRsvpSection: UserComponent<CraftJavaneseRsvpProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.rsvp || props;
  const tagline = data.tagline ?? props.tagline ?? "KONFIRMASI";
  const title = data.title ?? props.title ?? "Konfirmasi Kehadiran";
  const deadline = data.deadline ?? data.deadlineText ?? props.deadline ?? "Mohon konfirmasi sebelum 10 Maret 2027";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-rsvp"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[530px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-8 bg-[#e4e9d3] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#e4e9d3]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <p
          className="text-[13px] text-[#55664d] italic mt-2 mb-4"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {deadline}
        </p>

        {/* Form Card (White with gold border) */}
        <div className="w-full max-w-[342px] rounded-[24px] bg-white border border-[#b8913e] p-6 shadow-sm select-none">
          <div className="text-center">
            <label className="text-[11px] font-bold tracking-[0.2em] text-[#2f3b22] uppercase block mb-2">
              NAMA
            </label>
            <div className="w-full rounded-2xl border border-[#55664d]/60 px-4 py-2.5 text-center text-xs text-[#889980] bg-white">
              Nama lengkap
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="py-2.5 rounded-full text-xs font-semibold bg-[#b8913e] text-[#2f3b22] flex items-center justify-center shadow-xs">
              Hadir
            </div>
            <div className="py-2.5 rounded-full text-xs font-semibold bg-white border border-[#55664d] text-[#2f3b22] flex items-center justify-center">
              Tidak Hadir
            </div>
          </div>

          <div className="text-center mt-4">
            <label className="text-[11px] font-bold tracking-[0.2em] text-[#2f3b22] uppercase block mb-2">
              JUMLAH TAMU
            </label>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-8 h-8 rounded-full border border-[#55664d] flex items-center justify-center text-sm text-[#2f3b22]">
                −
              </div>
              <span
                className="text-2xl font-bold italic text-[#2f3b22] w-8 text-center"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                2
              </span>
              <div className="w-8 h-8 rounded-full border border-[#55664d] flex items-center justify-center text-sm text-[#2f3b22]">
                +
              </div>
            </div>
          </div>

          <div className="w-full h-[46px] rounded-full bg-[#b8913e] text-[#2f3b22] font-semibold text-xs flex items-center justify-center shadow-md mt-5">
            Kirim Konfirmasi
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseRsvpSection.craft = {
  displayName: "Javanese RSVP",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "KONFIRMASI",
    title: "Konfirmasi Kehadiran",
    deadline: "Mohon konfirmasi sebelum 10 Maret 2027",
  },
};

// Javanese Voice Note / Pesan Personal Section (Matches Reference: 390 x 744 Ratio)
export interface CraftJavaneseVoiceNoteProps {
  tagline?: string;
  title?: string;
  desc?: string;
}

export const CraftJavaneseVoiceNoteSection: UserComponent<CraftJavaneseVoiceNoteProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.voiceNote || props;
  const tagline = data.tagline ?? props.tagline ?? "FITUR TAMBAHAN";
  const title = data.title ?? props.title ?? "Pesan Personal";
  const desc = data.desc ?? props.desc ?? "Tinggalkan ucapan dalam rekaman suara atau video singkat, maksimal 10 detik.";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-voice-note"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[744px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-10 bg-[#2f3b22] text-[#f8f5ec] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#2f3b22]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#f8f4e8] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#b8913e" />

        <p className="text-xs text-[#e4e9d3] max-w-[280px] mx-auto text-center leading-relaxed mt-1">
          {desc}
        </p>

        <div className="inline-block mt-3 px-4 py-1 rounded-full border border-[#957b37] bg-[#232d19] text-[11px] font-semibold text-[#b8913e] select-none">
          Terbuka setelah RSVP dikirim
        </div>

        {/* Card */}
        <div className="w-full max-w-[342px] min-h-[460px] rounded-[24px] bg-[#566638] border border-[#957b37] p-6 flex flex-col items-center justify-between text-center relative shadow-lg mt-4 select-none">
          <div className="w-[220px] h-[38px] rounded-full border border-[#957b37] bg-transparent p-0.5 flex items-center">
            <div className="w-[110px] h-full rounded-full bg-[#b8913e] text-[#2f3b22] font-semibold text-xs flex items-center justify-center">
              Suara
            </div>
            <div className="flex-1 h-full rounded-full bg-transparent text-[#e3cb8b] font-semibold text-xs flex items-center justify-center">
              Video
            </div>
          </div>

          <div className="my-5 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-2 border-[#b8913e] flex items-center justify-center bg-[#5b6b3a]/50 shadow-inner">
              <svg className="w-8 h-8 text-[#b8913e] fill-current" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>

            <div
              className="text-4xl font-bold text-white tracking-widest mt-4"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              00:10
            </div>

            <div className="flex items-center justify-center space-x-1.5 mt-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-1 h-1 rounded-full bg-[#b8913e]" />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-[#f8f5ec]">
              Ketuk untuk mulai merekam.
            </p>
            <p className="text-xs text-[#e4e9d3]/80 mt-0.5">
              Browser akan meminta izin mikrofon.
            </p>
            <p
              className="text-xs italic text-[#e3cb8b] underline mt-3"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              Lebih suka mengetik? Tulis pesan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseVoiceNoteSection.craft = {
  displayName: "Javanese Voice Note",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "FITUR TAMBAHAN",
    title: "Pesan Personal",
    desc: "Tinggalkan ucapan dalam rekaman suara atau video singkat, maksimal 10 detik.",
  },
};

// Javanese Wishes / Doa & Ucapan Section
export interface CraftJavaneseWishesProps {
  tagline?: string;
  title?: string;
  introText?: string;
}

export const CraftJavaneseWishesSection: UserComponent<CraftJavaneseWishesProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.wishes || props;
  const tagline = data.tagline ?? props.tagline ?? "BUKU TAMU";
  const title = data.title ?? props.title ?? "Ucapan & Doa";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-wishes"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[696px] w-full max-w-[390px] mx-auto flex flex-col items-center text-center px-4 pt-12 pb-10 bg-[#f8f4e8] text-[#2f3b22] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#f8f4e8]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        {/* Small Caps Tagline */}
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-bold font-sans">
          {tagline}
        </p>

        {/* Heading */}
        <h2
          className="text-3xl sm:text-[34px] font-bold text-[#2f3b22] mt-1 mb-2 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>

        <JavaneseStarDivider color="#b8913e" />

        {/* Wishes Form Card (Sage Green Background #e4e9d3) */}
        <div className="w-full max-w-[340px] bg-[#e4e9d3] rounded-[24px] p-5 text-left space-y-4 shadow-xs font-sans mt-5">
          <div>
            <label className="text-[10px] font-bold tracking-widest text-[#2f3b22] uppercase block mb-1.5">
              NAMA
            </label>
            <input
              type="text"
              disabled
              placeholder="Nama"
              className="w-full rounded-[14px] bg-white border border-[#bfc8a5] px-4 py-2.5 text-xs text-[#2f3b22] placeholder:text-[#888888]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest text-[#2f3b22] uppercase block mb-1.5">
              UCAPAN
            </label>
            <textarea
              disabled
              rows={3}
              placeholder="Tulis ucapan untuk kedua mempelai"
              className="w-full rounded-[14px] bg-white border border-[#bfc8a5] px-4 py-2.5 text-xs text-[#2f3b22] placeholder:text-[#888888] resize-none"
            />
          </div>

          <div className="w-full rounded-full bg-[#b8913e] text-[#2f3b22] py-3 text-xs font-semibold tracking-wide uppercase shadow-xs text-center">
            Kirim Ucapan
          </div>
        </div>

        {/* List of Wishes (Vertical Gold Line Accent) */}
        <div className="w-full max-w-[340px] mt-6 space-y-4 text-left font-sans">
          <div className="border-l-2 border-[#b8913e] pl-3 py-0.5 text-left">
            <h4
              className="text-sm font-bold text-[#2f3b22] leading-tight"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              Bu Retno
            </h4>
            <p className="text-xs text-[#5b6b3a] mt-0.5 leading-relaxed font-sans">
              Barakallahu lakuma wa baraka &apos;alaikuma wa jama&apos;a bainakuma fii khair.
            </p>
          </div>
          <div className="border-l-2 border-[#b8913e] pl-3 py-0.5 text-left">
            <h4
              className="text-sm font-bold text-[#2f3b22] leading-tight"
              style={{ fontFamily: "'Amiri', serif" }}
            >
              Mas Dimas
            </h4>
            <p className="text-xs text-[#5b6b3a] mt-0.5 leading-relaxed font-sans">
              Semoga sakinah, mawaddah, warahmah selalu ya!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseWishesSection.craft = {
  displayName: "Javanese Wishes",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "BUKU TAMU",
    title: "Ucapan & Doa",
  },
};

// Javanese Digital Gift / Kirim Hadiah Section
export interface CraftJavaneseGiftProps {
  tagline?: string;
  title?: string;
  introText?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  bank1Name?: string;
  bank1Account?: string;
  bank1Holder?: string;
}

export const CraftJavaneseGiftSection: UserComponent<CraftJavaneseGiftProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.gift || props;
  const tagline = data.tagline ?? props.tagline ?? "INFORMASI TAMBAHAN";
  const title = data.title ?? props.title ?? "Kirim Hadiah";
  const introText =
    data.introText ??
    props.introText ??
    "Kehadiran dan doa Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:";
  const bankName = data.bankName ?? data.bank1Name ?? props.bankName ?? props.bank1Name ?? "BCA";
  const accountHolder = data.accountHolder ?? data.bank1Holder ?? props.accountHolder ?? props.bank1Holder ?? "Dimas Adi Pratama";
  const accountNumber = data.accountNumber ?? data.bank1Account ?? props.accountNumber ?? props.bank1Account ?? "1234 5678 90";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-gift"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[535px] w-full max-w-[390px] mx-auto flex flex-col items-center text-center px-4 pt-12 pb-10 bg-[#ede6d2] text-[#2f3b22] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#ede6d2]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        {/* Small Caps Tagline */}
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#b8913e] font-medium font-sans">
          {tagline}
        </p>

        {/* Heading */}
        <h2
          className="text-3xl sm:text-[34px] font-bold text-[#2f3b22] mt-1 mb-2 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>

        <JavaneseStarDivider color="#b8913e" />

        {/* Description */}
        <p className="text-xs text-[#22281a] max-w-[290px] mx-auto text-center leading-relaxed mt-4 mb-6 font-sans whitespace-pre-line">
          {introText}
        </p>

        {/* Main Dark Green Gift Card (#2f3b22) */}
        <div className="w-full max-w-[340px] rounded-[24px] bg-[#2f3b22] p-6 text-center shadow-md font-sans">
          <p className="text-xs text-[#e4e9d3] font-normal tracking-wide">
            {bankName} a.n {accountHolder}
          </p>

          <div
            className="text-3xl font-bold text-[#e3cb8b] tracking-widest my-4 select-all"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            {accountNumber}
          </div>

          <div className="mx-auto rounded-full bg-[#b8913e] text-[#2f3b22] px-8 py-2.5 text-xs font-semibold tracking-normal shadow-xs flex items-center justify-center">
            Salin Nomor Rekening
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseGiftSection.craft = {
  displayName: "Javanese Gift",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "INFORMASI TAMBAHAN",
    title: "Kirim Hadiah",
    introText: "Kehadiran dan doa Bapak/Ibu/Saudara/i sudah menjadi hadiah terindah. Bila berkenan berbagi kebahagiaan, dapat melalui:",
    bankName: "BCA",
    accountHolder: "Dimas Adi Pratama",
    accountNumber: "1234 5678 90",
  },
};

// Javanese Closing Section (Matches Reference: 390 x 656 Ratio)
export interface CraftJavaneseClosingProps {
  title?: string;
  message?: string;
  coupleName?: string;
  dresscode?: string;
  eventNotes?: string;
  contactPerson?: string;
  skylineImage?: string;
  tagline?: string;
  arabicPraise?: string;
  familySignature?: string;
  familySubtext?: string;
}

export const CraftJavaneseClosingSection: UserComponent<CraftJavaneseClosingProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.closing || props;
  const title = data.title ?? props.title ?? "Jazakumullahu Khairan";
  const message =
    data.message ??
    props.message ??
    "Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.";
  const coupleName =
    data.coupleName ?? props.coupleName ?? data.familySignature ?? props.familySignature ?? "Nara & Dimas";
  const dresscode = data.dresscode ?? props.dresscode ?? "Dresscode: Sage & Ivory";
  const eventNotes =
    data.eventNotes ?? props.eventNotes ?? "Mohon hadir 15 menit sebelum acara dimulai.";
  const contactPerson =
    data.contactPerson ?? props.contactPerson ?? "Kontak panitia: 0812-3456-7890";
  const skylineImage =
    data.skylineImage ?? props.skylineImage ?? "/templates/javanesse-elegant/skyline.png";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-closing"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[656px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 pt-12 pb-0 bg-[#2f3b22] text-[#f8f4e8] overflow-hidden transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#b8913e] ring-offset-2 ring-offset-[#2f3b22]" : "hover:outline hover:outline-dashed hover:outline-[#b8913e]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center z-20">
        {/* Main Title (Amiri Font, Light Gold) */}
        <h2
          className="text-3xl sm:text-[34px] font-bold text-[#e3cb8b] tracking-wide mb-2"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>

        <JavaneseStarDivider color="#b8913e" />

        {/* Closing Message */}
        <p className="text-xs text-[#e4e9d3] max-w-[290px] mx-auto leading-relaxed mt-3 mb-4 font-sans whitespace-pre-line text-center">
          {message}
        </p>

        {/* Couple Names */}
        <h3
          className="text-3xl font-bold text-[#f8f4e8] tracking-wide my-3"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {coupleName.includes("&") ? (
            <>
              {coupleName.split("&")[0].trim()}{" "}
              <span className="text-[#b8913e] font-normal italic">&amp;</span>{" "}
              {coupleName.split("&")[1].trim()}
            </>
          ) : (
            coupleName
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
            {dresscode}
          </p>
          <p className="text-xs text-[#e4e9d3] leading-relaxed">
            {eventNotes}
          </p>
          <p className="text-xs text-[#e4e9d3]">
            {contactPerson}
          </p>
        </div>
      </div>

      {/* Mosque Skyline Image at bottom (390 x 120 px) */}
      <div className="w-full mt-auto relative z-10 pointer-events-none select-none">
        <img
          src={skylineImage}
          alt="Skyline Masjid"
          className="w-full h-[120px] object-cover object-top block"
        />
      </div>
    </div>
  );
};

CraftJavaneseClosingSection.craft = {
  displayName: "Javanese Closing",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
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

// Javanese Countdown / Hitung Mundur Section (Matches Reference: 390 x 305 Ratio)
export interface CraftJavaneseCountdownProps {
  tagline?: string;
  title?: string;
  days?: string | number;
  hours?: string | number;
  minutes?: string | number;
  seconds?: string | number;
}

export const CraftJavaneseCountdownSection: UserComponent<CraftJavaneseCountdownProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.countdown || props;
  const tagline = data.tagline ?? props.tagline ?? "MENUJU HARI BAHAGIA";
  const title = data.title ?? props.title ?? "Hitung Mundur";
  const days = data.days ?? props.days ?? "151";
  const hours = data.hours ?? props.hours ?? "20";
  const minutes = data.minutes ?? props.minutes ?? "15";
  const seconds = data.seconds ?? props.seconds ?? "39";

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-countdown"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[305px] w-full max-w-[390px] mx-auto flex flex-col justify-center items-center text-center px-4 py-8 bg-[#f8f4e8] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#f8f4e8]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#2f3b22] mt-1 mb-4 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>

        <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-1">
          {/* Hari */}
          <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
            <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
              {days}
            </span>
            <span className="text-[11px] font-medium text-[#f8f4e8] mt-1">
              Hari
            </span>
          </div>
          {/* Jam */}
          <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
            <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
              {hours}
            </span>
            <span className="text-[11px] font-medium text-[#f8f4e8] mt-1">
              Jam
            </span>
          </div>
          {/* Menit */}
          <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
            <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
              {minutes}
            </span>
            <span className="text-[11px] font-medium text-[#f8f4e8] mt-1">
              Menit
            </span>
          </div>
          {/* Detik */}
          <div className="w-[76px] h-[94px] bg-[#2f3b22] rounded-t-[38px] rounded-b-[18px] flex flex-col items-center justify-center shadow-md select-none">
            <span className="text-2xl font-bold text-[#e3cb8b] leading-tight" style={{ fontFamily: "'Amiri', serif" }}>
              {seconds}
            </span>
            <span className="text-[11px] font-medium text-[#f8f4e8] mt-1">
              Detik
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseCountdownSection.craft = {
  displayName: "Javanese Countdown",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "MENUJU HARI BAHAGIA",
    title: "Hitung Mundur",
    days: "151",
    hours: "20",
    minutes: "15",
    seconds: "39",
  },
};

// Javanese Rundown / Susunan Acara Section (Matches Reference: 390 x 645 Ratio)
export interface CraftJavaneseRundownProps {
  tagline?: string;
  title?: string;
  items?: Array<{ time: string; title: string; desc: string }>;
}

export const CraftJavaneseRundownSection: UserComponent<CraftJavaneseRundownProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.rundown || props;
  const tagline = data.tagline ?? props.tagline ?? "RUNDOWN";
  const title = data.title ?? props.title ?? "Susunan Acara";
  const items = data.items ?? props.items ?? [
    { time: "07.30", title: "Registrasi Tamu", desc: "Penerimaan tamu dan buku tamu" },
    { time: "08.00", title: "Akad Nikah", desc: "Ijab kabul di masjid" },
    { time: "10.00", title: "Sesi Foto", desc: "Foto bersama keluarga" },
    { time: "11.00", title: "Resepsi Dibuka", desc: "Penyambutan tamu undangan" },
    { time: "12.00", title: "Santap Siang", desc: "Hidangan dan ramah tamah" },
    { time: "14.00", title: "Doa Penutup", desc: "Acara selesai" },
  ];

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-rundown"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[645px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-10 bg-[#e4e9d3] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#e4e9d3]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#a6833b" />

        {/* Timeline List */}
        <div className="w-full max-w-[342px] mt-6 relative text-left">
          {/* Continuous Vertical Line at x=92px */}
          <div className="absolute left-[92px] top-3 bottom-5 w-[1.5px] bg-[#c9b275]" />

          <div className="space-y-6">
            {items.map((item: any, idx: number) => (
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

                {/* Diamond Marker */}
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
                  <p className="text-xs text-[#55664d] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

CraftJavaneseRundownSection.craft = {
  displayName: "Javanese Rundown",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
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
};

// Javanese Gallery / Momen Kami Section (Matches Reference: 337 x 1024 / 390 x 1185 Ratio)
export interface CraftJavaneseGalleryProps {
  tagline?: string;
  title?: string;
  videoUrl?: string;
  images?: string[];
}

export const CraftJavaneseGallerySection: UserComponent<CraftJavaneseGalleryProps> = (props) => {
  const liveCtx = useContext(BuilderLiveContext);
  const data = liveCtx?.sectionData?.gallery || props;
  const tagline = data.tagline ?? props.tagline ?? "GALERI";
  const title = data.title ?? props.title ?? "Momen Kami";
  const videoUrl = data.videoUrl ?? props.videoUrl ?? "";
  const images = data.images ?? props.images ?? [];

  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div
      id="section-gallery"
      ref={(dom) => {
        if (dom) connect(drag(dom));
      }}
      className={`relative min-h-[1100px] w-full max-w-[390px] mx-auto flex flex-col justify-between items-center text-center px-4 py-10 bg-[#f8f4e8] text-[#1d2a1b] transition-all cursor-pointer ${
        selected ? "ring-2 ring-[#a6833b] ring-offset-2 ring-offset-[#f8f4e8]" : "hover:outline hover:outline-dashed hover:outline-[#a6833b]/50"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full flex flex-col items-center">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#a6833b] font-bold">
          {tagline}
        </p>
        <h2
          className="text-3xl font-bold text-[#2f3b22] mt-1 mb-1 tracking-tight"
          style={{ fontFamily: "'Amiri', serif" }}
        >
          {title}
        </h2>
        <JavaneseStarDivider color="#a6833b" />

        {/* Video Card */}
        <div className="w-full max-w-[342px] h-[155px] rounded-2xl overflow-hidden relative border border-[#a6833b]/60 shadow-md flex flex-col items-center justify-center my-3 bg-gradient-to-b from-[#64744d] via-[#4d5c38] to-[#28351e] select-none">
          <div className="w-14 h-14 rounded-full border border-[#d4b97a] bg-[#1e2918]/60 flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5 text-[#d4b97a] fill-current ml-0.5" viewBox="0 0 24 24">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e3cb8b] uppercase mt-3">
            VIDEO DOKUMENTASI
          </p>
        </div>

        {/* 6 Arched Pointed Dome Photo Frames Grid */}
        <div className="w-full max-w-[342px] mx-auto grid grid-cols-2 gap-3.5 mt-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="relative w-full aspect-[164/215] flex items-center justify-center select-none"
            >
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
              <div
                className="relative z-0 w-full h-full overflow-hidden flex items-center justify-center"
                style={{
                  clipPath:
                    "path('M 2 213 L 162 213 L 162 90 C 162 48 126 18 82 2 C 38 18 2 48 2 90 Z')",
                }}
              >
                {images[idx] ? (
                  <img
                    src={images[idx]}
                    alt={`Momen Kami ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-[#85926c] to-[#3e4d2e] flex flex-col items-center justify-center text-[#e4e9d3]/60">
                    <svg
                      className="w-8 h-8 stroke-current fill-none opacity-40 mb-1"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-[10px] tracking-wider uppercase opacity-50">
                      Ganti Foto
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

CraftJavaneseGallerySection.craft = {
  displayName: "Javanese Gallery",
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
  props: {
    tagline: "GALERI",
    title: "Momen Kami",
    videoUrl: "",
    images: [],
  },
};
