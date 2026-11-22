"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  FolderOpen,
  Search,
  Upload,
  Plus,
  Eye,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import { DesignerPageHeader } from "../components/DesignerPageHeader";

const { Text, Title } = Typography;

export interface DesignAsset {
  id: string;
  name: string;
  category: "images" | "illustrations" | "backgrounds" | "decorative";
  url: string;
  fileSize: string;
  dimensions?: string;
  format: string;
  createdAt: string;
}

const INITIAL_ASSETS: DesignAsset[] = [
  {
    id: "asset-1",
    name: "Couple Hero Main Wedding",
    category: "images",
    url: "/templates/wedding/couple-main.jpg",
    fileSize: "245 KB",
    dimensions: "1200 x 800",
    format: "JPG",
    createdAt: "2 hari lalu",
  },
  {
    id: "asset-2",
    name: "Botanical Floral Watercolor",
    category: "illustrations",
    url: "/templates/wedding/botanical-header.jpg",
    fileSize: "180 KB",
    dimensions: "800 x 600",
    format: "JPG",
    createdAt: "3 hari lalu",
  },
  {
    id: "asset-3",
    name: "Parchment Warm Paper Texture",
    category: "backgrounds",
    url: "/templates/wedding/parchment-bg.jpg",
    fileSize: "320 KB",
    dimensions: "1920 x 1080",
    format: "JPG",
    createdAt: "4 hari lalu",
  },
  {
    id: "asset-4",
    name: "Gold Luxury Line Border",
    category: "decorative",
    url: "/templates/wedding/gold-ornament.png",
    fileSize: "95 KB",
    dimensions: "600 x 150",
    format: "PNG",
    createdAt: "1 minggu lalu",
  },
  {
    id: "asset-5",
    name: "Emerald Botanical Leaves Frame",
    category: "decorative",
    url: "/templates/wedding/emerald-corner.png",
    fileSize: "115 KB",
    dimensions: "400 x 400",
    format: "PNG",
    createdAt: "1 minggu lalu",
  },
  {
    id: "asset-6",
    name: "Vintage Wedding Rings Illustration",
    category: "illustrations",
    url: "/templates/wedding/rings-ornament.png",
    fileSize: "85 KB",
    dimensions: "300 x 300",
    format: "PNG",
    createdAt: "2 minggu lalu",
  },
];

export default function DesignerAssetLibraryPage() {
  const { message } = AntdApp.useApp();
  const [assets, setAssets] = useState<DesignAsset[]>(INITIAL_ASSETS);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [previewAsset, setPreviewAsset] = useState<DesignAsset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState<"images" | "illustrations" | "backgrounds" | "decorative">("images");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [assets, search, categoryFilter]);

  const handleCopyUrl = (url: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedId(id);
    message.success("URL aset berhasil disalin ke clipboard.");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: "Hapus aset?",
      content: `Aset "${name}" akan dihapus dari koleksi perpustakaan Anda.`,
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        message.success("Aset berhasil dihapus.");
      },
    });
  };

  const handleSimulateUpload = () => {
    if (!newAssetName.trim()) {
      message.error("Nama aset tidak boleh kosong.");
      return;
    }

    const newAsset: DesignAsset = {
      id: `asset-${Date.now()}`,
      name: newAssetName.trim(),
      category: newAssetCategory,
      url: "/templates/wedding/couple-main.jpg",
      fileSize: "150 KB",
      dimensions: "800 x 600",
      format: "PNG",
      createdAt: "Baru saja",
    };

    setAssets((prev) => [newAsset, ...prev]);
    message.success(`Aset "${newAsset.name}" berhasil diunggah ke Asset Library.`);
    setIsUploadModalOpen(false);
    setNewAssetName("");
  };

  const categoryCounts = useMemo(() => {
    return {
      all: assets.length,
      images: assets.filter((a) => a.category === "images").length,
      illustrations: assets.filter((a) => a.category === "illustrations").length,
      backgrounds: assets.filter((a) => a.category === "backgrounds").length,
      decorative: assets.filter((a) => a.category === "decorative").length,
    };
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <DesignerPageHeader
        title="Asset Library"
        description="Kelola aset gambar, ornamen dekoratif, background, dan ilustrasi untuk kebutuhan template undangan."
        actions={
          <Button
            type="primary"
            icon={<Upload size={16} strokeWidth={1.8} />}
            onClick={() => setIsUploadModalOpen(true)}
            className="!rounded-lg !bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs"
          >
            Unggah Aset
          </Button>
        }
      />

      {/* 2. Category Tabs & Search Toolbar */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="overflow-x-auto pb-1">
          <Segmented
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val as string)}
            className="p-1 bg-white border border-[#EAE5DF] rounded-[10px] shadow-xs"
            options={[
              { value: "all", label: `Semua Aset (${categoryCounts.all})` },
              { value: "images", label: `Gambar & Foto (${categoryCounts.images})` },
              { value: "illustrations", label: `Ilustrasi (${categoryCounts.illustrations})` },
              { value: "backgrounds", label: `Backgrounds (${categoryCounts.backgrounds})` },
              { value: "decorative", label: `Ornamen Dekoratif (${categoryCounts.decorative})` },
            ]}
          />
        </div>

        {/* Search Bar */}
        <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs" styles={{ body: { padding: "12px 16px" } }}>
          <div className="flex items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <Input
                allowClear
                prefix={<Search size={14} className="text-[#99918A]" />}
                placeholder="Cari aset berdasarkan nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!rounded-lg"
              />
            </div>
            <Text className="text-xs text-[#99918A] hidden sm:inline">
              Menampilkan {filteredAssets.length} dari {assets.length} aset
            </Text>
          </div>
        </Card>
      </div>

      {/* 3. Asset Grid Display */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              hoverable
              className="overflow-hidden rounded-[10px] border-[#EAE5DF] bg-white transition-all hover:border-[#FFAD38] hover:shadow-xs group flex flex-col justify-between"
              styles={{ body: { padding: 12 } }}
              cover={
                <div
                  className="relative aspect-square w-full bg-[#F7F6F4] flex items-center justify-center overflow-hidden cursor-pointer border-b border-[#EAE5DF]"
                  onClick={() => setPreviewAsset(asset)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Tag className="!mr-0 uppercase !text-[9px] !font-bold !rounded-[4px] bg-white/90">
                      {asset.format}
                    </Tag>
                  </div>
                </div>
              }
            >
              <div>
                <Title
                  level={5}
                  className="!mb-0.5 truncate !text-xs !text-[#422B1C] font-semibold"
                  title={asset.name}
                >
                  {asset.name}
                </Title>
                <div className="flex items-center justify-between text-[11px] text-[#99918A] mt-0.5">
                  <span className="capitalize">{asset.category}</span>
                  <span>{asset.fileSize}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 flex items-center justify-between border-t border-[#EAE5DF]/70 pt-2 text-xs">
                <Button
                  size="small"
                  type="text"
                  icon={copiedId === asset.id ? <Check size={12} className="text-[#258447]" /> : <Copy size={12} />}
                  onClick={() => handleCopyUrl(asset.url, asset.id)}
                  className="!text-[10px] !px-1.5 text-[#422B1C] hover:text-[#FFAD38]"
                  title="Salin path aset"
                >
                  {copiedId === asset.id ? "Disalin" : "Salin URL"}
                </Button>

                <Space size={2}>
                  <Button
                    size="small"
                    type="text"
                    icon={<Eye size={12} />}
                    onClick={() => setPreviewAsset(asset)}
                    className="!text-[10px] !px-1 text-[#422B1C] hover:text-[#FFAD38]"
                    title="Lihat preview"
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<Trash2 size={12} />}
                    onClick={() => handleDelete(asset.id, asset.name)}
                    className="!text-[10px] !px-1"
                    title="Hapus aset"
                  />
                </Space>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs py-12 text-center">
          <Empty description="Tidak ada aset yang sesuai dengan kriteria pencarian Anda.">
            <Button
              type="primary"
              icon={<Upload size={14} />}
              onClick={() => setIsUploadModalOpen(true)}
              className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
            >
              Unggah Aset Sekarang
            </Button>
          </Empty>
        </Card>
      )}

      {/* 4. Preview Modal */}
      {previewAsset && (
        <Modal
          open={Boolean(previewAsset)}
          onCancel={() => setPreviewAsset(null)}
          title={
            <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
              {previewAsset.name}
            </span>
          }
          footer={
            <div className="flex items-center justify-between">
              <Text className="text-xs text-[#99918A]">
                Format: {previewAsset.format} · Ukuran: {previewAsset.fileSize} {previewAsset.dimensions ? `· ${previewAsset.dimensions}px` : ""}
              </Text>
              <Button
                type="primary"
                icon={<Copy size={14} />}
                onClick={() => handleCopyUrl(previewAsset.url, previewAsset.id)}
                className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] !rounded-lg"
              >
                Salin Path Aset
              </Button>
            </div>
          }
        >
          <div className="flex items-center justify-center p-4 bg-[#F7F6F4] rounded-[8px] my-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewAsset.url}
              alt={previewAsset.name}
              className="max-h-[360px] max-w-full object-contain"
            />
          </div>
        </Modal>
      )}

      {/* 5. Upload Modal */}
      <Modal
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        title={
          <span className="font-['Playfair_Display'] text-[16px] font-semibold text-[#422B1C]">
            Unggah Aset Desain Baru
          </span>
        }
        okText="Simpan ke Library"
        cancelText="Batal"
        onOk={handleSimulateUpload}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-[#422B1C] block mb-1">
              Nama Aset <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Bunga Mawar Watercolor, Frame Emas..."
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              className="!rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#422B1C] block mb-1">
              Kategori Aset
            </label>
            <Segmented
              value={newAssetCategory}
              onChange={(val) => setNewAssetCategory(val as "images" | "illustrations" | "backgrounds" | "decorative")}
              className="w-full"
              options={[
                { value: "images", label: "Gambar" },
                { value: "illustrations", label: "Ilustrasi" },
                { value: "backgrounds", label: "Background" },
                { value: "decorative", label: "Dekorasi" },
              ]}
            />
          </div>

          <div className="border border-dashed border-[#EAE5DF] rounded-[10px] p-6 text-center bg-[#FAF8F5]">
            <ImageIcon size={28} className="mx-auto text-[#FFAD38] mb-2" strokeWidth={1.8} />
            <p className="text-xs text-[#422B1C] font-semibold mb-0.5">
              Tarik file ke sini atau klik untuk memilih
            </p>
            <p className="text-[11px] text-[#99918A] mb-0">
              Mendukung PNG, JPG, WebP, SVG (Maks. 5 MB)
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
