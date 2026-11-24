import { weddingTheme, TemplateTheme } from "./wedding";
import { baliTropicalTheme } from "./bali-tropical";
import { emeraldGoldBasicTheme } from "./emerald-gold-basic";

export type { TemplateTheme };

/**
 * Registri Template Desainer:
 * Setiap satu folder tema di dalam `themes/` mewakili satu tema di sistem.
 */
export const TEMPLATES_REGISTRY: TemplateTheme[] = [
  emeraldGoldBasicTheme,
  weddingTheme,
  baliTropicalTheme,
];

export function getTemplateBySlug(slug: string): TemplateTheme | undefined {
  return TEMPLATES_REGISTRY.find(
    (t) =>
      t.slug === slug ||
      t.id === slug ||
      (slug === "emerald-gold-basic" && t.slug === "emerald-gold-basic") ||
      (slug === "emerald_gold_basic" && t.slug === "emerald-gold-basic") ||
      (slug === "emerald-gold" && t.slug === "emerald-gold-basic") ||
      (slug === "mogran-laura" && t.slug === "wedding") ||
      (slug === "bali" && t.slug === "bali-tropical")
  );
}
