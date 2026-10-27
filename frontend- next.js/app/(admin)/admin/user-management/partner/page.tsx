"use client";

import React, { useState } from "react";
import { useUserManagement, ManagedUser } from "@/context/UserManagementContext";
import { UserManagementTabs } from "../components/UserManagementTabs";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function PartnerManagementPage() {
  const { users, updateUserStatus } = useUserManagement();
  const partners = users.filter((u) => u.role === "partner");

  // State: Modal View Profile
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusChange = (userId: string, newStatus: "active" | "inactive") => {
    updateUserStatus(userId, newStatus);
    const target = users.find((u) => u.id === userId);
    showToast(`Status kemitraan ${target?.name || "Partner"} (${target?.businessName || ""}) berhasil diubah menjadi: ${newStatus === "active" ? "Aktif" : "Inaktif"}`);
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Header (No Tambah Akun button for Partner, as instructed) */}
      <UserManagementTabs />

      {/* Table Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Daftar Mitra Partner B2B
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Mengelola akun vendor EO, WO, studio foto, status aktif/inaktif, dan kuota publikasi undangan.
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            Total: {partners.length} Mitra Partner
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Partner</TableHead>
                <TableHead>Nama Vendor & PIC</TableHead>
                <TableHead>Email Kontak</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Paket Tier</TableHead>
                <TableHead>Kuota Terpakai</TableHead>
                <TableHead>Status Kemitraan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const isActive = partner.status === "active";

                return (
                  <TableRow key={partner.id}>
                    <TableCell className="font-mono text-xs font-semibold text-zinc-500">
                      {partner.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {partner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {partner.businessName || partner.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            PIC: {partner.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {partner.email}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      {partner.phone}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          partner.partnerTier === "Premium"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : partner.partnerTier === "Pro"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : "bg-zinc-100 text-zinc-800 border border-zinc-300"
                        }`}
                      >
                        {partner.partnerTier || "Basic"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {partner.quotaUsage || "0/100"}
                    </TableCell>
                    <TableCell>
                      {/* Active/Inactive Selector */}
                      <select
                        value={partner.status}
                        onChange={(e) =>
                          handleStatusChange(partner.id, e.target.value as "active" | "inactive")
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer focus:outline-none ${
                          isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                            : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedUser(partner)}
                        className="text-xs"
                      >
                        Lihat Profil
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* MODAL: Lihat Profil Detail Partner */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Detail Profil Mitra Partner B2B"
        description="Rincian identitas bisnis vendor, status langganan paket, dan kontrol status kemitraan."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Ubah Status Akun:</span>
              {selectedUser && (
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange(
                      selectedUser.id,
                      selectedUser.status === "active" ? "inactive" : "active"
                    )
                  }
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedUser.status === "active"
                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  Set ke {selectedUser.status === "active" ? "Inactive" : "Active"}
                </button>
              )}
            </div>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/80 dark:border-zinc-700">
              <div className="w-14 h-14 rounded-full bg-amber-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    {selectedUser.businessName || selectedUser.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedUser.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedUser.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  ID: {selectedUser.id} • PIC: {selectedUser.name}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Paket {selectedUser.partnerTier || "Basic"}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Kuota: {selectedUser.quotaUsage || "0/100"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Nama Lengkap PIC</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.name}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Email Resmi Akun</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.email}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Nomor WhatsApp / Telepon</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.phone}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Bergabung Sejak</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.createdAt}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                Sinkronisasi Status Real-time
              </p>
              <p className="text-[11px] mt-0.5 text-zinc-500">
                Jika status diset ke &quot;Inactive&quot;, partner tidak dapat mempublikasikan undangan baru dan di halaman profil partner akan langsung muncul tanda peringatan inaktif.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
