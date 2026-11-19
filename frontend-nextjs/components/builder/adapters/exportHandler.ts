/**
 * InviteU Page Builder - Export Handler (MVP 1)
 *
 * Menyiapkan, memvalidasi, dan mengekspor data desain undangan ke format
 * internal JSON (InviteUTemplateJSON), paket schema, dan file download.
 */

import {
  InviteUTemplateJSON,
  serializeToTemplateJSON,
  validateTemplateJSON,
  ValidationResult,
  SerializationParams,
} from "@/lib/template-json";

export interface TemplateExportPackage {
  json: InviteUTemplateJSON;
  jsonString: string;
  validation: ValidationResult;
  stats: {
    sectionCount: number;
    containerCount: number;
    elementCount: number;
    widgetCount: number;
    assetCount: number;
  };
}

/**
 * Menghasilkan paket export lengkap dari state builder
 */
export function exportTemplatePackage(params: SerializationParams): TemplateExportPackage {
  const json = serializeToTemplateJSON(params);
  const validation = validateTemplateJSON(json);
  const jsonString = JSON.stringify(json, null, 2);

  const stats = {
    sectionCount: json.sections.length,
    containerCount: Object.keys(json.containers || {}).length,
    elementCount: Object.keys(json.elements || {}).length,
    widgetCount: Object.keys(json.widgets || {}).length,
    assetCount: json.assets.length,
  };

  return {
    json,
    jsonString,
    validation,
    stats,
  };
}

/**
 * Memicu pengunduhan file JSON di browser
 */
export function downloadTemplateJSON(
  templateJSON: InviteUTemplateJSON,
  customFilename?: string
): void {
  const slug = templateJSON.metadata.slug || "template";
  const filename = customFilename || `inviteu-template-${slug}.json`;

  const blob = new Blob([JSON.stringify(templateJSON, null, 2)], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
