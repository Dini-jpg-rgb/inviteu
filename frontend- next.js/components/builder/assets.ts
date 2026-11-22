export type BuilderAssetType = "image" | "video" | "font";

export interface BuilderAsset {
  id: string;
  name: string;
  type: BuilderAssetType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  previewUrl: string;
  createdAt: string;
  folder?: string;
  width?: number;
  height?: number;
  duration?: number; // In seconds for video
  aspectRatio?: string;
}

const ASSET_LIMITS: Record<BuilderAssetType, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  font: 5 * 1024 * 1024,
};

const FILE_EXTENSIONS: Record<BuilderAssetType, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"],
  video: [".mp4", ".webm"],
  font: [".woff", ".woff2", ".ttf", ".otf"],
};

let nextAssetId = 0;
let localAssetLibrary: BuilderAsset[] = [];
const objectUrls = new Set<string>();
let pageHideListenerRegistered = false;

export function getLocalBuilderAssets(): BuilderAsset[] {
  return [...localAssetLibrary];
}

export function setLocalBuilderAssets(assets: BuilderAsset[]): void {
  localAssetLibrary = [...assets];
}

export function trackBuilderAssetUrl(url: string): void {
  objectUrls.add(url);
  if (typeof window === "undefined" || pageHideListenerRegistered) return;
  window.addEventListener("pagehide", () => {
    objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    objectUrls.clear();
    localAssetLibrary = [];
  });
  pageHideListenerRegistered = true;
}

export function releaseBuilderAssetUrl(url: string): void {
  URL.revokeObjectURL(url);
  objectUrls.delete(url);
}

export function getBuilderAssetType(file: File): BuilderAssetType | null {
  const fileName = file.name.toLowerCase();
  if (
    file.type.startsWith("image/") &&
    FILE_EXTENSIONS.image.some((extension) => fileName.endsWith(extension))
  ) {
    return "image";
  }
  if (
    (file.type.startsWith("video/") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm")) &&
    FILE_EXTENSIONS.video.some((extension) => fileName.endsWith(extension))
  ) {
    return "video";
  }
  if (
    FILE_EXTENSIONS.font.some((extension) => fileName.endsWith(extension))
  ) {
    return "font";
  }
  return null;
}

export function validateBuilderAsset(file: File): string | null {
  const type = getBuilderAssetType(file);
  if (!type) {
    return "Format tidak didukung. Gunakan gambar (JPG, PNG, WebP, GIF, AVIF), video (MP4, WebM), atau font (WOFF, TTF, OTF).";
  }
  if (file.size > ASSET_LIMITS[type]) {
    const limitMb = ASSET_LIMITS[type] / (1024 * 1024);
    return `Ukuran file ${type} melebihi batas maksimum ${limitMb} MB.`;
  }
  if (file.size === 0) return "File kosong tidak dapat ditambahkan.";
  return null;
}

export function validateImageResolution(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (width < 50 || height < 50) {
    return {
      valid: false,
      error: `Resolusi gambar terlalu kecil (${width}x${height}px). Minimal 50x50px.`,
    };
  }
  if (width > 6000 || height > 6000) {
    return {
      valid: false,
      error: `Resolusi gambar terlalu besar (${width}x${height}px). Maksimal 6000x6000px.`,
    };
  }
  return { valid: true };
}

export function validateVideoDuration(
  duration: number
): { valid: boolean; error?: string } {
  // Max duration 180 seconds (3 minutes)
  if (duration > 180) {
    return {
      valid: false,
      error: `Durasi video (${Math.round(duration)}s) melebihi batas maksimal 3 menit (180s).`,
    };
  }
  return { valid: true };
}

export function createBuilderAsset(
  file: File,
  previewUrl: string
): BuilderAsset {
  const type = getBuilderAssetType(file);
  if (!type) throw new Error("Cannot create an asset from an unsupported file.");

  nextAssetId += 1;
  return {
    id: `local-asset-${Date.now()}-${nextAssetId}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    type,
    fileName: file.name,
    mimeType: file.type || getFallbackMimeType(type, file.name),
    fileSize: file.size,
    previewUrl,
    createdAt: new Date().toISOString(),
  };
}

export function getUploadedFontFamily(assetId: string): string {
  return `InviteUFont-${assetId}`;
}

function getFallbackMimeType(type: BuilderAssetType, fileName: string): string {
  const extension = fileName.toLowerCase().split(".").pop();
  if (type === "font") {
    if (extension === "woff2") return "font/woff2";
    if (extension === "woff") return "font/woff";
    if (extension === "ttf") return "font/ttf";
    if (extension === "otf") return "font/otf";
  }
  if (type === "video") return extension === "webm" ? "video/webm" : "video/mp4";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  return "image/jpeg";
}
