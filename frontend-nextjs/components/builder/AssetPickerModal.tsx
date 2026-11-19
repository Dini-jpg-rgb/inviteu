"use client";

import React, { useState } from "react";
import {
  UploadOutlined,
  CloseOutlined,
  CheckOutlined,
  ScissorOutlined,
  SyncOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  TemplateAssetItem,
  DEFAULT_TEMPLATE_ASSETS,
  ASSET_UPLOAD_UNAVAILABLE_MESSAGE,
  ImageTransformSettings,
} from "@/lib/template-assets";
import { BuilderAsset } from "./assets";

export interface AssetPickerModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  currentUrl?: string;
  onSelectImage?: (url: string, assetItem?: TemplateAssetItem) => void;
  onSelect?: (asset: BuilderAsset) => void;
  title?: string;
  assets?: BuilderAsset[];
}

export function AssetPickerModal({
  isOpen,
  open,
  onClose,
  currentImageUrl,
  currentUrl,
  onSelectImage,
  onSelect,
  title = "Pilih Aset Media",
}: AssetPickerModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const activeCurrentUrl = currentUrl ?? currentImageUrl;
  const assets = DEFAULT_TEMPLATE_ASSETS;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<TemplateAssetItem | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const isCustomUrlValid = (() => {
    try {
      const url = new URL(customUrlInput);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  })();

  const categories = [
    { id: "all", label: "Semua Aset" },
    { id: "couples", label: "Foto Mempelai" },
    { id: "venues", label: "Lokasi / Venue" },
    { id: "galleries", label: "Galeri Foto" },
    { id: "backgrounds", label: "Background & Tekstur" },
  ];

  const filteredAssets = assets.filter((a) => {
    const matchesCategory =
      selectedCategory === "all" || a.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      a.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(a.asset_key && a.asset_key.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleConfirmSelect = () => {
    if (selectedAsset) {
      if (onSelectImage) onSelectImage(selectedAsset.url, selectedAsset);
      if (onSelect) {
        onSelect({
          id: String(selectedAsset.id),
          name: selectedAsset.original_name,
          previewUrl: selectedAsset.url,
          type: "image",
          fileName: selectedAsset.original_name,
          mimeType: selectedAsset.mime_type || "image/jpeg",
          fileSize: selectedAsset.size || 0,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } else if (isCustomUrlValid) {
      const url = customUrlInput.trim();
      if (onSelectImage) onSelectImage(url);
      if (onSelect) {
        onSelect({
          id: `custom-${Date.now()}`,
          name: "Custom URL",
          previewUrl: url,
          type: "image",
          fileName: "custom-image.jpg",
          mimeType: "image/jpeg",
          fileSize: 0,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title={title}
      description="Pilih foto dari pustaka aset template InviteU atau gunakan URL gambar publik."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-zinc-500 truncate max-w-[280px]">
            {selectedAsset ? (
              <span>Terpilih: <strong>{selectedAsset.original_name}</strong></span>
            ) : isCustomUrlValid ? (
              <span>URL Kustom Terisi</span>
            ) : (
              <span>Pilih salah satu gambar</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSelect}
              disabled={!selectedAsset && !isCustomUrlValid}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              Terapkan Gambar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Upload integration boundary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Upload gambar belum tersedia
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {ASSET_UPLOAD_UNAVAILABLE_MESSAGE}
            </p>
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled
              title={ASSET_UPLOAD_UNAVAILABLE_MESSAGE}
              className="text-xs w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              <UploadOutlined />
              <span>Unggah dari Perangkat</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama file aset..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 flex items-center"
            >
              <CloseOutlined className="text-[10px]" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Asset Grid Preview */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-zinc-400">
              Tidak ada aset yang cocok dengan filter atau kata kunci.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id || activeCurrentUrl === asset.url;
              const formattedSize = asset.size ? `${Math.round(asset.size / 1024)} KB` : "";
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setCustomUrlInput("");
                  }}
                  className={`relative aspect-4/3 rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-400 shadow-md scale-[1.02]"
                      : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-1.5 pt-4 text-white text-[9px]">
                    <div className="truncate font-medium">{asset.original_name}</div>
                    {formattedSize && (
                      <div className="text-[8px] text-zinc-300">{formattedSize}</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-xs">
                      <CheckOutlined className="text-[9px]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Custom URL Input */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Atau gunakan URL gambar publik (HTTPS):
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => {
                setCustomUrlInput(e.target.value);
                setSelectedAsset(null);
              }}
              placeholder="https://contoh.com/foto-anda.jpg"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          {customUrlInput && !isCustomUrlValid && (
            <p className="mt-1 text-[10px] text-rose-600">
              Masukkan URL HTTPS yang valid. URL lokal dan Data URL tidak didukung.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * Image Control Panel (Cropping, Sizing, Object Position)
 */
export interface ImageControlProps {
  label?: string;
  imageUrl?: string;
  cropFit?: "cover" | "contain" | "fill";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
  height?: number;
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  showDimensions?: boolean;
  onChangeImage: (url: string) => void;
  onRemoveImage: () => void;
  onUpdateSettings?: (key: keyof ImageTransformSettings, value: unknown) => void;
}

export function ImageControlField({
  label = "Gambar Section",
  imageUrl,
  cropFit = "cover",
  objectPosition = "center",
  height = 180,
  borderRadius = "md",
  showDimensions = true,
  onChangeImage,
  onRemoveImage,
  onUpdateSettings,
}: ImageControlProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showAdvancedCrop, setShowAdvancedCrop] = useState(false);

  return (
    <div className="space-y-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={onRemoveImage}
            className="text-[10px] text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            <span>Hapus Gambar</span>
            <CloseOutlined className="text-[9px]" />
          </button>
        )}
      </div>

      {imageUrl ? (
        <div className="space-y-2">
          {/* Thumbnail Preview */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              style={{
                objectFit: cropFit,
                objectPosition: objectPosition,
              }}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-2 py-1 bg-white text-zinc-900 rounded text-[11px] font-semibold shadow-xs hover:bg-zinc-100 cursor-pointer"
              >
                Ganti Gambar
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedCrop(!showAdvancedCrop)}
                className="px-2 py-1 bg-zinc-900 text-white rounded text-[11px] font-semibold shadow-xs hover:bg-zinc-800 cursor-pointer inline-flex items-center gap-1"
              >
                <ScissorOutlined className="text-[10px]" />
                <span>Atur Crop</span>
              </button>
            </div>
          </div>

          {/* Quick Button */}
          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <SyncOutlined className="text-[10px]" />
              <span>Ganti dari Aset</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedCrop(!showAdvancedCrop)}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              {showAdvancedCrop ? "Tutup Pengaturan Crop ▲" : "Pengaturan Crop & Ukuran ▼"}
            </button>
          </div>

          {/* Advanced Cropping & Sizing Controls */}
          {showAdvancedCrop && onUpdateSettings && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px]">
              {/* Fit / Cropping */}
              <div>
                <span className="text-zinc-500 block mb-1">Metode Crop (Fit):</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "cover", label: "Cover (Penuh)" },
                    { id: "contain", label: "Contain (Muat)" },
                    { id: "fill", label: "Fill (Regang)" },
                  ].map((fit) => (
                    <button
                      key={fit.id}
                      type="button"
                      onClick={() => onUpdateSettings("cropFit", fit.id)}
                      className={`py-1 rounded border text-[10px] font-medium cursor-pointer ${
                        cropFit === fit.id
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {fit.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posisi Fokus Gambar */}
              <div>
                <span className="text-zinc-500 block mb-1">Posisi Fokus:</span>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "left", label: "Kiri" },
                    { id: "top", label: "Atas" },
                    { id: "center", label: "Tengah" },
                    { id: "bottom", label: "Bawah" },
                    { id: "right", label: "Kanan" },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => onUpdateSettings("objectPosition", pos.id)}
                      className={`py-1 rounded border text-[10px] font-medium cursor-pointer ${
                        objectPosition === pos.id
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {showDimensions && (
                <>
                  <div>
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                      <span>Tinggi Gambar:</span>
                      <span className="font-mono">{height}px</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={380}
                      step={10}
                      value={height}
                      onChange={(e) => onUpdateSettings("height", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-zinc-500 block mb-1">Kelengkungan Sudut:</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { id: "none", label: "0" },
                        { id: "sm", label: "S" },
                        { id: "md", label: "M" },
                        { id: "lg", label: "L" },
                        { id: "full", label: "Bulat" },
                      ].map((rad) => (
                        <button
                          key={rad.id}
                          type="button"
                          onClick={() => onUpdateSettings("borderRadius", rad.id)}
                          className={`py-1 rounded border text-[10px] font-medium cursor-pointer ${
                            borderRadius === rad.id
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {rad.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Placeholder saat belum ada gambar */
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-1 bg-white/50 dark:bg-zinc-800/20"
        >
          <PictureOutlined className="text-xl text-zinc-400" />
          <span className="text-xs font-semibold">+ Pilih Gambar</span>
          <span className="text-[10px] text-zinc-400">Pilih dari pustaka aset template</span>
        </button>
      )}

      {/* Modal Picker */}
      <AssetPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentImageUrl={imageUrl}
        onSelectImage={(url) => onChangeImage(url)}
      />
    </div>
  );
}
