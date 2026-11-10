"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { usePartner } from "@/context/PartnerContext";

type TabType = "overview" | "guests" | "event_owner" | "share";
type GuestRsvpStatus = "Hadir" | "Tidak hadir" | "Belum merespons";

interface GuestItem {
  id: string;
  name: string;
  contact: string;
  rsvp: GuestRsvpStatus;
  guestCount: number | "-";
  message: string;
  rsvpTime: string;
}

const INITIAL_GUESTS: GuestItem[] = [
  {
    id: "g-1",
    name: "Ben",
    contact: "0812 7890 3456",
    rsvp: "Hadir",
    guestCount: 2,
    message: "Congrats ya kalian",
    rsvpTime: "5 Jan 2026, 14:20",
  },
  {
    id: "g-2",
    name: "Timothy",
    contact: "timothy@email.com",
    rsvp: "Tidak hadir",
    guestCount: "-",
    message: "Maaf belum bisa hadir",
    rsvpTime: "4 Jan 2026, 11:15",
  },
  {
    id: "g-3",
    name: "Thuril",
    contact: "0857 1234 5678",
    rsvp: "Belum merespons",
    guestCount: "-",
    message: "-",
    rsvpTime: "-",
  },
  {
    id: "g-4",
    name: "Dwi",
    contact: "0812 3456 7890",
    rsvp: "Hadir",
    guestCount: 3,
    message: "Sampai jumpa",
    rsvpTime: "3 Jan 2026, 09:40",
  },
  {
    id: "g-5",
    name: "Jack",
    contact: "jack@email.com",
    rsvp: "Tidak hadir",
    guestCount: 1,
    message: "Bahagia selalu",
    rsvpTime: "2 Jan 2026, 18:22",
  },
  {
    id: "g-6",
    name: "Dini",
    contact: "0821 7508 8285",
    rsvp: "Hadir",
    guestCount: 8,
    message: "Bahagia selalu",
    rsvpTime: "5 Jan 2026, 10:12",
  },
  {
    id: "g-7",
    name: "Catur",
    contact: "085 1747 8539",
    rsvp: "Hadir",
    guestCount: 3,
    message: "Congarts buat kalian uhuy",
    rsvpTime: "1 Jan 2026, 16:50",
  },
  {
    id: "g-8",
    name: "Jenie",
    contact: "Jenie@email.com",
    rsvp: "Hadir",
    guestCount: 1,
    message: "Happy wedding yaa",
    rsvpTime: "30 Des 2025, 20:05",
  },
];

export default function InvitationDetailPage() {
  const params = useParams();
  const invitationId = params.id as string;
  const { invitations } = usePartner();
  const found = invitations.find((i) => i.id === invitationId);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Guest list & filter states
  const [guestSubTab, setGuestSubTab] = useState<"daftar" | "ucapan">("daftar");
  const [guests, setGuests] = useState<GuestItem[]>(INITIAL_GUESTS);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<"all" | "hadir" | "tidak_hadir" | "belum_merespons">("all");

  // Drawer & Modal states
  const [selectedGuestForDetail, setSelectedGuestForDetail] = useState<GuestItem | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<GuestItem | null>(null);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<GuestItem | null>(null);

  // Form states for Add / Edit Guest
  const [formGuestName, setFormGuestName] = useState("");
  const [formGuestContact, setFormGuestContact] = useState("");
  const [formGuestRsvp, setFormGuestRsvp] = useState<GuestRsvpStatus>("Hadir");
  const [formGuestCount, setFormGuestCount] = useState<string>("2");
  const [formGuestMessage, setFormGuestMessage] = useState("");

  // Share Invitation states
  const [customSlug, setCustomSlug] = useState("satu-dua-wedding");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // OTP state for Event Owner
  const [otpGenerated, setOtpGenerated] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dynamic invitation info
  const statusStr = (found?.status || "Published").toLowerCase();
  const invitation = {
    id: invitationId || "inv-01",
    title: found ? found.title : "Satu and Dua",
    slug: found ? found.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "satu-dua-wedding",
    status: statusStr as "draft" | "published" | "expired",
    templateName: found?.template || "Elegant",
    eventDate: found?.eventDate || "1 Desember 2026",
    expirationDate: found?.expiration || "20 Jul 2027",
    publishDate: "25 Agustus 2026",
  };

  // Metrics for Guest dan RSVP (Matching Image 1: 85, 10, 20, 125 orang)
  const hadirCount = guests.filter((g) => g.rsvp === "Hadir").length + 79;
  const tidakHadirCount = guests.filter((g) => g.rsvp === "Tidak hadir").length + 8;
  const belumMeresponsCount = guests.filter((g) => g.rsvp === "Belum merespons").length + 19;
  const totalTamuHadir =
    guests.reduce((acc, curr) => acc + (typeof curr.guestCount === "number" ? curr.guestCount : 0), 0) + 107;

  // Filtered guests list
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (guestFilter === "hadir" && g.rsvp !== "Hadir") return false;
      if (guestFilter === "tidak_hadir" && g.rsvp !== "Tidak hadir") return false;
      if (guestFilter === "belum_merespons" && g.rsvp !== "Belum merespons") return false;

      if (guestSearch.trim()) {
        const q = guestSearch.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchContact = g.contact.toLowerCase().includes(q);
        const matchMsg = g.message.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchMsg) return false;
      }
      return true;
    });
  }, [guests, guestFilter, guestSearch]);

  // Handle Delete Guest
  const handleDeleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    showToast("Guest berhasil dihapus dari daftar.");
  };

  // Open Edit Guest Modal
  const openEditModal = (guest: GuestItem) => {
    setGuestToEdit(guest);
    setFormGuestName(guest.name);
    setFormGuestContact(guest.contact);
    setFormGuestRsvp(guest.rsvp);
    setFormGuestCount(guest.guestCount.toString());
    setFormGuestMessage(guest.message === "-" ? "" : guest.message);
  };

  // Open Add Guest Modal
  const openAddModal = () => {
    setIsAddingGuest(true);
    setFormGuestName("");
    setFormGuestContact("");
    setFormGuestRsvp("Hadir");
    setFormGuestCount("2");
    setFormGuestMessage("");
  };

  // Save Add / Edit Guest
  const handleSaveGuestForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGuestName.trim()) return;

    const parsedCount =
      formGuestRsvp === "Hadir" && formGuestCount.trim() !== "-"
        ? parseInt(formGuestCount, 10) || 1
        : "-";

    if (guestToEdit) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestToEdit.id
            ? {
                ...g,
                name: formGuestName.trim(),
                contact: formGuestContact.trim(),
                rsvp: formGuestRsvp,
                guestCount: parsedCount,
                message: formGuestMessage.trim() || "-",
              }
            : g
        )
      );
      if (selectedGuestForDetail?.id === guestToEdit.id) {
        setSelectedGuestForDetail({
          ...selectedGuestForDetail,
          name: formGuestName.trim(),
          contact: formGuestContact.trim(),
          rsvp: formGuestRsvp,
          guestCount: parsedCount,
          message: formGuestMessage.trim() || "-",
        });
      }
      showToast("Data guest berhasil diperbarui.");
      setGuestToEdit(null);
    } else {
      const now = new Date();
      const newGuest: GuestItem = {
        id: `g-${Date.now()}`,
        name: formGuestName.trim(),
        contact: formGuestContact.trim(),
        rsvp: formGuestRsvp,
        guestCount: parsedCount,
        message: formGuestMessage.trim() || "-",
        rsvpTime: `${now.getDate()} Jan 2026, ${now.getHours()}.${String(now.getMinutes()).padStart(2, "0")}`,
      };
      setGuests((prev) => [newGuest, ...prev]);
      showToast("Guest baru berhasil ditambahkan.");
      setIsAddingGuest(false);
    }
  };

  // Copy share URL
  const handleCopyLink = () => {
    const url =
      invitation.status === "expired"
        ? `https://inviteu.id/${customSlug}`
        : `${customSlug}.inviteu.id`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("Tautan undangan berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Web Share or WhatsApp Share
  const handleShareClick = () => {
    const url = `https://${customSlug}.inviteu.id`;
    if (navigator.share) {
      navigator
        .share({
          title: invitation.title,
          text: `Undangan Pernikahan ${invitation.title}:`,
          url,
        })
        .catch(() => {});
    } else {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Halo! Kami mengundang Anda ke acara pernikahan ${invitation.title}. Buka link undangan resmi berikut: ${url}`
        )}`,
        "_blank"
      );
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-[#2d1b11] text-white px-4 py-2.5 text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Back Arrow (<), Title, and Status Pill Badge */}
      <div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/invitations"
            className="text-zinc-800 hover:text-amber-700 transition-colors text-2xl font-serif font-bold cursor-pointer"
            title="Kembali ke Daftar Invitation"
          >
            ‹
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
            {invitation.title}
          </h1>

          {/* Status Badge */}
          {invitation.status === "draft" && (
            <span className="bg-[#fef5e7] text-amber-800 border border-amber-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
              Draft
            </span>
          )}
          {invitation.status === "published" && (
            <span className="bg-[#eaf7f0] text-emerald-700 border border-emerald-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
              Published
            </span>
          )}
          {invitation.status === "expired" && (
            <span className="bg-zinc-200/70 text-zinc-600 border border-zinc-300 px-3 py-0.5 rounded-full text-xs font-semibold">
              Expired
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 font-normal mt-0.5 ml-5">
          Invitation Detail
        </p>
      </div>

      {/* 2. Sub-menu Tabs (Pilihan Edit Invitation Dihapus Sesuai Permintaan) */}
      <div className="flex items-center gap-6 border-b border-[#e5d8c8]/80 text-xs sm:text-sm font-medium pt-1 overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "guests", label: "Guest dan RSVP" },
          { id: "event_owner", label: "Event Owner Access" },
          { id: "share", label: "Share Invitation" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`pb-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "text-zinc-900 font-bold border-b-2 border-zinc-900 -mb-px"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (Persis Gambar 1, 2, 3 Sesi Sebelumnya) */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Expired Warning Banner (Jika status Expired) */}
          {invitation.status === "expired" && (
            <div className="rounded-xl border border-amber-300 bg-[#fffbeb] p-3 text-xs text-amber-900 font-medium flex items-center gap-2">
              <span>Invitation Expired. Akses publik tidak aktif. Data tetap tersimpan.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Sisi Kiri (8 cols): Rincian Informasi Undangan */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-[#e5d8c8] shadow-xs">
              <div className="divide-y divide-zinc-100 text-xs sm:text-[13px]">
                {/* Row 1: Status */}
                <div className="py-3.5 first:pt-1 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Status</span>
                  <div>
                    {invitation.status === "draft" && (
                      <span className="bg-[#fef5e7] text-amber-800 border border-amber-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
                        Draft
                      </span>
                    )}
                    {invitation.status === "published" && (
                      <span className="bg-[#eaf7f0] text-emerald-700 border border-emerald-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
                        Published
                      </span>
                    )}
                    {invitation.status === "expired" && (
                      <span className="bg-zinc-200/70 text-zinc-600 border border-zinc-300 px-3 py-0.5 rounded-full text-xs font-semibold">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Template */}
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Template</span>
                  <span className="font-semibold text-zinc-900">
                    {invitation.templateName}
                  </span>
                </div>

                {/* Row 3: Event date */}
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Event date</span>
                  <span className="font-semibold text-zinc-900">
                    {invitation.eventDate}
                  </span>
                </div>

                {/* Row 4: Expiration */}
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Expiration</span>
                  <span className="font-semibold text-zinc-900">
                    {invitation.status === "draft" ? "-" : invitation.expirationDate}
                  </span>
                </div>

                {/* Row 5: Quota terpakai */}
                <div className="py-3.5 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Quota terpakai</span>
                  <span className="font-semibold text-zinc-900">
                    {invitation.status === "draft"
                      ? "Belum terpakai"
                      : invitation.status === "published"
                      ? "1 (dipakai saat publish pertama)"
                      : "1"}
                  </span>
                </div>

                {/* Row 6: Publish status */}
                <div className="py-3.5 last:pb-1 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Publish status</span>
                  <span className="font-semibold text-zinc-900">
                    {invitation.status === "draft"
                      ? "Belum dipublish"
                      : `Dipublish ${invitation.publishDate}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan (4 cols): Kotak Preview Oranye & Tombol Aksi */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-[#e5d8c8] shadow-xs space-y-3">
              <div className="bg-[#f5a638] rounded-2xl h-56 sm:h-64 flex items-center justify-center relative overflow-hidden group shadow-2xs">
                {found?.cover && (
                  <Image
                    src={found.cover}
                    alt={invitation.title}
                    fill
                    className="object-cover opacity-20 group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <span className="font-bold text-sm text-[#2d1b11] z-10">
                  Preview invitation
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {invitation.status === "draft" && (
                  <>
                    <Link href="/designer/templates/wedding" className="block w-full">
                      <button
                        type="button"
                        className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Edit Invitation
                      </button>
                    </Link>
                    <Link href="/designer/templates/wedding" target="_blank" className="block w-full">
                      <button
                        type="button"
                        className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold py-2.5 rounded-xl border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        Preview
                      </button>
                    </Link>
                  </>
                )}

                {invitation.status === "expired" && (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-[#f4ece3] text-zinc-500 text-xs font-semibold py-2.5 rounded-xl border border-zinc-200 cursor-not-allowed text-center"
                  >
                    Lihat saja (Expired)
                  </button>
                )}

                {invitation.status === "published" && (
                  <>
                    <Link href="/designer/templates/wedding" className="block w-full">
                      <button
                        type="button"
                        className="w-full bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Edit Invitation
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setActiveTab("share")}
                      className="w-full bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold py-2.5 rounded-xl border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      Share Invitation
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GUEST DAN RSVP (Gambar 1, 2, dan 3)               */}
      {/* ======================================================== */}
      {activeTab === "guests" && (
        <div className="space-y-4">
          {/* Sub-segmented Control: Daftar guest & Ucapan tamu */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 bg-white rounded-xl border border-zinc-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setGuestSubTab("daftar")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  guestSubTab === "daftar"
                    ? "bg-[#2d1b11] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Daftar guest
              </button>
              <button
                type="button"
                onClick={() => setGuestSubTab("ucapan")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  guestSubTab === "ucapan"
                    ? "bg-[#2d1b11] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Ucapan tamu
              </button>
            </div>
          </div>

          {/* 4 Kotak Metrik Oranye RSVP (Persis Gambar 1: Hadir 85, Tidak hadir 10, Belum merespons 20, Total 125 orang) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Hadir */}
            <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
              <span className="text-xs font-medium text-[#2d1b11]">Hadir</span>
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
                {hadirCount}
              </span>
            </div>

            {/* Tidak hadir */}
            <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
              <span className="text-xs font-medium text-[#2d1b11]">Tidak hadir</span>
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
                {tidakHadirCount}
              </span>
            </div>

            {/* Belum merespons */}
            <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
              <span className="text-xs font-medium text-[#2d1b11]">Belum merespons</span>
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2">
                {belumMeresponsCount}
              </span>
            </div>

            {/* Total tamu hadir */}
            <div className="bg-[#f5a638] rounded-2xl p-4 sm:p-5 shadow-xs text-[#2d1b11] flex flex-col justify-between">
              <span className="text-xs font-medium text-[#2d1b11]">Total tamu hadir</span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#2d1b11] mt-2 flex items-baseline gap-1.5">
                <span>{totalTamuHadir}</span>
                <span className="text-xs sm:text-sm font-sans font-normal text-[#2d1b11]/80">orang</span>
              </div>
            </div>
          </div>

          {/* Sub-tab: DAFTAR GUEST (Gambar 1) */}
          {guestSubTab === "daftar" && (
            <div className="bg-white rounded-2xl border border-[#e5d8c8] shadow-xs p-4 sm:p-5 space-y-4">
              {/* Toolbar: Search + Filter Pills di samping + Button + Add Guest */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search box */}
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Cari nama guest"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>

                  {/* Filter Pills langsung di samping search */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setGuestFilter("all")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        guestFilter === "all"
                          ? "bg-[#2d1b11] text-white shadow-xs"
                          : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestFilter("hadir")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        guestFilter === "hadir"
                          ? "bg-[#2d1b11] text-white shadow-xs"
                          : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestFilter("tidak_hadir")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        guestFilter === "tidak_hadir"
                          ? "bg-[#2d1b11] text-white shadow-xs"
                          : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      Tidak hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestFilter("belum_merespons")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        guestFilter === "belum_merespons"
                          ? "bg-[#2d1b11] text-white shadow-xs"
                          : "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      Belum merespons
                    </button>
                  </div>
                </div>

                {/* + Add Guest Button */}
                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  + Add Guest
                </button>
              </div>

              {/* Table of Guests */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#faf8f5] text-zinc-600 font-semibold border-b border-zinc-100">
                    <tr>
                      <th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Kontak</th>
                      <th className="py-3 px-4">RSVP</th>
                      <th className="py-3 px-4">Jumlah hadir</th>
                      <th className="py-3 px-4">Pesan</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          Tidak ada guest yang sesuai dengan filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-zinc-900">
                            {guest.name}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px]">
                            {guest.contact}
                          </td>
                          <td className="py-3.5 px-4">
                            {guest.rsvp === "Hadir" && (
                              <span className="inline-block bg-[#eaf7f0] text-emerald-700 border border-emerald-200/60 px-3 py-0.5 rounded-full text-[11px] font-semibold">
                                Hadir
                              </span>
                            )}
                            {guest.rsvp === "Tidak hadir" && (
                              <span className="inline-block bg-[#fef2f2] text-rose-700 border border-rose-200/60 px-3 py-0.5 rounded-full text-[11px] font-semibold">
                                Tidak hadir
                              </span>
                            )}
                            {guest.rsvp === "Belum merespons" && (
                              <span className="inline-block bg-[#fef5e7] text-amber-800 border border-amber-200/60 px-3 py-0.5 rounded-full text-[11px] font-semibold">
                                Belum merespons
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-800 font-medium">
                            {guest.guestCount}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate">
                            {guest.message}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Icon Mata: Buka Detail Guest (Gambar 2) */}
                              <button
                                type="button"
                                onClick={() => setSelectedGuestForDetail(guest)}
                                title="Lihat detail guest"
                                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              {/* Icon Pensil: Edit Guest */}
                              <button
                                type="button"
                                onClick={() => openEditModal(guest)}
                                title="Edit guest"
                                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Icon Sampah: Buka Konfirmasi Hapus (Gambar 3) */}
                              <button
                                type="button"
                                onClick={() => setGuestToDelete(guest)}
                                title="Hapus guest"
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-600 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: UCAPAN TAMU */}
          {guestSubTab === "ucapan" && (
            <div className="bg-white rounded-2xl border border-[#e5d8c8] shadow-xs p-5 space-y-4">
              <h3 className="font-serif font-bold text-base text-zinc-900">
                Pesan & Doa dari Tamu Undangan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {guests
                  .filter((g) => g.message && g.message !== "-")
                  .map((g) => (
                    <div
                      key={g.id}
                      className="p-4 rounded-xl bg-[#fcfaf7] border border-[#ede3d5] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 text-xs">{g.name}</span>
                        <span className="text-[10px] text-zinc-400">{g.rsvpTime}</span>
                      </div>
                      <p className="text-xs text-zinc-700 italic">&ldquo;{g.message}&rdquo;</p>
                      <div className="pt-1">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {g.rsvp}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: EVENT OWNER ACCESS                                */}
      {/* ======================================================== */}
      {activeTab === "event_owner" && (
        <div className="bg-white rounded-2xl border border-[#e5d8c8] p-6 sm:p-8 shadow-xs space-y-4 max-w-4xl">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Akses Khusus Pengantin (Event Owner Access)
            </h2>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              Klien pengantin tidak perlu mendaftar akun. Berikan link atau kode OTP ini agar mereka bisa memantau data tamu dan RSVP secara langsung.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  Kode Akses OTP Pengantin:
                </p>
                <p className="text-2xl font-mono font-bold tracking-widest text-zinc-900 mt-1">
                  {otpGenerated ? "849-210" : "••••••"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtpGenerated(true)}
                className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                {otpGenerated ? "Generate Ulang OTP" : "Tampilkan / Generate OTP"}
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-200 text-xs text-zinc-500">
              Link Akses RSVP Langsung: <span className="font-mono text-zinc-800 font-medium">https://inviteu.id/owner-access/{invitation.slug}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SHARE INVITATION (Gambar 4 & 5)                   */}
      {/* ======================================================== */}
      {activeTab === "share" && (
        <div className="bg-white rounded-2xl border border-[#e5d8c8] p-6 sm:p-8 shadow-xs space-y-5 max-w-4xl">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Invitation URL
            </h2>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              {invitation.status === "expired"
                ? "Link publik tidak aktif karena invitation sudah Expired."
                : "Bagikan link ini kepada tamu. Tamu membuka tanpa login."}
            </p>
          </div>

          {/* URL Row & Actions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* URL Display / Input */}
              <div
                className={`flex-1 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                  invitation.status === "expired"
                    ? "bg-[#fef3e2] border-[#f5dfbe] text-zinc-400 cursor-not-allowed"
                    : "bg-[#fef3e2] border-[#f5dfbe] text-zinc-800"
                }`}
              >
                {isEditingSlug ? (
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-mono">https://</span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) =>
                        setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      className="bg-transparent border-b border-zinc-400 focus:outline-none font-semibold text-zinc-900 w-full"
                      autoFocus
                    />
                    <span className="text-zinc-500 font-mono">.inviteu.id</span>
                  </div>
                ) : (
                  <span className="font-mono font-medium">
                    {invitation.status === "expired"
                      ? `https://inviteu.id/${customSlug}`
                      : `${customSlug}.inviteu.id`}
                  </span>
                )}
              </div>

              {/* Action Buttons: PUBLISHED (Gambar 4) */}
              {invitation.status !== "expired" && (
                <div className="flex items-center gap-2 shrink-0">
                  {isEditingSlug ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(false)}
                      className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-5 py-3 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      Simpan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(true)}
                      className="bg-[#2d1b11] hover:bg-black text-white text-xs font-semibold px-5 py-3 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      Edit Link
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-[#f5a638] hover:bg-[#e09228] text-[#2d1b11] text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {copied ? "Tersalin! ✓" : "Copy Link"}
                  </button>
                </div>
              )}

              {/* Action Button: EXPIRED (Gambar 5) */}
              {invitation.status === "expired" && (
                <div className="shrink-0">
                  <button
                    type="button"
                    disabled
                    className="bg-zinc-400 text-white text-xs font-semibold px-6 py-3 rounded-xl cursor-not-allowed shadow-xs"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Bagikan Link Button (Hanya di Published - Gambar 4) */}
            {invitation.status !== "expired" && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold px-6 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Bagikan link</span>
                </button>
              </div>
            )}

            {/* Warning Banner (Hanya di Expired - Gambar 5) */}
            {invitation.status === "expired" && (
              <div className="bg-[#fff8e7] border border-[#f8e3b6] rounded-xl p-3.5 text-xs text-[#9a641a] font-medium leading-relaxed">
                Expired: akses publik dan pengiriman RSVP tidak lagi tersedia. Data invitation tetap tersimpan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER: DETAIL GUEST (Gambar 2)                          */}
      {/* ======================================================== */}
      {selectedGuestForDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedGuestForDetail(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                {/* Header Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">
                    Detail guest
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedGuestForDetail(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-medium cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {/* Guest Details List */}
                <div className="divide-y divide-zinc-100 text-xs sm:text-sm">
                  <div className="py-3.5 first:pt-1 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Nama</span>
                    <span className="font-semibold text-zinc-900">
                      {selectedGuestForDetail.name}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Kontak</span>
                    <span className="font-medium text-zinc-800 font-mono">
                      {selectedGuestForDetail.contact}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Status RSVP</span>
                    <div>
                      {selectedGuestForDetail.rsvp === "Hadir" && (
                        <span className="bg-[#eaf7f0] text-emerald-700 border border-emerald-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
                          Hadir
                        </span>
                      )}
                      {selectedGuestForDetail.rsvp === "Tidak hadir" && (
                        <span className="bg-[#fef2f2] text-rose-700 border border-rose-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
                          Tidak hadir
                        </span>
                      )}
                      {selectedGuestForDetail.rsvp === "Belum merespons" && (
                        <span className="bg-[#fef5e7] text-amber-800 border border-amber-200/60 px-3 py-0.5 rounded-full text-xs font-semibold">
                          Belum merespons
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Jumlah tamu hadir</span>
                    <span className="font-semibold text-zinc-900">
                      {typeof selectedGuestForDetail.guestCount === "number"
                        ? `${selectedGuestForDetail.guestCount} orang`
                        : "-"}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Pesan</span>
                    <span className="font-medium text-zinc-800 max-w-xs text-right">
                      {selectedGuestForDetail.message !== "-" ? selectedGuestForDetail.message : "-"}
                    </span>
                  </div>

                  <div className="py-3.5 last:pb-1 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Waktu RSVP</span>
                    <span className="font-medium text-zinc-700">
                      {selectedGuestForDetail.rsvpTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons in Drawer */}
              <div className="pt-6 border-t border-zinc-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const g = selectedGuestForDetail;
                    setSelectedGuestForDetail(null);
                    openEditModal(g);
                  }}
                  className="flex-1 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Edit guest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const g = selectedGuestForDetail;
                    setGuestToDelete(g);
                  }}
                  className="flex-1 bg-white hover:bg-rose-50 text-zinc-800 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Hapus guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HAPUS GUEST? (Gambar 3)                           */}
      {/* ======================================================== */}
      {guestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-zinc-100 text-left space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">
                Hapus guest?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1.5">
                <strong>{guestToDelete.name}</strong> tidak akan tampil lagi sebagai guest aktif pada invitation ini.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGuestToDelete(null)}
                className="flex-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteGuest(guestToDelete.id);
                  setGuestToDelete(null);
                  if (selectedGuestForDetail?.id === guestToDelete.id) {
                    setSelectedGuestForDetail(null);
                  }
                }}
                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT GUEST                               */}
      {/* ======================================================== */}
      {(isAddingGuest || guestToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-zinc-100 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {guestToEdit ? "Edit Guest" : "Tambah Guest Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingGuest(false);
                  setGuestToEdit(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGuestForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nama Guest *
                </label>
                <input
                  type="text"
                  required
                  value={formGuestName}
                  onChange={(e) => setFormGuestName(e.target.value)}
                  placeholder="Contoh: Dini"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Kontak (No HP / Email) *
                </label>
                <input
                  type="text"
                  required
                  value={formGuestContact}
                  onChange={(e) => setFormGuestContact(e.target.value)}
                  placeholder="Contoh: 0821 7508 8285 / dini@email.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Status RSVP
                  </label>
                  <select
                    value={formGuestRsvp}
                    onChange={(e) =>
                      setFormGuestRsvp(e.target.value as GuestRsvpStatus)
                    }
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Tidak hadir">Tidak hadir</option>
                    <option value="Belum merespons">Belum merespons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Jumlah Hadir
                  </label>
                  <input
                    type="text"
                    value={formGuestCount}
                    onChange={(e) => setFormGuestCount(e.target.value)}
                    placeholder="Contoh: 2 atau -"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Pesan / Ucapan
                </label>
                <textarea
                  rows={2}
                  value={formGuestMessage}
                  onChange={(e) => setFormGuestMessage(e.target.value)}
                  placeholder="Ucapan atau doa restu..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGuest(false);
                    setGuestToEdit(null);
                  }}
                  className="flex-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold py-2.5 rounded-xl cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#2d1b11] hover:bg-black text-white font-semibold py-2.5 rounded-xl cursor-pointer text-center shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
