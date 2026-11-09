import {
  deserializeSchemaToBuilder,
  TemplateSchemaPackage,
} from "@/lib/template-schema";
import { SectionConfig } from "@/components/builder/registry";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface DesignerTemplateSummary {
  id: number;
  designer_id: number;
  name: string;
  slug: string;
  category_name: string;
  status: string;
  rejection_note?: string | null;
  secondary_color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignerTemplateData {
  id: string;
  name: string;
  slug: string;
  themeCategory: string;
  status: string;
  rejectionNote: string | null;
  primaryColor: string;
  secondaryColor: string;
  sections: SectionConfig[];
}

export interface TemplateReviewQueueItem {
  id: number;
  name: string;
  slug: string;
  status: string;
  updated_at: string;
  designer_id: number;
  designer_name: string;
  submitted_at: string;
  rejection_note: string | null;
}

export interface TemplateStatusHistoryItem {
  id: number;
  from_status: string | null;
  to_status: string;
  actor_user_id: number | null;
  actor_name: string | null;
  note: string | null;
  created_at: string;
}

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi.");
  }
  return apiBaseUrl;
}

async function designerApiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body) headers.set("Content-Type", "application/json");
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers,
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke backend template.");
  }

  const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Permintaan backend gagal (${response.status}).`);
  }
  if (result.data === undefined) {
    throw new Error("Backend mengembalikan response template tanpa data.");
  }
  return result.data;
}

function toSchemaPackage(template: Record<string, unknown>): TemplateSchemaPackage {
  const rawSections = Array.isArray(template.sections) ? template.sections : [];
  return {
    id: template.id as string | number,
    name: String(template.name ?? ""),
    slug: String(template.slug ?? ""),
    version: "1.0",
    themeCategory: String(
      template.style ?? ""
    ),
    primaryColor: typeof template.color === "string" ? template.color : "#6f7f5f",
    secondaryColor:
      typeof template.secondary_color === "string"
        ? template.secondary_color
        : "#455633",
    sections: rawSections.map((value, sectionIndex) => {
      const section = value as Record<string, unknown>;
      const rawFields = Array.isArray(section.fields) ? section.fields : [];
      const settings =
        section.settings && typeof section.settings === "object"
          ? (section.settings as Record<string, unknown>)
          : {};
      return {
        id: section.id as string | number,
        template_id: template.id as string | number,
        name: String(section.name ?? ""),
        type: String(section.type ?? ""),
        sort_order: Number(section.sort_order ?? sectionIndex),
        is_required: Boolean(section.is_required),
        is_editable: Boolean(section.is_editable),
        settings,
        fields: rawFields.map((fieldValue, fieldIndex) => {
          const field = fieldValue as Record<string, unknown>;
          const validationRules = field.validation_rules;
          return {
            id: field.id as string | number,
            template_section_id: section.id as string | number,
            field_key: String(field.field_key ?? ""),
            label: String(field.label ?? ""),
            field_type: String(field.field_type ?? "text") as
              | "text"
              | "textarea"
              | "number"
              | "image"
              | "date"
              | "url"
              | "select"
              | "gallery"
              | "json",
            default_value:
              field.default_value == null ? "" : String(field.default_value),
            is_required: Boolean(field.is_required),
            is_editable: Boolean(field.is_editable),
            binding_type: field.is_editable ? "dynamic" : "static",
            sort_order: Number(field.sort_order ?? fieldIndex),
            validation_rules:
              validationRules && typeof validationRules === "object"
                ? (validationRules as Record<string, unknown>)
                : undefined,
          };
        }),
      };
    }),
  };
}

export async function listDesignerTemplates(token: string): Promise<DesignerTemplateSummary[]> {
  const data = await designerApiRequest<{ templates: DesignerTemplateSummary[] }>(
    "/designer/templates",
    token
  );
  return data.templates;
}

export async function getDesignerTemplate(
  token: string,
  templateId: string,
  _audience: "admin"
): Promise<DesignerTemplateData> {
  if (!/^[1-9]\d*$/.test(templateId)) {
    throw new Error("ID template tidak valid.");
  }
  const data = await designerApiRequest<{
    template: Record<string, unknown>;
    status: string;
  }>(
    `/admin/templates/${templateId}/review`,
    token
  );
  const template = toSchemaPackage(data.template);
  const builder = deserializeSchemaToBuilder(template);
  return {
    id: String(data.template.id),
    name: builder.templateMeta.name,
    slug: builder.templateMeta.slug,
    themeCategory: builder.templateMeta.themeCategory || "",
    status: data.status,
    rejectionNote:
      typeof data.template.rejection_note === "string"
        ? data.template.rejection_note
        : null,
    primaryColor: builder.templateMeta.primaryColor || "#6f7f5f",
    secondaryColor: builder.templateMeta.secondaryColor || "#455633",
    sections: builder.sections,
  };
}

export async function listTemplateReviewQueue(
  token: string
): Promise<TemplateReviewQueueItem[]> {
  const data = await designerApiRequest<{ templates: TemplateReviewQueueItem[] }>(
    "/admin/templates/review",
    token
  );
  return data.templates;
}

export async function getTemplateStatusHistory(
  token: string,
  templateId: string,
  _audience: "admin"
): Promise<TemplateStatusHistoryItem[]> {
  const data = await designerApiRequest<{ history: TemplateStatusHistoryItem[] }>(
    `/admin/templates/${templateId}/history`,
    token
  );
  return data.history;
}

export async function approveTemplate(
  token: string,
  templateId: string,
  note?: string
): Promise<void> {
  await designerApiRequest<{ id: number; status: string }>(
    `/admin/templates/${templateId}/approve`,
    token,
    {
      method: "POST",
      body: JSON.stringify(note ? { note } : {}),
    }
  );
}

export async function rejectTemplate(
  token: string,
  templateId: string,
  note: string
): Promise<void> {
  await designerApiRequest<{ id: number; status: string }>(
    `/admin/templates/${templateId}/reject`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    }
  );
}

export async function archiveTemplate(
  token: string,
  templateId: string
): Promise<void> {
  await designerApiRequest<{ id: number; status: string }>(
    `/admin/templates/${templateId}/archive`,
    token,
    { method: "POST" }
  );
}
