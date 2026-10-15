import { weddingTheme, TemplateTheme } from "./wedding";

export type { TemplateTheme };

/**
 * Registri Template Desainer:
 * Setiap satu folder tema di dalam `themes/` mewakili satu tema di sistem.
 * Saat ini hanya ada 1 tema yang dibuat di folder: `wedding`.
 */
export const TEMPLATES_REGISTRY: TemplateTheme[] = [
  weddingTheme,
];

export function getTemplateBySlug(slug: string): TemplateTheme | undefined {
  return TEMPLATES_REGISTRY.find(
    (t) =>
      t.slug === slug ||
      t.id === slug ||
      (slug === "mogran-laura" && t.slug === "wedding")
  );
}

