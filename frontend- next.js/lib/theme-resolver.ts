/**
 * InviteU Page Builder - Theme Resolver (MVP 1)
 *
 * Bertanggung jawab menyelesaikan konfigurasi tema undangan:
 * 1. Mengambil preset tema global berdasarkan themeId.
 * 2. Menggabungkan override lokal (themeConfig) tanpa merusak preset global.
 * 3. Menyediakan fallback yang aman jika tema tidak ditemukan atau dihapus dari sistem.
 * 4. Menghasilkan DesignTokens dan CSS custom properties untuk Canvas Renderer dan Preview Renderer.
 */

import {
  GlobalThemePreset,
  ThemeColorPalette,
  ThemeTypography,
  ThemeButtonStyle,
  ThemeBackgroundStyle,
  TemplateThemeConfigOverride,
  GLOBAL_THEME_PRESETS,
  DEFAULT_THEME_ID,
  getGlobalThemePreset,
} from "./theme-system";
import type { DesignTokens } from "./template-json";

export interface ResolvedTheme {
  themeId: string;
  presetName: string;
  isFallback: boolean;
  isCustomized: boolean;
  colorPalette: ThemeColorPalette;
  typography: ThemeTypography;
  buttonStyle: ThemeButtonStyle;
  backgroundStyle: ThemeBackgroundStyle;
  designTokens: DesignTokens;
  cssVariables: Record<string, string>;
  cssVariablesString: string;
}

/**
 * Menyelesaikan konfigurasi tema dengan menggabungkan preset global dan override template lokal.
 * Jika preset tidak ditemukan, menggunakan fallback dari designTokens tersimpan atau default preset.
 */
export function resolveTheme(
  themeId?: string,
  localOverrides?: TemplateThemeConfigOverride,
  fallbackTokens?: DesignTokens
): ResolvedTheme {
  const preset = getGlobalThemePreset(themeId);
  const isFallback = !preset;

  // 1. Tentukan basis preset (menggunakan preset ditemukan atau default fallback)
  const basePreset: GlobalThemePreset =
    preset ||
    GLOBAL_THEME_PRESETS[DEFAULT_THEME_ID] ||
    Object.values(GLOBAL_THEME_PRESETS)[0];

  // 2. Gabungkan Color Palette
  const colorPalette: ThemeColorPalette = {
    ...basePreset.colorPalette,
    // Jika fallback, utamakan warna dari fallbackTokens yang tersimpan di template
    ...(fallbackTokens?.colors
      ? {
          primary: fallbackTokens.colors.primary || basePreset.colorPalette.primary,
          secondary: fallbackTokens.colors.secondary || basePreset.colorPalette.secondary,
          accent: fallbackTokens.colors.accent || basePreset.colorPalette.accent,
          text: fallbackTokens.colors.text || basePreset.colorPalette.text,
          background: fallbackTokens.colors.background || basePreset.colorPalette.background,
          surface: fallbackTokens.colors.surface || basePreset.colorPalette.surface,
        }
      : {}),
    // Terapkan override lokal desainer
    ...(localOverrides?.colorPalette || {}),
  };

  // 3. Gabungkan Typography
  const typography: ThemeTypography = {
    ...basePreset.typography,
    ...(fallbackTokens?.typography
      ? {
          fontFamily: fallbackTokens.typography.fontFamily || basePreset.typography.fontFamily,
          headingFontFamily:
            fallbackTokens.typography.headingFontFamily ||
            basePreset.typography.headingFontFamily,
          baseFontSize: fallbackTokens.typography.baseFontSize || basePreset.typography.baseFontSize,
          scaleRatio: fallbackTokens.typography.scaleRatio || basePreset.typography.scaleRatio,
        }
      : {}),
    ...(localOverrides?.typography || {}),
  };

  // 4. Gabungkan Button Style
  const buttonStyle: ThemeButtonStyle = {
    ...basePreset.buttonStyle,
    ...(localOverrides?.buttonStyle || {}),
  };

  // 5. Gabungkan Background Style
  const backgroundStyle: ThemeBackgroundStyle = {
    ...basePreset.backgroundStyle,
    ...(localOverrides?.backgroundStyle || {}),
  };

  // 6. Sinkronisasi ke DesignTokens internal
  const designTokens: DesignTokens = {
    colors: {
      primary: colorPalette.primary,
      secondary: colorPalette.secondary,
      accent: colorPalette.accent,
      text: colorPalette.text,
      background: colorPalette.background,
      surface: colorPalette.surface,
      cardBg: colorPalette.cardBg,
      border: colorPalette.border,
    },
    typography: {
      fontFamily: typography.fontFamily,
      headingFontFamily: typography.headingFontFamily,
      scriptFontFamily: typography.scriptFontFamily,
      baseFontSize: typography.baseFontSize,
      scaleRatio: typography.scaleRatio,
    },
    spacing: fallbackTokens?.spacing || {
      unit: 8,
      containerPadding: 24,
      sectionGap: 16,
    },
    styles: {
      ...(fallbackTokens?.styles || {}),
      buttonVariant: buttonStyle.variant,
      buttonBorderRadius: buttonStyle.borderRadius,
      buttonPadding: buttonStyle.padding,
      backgroundType: backgroundStyle.type,
      backgroundOpacity: backgroundStyle.opacity,
    },
  };

  // 7. Bangun CSS Variables untuk injeksi ke Canvas dan Preview
  const cssVariables: Record<string, string> = {
    "--theme-primary": colorPalette.primary,
    "--theme-secondary": colorPalette.secondary,
    "--theme-accent": colorPalette.accent,
    "--theme-text": colorPalette.text,
    "--theme-bg": colorPalette.background,
    "--theme-surface": colorPalette.surface || "#ffffff",
    "--theme-card-bg": colorPalette.cardBg || "#ffffff",
    "--theme-border": colorPalette.border || "#e5e7eb",
    "--theme-font-body": typography.fontFamily,
    "--theme-font-heading": typography.headingFontFamily,
    "--theme-font-script": typography.scriptFontFamily || typography.headingFontFamily,
    "--theme-btn-radius": `${buttonStyle.borderRadius}px`,
  };

  const cssVariablesString = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");

  const hasColorOverrides = Boolean(
    localOverrides?.colorPalette && Object.keys(localOverrides.colorPalette).length > 0
  );
  const hasTypoOverrides = Boolean(
    localOverrides?.typography && Object.keys(localOverrides.typography).length > 0
  );
  const hasButtonOverrides = Boolean(
    localOverrides?.buttonStyle && Object.keys(localOverrides.buttonStyle).length > 0
  );
  const hasBgOverrides = Boolean(
    localOverrides?.backgroundStyle && Object.keys(localOverrides.backgroundStyle).length > 0
  );
  const isCustomized = hasColorOverrides || hasTypoOverrides || hasButtonOverrides || hasBgOverrides;

  return {
    themeId: preset?.id || basePreset.id,
    presetName: basePreset.name,
    isFallback,
    isCustomized,
    colorPalette,
    typography,
    buttonStyle,
    backgroundStyle,
    designTokens,
    cssVariables,
    cssVariablesString,
  };
}
