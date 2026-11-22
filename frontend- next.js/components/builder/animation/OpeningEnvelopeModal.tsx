"use client";

import React, { useState } from "react";
import { MailOutlined, SafetyCertificateOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { OpeningAnimationType } from "./animationTypes";

interface OpeningEnvelopeModalProps {
  type: OpeningAnimationType;
  title?: string;
  guestName?: string;
  onOpenComplete: () => void;
  isOpen: boolean;
}

export function OpeningEnvelopeModal({
  type,
  title = "The Wedding Celebration",
  guestName = "Tamu Undangan",
  onOpenComplete,
  isOpen,
}: OpeningEnvelopeModalProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  if (!isOpen || type === "none" || isOpened) {
    return null;
  }

  const handleOpenClick = () => {
    setIsOpening(true);
    // Animasi buka amplop berlangsung 1.2 detik lalu serahkan tampilan ke isi undangan
    setTimeout(() => {
      setIsOpened(true);
      onOpenComplete();
    }, 1100);
  };

  const handleSkip = () => {
    setIsOpened(true);
    onOpenComplete();
  };

  // Sederhana untuk fade_in & slide_in
  if (type === "fade_in" || type === "slide_in") {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5] p-6 text-center transition-all duration-700 ${
          isOpening
            ? type === "fade_in"
              ? "opacity-0 pointer-events-none"
              : "-translate-y-full opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF8EE] text-[#FFAD38] border border-[#FFAD38]/30 shadow-xs">
            <MailOutlined className="text-2xl" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#99918A]">
            Undangan Eksklusif
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#422B1C] sm:text-3xl">
            {title}
          </h2>
          <div className="rounded-lg bg-white/80 p-3 border border-[#EAE5DF]">
            <span className="text-xs text-[#99918A] block mb-0.5">Kepada Yth:</span>
            <span className="font-bold text-sm text-[#422B1C]">{guestName}</span>
          </div>
          <div className="pt-2">
            <Button
              type="primary"
              size="large"
              icon={<ArrowDownOutlined />}
              onClick={handleOpenClick}
              className="!bg-[#FFAD38] !text-[#3D2516] !font-bold hover:!bg-[#F5A623] shadow-md px-6 !border-[#FFAD38]"
            >
              Buka Undangan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isWaxSeal = type === "envelope_wax_seal";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity duration-700 ${
        isOpening ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl bg-[#FFF8EE] p-6 sm:p-8 shadow-2xl border border-[#EAE5DF] text-center">
        {/* Tombol Lewati agar tidak pernah menghalangi tamu */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-3 right-3 text-xs text-[#99918A] hover:text-[#422B1C] underline cursor-pointer"
        >
          Lewati
        </button>

        {/* Envelope Graphic */}
        <div className="relative mx-auto mb-6 flex h-40 w-56 sm:h-44 sm:w-64 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#FAF5EE] to-[#EFE5D6] border-2 border-[#EAE5DF] shadow-md">
          {/* Envelope flap effect */}
          <div
            className={`absolute top-0 inset-x-0 h-16 origin-top bg-[#F3E6D3] border-b border-[#D8C2A3] transition-transform duration-700 rounded-t-xl ${
              isOpening ? "-rotate-x-180" : ""
            }`}
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            }}
          />

          {/* Letter Peek */}
          <div
            className={`w-44 sm:w-52 h-24 bg-white rounded-md shadow-xs p-3 transition-transform duration-700 flex flex-col justify-center items-center ${
              isOpening ? "-translate-y-8" : ""
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider text-[#FFAD38] font-bold">
              Save The Date
            </span>
            <span className="font-serif text-sm font-bold text-[#422B1C] truncate max-w-full">
              {title}
            </span>
            <span className="text-[11px] text-[#99918A] mt-1">Untuk: {guestName}</span>
          </div>

          {/* Wax Seal or Stamp */}
          <button
            type="button"
            onClick={handleOpenClick}
            className={`absolute bottom-6 z-10 flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer ${
              isWaxSeal
                ? "h-12 w-12 rounded-full bg-[#CB3025] text-white shadow-lg border-2 border-[#CB3025]"
                : "h-11 w-11 rounded-full bg-[#FFAD38] text-[#3D2516] shadow-md border border-[#FFAD38]"
            }`}
            title="Klik untuk membuka segel amplop"
          >
            {isWaxSeal ? (
              <SafetyCertificateOutlined className="text-xl" />
            ) : (
              <MailOutlined className="text-xl" />
            )}
          </button>
        </div>

        {/* Action text & button */}
        <h3 className="font-serif text-xl font-bold text-[#422B1C] mb-1">
          {isWaxSeal ? "Amplop Segel Resmi" : "Undangan Spesial Untuk Anda"}
        </h3>
        <p className="text-xs text-[#99918A] mb-4">
          Klik segel atau tombol di bawah untuk membuka lembaran undangan.
        </p>

        <Button
          type="primary"
          size="middle"
          onClick={handleOpenClick}
          loading={isOpening}
          className="!bg-[#FFAD38] !text-[#3D2516] !font-bold hover:!bg-[#F5A623] shadow-sm px-6 !border-[#FFAD38]"
        >
          {isWaxSeal ? "Buka Segel & Undangan" : "Buka Amplop Undangan"}
        </Button>
      </div>
    </div>
  );
}
