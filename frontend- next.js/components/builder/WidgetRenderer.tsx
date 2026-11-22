"use client";

import React, { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Input,
  Select,
  Tag,
  Typography,
  message as staticMessage,
} from "antd";
import {
  CalendarOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  SendOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  BuilderDevice,
  BuilderPropertyValue,
  BuilderWidget,
  getResponsiveProps,
} from "./model";
import { getBuilderObjectStyle, getBuilderTypographyStyle } from "./styles";

const { Text } = Typography;

interface WidgetRendererProps {
  widget: BuilderWidget;
  device: BuilderDevice;
  onSelect: () => void;
  previewMode?: boolean;
  parentSectionProps?: Record<string, BuilderPropertyValue>;
  onDirectFieldChange?: (fieldKey: string, text: string) => void;
  selectedSubElementId?: string | null;
  onSelectSubElement?: (subFieldKey: string) => void;
}

export function WidgetRenderer({
  widget,
  device,
  onSelect,
  previewMode = false,
  parentSectionProps,
  onDirectFieldChange,
  selectedSubElementId,
  onSelectSubElement,
}: WidgetRendererProps) {
  const antdApp = AntdApp.useApp();
  const message = antdApp?.message || staticMessage;
  const [now, setNow] = useState(() => Date.now());
  const [previewEventDate] = useState(
    () => new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [guestName, setGuestName] = useState("");
  const [attendance, setAttendance] = useState<string>();
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [guestbookMessage, setGuestbookMessage] = useState("");
  const [guestbookWishes, setGuestbookWishes] = useState<Array<{ name: string; text: string; time: string }>>([
    {
      name: "Budi & Maya",
      text: "Selamat menempuh hidup baru Mogran & Laura! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
      time: "2 jam yang lalu",
    },
    {
      name: "Keluarga Rahardian",
      text: "Happy wedding! Sangat bahagia melihat kalian berdua bersatu. Semoga senantiasa diberkahi kebahagiaan.",
      time: "5 jam yang lalu",
    },
  ]);

  const rawProps = getResponsiveProps(widget, device);
  const isCustomStyle = rawProps.styleMode === "custom";
  const props: Record<string, BuilderPropertyValue> = {
    ...rawProps,
    fontFamily: isCustomStyle
      ? rawProps.fontFamily
      : (parentSectionProps?.fontFamily as string) || rawProps.fontFamily,
    color: isCustomStyle
      ? rawProps.color
      : (parentSectionProps?.textColor as string) ||
        (parentSectionProps?.color as string) ||
        rawProps.color,
  };
  const eventDate = String(
    props.eventDate || (previewMode ? previewEventDate : "2026-12-28T09:00:00")
  );
  const eventTime = new Date(eventDate).getTime();
  const secondsRemaining =
    eventDate && Number.isFinite(eventTime)
      ? Math.max(0, Math.floor((eventTime - now) / 1000))
      : 3600 * 24 * 45;

  useEffect(() => {
    if (
      widget.widgetType !== "countdown" ||
      !eventDate ||
      !Number.isFinite(eventTime)
    ) {
      return;
    }
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, [eventDate, eventTime, widget.widgetType]);

  const boxStyle = getBuilderObjectStyle(props);
  const typographyStyle = getBuilderTypographyStyle(props);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER BASED ON WIDGET TYPE
  // ═══════════════════════════════════════════════════════════════════════════
  let widgetContent: React.ReactNode;

  switch (widget.widgetType) {
    // ── 0. COVER WIDGET ──────────────────────────────────────────────────────
    case "cover": {
      widgetContent = (
        <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
          {props.title && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFAD38] bg-[#FFF8EE] border border-[#EAE5DF] px-2.5 py-0.5 rounded-full">
              {String(props.title)}
            </span>
          )}
          <Text strong className="text-lg font-serif text-[#422B1C] block" style={typographyStyle}>
            {String(props.coupleTitle || "MOGRAN & LAURA")}
          </Text>
          {props.subtitle && (
            <p className="text-xs text-[#99918A] max-w-xs leading-relaxed my-0">
              {String(props.subtitle)}
            </p>
          )}
          {props.imageUrl && (
            <div className="h-32 w-full overflow-hidden rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(props.imageUrl)}
                alt="Foto Cover"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {props.dateText && (
            <span className="text-[11px] text-[#99918A] font-medium pt-1">
              {String(props.dateText)}
            </span>
          )}
        </div>
      );
      break;
    }

    // ── 0B. STORY WIDGET ─────────────────────────────────────────────────────
    case "story":
    case "love_story": {
      let milestonesList: Array<{ id: string; year: string; title: string; story: string }> = [];
      try {
        if (typeof props.milestones === "string") {
          milestonesList = JSON.parse(props.milestones);
        } else if (Array.isArray(props.milestones)) {
          milestonesList = (props.milestones as unknown) as Array<{ id: string; year: string; title: string; story: string }>;
        }
      } catch {
        milestonesList = [];
      }
      if (!milestonesList.length) {
        milestonesList = [
          { id: "1", year: "2021", title: "Pertama Bertemu", story: "Berawal dari kedai kopi di Denpasar." },
          { id: "2", year: "2023", title: "Memulai Komitmen", story: "Melangkah bersama melewati suka dan duka." },
          { id: "3", year: "2026", title: "Menuju Pelaminan", story: "Mengikat janji suci di hadapan keluarga tercinta." },
        ];
      }

      widgetContent = (
        <div className="p-3 space-y-2">
          <div className="text-center mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFAD38] bg-[#FFF8EE] border border-[#EAE5DF] px-2 py-0.5 rounded-full inline-block mb-1">
              Love Story
            </span>
            <Text strong className="text-sm text-[#422B1C] block" style={typographyStyle}>
              {String(props.title || "Our Love Story")}
            </Text>
            {props.subtitle && (
              <p className="text-[11px] text-[#99918A] mt-0.5 mb-0">
                {String(props.subtitle)}
              </p>
            )}
          </div>
          <div className="relative border-l-2 border-[#EAE5DF] ml-3 pl-3 space-y-3 text-left">
            {milestonesList.map((m) => (
              <div key={m.id} className="relative">
                <span className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-[#FFAD38] border border-white shadow-xs" />
                <span className="text-[9px] font-mono font-bold text-[#FFAD38] bg-[#FFF8EE] px-1.5 py-0.5 rounded">
                  {m.year}
                </span>
                <div className="text-xs font-semibold text-[#422B1C] mt-0.5">{m.title}</div>
                <div className="text-[10px] text-[#99918A] leading-tight">{m.story}</div>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    // ── 1. COUNTDOWN WIDGET ──────────────────────────────────────────────────
    case "countdown": {
      const days = Math.floor(secondsRemaining / 86400);
      const hours = Math.floor((secondsRemaining % 86400) / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      widgetContent = (
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <Text strong className="text-base text-[#422B1C] mb-3 block" style={typographyStyle}>
            {String(props.title || "Menghitung Hari Bahagia")}
          </Text>
          <div className="grid grid-cols-4 gap-2 w-full max-w-[320px]">
            {[
              { val: days, label: "Hari" },
              { val: hours, label: "Jam" },
              { val: minutes, label: "Menit" },
              { val: seconds, label: "Detik" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-lg bg-[#FFF8EE] border border-[#EAE5DF] py-2 px-1 shadow-xs"
              >
                <span className="text-lg font-bold text-[#FFAD38] tabular-nums leading-none">
                  {String(item.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-[#99918A] mt-1 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    // ── 2. RSVP WIDGET ───────────────────────────────────────────────────────
    case "rsvp": {
      widgetContent = (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-3">
            <Text strong className="text-base text-[#422B1C] block" style={typographyStyle}>
              {String(props.title || "Konfirmasi Kehadiran (RSVP)")}
            </Text>
            {props.subtitle && (
              <Text type="secondary" className="text-xs text-[#99918A] block mt-0.5">
                {String(props.subtitle)}
              </Text>
            )}
          </div>

          {rsvpSubmitted ? (
            <div className="p-4 bg-[#E7F4EA] border border-[#A6D5B4] rounded-lg text-center">
              <Text strong className="text-sm text-[#173B2B] block">
                Terima kasih, konfirmasi Anda berhasil dikirim!
              </Text>
              <Text className="text-xs text-[#2A5C43] mt-1 block">
                Kami sangat menantikan kehadiran Anda di hari bahagia kami.
              </Text>
              <Button
                size="small"
                type="link"
                className="!text-xs mt-2"
                onClick={() => setRsvpSubmitted(false)}
              >
                Kirim tanggapan lain
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <Input
                size="small"
                placeholder="Nama Lengkap Tamu"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <Select
                size="small"
                className="w-full"
                value={attendance}
                placeholder="Pilih Konfirmasi Kehadiran"
                onChange={setAttendance}
                options={[
                  { value: "hadir", label: "Hadir, dengan senang hati" },
                  { value: "tidak_hadir", label: "Maaf, berhalangan hadir" },
                  { value: "ragu", label: "Belum dapat memastikan" },
                ]}
              />
              {props.showGuestCount && (
                <Select
                  size="small"
                  className="w-full"
                  defaultValue="1"
                  options={[
                    { value: "1", label: "1 Orang" },
                    { value: "2", label: "2 Orang" },
                    { value: "3", label: "3 Orang" },
                  ]}
                />
              )}
              <Button
                block
                type="primary"
                size="small"
                className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] hover:!bg-[#F5A623] !font-semibold"
                onClick={() => {
                  if (!guestName.trim() || !attendance) {
                    message.warning("Silakan isi nama dan status kehadiran Anda.");
                    return;
                  }
                  setRsvpSubmitted(true);
                  message.success("RSVP berhasil dikirim!");
                }}
              >
                {String(props.buttonLabel || "Kirim Konfirmasi")}
              </Button>
            </div>
          )}
        </div>
      );
      break;
    }

    // ── 3. MUSIC WIDGET ──────────────────────────────────────────────────────
    case "music": {
      widgetContent = (
        <div className="flex items-center justify-between p-3 gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8EE] border border-[#EAE5DF] text-[#FFAD38] ${
                musicPlaying ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "4s" }}
            >
              <CustomerServiceOutlined className="text-lg" />
            </div>
            <div className="min-w-0">
              <Text strong className="text-xs text-[#422B1C] block truncate">
                {String(props.songTitle || "A Thousand Years")}
              </Text>
              <Text type="secondary" className="text-[11px] text-[#99918A] block truncate">
                {String(props.artistName || "Christina Perri")}
              </Text>
            </div>
          </div>
          <Button
            shape="circle"
            size="small"
            type="primary"
            className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] shrink-0"
            icon={musicPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={() => {
              setMusicPlaying(!musicPlaying);
              if (!musicPlaying) {
                message.info("Memutar musik latar (Simulasi Audio).");
              }
            }}
          />
        </div>
      );
      break;
    }

    // ── 4. DIGITAL GIFT WIDGET ───────────────────────────────────────────────
    case "digital_gift": {
      const bankName = String(props.bankName || "BCA");
      const accountNumber = String(props.accountNumber || "1234 5678 90");
      const accountHolder = String(props.accountHolder || "Mogran & Laura");

      widgetContent = (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-2.5">
            <Text strong className="text-sm text-[#422B1C] block" style={typographyStyle}>
              {String(props.title || "Tanda Kasih (Digital Gift)")}
            </Text>
            {props.subtitle && (
              <Text type="secondary" className="text-[11px] text-[#99918A] block mt-0.5">
                {String(props.subtitle)}
              </Text>
            )}
          </div>

          <div className="rounded-xl bg-[#FFF8EE] border border-[#EAE5DF] p-3 text-center space-y-1 shadow-xs">
            <Tag color="gold" className="!font-semibold !px-2">
              {bankName}
            </Tag>
            <div className="text-base font-bold text-[#422B1C] tracking-wider font-mono">
              {accountNumber}
            </div>
            <div className="text-xs text-[#99918A]">
              a.n. <strong>{accountHolder}</strong>
            </div>

            {props.showCopyButton !== false && (
              <div className="pt-2">
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  className="!text-xs !border-[#EAE5DF] !text-[#FFAD38] hover:!text-[#D48816]"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(accountNumber.replace(/\s+/g, ""));
                      message.success("Nomor rekening berhasil disalin!");
                    } catch {
                      message.success("Nomor rekening: " + accountNumber);
                    }
                  }}
                >
                  Salin Nomor Rekening
                </Button>
              </div>
            )}
          </div>
        </div>
      );
      break;
    }

    // ── 5. EVENT DETAILS WIDGET ──────────────────────────────────────────────
    case "event_details": {
      const getFieldStyle = (
        fieldName: string,
        defaultColor?: string,
        defaultSize?: number,
        defaultWeight?: string | number
      ): React.CSSProperties => {
        const isVisible = props[`${fieldName}_visible`] !== false;
        if (!isVisible) return { display: "none" };
        const pad = props[`${fieldName}_padding`] !== undefined ? Number(props[`${fieldName}_padding`]) : undefined;
        const mar = props[`${fieldName}_margin`] !== undefined ? Number(props[`${fieldName}_margin`]) : undefined;
        const align = (props[`${fieldName}_alignment`] as string) || undefined;
        const w = props[`${fieldName}_width`] !== undefined ? (typeof props[`${fieldName}_width`] === "number" ? `${props[`${fieldName}_width`]}px` : String(props[`${fieldName}_width`])) : undefined;

        return {
          color: (props[`${fieldName}_color`] as string) || defaultColor,
          fontSize: props[`${fieldName}_fontSize`]
            ? `${props[`${fieldName}_fontSize`]}px`
            : defaultSize
            ? `${defaultSize}px`
            : undefined,
          fontFamily: (props[`${fieldName}_fontFamily`] as string) || typographyStyle.fontFamily,
          fontWeight: (props[`${fieldName}_fontWeight`] as string | number) || defaultWeight,
          marginBottom:
            props[`${fieldName}_spacing`] !== undefined
              ? `${props[`${fieldName}_spacing`]}px`
              : mar !== undefined ? `${mar}px` : undefined,
          padding: pad !== undefined ? `${pad}px` : undefined,
          textAlign: align as React.CSSProperties["textAlign"],
          width: w,
        };
      };

      const titleVisible = props.title_visible !== false;
      const badgeVisible = props.badge_visible !== false;
      const dateVisible = props.dateText_visible !== false;
      const timeVisible = props.timeText_visible !== false;
      const placeVisible = props.placeName_visible !== false;
      const addressVisible = props.address_visible !== false;
      const mapVisible = props.mapButton_visible !== false;

      const isSubSelected = (fieldKey: string) => !previewMode && selectedSubElementId === fieldKey;

      const getSubWrapperClass = (fieldKey: string) => {
        if (previewMode) return "transition-all";
        const selected = isSubSelected(fieldKey);
        return `transition-all rounded cursor-pointer relative group ${
          selected
            ? "outline-2 outline-[#FFAD38] bg-[#FFF8EE]/60 shadow-xs ring-1 ring-[#FFAD38]"
            : "hover:outline-1 hover:outline-dashed hover:outline-[#FFAD38]/60 hover:bg-[#FFF8EE]/30"
        }`;
      };

      widgetContent = (
        <div className="p-3.5 space-y-3">
          {(titleVisible || badgeVisible) && (
            <div className="flex items-center justify-between gap-2">
              {titleVisible && (
                <div
                  className={`flex-1 min-w-0 ${getSubWrapperClass("title")}`}
                  onClick={(e) => {
                    if (!previewMode && onSelectSubElement) {
                      e.stopPropagation();
                      onSelectSubElement("title");
                    }
                  }}
                  title={!previewMode ? "Pilih Judul Acara (Detail Properties)" : undefined}
                >
                  <span
                    contentEditable={!previewMode}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      onDirectFieldChange?.("title", e.currentTarget.textContent || "")
                    }
                    className="font-bold text-sm outline-none rounded px-0.5 cursor-text block truncate"
                    style={getFieldStyle("title", "#422B1C", 14, 700)}
                  >
                    {String(props.title || "Waktu & Tempat Acara")}
                  </span>
                </div>
              )}
              {badgeVisible && props.badge && (
                <div
                  className={getSubWrapperClass("badge")}
                  onClick={(e) => {
                    if (!previewMode && onSelectSubElement) {
                      e.stopPropagation();
                      onSelectSubElement("badge");
                    }
                  }}
                  title={!previewMode ? "Pilih Badge Acara (Detail Properties)" : undefined}
                >
                  <Tag
                    color="gold"
                    className="!mr-0 !text-[10px]"
                    style={getFieldStyle("badge")}
                  >
                    {String(props.badge)}
                  </Tag>
                </div>
              )}
            </div>
          )}

          {(dateVisible || timeVisible || placeVisible || addressVisible) && (
            <div className="space-y-2 rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-3">
              {(dateVisible || timeVisible) && (
                <div className="flex items-start gap-2">
                  <CalendarOutlined className="mt-0.5 text-[#FFAD38]" />
                  <div className="text-xs flex-1 min-w-0 space-y-1">
                    {dateVisible && (
                      <div
                        className={getSubWrapperClass("dateText")}
                        onClick={(e) => {
                          if (!previewMode && onSelectSubElement) {
                            e.stopPropagation();
                            onSelectSubElement("dateText");
                          }
                        }}
                        title={!previewMode ? "Pilih Tanggal Acara (Detail Properties)" : undefined}
                      >
                        <span
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            onDirectFieldChange?.("dateText", e.currentTarget.textContent || "")
                          }
                          className="font-semibold text-[#422B1C] block outline-none rounded px-0.5 cursor-text"
                          style={getFieldStyle("dateText", "#422B1C", 12, 600)}
                        >
                          {String(props.dateText || "Senin, 28 Desember 2026")}
                        </span>
                      </div>
                    )}
                    {timeVisible && (
                      <div
                        className={getSubWrapperClass("timeText")}
                        onClick={(e) => {
                          if (!previewMode && onSelectSubElement) {
                            e.stopPropagation();
                            onSelectSubElement("timeText");
                          }
                        }}
                        title={!previewMode ? "Pilih Waktu Acara (Detail Properties)" : undefined}
                      >
                        <span
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            onDirectFieldChange?.("timeText", e.currentTarget.textContent || "")
                          }
                          className="text-[#99918A] text-[11px] block outline-none rounded px-0.5 cursor-text"
                          style={getFieldStyle("timeText", "#99918A", 11)}
                        >
                          {String(props.timeText || "Akad: 08.00 WIB · Resepsi: 11.00 WIB")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(placeVisible || addressVisible) && (
                <div className="flex items-start gap-2 pt-1 border-t border-[#F0E6D6]">
                  <EnvironmentOutlined className="mt-0.5 text-[#FFAD38]" />
                  <div className="text-xs flex-1 min-w-0 space-y-1">
                    {placeVisible && (
                      <div
                        className={getSubWrapperClass("placeName")}
                        onClick={(e) => {
                          if (!previewMode && onSelectSubElement) {
                            e.stopPropagation();
                            onSelectSubElement("placeName");
                          }
                        }}
                        title={!previewMode ? "Pilih Tempat/Gedung (Detail Properties)" : undefined}
                      >
                        <span
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            onDirectFieldChange?.("placeName", e.currentTarget.textContent || "")
                          }
                          className="font-semibold text-[#422B1C] block outline-none rounded px-0.5 cursor-text"
                          style={getFieldStyle("placeName", "#422B1C", 12, 600)}
                        >
                          {String(props.placeName || "Grand Ballroom Hotel Mulia")}
                        </span>
                      </div>
                    )}
                    {addressVisible && (
                      <div
                        className={getSubWrapperClass("address")}
                        onClick={(e) => {
                          if (!previewMode && onSelectSubElement) {
                            e.stopPropagation();
                            onSelectSubElement("address");
                          }
                        }}
                        title={!previewMode ? "Pilih Alamat Lengkap (Detail Properties)" : undefined}
                      >
                        <span
                          contentEditable={!previewMode}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            onDirectFieldChange?.("address", e.currentTarget.textContent || "")
                          }
                          className="text-[#99918A] text-[11px] block leading-tight outline-none rounded px-0.5 cursor-text"
                          style={getFieldStyle("address", "#99918A", 11)}
                        >
                          {String(props.address || "Jl. Asia Afrika, Senayan, Jakarta Pusat")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {mapVisible && props.mapUrl && (
            <div
              className={getSubWrapperClass("mapButton")}
              onClick={(e) => {
                if (!previewMode && onSelectSubElement) {
                  e.stopPropagation();
                  onSelectSubElement("mapButton");
                }
              }}
              title={!previewMode ? "Pilih Tombol Peta (Detail Properties)" : undefined}
            >
              <Button
                block
                size="small"
                icon={<CompassOutlined />}
                className="!text-xs !bg-[#FFF8EE] !border-[#EAE5DF] !text-[#FFAD38] hover:!text-[#D48816]"
                style={getFieldStyle("mapButton")}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(String(props.mapUrl), "_blank");
                }}
              >
                {String(props.mapButton_text || "Petunjuk Arah (Google Maps)")}
              </Button>
            </div>
          )}
        </div>
      );
      break;
    }

    // ── 6. GALLERY WIDGET ────────────────────────────────────────────────────
    case "gallery": {
      const layout = String(props.galleryLayout || "grid-2");
      const count = Number(props.imageCount) || 4;
      const sampleImages = [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
        "/templates/wedding/couple-main.jpg",
        "/templates/wedding/venue.jpg",
      ].slice(0, count);

      widgetContent = (
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <Text strong className="text-sm text-[#422B1C]" style={typographyStyle}>
              {String(props.title || "Galeri Foto Bahagia")}
            </Text>
            <Tag color="gold" className="!mr-0 !text-[10px] !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30">
              {count} Foto · {layout}
            </Tag>
          </div>

          {layout === "carousel" ? (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {sampleImages.map((src, idx) => (
                <div
                  key={idx}
                  className="h-28 min-w-[130px] shrink-0 overflow-hidden rounded-lg bg-[#F7F6F4] border border-[#EAE5DF]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : layout === "grid-3" ? (
            <div className="grid grid-cols-3 gap-1.5">
              {sampleImages.map((src, idx) => (
                <div
                  key={idx}
                  className="h-20 overflow-hidden rounded-lg bg-[#F7F6F4] border border-[#EAE5DF]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sampleImages.map((src, idx) => (
                <div
                  key={idx}
                  className="h-24 overflow-hidden rounded-lg bg-[#F7F6F4] border border-[#EAE5DF]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      );
      break;
    }

    // ── 7. GUESTBOOK WIDGET ──────────────────────────────────────────────────
    case "guestbook": {
      widgetContent = (
        <div className="p-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <Text strong className="text-sm text-[#422B1C] block" style={typographyStyle}>
              {String(props.title || "Buku Tamu & Ucapan")}
            </Text>
            {props.subtitle && (
              <Text type="secondary" className="text-[11px] text-[#99918A] block mt-0.5">
                {String(props.subtitle)}
              </Text>
            )}
          </div>

          <div className="space-y-1.5">
            <Input
              size="small"
              placeholder="Nama Anda"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
            <Input.TextArea
              rows={2}
              size="small"
              placeholder="Tuliskan ucapan dan doa restu..."
              value={guestbookMessage}
              onChange={(e) => setGuestbookMessage(e.target.value)}
            />
            <Button
              size="small"
              type="primary"
              block
              icon={<SendOutlined />}
              className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs hover:!bg-[#F5A623]"
              onClick={() => {
                if (!guestName.trim() || !guestbookMessage.trim()) {
                  message.warning("Silakan tulis nama dan ucapan Anda.");
                  return;
                }
                setGuestbookWishes([
                  { name: guestName, text: guestbookMessage, time: "Baru saja" },
                  ...guestbookWishes,
                ]);
                setGuestbookMessage("");
                message.success("Ucapan berhasil dikirim!");
              }}
            >
              {String(props.buttonLabel || "Kirim Ucapan")}
            </Button>
          </div>

          {/* Wishes List */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 pt-1">
            {guestbookWishes.map((w, idx) => (
              <div key={idx} className="p-2 bg-[#FFF8EE] border border-[#EAE5DF] rounded text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#422B1C]">{w.name}</span>
                  <span className="text-[9px] text-[#99918A]">{w.time}</span>
                </div>
                <p className="text-[10px] text-[#99918A] mt-0.5 leading-tight mb-0">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    // ── 8. LOCATION / MAPS WIDGET ────────────────────────────────────────────
    case "maps": {
      widgetContent = (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Text strong className="text-sm text-[#422B1C]" style={typographyStyle}>
              {String(props.title || "Lokasi Acara")}
            </Text>
            <CompassOutlined className="text-[#FFAD38]" />
          </div>

          <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2.5 text-xs">
            <span className="font-semibold text-[#422B1C] block">
              {String(props.placeName || "Grand Ballroom Hotel Mulia")}
            </span>
            <span className="text-[#99918A] text-[11px] block mt-0.5">
              {String(props.address || "Jl. Asia Afrika, Senayan, Jakarta Pusat")}
            </span>
          </div>

          {/* Map Preview Mock */}
          <div className="relative h-20 w-full overflow-hidden rounded-lg border border-[#EAE5DF] bg-[#F7F6F4] flex items-center justify-center">
            <div className="text-center text-[#99918A]">
              <EnvironmentOutlined className="text-xl text-[#CB3025] block mb-0.5" />
              <span className="text-[10px] font-medium">Google Maps Preview</span>
            </div>
          </div>

          <Button
            block
            size="small"
            type="primary"
            icon={<CompassOutlined />}
            className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs hover:!bg-[#F5A623] !text-xs"
            onClick={(e) => {
              e.stopPropagation();
              window.open(String(props.mapUrl || "https://maps.google.com"), "_blank");
            }}
          >
            {String(props.buttonLabel || "Buka Petunjuk Arah")}
          </Button>
        </div>
      );
      break;
    }

    // ── 9. VIDEO GREETING WIDGET (ADD-ON) ────────────────────────────────────
    case "video_greeting": {
      widgetContent = (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Text strong className="text-sm text-[#422B1C]" style={typographyStyle}>
              {String(props.title || "Video Momen Bahagia")}
            </Text>
            <Tag color="gold" className="!mr-0 !text-[10px] font-medium !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30">
              Add-on
            </Tag>
          </div>

          <div className="relative h-36 w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(props.poster || "/templates/wedding/venue.jpg")}
              alt="Video Poster"
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                shape="circle"
                size="large"
                type="primary"
                danger
                icon={<PlayCircleOutlined className="text-xl" />}
                className="shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  message.info("Memutar preview video ucapan.");
                }}
              />
            </div>
          </div>
        </div>
      );
      break;
    }

    default:
      widgetContent = (
        <div className="p-3 text-center text-xs text-[#99918A]">
          <Text strong>{widget.name}</Text>
        </div>
      );
  }

  return (
    <Card
      size="small"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className="h-full w-full cursor-pointer hover:shadow-sm transition-shadow"
      style={{
        ...boxStyle,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {widgetContent}
    </Card>
  );
}
