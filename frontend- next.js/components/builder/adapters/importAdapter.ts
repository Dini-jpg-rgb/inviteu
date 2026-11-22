/**
 * InviteU Page Builder - Import Adapter (MVP 1)
 *
 * Mengakomodasi parsing dan konversi desain eksternal (JSON, tema lama, Figma)
 * ke dalam format standar InviteUTemplateJSON dan BuilderDocument internal.
 */

import {
  InviteUTemplateJSON,
  validateTemplateJSON,
  deserializeFromTemplateJSON,
  ValidationResult,
  DeserializationResult,
} from "@/lib/template-json";

export interface ImportResult {
  success: boolean;
  templateJSON?: InviteUTemplateJSON;
  deserialized?: DeserializationResult;
  validation: ValidationResult;
  error?: string;
}

/**
 * Mengimpor template dari string JSON internal
 */
export function importFromJSONString(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateTemplateJSON(parsed);

    if (!validation.valid) {
      return {
        success: false,
        validation,
        error: `Validasi template gagal: ${validation.errors.join("; ")}`,
      };
    }

    const templateJSON = parsed as InviteUTemplateJSON;
    const deserialized = deserializeFromTemplateJSON(templateJSON);

    return {
      success: true,
      templateJSON,
      deserialized,
      validation,
    };
  } catch (err) {
    return {
      success: false,
      validation: {
        valid: false,
        errors: [err instanceof Error ? err.message : "Gagal mem-parse format JSON."],
        warnings: [],
      },
      error: "Format string JSON tidak valid.",
    };
  }
}

/**
 * Adapter untuk konversi payload desain eksternal (Figma / Webhook) di masa mendatang
 */
export interface ExternalDesignPayload {
  source: "figma" | "theme" | "custom";
  version?: string;
  data: Record<string, unknown>;
}

export function importFromExternalDesign(payload: ExternalDesignPayload): ImportResult {
  if (payload.source === "figma") {
    // Jalur konversi desain Figma ke schema InviteU
    const templateName = String(payload.data.name || "Figma Imported Template");
    const templateId = `figma-${Date.now()}`;
    const rawJSON: Partial<InviteUTemplateJSON> = {
      metadata: {
        templateId,
        id: templateId,
        name: templateName,
        slug: templateName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: "Wedding",
        packageTier: "basic",
        status: "draft",
        schemaVersion: "1.0.0",
        description: "Template diimpor dari desain Figma.",
        author: "Figma Adapter",
        createdAt: new Date().toISOString(),
      },
      theme: {
        themeId: "theme-wedding-botanical",
        themeConfig: {},
      },
      sections: [],
      containers: {},
      elements: {},
      widgets: {},
      assets: [],
      responsive: {
        breakpoints: { mobile: 390, tablet: 768, desktop: 1120 },
        defaultDevice: "mobile",
      },
    };

    return importFromJSONString(JSON.stringify(rawJSON));
  }

  return {
    success: false,
    validation: {
      valid: false,
      errors: [`Source adaptor '${payload.source}' belum didukung.`],
      warnings: [],
    },
    error: `Adapter untuk ${payload.source} belum tersedia.`,
  };
}
