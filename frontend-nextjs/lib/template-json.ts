/**
 * InviteU Page Builder - Internal Template JSON Schema (MVP 1)
 *
 * Struktur JSON internal sebagai single source of truth desain undangan InviteU.
 * Memisahkan secara ketat antara Design Data dan Editor State.
 *
 * Minimal mencakup:
 * - metadata: templateId, name, description, categoryId, packageTier, status, schemaVersion.
 * - theme: themeId dan themeConfig.
 * - sections: daftar section, urutan, dan konfigurasi.
 * - containers: struktur layout dan hubungan parent-child.
 * - elements: teks, gambar, tombol, dan elemen desain.
 * - widgets: konfigurasi widget InviteU.
 * - designTokens: warna, typography, spacing, dan style global.
 * - assets: referensi gambar, video, audio, dan media.
 * - responsive: breakpoint dan override tampilan.
 * - animations: konfigurasi animasi jika tersedia.
 */

import {
  BuilderDocument,
  BuilderSection,
  BuilderSectionChild,
  BuilderElement,
  BuilderWidget,
  BuilderDevice,
  BuilderPropertyValue,
  BUILDER_BREAKPOINTS,
  createBuilderId,
  ensureCoverAndPenutup,
} from "@/components/builder/model";
import { BuilderAsset } from "@/components/builder/assets";
import { BuilderMetadata } from "@/components/builder/BuilderProperties";
import {
  DEFAULT_THEME_ID,
  TemplateThemeConfigOverride,
  TemplateThemeData,
  ThemeColorPalette,
  ThemeTypography,
  ThemeButtonStyle,
  ThemeBackgroundStyle,
} from "./theme-system";
import { resolveTheme } from "./theme-resolver";

// Re-export theme types for convenience
export type {
  TemplateThemeConfigOverride,
  TemplateThemeData,
  ThemeColorPalette,
  ThemeTypography,
  ThemeButtonStyle,
  ThemeBackgroundStyle,
};

// =============================================================================
// 1. TIPE DATA & SCHEMA SPECIFICATION
// =============================================================================

/**
 * Package Tier:
 * Basic, Medium, Pro
 * Menunjukkan kompatibilitas template terhadap paket produk InviteU.
 * Bukan tema atau status.
 */
export type PackageTier =
  | "basic"
  | "medium"
  | "pro"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "custom";

/**
 * Template Status:
 * Draft, Pending Review, Revision Needed, Rejected, Published
 */
export type TemplateStatus =
  | "draft"
  | "pending_review"
  | "revision_needed"
  | "rejected"
  | "published";

/**
 * Menstandarisasi Package Tier ke nilai kanonikal
 */
export function normalizePackageTier(
  tier?: unknown
): "basic" | "medium" | "pro" {
  const str = String(tier || "")
    .trim()
    .toLowerCase();
  if (str === "pro" || str === "gold" || str === "platinum") return "pro";
  if (str === "medium" || str === "silver") return "medium";
  return "basic";
}

/**
 * Menghasilkan label tampilan Package Tier
 */
export function formatPackageTierLabel(
  tier?: unknown
): "Basic" | "Medium" | "Pro" {
  const norm = normalizePackageTier(tier);
  if (norm === "pro") return "Pro";
  if (norm === "medium") return "Medium";
  return "Basic";
}

/**
 * Menstandarisasi Template Status ke nilai kanonikal
 */
export function normalizeTemplateStatus(status?: unknown): TemplateStatus {
  const str = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    str === "published" ||
    str === "approved" ||
    str === "active" ||
    str === "aktif"
  ) {
    return "published";
  }
  if (
    str === "pending_review" ||
    str === "in_review" ||
    str === "pending" ||
    str === "review"
  ) {
    return "pending_review";
  }
  if (
    str === "revision_needed" ||
    str === "revision" ||
    str === "revisi"
  ) {
    return "revision_needed";
  }
  if (str === "rejected") {
    return "rejected";
  }
  return "draft";
}

/**
 * Menghasilkan label tampilan Template Status
 */
export function formatTemplateStatusLabel(
  status?: unknown
): "Draft" | "Pending Review" | "Revision Needed" | "Rejected" | "Published" {
  const norm = normalizeTemplateStatus(status);
  switch (norm) {
    case "published":
      return "Published";
    case "pending_review":
      return "Pending Review";
    case "revision_needed":
      return "Revision Needed";
    case "rejected":
      return "Rejected";
    case "draft":
    default:
      return "Draft";
  }
}

export interface TemplateMetadata {
  templateId: string | number;
  id?: string | number; // Alias kompatibilitas
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | number;
  category: string;
  packageTier: PackageTier | string;
  status: TemplateStatus | string;
  schemaVersion: "1.0.0" | string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    surface?: string;
    cardBg?: string;
    border?: string;
    [key: string]: string | undefined;
  };
  typography: {
    fontFamily: string;
    headingFontFamily?: string;
    scriptFontFamily?: string;
    baseFontSize?: number;
    scaleRatio?: number;
  };
  spacing: {
    unit?: number;
    containerPadding?: number;
    sectionGap?: number;
  };
  styles?: Record<string, unknown>;
}

export interface TemplateAssetReference {
  id: string;
  type: "image" | "video" | "audio" | "font";
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface ResponsiveBreakpointConfig {
  breakpoints: Record<BuilderDevice, number>;
  defaultDevice: BuilderDevice;
}

export interface AnimationConfig {
  type?: "none" | "fade" | "fade-up" | "fade-down" | "zoom-in" | "slide";
  duration?: number;
  delay?: number;
  easing?: string;
}

// ── Node Schemas ─────────────────────────────────────────────────────────────

export interface ContainerNode {
  id: string;
  name: string;
  parentSectionId: string;
  parentContainerId?: string;
  sortOrder: number;
  layout: {
    display: "flex" | "grid";
    direction?: "row" | "column";
    wrap?: boolean;
    alignItems?: string;
    justifyContent?: string;
    gap?: number;
    columns?: number;
  };
  style?: Record<string, unknown>;
  responsive?: Partial<Record<BuilderDevice, Record<string, unknown>>>;
  childrenIds: string[];
}

export interface ElementNode {
  id: string;
  type:
    | "text"
    | "image"
    | "video"
    | "shape"
    | "button"
    | "divider"
    | "heading"
    | "spacer"
    | "icon";
  name: string;
  parentSectionId: string;
  parentContainerId?: string;
  sortOrder: number;
  visible: boolean;
  locked?: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: Record<string, unknown>;
  responsive?: Partial<
    Record<
      BuilderDevice,
      {
        position?: { x?: number; y?: number };
        size?: { width?: number; height?: number };
        props?: Record<string, unknown>;
      }
    >
  >;
  animation?: AnimationConfig;
}

// ── InviteU Widget Types & Configurations ────────────────────────────────────

export type InviteUWidgetType =
  | "cover"
  | "event_details"
  | "gallery"
  | "story"
  | "countdown"
  | "music"
  | "rsvp"
  | "guestbook"
  | "digital_gift"
  | "video_greeting";

export interface CoverWidgetConfig {
  title: string;
  subtitle?: string;
  coupleTitle: string;
  dateText?: string;
  imageUrl?: string;
  bgImageUrl?: string;
  bgOpacity?: number;
}

export interface EventDetailsWidgetConfig {
  title?: string;
  badge?: string;
  placeName: string;
  address: string;
  dateText: string;
  timeText: string;
  mapUrl?: string;
  showMapButton?: boolean;
}

export interface GalleryWidgetConfig {
  layout: "grid-2" | "grid-3" | "grid-4" | "carousel" | "masonry";
  images: Array<{ id: string; url: string; caption?: string }>;
  title?: string;
  columns?: number;
  enableLightbox?: boolean;
}

export interface StoryMilestone {
  id: string;
  year: string;
  title: string;
  story: string;
  imageUrl?: string;
}

export interface StoryWidgetConfig {
  milestones: StoryMilestone[];
  title?: string;
  subtitle?: string;
  layout?: "timeline" | "cards";
}

export interface CountdownWidgetConfig {
  targetDate: string;
  title?: string;
  subtitle?: string;
  labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
}

export interface MusicWidgetConfig {
  songTitle: string;
  artistName: string;
  audioUrl: string;
  autoplay: boolean;
  loop: boolean;
  title?: string;
}

export interface RsvpWidgetConfig {
  buttonLabel: string;
  title?: string;
  subtitle?: string;
  showGuestCount?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface GuestbookWidgetConfig {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  showCount?: boolean;
}

export interface DigitalGiftAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeUrl?: string;
}

export interface DigitalGiftWidgetConfig {
  accounts: DigitalGiftAccount[];
  title?: string;
  subtitle?: string;
  giftNote?: string;
  showCopyButton?: boolean;
}

export interface VideoGreetingWidgetConfig {
  videoUrl: string;
  isAddon: true;
  title?: string;
  subtitle?: string;
  posterUrl?: string;
  aspectRatio?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export type WidgetConfigMap = {
  cover: CoverWidgetConfig;
  event_details: EventDetailsWidgetConfig;
  gallery: GalleryWidgetConfig;
  story: StoryWidgetConfig;
  countdown: CountdownWidgetConfig;
  music: MusicWidgetConfig;
  rsvp: RsvpWidgetConfig;
  guestbook: GuestbookWidgetConfig;
  digital_gift: DigitalGiftWidgetConfig;
  video_greeting: VideoGreetingWidgetConfig;
};

export interface WidgetNode<
  TType extends InviteUWidgetType = InviteUWidgetType
> {
  id: string;
  widgetType: TType;
  name: string;
  parentSectionId: string;
  parentContainerId?: string;
  sortOrder: number;
  visible: boolean;
  locked?: boolean;
  isAddon?: boolean;
  config: Record<string, unknown>;
  style?: Record<string, unknown>;
  responsive?: Partial<
    Record<
      BuilderDevice,
      {
        position?: { x?: number; y?: number };
        size?: { width?: number; height?: number };
        props?: Record<string, unknown>;
      }
    >
  >;
  animation?: AnimationConfig;
}

// ── Section Node ─────────────────────────────────────────────────────────────

export interface SectionNode {
  id: string;
  name: string;
  sortOrder: number;
  sectionRole: "cover" | "content" | "closing";
  visible: boolean;
  locked?: boolean;
  props: Record<string, unknown>;
  responsive?: Partial<
    Record<
      BuilderDevice,
      {
        position?: { x?: number; y?: number };
        size?: { width?: number; height?: number };
        props?: Record<string, unknown>;
      }
    >
  >;
  containerIds: string[];
  elementIds: string[];
  widgetIds: string[];
}

// ── The Root Template JSON ───────────────────────────────────────────────────

export interface InviteUTemplateJSON {
  metadata: TemplateMetadata;
  theme: TemplateThemeData;
  designTokens: DesignTokens;
  sections: SectionNode[];
  containers: Record<string, ContainerNode>;
  elements: Record<string, ElementNode>;
  widgets: Record<string, WidgetNode>;
  assets: TemplateAssetReference[];
  responsive: ResponsiveBreakpointConfig;
  animations?: Record<string, AnimationConfig>;
}

// =============================================================================
// 2. VALIDATION FUNCTION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTemplateJSON(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      errors: ["Template JSON tidak valid: bukan sebuah objek."],
      warnings: [],
    };
  }

  const data = raw as Partial<InviteUTemplateJSON>;

  // 1. Metadata Checks
  if (!data.metadata) {
    errors.push("Missing required 'metadata' object.");
  } else {
    const meta = data.metadata;
    const templateId = meta.templateId ?? meta.id;
    if (!templateId) {
      warnings.push(
        "Metadata: 'templateId' is not specified; generated fallback will be used."
      );
    }
    if (!meta.name || !String(meta.name).trim()) {
      errors.push("Metadata: 'name' is required.");
    }
    if (!meta.schemaVersion) {
      errors.push("Metadata: 'schemaVersion' is required.");
    }
    if (!meta.category) {
      warnings.push(
        "Metadata: 'category' is not specified (defaulting to Wedding)."
      );
    }
    if (!meta.packageTier) {
      warnings.push(
        "Metadata: 'packageTier' is not specified (defaulting to Basic)."
      );
    } else {
      const validTiers = [
        "basic",
        "medium",
        "pro",
        "bronze",
        "silver",
        "gold",
        "platinum",
        "custom",
      ];
      if (!validTiers.includes(String(meta.packageTier).toLowerCase())) {
        warnings.push(
          `Metadata: 'packageTier' '${meta.packageTier}' tidak standar (Basic, Medium, Pro).`
        );
      }
    }
    if (!meta.status) {
      warnings.push("Metadata: 'status' is not specified (defaulting to Draft).");
    }
  }

  // 2. Theme Reference Checks
  if (!data.theme) {
    warnings.push(
      "Missing 'theme' object (default theme preset will be applied)."
    );
  } else {
    if (!data.theme.themeId || !String(data.theme.themeId).trim()) {
      warnings.push(
        "Theme: 'themeId' tidak ditentukan (menggunakan preset default Minimalist)."
      );
    }
    if (data.theme.themeConfig && typeof data.theme.themeConfig !== "object") {
      errors.push(
        "Theme: 'themeConfig' must be an object containing overrides."
      );
    }
  }

  // 3. Sections Array Checks
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    errors.push(
      "Template wajib memiliki daftar 'sections'. Minimal 2 section (Cover dan Closing)."
    );
  } else {
    const sections = data.sections;

    if (sections.length < 2) {
      errors.push(
        "Template harus memiliki minimal 2 section: Cover (pertama) dan Closing (terakhir)."
      );
    }

    // Rule: Cover Wajib Section Pertama
    const firstSec = sections[0];
    const isFirstCover =
      firstSec.sectionRole === "cover" ||
      firstSec.name.toLowerCase().includes("cover") ||
      firstSec.id.toLowerCase().includes("cover");

    if (!isFirstCover) {
      errors.push("Section pertama wajib berupa Cover (sectionRole: 'cover').");
    }

    // Rule: Closing Wajib Section Terakhir
    const lastSec = sections[sections.length - 1];
    const isLastClosing =
      lastSec.sectionRole === "closing" ||
      lastSec.name.toLowerCase().includes("penutup") ||
      lastSec.name.toLowerCase().includes("closing") ||
      lastSec.id.toLowerCase().includes("penutup") ||
      lastSec.id.toLowerCase().includes("closing");

    if (!isLastClosing) {
      errors.push(
        "Section terakhir wajib berupa Closing / Penutup (sectionRole: 'closing')."
      );
    }

    // Section sortOrder sequential check
    sections.forEach((sec, idx) => {
      if (sec.sortOrder !== idx) {
        warnings.push(
          `Section '${sec.name}' (${sec.id}) sortOrder mismatch: expected ${idx}, got ${sec.sortOrder}.`
        );
      }
    });
  }

  // 4. Unique ID Checks
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  const checkId = (id: string | undefined, nodeType: string) => {
    if (!id || typeof id !== "string") {
      errors.push(`Node ${nodeType} memiliki ID kosong atau tidak valid.`);
      return;
    }
    if (seenIds.has(id)) {
      duplicateIds.add(id);
    } else {
      seenIds.add(id);
    }
  };

  if (Array.isArray(data.sections)) {
    data.sections.forEach((s) => checkId(s.id, `section (${s.name})`));
  }
  if (data.containers && typeof data.containers === "object") {
    Object.values(data.containers).forEach((c) =>
      checkId(c.id, `container (${c.name})`)
    );
  }
  if (data.elements && typeof data.elements === "object") {
    Object.values(data.elements).forEach((e) =>
      checkId(e.id, `element (${e.name})`)
    );
  }
  if (data.widgets && typeof data.widgets === "object") {
    Object.values(data.widgets).forEach((w) =>
      checkId(w.id, `widget (${w.name})`)
    );
  }

  if (duplicateIds.size > 0) {
    errors.push(
      `Ditemukan ID duplikat pada template: ${Array.from(duplicateIds).join(
        ", "
      )}. Setiap node wajib memiliki ID unik.`
    );
  }

  // 5. Parent-Child Relationship Checks
  const sectionIds = new Set(data.sections?.map((s) => s.id) || []);
  const containerIds = new Set(Object.keys(data.containers || {}));

  if (data.containers) {
    Object.values(data.containers).forEach((c) => {
      if (!sectionIds.has(c.parentSectionId)) {
        errors.push(
          `Container '${c.name}' (${c.id}) merujuk ke parentSectionId yang tidak ada: '${c.parentSectionId}'.`
        );
      }
      if (c.parentContainerId && !containerIds.has(c.parentContainerId)) {
        errors.push(
          `Container '${c.name}' (${c.id}) merujuk ke parentContainerId yang tidak ada: '${c.parentContainerId}'.`
        );
      }
      if (c.parentContainerId === c.id) {
        errors.push(`Circular reference terdeteksi pada container '${c.id}'.`);
      }
    });
  }

  if (data.elements) {
    Object.values(data.elements).forEach((e) => {
      if (!sectionIds.has(e.parentSectionId)) {
        errors.push(
          `Element '${e.name}' (${e.id}) merujuk ke parentSectionId yang tidak ada: '${e.parentSectionId}'.`
        );
      }
      if (e.parentContainerId && !containerIds.has(e.parentContainerId)) {
        warnings.push(
          `Element '${e.name}' (${e.id}) merujuk ke parentContainerId '${e.parentContainerId}' yang belum terdaftar.`
        );
      }
    });
  }

  // 6. Widget Structure and Product Rule Checks
  const allowedWidgetTypes = new Set([
    "cover",
    "event_details",
    "gallery",
    "story",
    "countdown",
    "music",
    "rsvp",
    "guestbook",
    "digital_gift",
    "video_greeting",
    "maps",
    "love_story",
  ]);

  if (data.widgets) {
    Object.values(data.widgets).forEach((w) => {
      if (!sectionIds.has(w.parentSectionId)) {
        errors.push(
          `Widget '${w.name}' (${w.id}) merujuk ke parentSectionId yang tidak ada: '${w.parentSectionId}'.`
        );
      }

      // Live Streaming Rule: Dilarang keras menambahkan Live Streaming
      const rawType = String(w.widgetType || "").toLowerCase();
      const rawName = String(w.name || "").toLowerCase();
      if (
        rawType.includes("stream") ||
        rawType.includes("live_streaming") ||
        rawType === "livestream" ||
        rawName.includes("live stream") ||
        rawName.includes("live streaming")
      ) {
        errors.push(
          `Widget '${w.name}' (${w.id}) terdeteksi sebagai Live Streaming. Live Streaming dilarang di Page Builder InviteU.`
        );
      }

      // Check allowed widget types
      if (!allowedWidgetTypes.has(rawType)) {
        warnings.push(
          `Widget type '${w.widgetType}' belum termasuk widget standar InviteU.`
        );
      }

      // Video Greeting Rule: Video Greeting adalah Add-on
      if (rawType === "video_greeting" && !w.isAddon) {
        warnings.push(
          `Widget Video Greeting '${w.id}' sebaiknya ditandai sebagai fitur add-on (isAddon: true).`
        );
      }

      // Config structure check
      if (!w.config || typeof w.config !== "object") {
        errors.push(
          `Widget '${w.name}' (${w.id}) tidak memiliki konfigurasi khusus (config harus berupa objek).`
        );
      }
    });
  }

  // 7. Design Tokens Check
  if (!data.designTokens || typeof data.designTokens !== "object") {
    warnings.push(
      "Missing 'designTokens' object; default palette will be applied."
    );
  } else {
    const colors = data.designTokens.colors;
    if (!colors || !colors.primary || !colors.secondary) {
      warnings.push(
        "DesignTokens: primary atau secondary color belum diatur secara eksplisit."
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// 3. SERIALIZATION: BuilderDocument -> InviteUTemplateJSON
// =============================================================================

export interface SerializationParams {
  document: BuilderDocument;
  metadata: BuilderMetadata;
  packageTier?: PackageTier | string;
  status?: TemplateStatus | string;
  themeId?: string;
  themeConfig?: TemplateThemeConfigOverride;
  assets?: BuilderAsset[];
  designTokens?: DesignTokens;
  templateId?: string | number;
  categoryId?: string | number;
}

export function serializeToTemplateJSON(
  params: SerializationParams
): InviteUTemplateJSON {
  const {
    document,
    metadata,
    assets = [],
    themeId = metadata.themeId || DEFAULT_THEME_ID,
    themeConfig = metadata.themeConfig || {},
  } = params;

  const packageTier = params.packageTier || metadata.packageTier || "basic";
  const templateStatus = params.status || metadata.status || "draft";

  // Ensure Cover is at index 0 and Closing at end
  const normalizedDoc = ensureCoverAndPenutup(document, metadata.name);
  const totalSections = normalizedDoc.sections.length;

  const sections: SectionNode[] = [];
  const containers: Record<string, ContainerNode> = {};
  const elements: Record<string, ElementNode> = {};
  const widgets: Record<string, WidgetNode> = {};

  normalizedDoc.sections.forEach((sec, secIdx) => {
    const isCover = secIdx === 0;
    const isClosing = secIdx === totalSections - 1 && totalSections > 1;
    const role: "cover" | "content" | "closing" = isCover
      ? "cover"
      : isClosing
      ? "closing"
      : "content";

    const containerIds: string[] = [];
    const elementIds: string[] = [];
    const widgetIds: string[] = [];

    // Separate children by kind
    sec.children.forEach((child, childIdx) => {
      const parentSectionId = sec.id;
      const parentContainerId = child.parentContainerId;

      if (child.kind === "element" && child.elementType === "container") {
        containerIds.push(child.id);

        const props = child.props || {};
        containers[child.id] = {
          id: child.id,
          name: child.name,
          parentSectionId,
          parentContainerId,
          sortOrder: childIdx,
          layout: {
            display: "flex",
            direction: (props.flexDirection as "row" | "column") || "column",
            wrap: props.flexWrap === "wrap",
            alignItems: (props.alignment as string) || "stretch",
            justifyContent: (props.justifyContent as string) || "flex-start",
            gap: Number(props.gap) || 12,
          },
          style: {
            padding: props.padding,
            margin: props.margin,
            backgroundColor: props.backgroundColor,
            borderColor: props.borderColor,
            borderWidth: props.borderWidth,
            borderStyle: props.borderStyle,
            borderRadius: props.borderRadius,
            opacity: props.opacity,
          },
          responsive: child.responsive as Record<
            BuilderDevice,
            Record<string, unknown>
          >,
          childrenIds: sec.children
            .filter((c) => c.parentContainerId === child.id)
            .map((c) => c.id),
        };
      } else if (child.kind === "widget") {
        widgetIds.push(child.id);

        const widgetChild = child as BuilderWidget;
        const normalizedType = (
          widgetChild.widgetType === "love_story"
            ? "story"
            : widgetChild.widgetType
        ) as InviteUWidgetType;

        const isAddon =
          normalizedType === "video_greeting" ||
          child.props.badge === "Add-on" ||
          child.props.isAddon === true;

        const config: Record<string, unknown> = { ...child.props };

        widgets[child.id] = {
          id: child.id,
          widgetType: normalizedType,
          name: child.name,
          parentSectionId,
          parentContainerId,
          sortOrder: childIdx,
          visible: child.visible !== false,
          locked: Boolean(child.locked),
          isAddon,
          config,
          style: {
            position: child.props.position,
            backgroundColor: child.props.backgroundColor,
          },
          responsive: child.responsive,
        };
      } else {
        // Standard Element
        elementIds.push(child.id);

        elements[child.id] = {
          id: child.id,
          type: (child as BuilderElement).elementType as ElementNode["type"],
          name: child.name,
          parentSectionId,
          parentContainerId,
          sortOrder: childIdx,
          visible: child.visible !== false,
          locked: Boolean(child.locked),
          position: { ...child.position },
          size: { ...child.size },
          props: { ...child.props },
          responsive: child.responsive,
        };
      }
    });

    sections.push({
      id: sec.id,
      name: sec.name,
      sortOrder: secIdx,
      sectionRole: role,
      visible: sec.visible !== false,
      locked: Boolean(sec.locked || isCover || isClosing),
      props: { ...sec.props },
      responsive: sec.responsive,
      containerIds,
      elementIds,
      widgetIds,
    });
  });

  // Resolve design tokens through theme resolver
  const resolved = resolveTheme(themeId, themeConfig, params.designTokens);
  const designTokens: DesignTokens =
    params.designTokens || resolved.designTokens;

  // Convert assets to references
  const assetReferences: TemplateAssetReference[] = assets.map((a) => ({
    id: a.id,
    type: a.type,
    name: a.name,
    url: a.previewUrl,
    size: a.fileSize || 0,
    mimeType: a.mimeType,
  }));

  const templateId =
    params.templateId ??
    (metadata.slug ? metadata.slug : Date.now());

  return {
    metadata: {
      templateId,
      id: templateId,
      name: metadata.name.trim() || "Untitled Template",
      slug:
        (metadata.slug ? metadata.slug.trim() : "") ||
        metadata.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") ||
        "untitled-template",
      description: metadata.description || "",
      categoryId: params.categoryId || 1,
      category: metadata.category_name || "Wedding",
      packageTier: normalizePackageTier(packageTier),
      status: normalizeTemplateStatus(templateStatus),
      schemaVersion: "1.0.0",
      author: "InviteU Designer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    theme: {
      themeId: resolved.themeId,
      themeConfig,
    },
    designTokens,
    sections,
    containers,
    elements,
    widgets,
    assets: assetReferences,
    responsive: {
      breakpoints: BUILDER_BREAKPOINTS,
      defaultDevice: "mobile",
    },
  };
}

// =============================================================================
// 4. DESERIALIZATION: InviteUTemplateJSON -> BuilderDocument
// =============================================================================

export interface DeserializationResult {
  document: BuilderDocument;
  metadata: BuilderMetadata;
  theme: TemplateThemeData;
  designTokens: DesignTokens;
  assets: BuilderAsset[];
  packageTier: PackageTier;
  status: TemplateStatus | string;
}

export function deserializeFromTemplateJSON(
  templateJSON: InviteUTemplateJSON
): DeserializationResult {
  const {
    metadata,
    designTokens: rawDesignTokens,
    sections,
    containers,
    elements,
    widgets,
    assets,
    theme: rawTheme,
  } = templateJSON;

  // Sort sections by sortOrder
  const sortedSections = [...(sections || [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const builderSections: BuilderSection[] = sortedSections.map((secNode) => {
    const children: BuilderSectionChild[] = [];

    // 1. Reconstruct Containers as BuilderElement
    (secNode.containerIds || []).forEach((cId) => {
      const c = containers?.[cId];
      if (!c) return;

      const containerElement: BuilderElement = {
        id: c.id,
        kind: "element",
        elementType: "container",
        name: c.name,
        visible: true,
        parentSectionId: secNode.id,
        parentContainerId: c.parentContainerId,
        position: { x: 0, y: 0 },
        size: { width: 340, height: 160 },
        responsive: (c.responsive as BuilderElement["responsive"]) || {},
        props: {
          display: c.layout.display,
          flexDirection: c.layout.direction || "column",
          flexWrap: c.layout.wrap ? "wrap" : "nowrap",
          alignment: c.layout.alignItems || "stretch",
          justifyContent: c.layout.justifyContent || "flex-start",
          gap: c.layout.gap ?? 12,
          padding: (c.style?.padding as number) ?? 16,
          margin: (c.style?.margin as number) ?? 0,
          backgroundColor:
            (c.style?.backgroundColor as string) ?? "transparent",
          borderColor: (c.style?.borderColor as string) ?? "#EBD9BE",
          borderWidth: (c.style?.borderWidth as number) ?? 1,
          borderStyle: (c.style?.borderStyle as string) ?? "dashed",
          borderRadius: (c.style?.borderRadius as number) ?? 8,
          opacity: (c.style?.opacity as number) ?? 100,
        },
      };
      children.push(containerElement);
    });

    // 2. Reconstruct Elements
    (secNode.elementIds || []).forEach((eId) => {
      const e = elements?.[eId];
      if (!e) return;

      const el: BuilderElement = {
        id: e.id,
        kind: "element",
        elementType: e.type,
        name: e.name,
        visible: e.visible !== false,
        locked: Boolean(e.locked),
        parentSectionId: secNode.id,
        parentContainerId: e.parentContainerId,
        position: { ...e.position },
        size: { ...e.size },
        responsive: (e.responsive as BuilderElement["responsive"]) || {},
        props: { ...(e.props as Record<string, BuilderPropertyValue>) },
      };
      children.push(el);
    });

    // 3. Reconstruct Widgets
    (secNode.widgetIds || []).forEach((wId) => {
      const w = widgets?.[wId];
      if (!w) return;

      const widget: BuilderWidget = {
        id: w.id,
        kind: "widget",
        widgetType: w.widgetType as BuilderWidget["widgetType"],
        name: w.name,
        visible: w.visible !== false,
        locked: Boolean(w.locked),
        parentSectionId: secNode.id,
        parentContainerId: w.parentContainerId,
        position: { x: 0, y: 0 },
        size: { width: 340, height: 180 },
        responsive: (w.responsive as BuilderWidget["responsive"]) || {},
        props: {
          ...(w.config as Record<string, BuilderPropertyValue>),
          ...(w.isAddon ? { isAddon: true, badge: "Add-on" } : {}),
        },
      };
      children.push(widget);
    });

    const isCover =
      secNode.sectionRole === "cover" || secNode.sortOrder === 0;
    const isClosing =
      secNode.sectionRole === "closing" ||
      secNode.sortOrder === sortedSections.length - 1;

    return {
      id: secNode.id,
      kind: "section",
      name: secNode.name,
      visible: secNode.visible !== false,
      locked: Boolean(secNode.locked || isCover || isClosing),
      position: { x: 0, y: 0 },
      size: { width: 100, height: Number(secNode.props?.height) || 480 },
      responsive: (secNode.responsive as BuilderSection["responsive"]) || {},
      props: { ...(secNode.props as Record<string, BuilderPropertyValue>) },
      children,
    };
  });

  const builderDoc = ensureCoverAndPenutup(
    { sections: builderSections },
    metadata.name
  );

  // Extract Theme
  const themeId = rawTheme?.themeId || DEFAULT_THEME_ID;
  const themeConfig = rawTheme?.themeConfig || {};
  const resolved = resolveTheme(themeId, themeConfig, rawDesignTokens);
  const designTokens = resolved.designTokens;

  const packageTier = normalizePackageTier(metadata.packageTier);
  const status = normalizeTemplateStatus(metadata.status);

  const builderMetadata: BuilderMetadata = {
    name: metadata.name || "Untitled Template",
    slug: metadata.slug || "",
    description: metadata.description || "",
    category_name: metadata.category || "Wedding",
    themeCategory: resolved.presetName || "Classic",
    primaryColor: resolved.colorPalette.primary,
    secondaryColor: resolved.colorPalette.secondary,
    canvasBackground: resolved.colorPalette.background,
    defaultFontFamily: resolved.typography.fontFamily,
    packageTier,
    status,
    themeId: resolved.themeId,
    themeConfig,
  };

  const builderAssets: BuilderAsset[] = (assets || []).map((ref) => ({
    id: ref.id || createBuilderId("asset"),
    name: ref.name,
    type: (ref.type === "audio" ? "video" : ref.type) as BuilderAsset["type"],
    previewUrl: ref.url,
    fileSize: ref.size || 0,
    mimeType: ref.mimeType || "application/octet-stream",
    fileName: ref.name,
    createdAt: new Date().toISOString(),
  }));

  return {
    document: builderDoc,
    metadata: builderMetadata,
    theme: {
      themeId: resolved.themeId,
      themeConfig,
    },
    designTokens,
    assets: builderAssets,
    packageTier,
    status,
  };
}
