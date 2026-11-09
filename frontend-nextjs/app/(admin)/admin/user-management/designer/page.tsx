"use client";

import React, { useState } from "react";
import { useUserManagement, ManagedUser } from "@/context/UserManagementContext";
import { UserManagementTabs } from "../components/UserManagementTabs";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function DesignerManagementPage() {
  const { users, updateUserStatus, addUserAccount } = useUserManagement();
  const designers = users.filter((u) => u.role === "designer");

  // State: Modal View Profile
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // State: Modal Tambah Akun Designer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "Wedding Luxury & Typography",
    portfolioUrl: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusChange = (userId: string, newStatus: "active" | "inactive") => {
    updateUserStatus(userId, newStatus);
    const target = users.find((u) => u.id === userId);
    showToast(`Status desainer ${target?.name || ""} berhasil diubah menjadi: ${newStatus === "active" ? "Aktif" : "Inaktif"}`);
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };

  const handleAddDesignerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError("Mohon lengkapi seluruh field wajib.");
      return;
    }

    if (!formData.email.includes("@")) {
      setFormError("Format email tidak valid.");
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === formData.email.trim().toLowerCase())) {
      setFormError("Email sudah terdaftar pada sistem.");
      return;
    }

    addUserAccount("designer", {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      portfolioUrl: formData.portfolioUrl || "https://behance.net",
    });

    setIsAddModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "Wedding Luxury & Typography",
      portfolioUrl: "",
      password: "",
    });
    showToast(`Akun desainer "${formData.name}" berhasil dibuat dan diaktifkan.`);
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

      {/* Tabs Header with Add Designer CTA Button */}
      <UserManagementTabs
        actionButton={
          <Button
            size="sm"
            onClick={() => {
              setFormError("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Akun Designer</span>
          </Button>
        }
      />

      {/* Table Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Daftar Desainer Kreatif
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Desainer bertugas membuat tema undangan estetik dan mengajukan template untuk ditinjau.
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            Total: {designers.length} Desainer
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Designer</TableHead>
                <TableHead>Nama Desainer</TableHead>
                <TableHead>Email Akun</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Spesialisasi</TableHead>
                <TableHead>Karya Template</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designers.map((designer) => {
                const isActive = designer.status === "active";

                return (
                  <TableRow key={designer.id}>
                    <TableCell className="font-mono text-xs font-semibold text-zinc-500">
                      {designer.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {designer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {designer.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Bergabung: {designer.createdAt}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {designer.email}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      {designer.phone}
                    </TableCell>
                    <TableCell>
                      <span className="inline-block text-[11px] font-medium text-purple-800 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300 px-2 py-0.5 rounded-md">
                        {designer.specialization || "General Design"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {designer.templatesCount || 0} Template
                    </TableCell>
                    <TableCell>
                      {/* Active/Inactive Selector */}
                      <select
                        value={designer.status}
                        onChange={(e) =>
                          handleStatusChange(designer.id, e.target.value as "active" | "inactive")
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
                        onClick={() => setSelectedUser(designer)}
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

      {/* MODAL 1: Lihat Profil Detail Designer */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Detail Profil Desainer Kreatif"
        description="Informasi portofolio, spesialisasi gaya, dan status akun desainer."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Ubah Status:</span>
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
            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow">
                {selectedUser.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    {selectedUser.name}
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
                <p className="text-xs text-zinc-500 font-mono">{selectedUser.id}</p>
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                  {selectedUser.specialization || "Creative Designer"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Email Akun</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.email}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Nomor Telepon</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.phone}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Karya Dibuat</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {selectedUser.templatesCount || 0} Template Desain
                </p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-400 font-medium text-[11px]">Portofolio Publik</p>
                <a
                  href={selectedUser.portfolioUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-purple-600 hover:underline mt-0.5 truncate block"
                >
                  {selectedUser.portfolioUrl || "Belum ada URL"}
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Tambah Akun Designer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Akun Desainer Baru"
        description="Daftarkan desainer kreatif baru untuk berkontribusi pada galeri template."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="add-designer-form">
              Simpan & Daftarkan Desainer
            </Button>
          </div>
        }
      >
        <form id="add-designer-form" onSubmit={handleAddDesignerSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Lengkap Desainer <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Maya Anggraini"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Akun <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="maya.design@inviteu.id"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nomor Telepon <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              placeholder="0819 8877 6655"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Spesialisasi Desain
            </label>
            <Input
              placeholder="Contoh: Minimalist Editorial, Luxury Floral, dsb."
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tautan Portofolio (Behance / Dribbble / Website)
            </label>
            <Input
              type="url"
              placeholder="https://behance.net/mayadesign"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password Sementara
            </label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Password default sistem jika dikosongkan adalah &quot;222222&quot;.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
