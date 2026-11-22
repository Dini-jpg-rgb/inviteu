/**
 * InviteU Page Builder - Theme System & Presets (MVP 1)
 *
 * Mengelola preset tema desain global dan aturan produk:
 * - Tema global dikelola Admin / sistem, tidak dapat diubah oleh Designer.
 * - Designer hanya dapat memilih tema yang tersedia dan melakukan override lokal per template.
 * - Perubahan lokal pada template tidak mengubah preset tema global.
 * - Mendukung tema: Minimalist, Elegant, Floral, Modern, Tropical Bali, dan Botanical Sage.
 * - Menyediakan fallback jika tema tidak tersedia atau dihapus dari daftar global.
 */

// =============================================================================
// 1. TIPE DATA TEMA
// =============================================================================

export interface ThemeColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  surface?: string;
  cardBg?: string;
  border?: string;
  [key: string]: string | undefined;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  scriptFontFamily?: string;
  baseFontSize: number;
  scaleRatio: number;
}

export interface ThemeButtonStyle {
  variant: "filled" | "outlined" | "pill" | "rounded" | "square";
  borderRadius: number;
  padding: string;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
}

export interface ThemeBackgroundStyle {
  type: "solid" | "gradient" | "pattern" | "image";
  color: string;
  opacity: number;
  patternUrl?: string;
}

export interface GlobalThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  colorPalette: ThemeColorPalette;
  typography: ThemeTypography;
  buttonStyle: ThemeButtonStyle;
  backgroundStyle: ThemeBackgroundStyle;
  defaultDecorativeElements?: string[];
}

export interface TemplateThemeConfigOverride {
  colorPalette?: Partial<ThemeColorPalette>;
  typography?: Partial<ThemeTypography>;
  buttonStyle?: Partial<ThemeButtonStyle>;
  backgroundStyle?: Partial<ThemeBackgroundStyle>;
  [key: string]: unknown;
}

export interface TemplateThemeData {
  themeId: string;
  themeConfig?: TemplateThemeConfigOverride;
}

// =============================================================================
// 2. PRESET TEMA GLOBAL (ADMIN / SYSTEM MANAGED)
// =============================================================================

export const GLOBAL_THEME_PRESETS: Record<string, GlobalThemePreset> = {
  "theme-minimalist": {
    id: "theme-minimalist",
    name: "Minimalist",
    description: "Desain monokrom bersih dan tata letak elegan modern yang fokus pada kejelasan informasi.",
    thumbnail: "/templates/wedding/couple-main.jpg",
    colorPalette: {
      primary: "#1E1E1E",
      secondary: "#4A4A4A",
      accent: "#8C8C8C",
      text: "#1A1A1A",
      background: "#FFFFFF",
      surface: "#F8F8F8",
      cardBg: "#FFFFFF",
      border: "#E5E5E5",
    },
    typography: {
      fontFamily: "'DM Sans', sans-serif",
      headingFontFamily: "'Playfair Display', serif",
      scriptFontFamily: "'Alex Brush', cursive",
      baseFontSize: 14,
      scaleRatio: 1.25,
    },
    buttonStyle: {
      variant: "filled",
      borderRadius: 4,
      padding: "10px 24px",
      textTransform: "uppercase",
    },
    backgroundStyle: {
      type: "solid",
      color: "#FFFFFF",
      opacity: 100,
    },
    defaultDecorativeElements: ["divider-minimal"],
  },

  "theme-elegant": {
    id: "theme-elegant",
    name: "Elegant",
    description: "Nuansa mewah kerajaan dengan perpaduan warna navy klasik, emas berkilau, dan tipografi serif megah.",
    thumbnail: "/templates/wedding/venue.jpg",
    colorPalette: {
      primary: "#1A2A3A",
      secondary: "#C5A059",
      accent: "#E5C989",
      text: "#1A2A3A",
      background: "#FAF8F5",
      surface: "#F4EFE6",
      cardBg: "#FFFFFF",
      border: "#E6D5B8",
    },
    typography: {
      fontFamily: "'Cinzel', serif",
      headingFontFamily: "'Playfair Display', serif",
      scriptFontFamily: "'Alex Brush', cursive",
      baseFontSize: 15,
      scaleRatio: 1.33,
    },
    buttonStyle: {
      variant: "outlined",
      borderRadius: 24,
      padding: "12px 28px",
      textTransform: "capitalize",
    },
    backgroundStyle: {
      type: "pattern",
      color: "#FAF8F5",
      opacity: 100,
    },
    defaultDecorativeElements: ["ornament-gold-corner", "flourish-divider"],
  },

  "theme-floral": {
    id: "theme-floral",
    name: "Floral",
    description: "Koleksi aksen bunga lembut dan palet warna mawar pastel untuk suasana pernikahan romantis manis.",
    thumbnail: "/templates/wedding/gallery-1.jpg",
    colorPalette: {
      primary: "#8C5866",
      secondary: "#D9AAB7",
      accent: "#E8C2CA",
      text: "#3D2B32",
      background: "#FFFBFB",
      surface: "#FDF2F4",
      cardBg: "#FFFFFF",
      border: "#F3D5DC",
    },
    typography: {
      fontFamily: "'Cormorant Garamond', serif",
      headingFontFamily: "'Playfair Display', serif",
      scriptFontFamily: "'Great Vibes', cursive",
      baseFontSize: 15,
      scaleRatio: 1.25,
    },
    buttonStyle: {
      variant: "pill",
      borderRadius: 9999,
      padding: "10px 26px",
      textTransform: "capitalize",
    },
    backgroundStyle: {
      type: "solid",
      color: "#FFFBFB",
      opacity: 100,
    },
    defaultDecorativeElements: ["floral-leaf-wreath", "rose-corner"],
  },

  "theme-modern": {
    id: "theme-modern",
    name: "Modern",
    description: "Gaya kontemporer dengan kontras berani, sudut membulat modern, dan visual bersih yang segar.",
    thumbnail: "/templates/wedding/gallery-2.jpg",
    colorPalette: {
      primary: "#2563EB",
      secondary: "#1E293B",
      accent: "#38BDF8",
      text: "#0F172A",
      background: "#F8FAFC",
      surface: "#F1F5F9",
      cardBg: "#FFFFFF",
      border: "#E2E8F0",
    },
    typography: {
      fontFamily: "'DM Sans', sans-serif",
      headingFontFamily: "'Montserrat', sans-serif",
      scriptFontFamily: "'Playfair Display', serif",
      baseFontSize: 14,
      scaleRatio: 1.25,
    },
    buttonStyle: {
      variant: "rounded",
      borderRadius: 8,
      padding: "10px 22px",
      textTransform: "none",
    },
    backgroundStyle: {
      type: "solid",
      color: "#F8FAFC",
      opacity: 100,
    },
    defaultDecorativeElements: [],
  },

  "theme-tropical-bali": {
    id: "theme-tropical-bali",
    name: "Tropical Bali",
    description: "Sentuhan eksotis Pulau Dewata dengan harmoni warna terracotta hangat, daun sage, dan linen alami.",
    thumbnail: "/templates/wedding/gallery-3.jpg",
    colorPalette: {
      primary: "#B85D3B",
      secondary: "#5B7052",
      accent: "#E59E75",
      text: "#2E241E",
      background: "#FAF7F2",
      surface: "#F2EBE1",
      cardBg: "#FFFFFF",
      border: "#E8DDD0",
    },
    typography: {
      fontFamily: "Georgia, serif",
      headingFontFamily: "'Cinzel', serif",
      scriptFontFamily: "'Alex Brush', cursive",
      baseFontSize: 14,
      scaleRatio: 1.3,
    },
    buttonStyle: {
      variant: "rounded",
      borderRadius: 12,
      padding: "12px 26px",
      textTransform: "capitalize",
    },
    backgroundStyle: {
      type: "solid",
      color: "#FAF7F2",
      opacity: 100,
    },
    defaultDecorativeElements: ["palm-silhouette", "balinese-motif"],
  },

  "theme-wedding-botanical": {
    id: "theme-wedding-botanical",
    name: "Botanical Sage",
    description: "Nuansa sage green botani klasik dengan linen lembut, dedaunan zaitun, dan aksen emas alami.",
    thumbnail: "/templates/wedding/gallery-4.jpg",
    colorPalette: {
      primary: "#6f7f5f",
      secondary: "#455633",
      accent: "#848858",
      text: "#24380f",
      background: "#fcfbfa",
      surface: "#f6f5ef",
      cardBg: "#ffffff",
      border: "#EBD9BE",
    },
    typography: {
      fontFamily: "Georgia, serif",
      headingFontFamily: "'Playfair Display', serif",
      scriptFontFamily: "'Alex Brush', cursive",
      baseFontSize: 14,
      scaleRatio: 1.25,
    },
    buttonStyle: {
      variant: "rounded",
      borderRadius: 6,
      padding: "10px 24px",
      textTransform: "none",
    },
    backgroundStyle: {
      type: "solid",
      color: "#fcfbfa",
      opacity: 100,
    },
    defaultDecorativeElements: ["sage-olive-branch", "linen-border"],
  },
};

// Aliases for backwards compatibility with existing templates/slugs
export const THEME_ALIASES: Record<string, string> = {
  wedding: "theme-wedding-botanical",
  "template-wedding": "theme-wedding-botanical",
  "mogran-laura": "theme-wedding-botanical",
  minimalist: "theme-minimalist",
  elegant: "theme-elegant",
  floral: "theme-floral",
  modern: "theme-modern",
  "tropical-bali": "theme-tropical-bali",
  tropical_bali: "theme-tropical-bali",
  bali: "theme-tropical-bali",
};

export const DEFAULT_THEME_ID = "theme-wedding-botanical";

/**
 * Mengambil daftar seluruh preset tema global
 */
export function getAllGlobalThemePresets(): GlobalThemePreset[] {
  return Object.values(GLOBAL_THEME_PRESETS);
}

/**
 * Mencari preset tema global berdasarkan ID atau alias
 */
export function getGlobalThemePreset(
  themeId?: string
): GlobalThemePreset | undefined {
  if (!themeId) return undefined;
  const canonicalId = THEME_ALIASES[themeId.toLowerCase()] || themeId;
  return GLOBAL_THEME_PRESETS[canonicalId];
}
