/**
 * InviteU Template Asset Registry & Management (MVP 5)
 *
 * Mengacu pada skema tabel database backend:
 * - template_assets (id, template_id, storage_file_id, asset_type, asset_key, sort_order)
 * - storage_files (id, provider, file_id, folder_id, original_name, mime_type, size, uploaded_by)
 *
 * Asset bawaan adalah file publik milik tema, bukan record storage_files. Hanya asset
 * dari backend yang boleh memiliki storage_file_id dan direlasikan lewat template_assets.
 * Backend saat ini belum menyediakan endpoint upload atau katalog asset dengan URL file.
 */

export interface TemplateAssetItem {
  id: string | number;
  template_id?: string | number;
  storage_file_id?: string | number;
  asset_type: "image" | "background" | "icon" | "audio" | "video";
  asset_key?: string;
  original_name: string;
  url: string;
  mime_type: string;
  size?: number; // in bytes
  dimensions?: { width: number; height: number };
  category: "couples" | "venues" | "galleries" | "backgrounds" | "decorations";
  sort_order: number;
}

/**
 * Image Adjustments & Cropping Metadata (disimpan ke settings/content section)
 */
export interface ImageTransformSettings {
  cropFit?: "cover" | "contain" | "fill";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
  zoom?: number; // 50 to 200%
  height?: number; // in px
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  aspectRatio?: "auto" | "1/1" | "4/3" | "16/9" | "3/4";
  grayscale?: boolean;
}

/**
 * Perpustakaan Asset Bawaan (Default Assets)
 * Sesuai asset fisik di public/templates/wedding dan tema pernikahan InviteU
 */
export const DEFAULT_TEMPLATE_ASSETS: TemplateAssetItem[] = [
  {
    id: "asset-couple-main",
    asset_type: "image",
    asset_key: "hero_image",
    original_name: "couple-main.jpg",
    url: "/templates/wedding/couple-main.jpg",
    mime_type: "image/jpeg",
    size: 900078,
    category: "couples",
    sort_order: 1,
  },
  {
    id: "asset-venue",
    asset_type: "image",
    asset_key: "venue_image",
    original_name: "venue.jpg",
    url: "/templates/wedding/venue.jpg",
    mime_type: "image/jpeg",
    size: 1301517,
    category: "venues",
    sort_order: 2,
  },
  {
    id: "asset-gallery-1",
    asset_type: "image",
    asset_key: "gallery_1",
    original_name: "gallery-1.jpg",
    url: "/templates/wedding/gallery-1.jpg",
    mime_type: "image/jpeg",
    size: 991734,
    category: "galleries",
    sort_order: 3,
  },
  {
    id: "asset-gallery-2",
    asset_type: "image",
    asset_key: "gallery_2",
    original_name: "gallery-2.jpg",
    url: "/templates/wedding/gallery-2.jpg",
    mime_type: "image/jpeg",
    size: 1066298,
    category: "galleries",
    sort_order: 4,
  },
  {
    id: "asset-gallery-3",
    asset_type: "image",
    asset_key: "gallery_3",
    original_name: "gallery-3.jpg",
    url: "/templates/wedding/gallery-3.jpg",
    mime_type: "image/jpeg",
    size: 900078,
    category: "galleries",
    sort_order: 5,
  },
  {
    id: "asset-gallery-4",
    asset_type: "image",
    asset_key: "gallery_4",
    original_name: "gallery-4.jpg",
    url: "/templates/wedding/gallery-4.jpg",
    mime_type: "image/jpeg",
    size: 991734,
    category: "galleries",
    sort_order: 6,
  },
  {
    id: "asset-botanical-background",
    asset_type: "background",
    asset_key: "bg_botanical_pattern",
    original_name: "botanical-leaf-subtle.png",
    url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80",
    mime_type: "image/png",
    size: 450000,
    category: "backgrounds",
    sort_order: 7,
  },
  {
    id: "asset-linen-background",
    asset_type: "background",
    asset_key: "bg_linen_texture",
    original_name: "warm-linen-texture.jpg",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80",
    mime_type: "image/jpeg",
    size: 320000,
    category: "backgrounds",
    sort_order: 8,
  },
  {
    id: "asset-couple-alt",
    asset_type: "image",
    asset_key: "couple_portrait_alt",
    original_name: "wedding-couple-walk.jpg",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    mime_type: "image/jpeg",
    size: 670000,
    category: "couples",
    sort_order: 9,
  },
];

export interface UploadAssetResult {
  success: boolean;
  asset?: TemplateAssetItem;
  error?: string;
}

export const ASSET_UPLOAD_UNAVAILABLE_MESSAGE =
  "Upload belum tersedia: backend belum memiliki endpoint storage upload. Integrasi perlu menyimpan file, membuat storage_files dan template_assets, lalu mengembalikan storage_file_id serta URL file yang dapat diakses.";

/**
 * Kejelasan batas integrasi sampai backend storage tersedia. Tidak ada fallback
 * ke Data URL atau ID storage simulasi karena keduanya tidak dapat disimpan permanen.
 */
export async function uploadTemplateAsset(file: File): Promise<UploadAssetResult> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return {
      success: false,
      error: "Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.",
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "Ukuran file terlalu besar. Batas maksimal ukuran gambar adalah 5 MB.",
    };
  }

  return {
    success: false,
    error: ASSET_UPLOAD_UNAVAILABLE_MESSAGE,
  };
}
