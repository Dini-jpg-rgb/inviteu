"use client";

import React, { useState } from "react";
import { useUserManagement, ManagedPackage } from "@/context/UserManagementContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminPackagesPage() {
  const { packages, updatePackage, resetPackagesToDefault } = useUserManagement();

  // State: Modal Edit Package
  const [editingPackage, setEditingPackage] = useState<ManagedPackage | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    priceNote: string;
    features: string[];
  }>({
    name: "",
    price: "",
    priceNote: "",
    features: [],
  });

  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openEditModal = (pkg: ManagedPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      priceNote: pkg.priceNote,
      features: [...pkg.features],
    });
    setNewFeatureInput("");
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const handleDeleteFeature = (index: number) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated });
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFormData({
      ...formData,
      features: [...formData.features, newFeatureInput.trim()],
    });
    setNewFeatureInput("");
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    if (!formData.name.trim() || !formData.price.trim()) {
      alert("Nama paket dan harga tidak boleh kosong.");
      return;
    }

    updatePackage(editingPackage.id, {
      name: formData.name.trim(),
      price: formData.price.trim(),
      priceNote: formData.priceNote.trim(),
      features: formData.features.filter((f) => f.trim().length > 0),
    });

    const savedName = formData.name;
    setEditingPackage(null);
    showToast(`Paket "${savedName}" dan seluruh deskripsinya berhasil diperbarui!`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Package Management
            </h1>
            <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold px-2.5 py-0.5">
              Sinkronisasi Partner B2B
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Mengelola 3 paket langganan (Basic, Pro, Premium), batasan kuota, harga, serta deskripsi dan fitur yang ditampilkan di sisi Partner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (confirm("Kembalikan informasi ketiga paket ke nilai awal partner?")) {
                resetPackagesToDefault();
                showToast("Informasi paket berhasil direset ke standar partner!");
              }
            }}
            className="text-xs"
          >
            Reset ke Default Partner
          </Button>
        </div>
      </div>

      {/* Grid: 3 Package Cards matching Partner's styling exactly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          return (
            <div
              key={pkg.id}
              className="bg-[#f5a638] rounded-2xl p-5 sm:p-6 border border-[#df9226] shadow-sm flex flex-col justify-between text-[#2d1b11] relative"
            >
              {/* Badge Tier */}
              <div className="absolute top-4 right-5">
                <span className="bg-[#331c11] text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                  ID: {pkg.id.toUpperCase()}
                </span>
              </div>

              <div>
                {/* Title */}
                <h3 className="text-sm font-bold text-zinc-900">
                  {pkg.name}
                </h3>

                {/* Price */}
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                    {pkg.price}
                  </span>
                  <p className="text-[11px] text-zinc-800 font-medium mt-0.5">
                    {pkg.priceNote}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[#df9226] my-4" />

                {/* Features / Descriptions List */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-800">
                    Deskripsi & Fitur Paket ({pkg.features.length})
                  </p>
                  <ul className="space-y-2 text-xs font-medium text-zinc-900">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action: Edit Package Button */}
              <div className="mt-8 pt-4 border-t border-[#df9226]/60">
                <button
                  type="button"
                  onClick={() => openEditModal(pkg)}
                  className="w-full bg-[#1a1a1a] hover:bg-black text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Paket & Deskripsi</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-bold">Informasi Sinkronisasi Real-time dengan Halaman Partner</p>
          <p className="mt-0.5 text-zinc-700 text-[11px]">
            Setiap perubahan nama, harga, dan butir deskripsi fitur paket yang Anda simpan di sini akan langsung tampil pada menu <strong>Package</strong> di sisi Partner B2B (<code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">/packages</code>).
          </p>
        </div>
      </div>

      {/* MODAL: Edit Package, Price, and Features/Descriptions */}
      <Modal
        isOpen={!!editingPackage}
        onClose={() => setEditingPackage(null)}
        title={`Edit Paket ${editingPackage?.name || ""}`}
        description="Ubah nama, harga, serta kelola (tambah, edit, hapus) seluruh butir deskripsi dan fitur paket ini."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingPackage(null)}
            >
              Batal
            </Button>
            <Button type="submit" form="edit-package-form">
              Simpan Perubahan Paket
            </Button>
          </div>
        }
      >
        {editingPackage && (
          <form id="edit-package-form" onSubmit={handleSavePackage} className="space-y-5 pt-1">
            {/* Grid 2 Columns: Name & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Paket <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pro"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Harga Tampilan <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Contoh: Rp 350.000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Harga (Subteks)
              </label>
              <Input
                value={formData.priceNote}
                onChange={(e) => setFormData({ ...formData, priceNote: e.target.value })}
                placeholder="Contoh: harga mengikuti keputusan bisnis"
              />
            </div>

            {/* Features / Descriptions Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Daftar Butir Deskripsi & Fitur Paket
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Admin dapat mengubah teks fitur yang ada, menghapusnya, atau menambahkan butir fitur baru di bawah.
                  </p>
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {formData.features.length} Butir
                </span>
              </div>

              {/* List of existing features */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {formData.features.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">
                    Belum ada deskripsi fitur untuk paket ini. Silakan tambah butir baru di bawah.
                  </p>
                ) : (
                  formData.features.map((feat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 ml-1" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder={`Fitur ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(index)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus butir ini"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Feature Input */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tambah Deskripsi / Fitur Baru:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Contoh: Custom domain & SSL gratis"
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFeature}
                    className="shrink-0 text-xs"
                  >
                    + Tambah Fitur
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
