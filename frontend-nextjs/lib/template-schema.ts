/**
 * InviteU Template Schema & Data Binding Adapter (MVP 4)
 * Menghubungkan Builder, database, dan renderer InviteU:
 * - template_sections (id, template_id, name, type, sort_order, is_required, is_editable, settings JSONB)
 * - template_fields (id, template_section_id, field_key, label, field_type, default_value, is_required, is_editable, sort_order, validation_rules JSONB)
 * - invitation_versions (id, invitation_id, version_number, status)
 * - invitation_contents (id, invitation_version_id, template_field_id, value TEXT)
 */

import { SectionConfig, SectionSettings } from "@/components/builder/registry/types";
import { getWidgetDefinition } from "@/components/builder/registry";
import { convertThemeToSections } from "@/components/builder/registry";
import type { TemplateTheme } from "@/app/(designer)/designer/templates/themes/registry";

// =============================================================================
// 1. TIPE DATA SCHEMA & DATABASE
// =============================================================================

export type BindingType = "dynamic" | "static" | "default";

/**
 * Representasi Field dalam Skema Template
 * Merefleksikan tabel template_fields di database
 */
export interface TemplateFieldSchema {
  id?: string | number;
  template_section_id?: string | number;
  field_key: string;
  label: string;
  field_type: "text" | "textarea" | "number" | "image" | "date" | "url" | "select" | "gallery" | "json";
  default_value: string;
  is_required: boolean;
  is_editable: boolean; // false = static designer only, true = dynamic partner field
  binding_type: BindingType; // 'static' (Designer) | 'dynamic' (Partner) | 'default' (Bawaan)
  sort_order: number;
  validation_rules?: Record<string, unknown>;
  description?: string;
}

/**
 * Representasi Section dalam Skema Template
 * Merefleksikan tabel template_sections di database dengan relasi has-many ke template_fields
 */
export interface TemplateSectionSchema {
  id: string | number;
  template_id?: string | number;
  name: string;
  type: string;
  sort_order: number;
  is_required: boolean;
  is_editable: boolean;
  settings: SectionSettings; // Disimpan sebagai JSONB di template_sections.settings
  fields: TemplateFieldSchema[]; // Child rows di tabel template_fields
}

/**
 * Paket Lengkap Skema Template
 * Berisi metadata template dan daftar section terurut
 */
export interface TemplateSchemaPackage {
  id?: string | number;
  name: string;
  slug: string;
  version: string;
  themeCategory?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sections: TemplateSectionSchema[];
  metadata?: {
    created_at?: string;
    updated_at?: string;
    author?: string;
    schema_version: "1.0";
    figma_source?: string;
  };
}

/**
 * Nilai Konten Undangan (Diisi oleh Partner)
 */
export type InvitationContentValues = Record<string, unknown>;

/**
 * Baris tabel template_sections di PostgreSQL
 */
export interface DbTemplateSectionRow {
  id: number | string;
  template_id: number | string;
  name: string;
  type: string;
  sort_order: number;
  is_required: boolean;
  is_editable: boolean;
  settings: Record<string, unknown>; // JSONB
  created_at?: string;
  updated_at?: string;
}

/**
 * Baris tabel template_fields di PostgreSQL
 */
export interface DbTemplateFieldRow {
  id: number | string;
  template_section_id: number | string;
  field_key: string;
  label: string;
  field_type: string;
  default_value: string | null;
  is_required: boolean;
  is_editable: boolean;
  sort_order: number;
  validation_rules?: Record<string, unknown> | null; // JSONB
  created_at?: string;
  updated_at?: string;
}

/**
 * Baris tabel invitation_contents di PostgreSQL
 */
export interface DbInvitationContentRow {
  id?: number | string;
  invitation_version_id: number | string;
  template_field_id: number | string;
  value: string; // TEXT
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// 2. STANDAR DYNAMIC FIELD KEYS (DATA BINDING MVP 4)
// =============================================================================

export const DYNAMIC_FIELD_KEYS = [
  // Nama pasangan & panggilan
  "couple_names",
  "coupleTitle",
  "groom_name",
  "bride_name",
  "groom_nickname",
  "bride_nickname",
  "groom",
  "bride",

  // Tanggal & waktu acara
  "event_date",
  "event_time",
  "dateText",
  "timeText",
  "days",
  "hours",
  "minutes",
  "seconds",

  // Lokasi & alamat
  "venue_name",
  "placeName",
  "venue_address",
  "address",

  // Google Maps URL
  "map_url",
  "mapUrl",

  // Foto pasangan
  "hero_image",
  "imageUrl",

  // Gallery
  "gallery_images",
  "galleryImages",

  // Love Story
  "love_story",
  "milestones",

  // Digital Gift
  "bank_name",
  "bankName",
  "account_number",
  "accountNumber",
  "account_holder",
  "accountHolder",
  "giftNote",

  // Tambahan banner & ucapan
  "title",
  "subtitle",
  "message",
  "tag",
];

/**
 * Kamus Alias / Sinonim Field
 * Menjamin kompatibilitas antara snake_case database dan camelCase state widget
 */
export const FIELD_KEY_ALIASES: Record<string, string[]> = {
  coupleTitle: ["couple_names", "coupleTitle", "title"],
  couple_names: ["coupleTitle", "couple_names"],
  groom: ["groom_nickname", "groom_name", "groom"],
  bride: ["bride_nickname", "bride_name", "bride"],
  groom_nickname: ["groom", "groom_nickname"],
  bride_nickname: ["bride", "bride_nickname"],
  dateText: ["event_date", "dateText"],
  timeText: ["event_time", "timeText"],
  event_date: ["dateText", "event_date"],
  event_time: ["timeText", "event_time"],
  placeName: ["venue_name", "placeName", "location"],
  venue_name: ["placeName", "venue_name"],
  address: ["venue_address", "address", "location_address"],
  venue_address: ["address", "venue_address"],
  mapUrl: ["map_url", "mapUrl", "google_maps_url"],
  map_url: ["mapUrl", "map_url"],
  imageUrl: ["hero_image", "imageUrl", "photo_url"],
  hero_image: ["imageUrl", "hero_image"],
  galleryImages: ["gallery_images", "galleryImages"],
  gallery_images: ["galleryImages", "gallery_images"],
  milestones: ["love_story", "milestones"],
  love_story: ["milestones", "love_story"],
  bankName: ["bank_name", "bankName"],
  bank_name: ["bankName", "bank_name"],
  accountNumber: ["account_number", "accountNumber"],
  account_number: ["accountNumber", "account_number"],
  accountHolder: ["account_holder", "accountHolder"],
  account_holder: ["accountHolder", "account_holder"],
};

/**
 * Menentukan klasifikasi binding_type:
 * - 'static': Konten statis yang ditentukan Designer (tidak dapat diubah Partner)
 * - 'dynamic': Field dinamis yang akan diisi Partner saat membuat undangan
 * - 'default': Konten default yang dapat disesuaikan jika diperlukan
 */
export function determineBindingType(
  fieldKey: string,
  explicitBinding?: BindingType | boolean
): BindingType {
  if (explicitBinding === "static" || explicitBinding === false) {
    return "static";
  }
  if (explicitBinding === "dynamic" || explicitBinding === true) {
    return "dynamic";
  }
  if (explicitBinding === "default") {
    return "default";
  }
  if (DYNAMIC_FIELD_KEYS.includes(fieldKey)) {
    return "dynamic";
  }
  return "default";
}

// =============================================================================
// 3. ADAPTER: SERIALIZE, DESERIALIZE & DATABASE CONVERTER
// =============================================================================

/**
 * Mengekstrak template_fields dari konfigurasi section builder
 */
export function extractFieldsFromSection(section: SectionConfig): TemplateFieldSchema[] {
  const master = getWidgetDefinition(section.type);
  const content = section.content || {};
  const fields: TemplateFieldSchema[] = [];

  let sortOrder = 0;

  // 1. Ekstrak dari editableFields di registry
  if (master && master.editableFields) {
    for (const def of master.editableFields) {
      if (def.target === "content" || def.category === "content") {
        const val = content[def.name];
        const strVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");

        // Periksa apakah desainer menandai field ini sebagai statis / dinamis
        const customBinding = content[`_binding_type_${def.name}`] as BindingType | undefined;
        const isExplicitStatic = content[`_is_static_${def.name}`] === true;
        const bindingType = isExplicitStatic
          ? "static"
          : determineBindingType(def.name, customBinding);

        const isRequired =
          def.name === "coupleTitle" ||
          def.name === "placeName" ||
          def.name === "dateText";

        fields.push({
          field_key: def.name,
          label: def.label,
          field_type:
            def.type === "image"
              ? "image"
              : def.type === "textarea"
              ? "textarea"
              : def.type === "number"
              ? "number"
              : "text",
          default_value: strVal,
          is_required: isRequired,
          is_editable: bindingType !== "static",
          binding_type: bindingType,
          sort_order: sortOrder++,
          description: def.description,
        });
      }
    }
  }

  // 2. Sertakan kunci konten lainnya yang belum tercakup di editableFields
  for (const [key, val] of Object.entries(content)) {
    // Abaikan metadata internal builder berawalan underscore
    if (key.startsWith("_")) continue;

    if (!fields.some((f) => f.field_key === key)) {
      const strVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
      const customBinding = content[`_binding_type_${key}`] as BindingType | undefined;
      const isExplicitStatic = content[`_is_static_${key}`] === true;
      const bindingType = isExplicitStatic
        ? "static"
        : determineBindingType(key, customBinding);

      let fieldType: TemplateFieldSchema["field_type"] = "text";
      if (typeof val === "number") fieldType = "number";
      else if (typeof val === "object") fieldType = "json";
      else if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
        fieldType = "url";
      }

      fields.push({
        field_key: key,
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        field_type: fieldType,
        default_value: strVal,
        is_required: false,
        is_editable: bindingType !== "static",
        binding_type: bindingType,
        sort_order: sortOrder++,
      });
    }
  }

  return fields;
}

/**
 * SERIALIZE: Format State Builder -> Format Database / JSON Schema
 * Menerjemahkan state Builder menjadi format yang siap disimpan ke tabel
 * template_sections dan template_fields
 */
export function serializeBuilderToSchema(
  templateMeta: {
    id?: string | number;
    name: string;
    slug: string;
    version?: string;
    themeCategory?: string;
    primaryColor?: string;
    secondaryColor?: string;
  },
  sections: SectionConfig[]
): TemplateSchemaPackage {
  const sectionSchemas: TemplateSectionSchema[] = sections.map((sec, idx) => ({
    id: sec.id,
    name: sec.name,
    type: sec.type,
    sort_order: sec.sortOrder !== undefined ? sec.sortOrder : idx,
    is_required: sec.type === "cover" || sec.type === "event_details",
    is_editable: sec.visible !== false,
    settings: { ...sec.settings },
    fields: extractFieldsFromSection(sec),
  }));

  return {
    id: templateMeta.id,
    name: templateMeta.name,
    slug: templateMeta.slug,
    version: templateMeta.version || "1.0",
    themeCategory: templateMeta.themeCategory,
    primaryColor: templateMeta.primaryColor,
    secondaryColor: templateMeta.secondaryColor,
    sections: sectionSchemas,
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: "InviteU Studio",
      schema_version: "1.0",
    },
  };
}

/**
 * DESERIALIZE: Format Database / JSON Schema -> Format State Builder
 * Membaca kembali skema database JSON menjadi SectionConfig[] yang siap diedit di Builder
 */
export function deserializeSchemaToBuilder(schemaPackage: TemplateSchemaPackage): {
  templateMeta: {
    id?: string | number;
    name: string;
    slug: string;
    version: string;
    themeCategory?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  sections: SectionConfig[];
} {
  const sortedSections = [...(schemaPackage.sections || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const sections: SectionConfig[] = sortedSections.map((secSchema, idx) => {
    const content: Record<string, unknown> = {};

    for (const f of secSchema.fields || []) {
      let parsedVal: unknown = f.default_value;
      if (
        f.field_type === "json" ||
        (typeof f.default_value === "string" &&
          (f.default_value.startsWith("{") || f.default_value.startsWith("[")))
      ) {
        try {
          parsedVal = JSON.parse(f.default_value);
        } catch {
          parsedVal = f.default_value;
        }
      } else if (f.field_type === "number") {
        parsedVal = Number(f.default_value) || 0;
      }
      content[f.field_key] = parsedVal;

      // Pertahankan status binding desainer saat deserialisasi
      content[`_binding_type_${f.field_key}`] = f.binding_type;
      content[`_is_static_${f.field_key}`] =
        f.binding_type === "static" || f.is_editable === false;
    }

    return {
      id: String(secSchema.id),
      type: secSchema.type,
      name: secSchema.name,
      sortOrder: secSchema.sort_order !== undefined ? secSchema.sort_order : idx,
      visible: secSchema.is_editable !== false,
      settings: { ...secSchema.settings },
      content,
    };
  });

  return {
    templateMeta: {
      id: schemaPackage.id,
      name: schemaPackage.name,
      slug: schemaPackage.slug,
      version: schemaPackage.version || "1.0",
      themeCategory: schemaPackage.themeCategory,
      primaryColor: schemaPackage.primaryColor,
      secondaryColor: schemaPackage.secondaryColor,
    },
    sections,
  };
}

/**
 * Konversi Skema Template ke Record Database Flat
 * Menghasilkan baris siap di-INSERT ke tabel template_sections dan template_fields
 */
export function schemaPackageToDatabaseRecords(
  pkg: TemplateSchemaPackage,
  templateId: number | string = 1
): {
  sections: DbTemplateSectionRow[];
  fields: DbTemplateFieldRow[];
} {
  const sectionsRows: DbTemplateSectionRow[] = [];
  const fieldsRows: DbTemplateFieldRow[] = [];

  let fieldCounter = 1;

  pkg.sections.forEach((sec, sIdx) => {
    const sectionDbId = typeof sec.id === "number" ? sec.id : sIdx + 1;

    sectionsRows.push({
      id: sectionDbId,
      template_id: templateId,
      name: sec.name,
      type: sec.type,
      sort_order: sec.sort_order,
      is_required: sec.is_required,
      is_editable: sec.is_editable,
      settings: sec.settings as Record<string, unknown>,
    });

    sec.fields.forEach((fld, fIdx) => {
      const fieldDbId = typeof fld.id === "number" ? fld.id : fieldCounter++;

      fieldsRows.push({
        id: fieldDbId,
        template_section_id: sectionDbId,
        field_key: fld.field_key,
        label: fld.label,
        field_type: fld.field_type,
        default_value: fld.default_value,
        is_required: fld.is_required,
        is_editable: fld.is_editable,
        sort_order: fld.sort_order !== undefined ? fld.sort_order : fIdx,
        validation_rules: fld.validation_rules || null,
      });
    });
  });

  return { sections: sectionsRows, fields: fieldsRows };
}

/**
 * Konversi Record Database Flat kembali ke Skema Template Package
 */
export function databaseRecordsToSchemaPackage(
  meta: { id?: number | string; name: string; slug: string; version?: string },
  sectionsRows: DbTemplateSectionRow[],
  fieldsRows: DbTemplateFieldRow[]
): TemplateSchemaPackage {
  const sections: TemplateSectionSchema[] = sectionsRows.map((secRow) => {
    const childFields = fieldsRows
      .filter((f) => String(f.template_section_id) === String(secRow.id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f): TemplateFieldSchema => ({
        id: f.id,
        template_section_id: f.template_section_id,
        field_key: f.field_key,
        label: f.label,
        field_type: (f.field_type as TemplateFieldSchema["field_type"]) || "text",
        default_value: f.default_value ?? "",
        is_required: f.is_required,
        is_editable: f.is_editable,
        binding_type: f.is_editable ? determineBindingType(f.field_key) : "static",
        sort_order: f.sort_order,
        validation_rules: f.validation_rules || undefined,
      }));

    return {
      id: secRow.id,
      template_id: secRow.template_id,
      name: secRow.name,
      type: secRow.type,
      sort_order: secRow.sort_order,
      is_required: secRow.is_required,
      is_editable: secRow.is_editable,
      settings: secRow.settings as SectionSettings,
      fields: childFields,
    };
  });

  return {
    id: meta.id,
    name: meta.name,
    slug: meta.slug,
    version: meta.version || "1.0",
    sections,
    metadata: {
      schema_version: "1.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Konversi dari nilai konten Partner ke baris database invitation_contents
 */
export function valuesToInvitationContents(
  values: InvitationContentValues,
  fieldsRows: DbTemplateFieldRow[],
  invitationVersionId: number | string = 1
): DbInvitationContentRow[] {
  const contentRows: DbInvitationContentRow[] = [];

  for (const field of fieldsRows) {
    // Cari nilai berdasarkan field_key atau salah satu aliasnya
    let matchedVal: unknown = undefined;
    if (field.field_key in values) {
      matchedVal = values[field.field_key];
    } else {
      const aliases = FIELD_KEY_ALIASES[field.field_key] || [];
      for (const alias of aliases) {
        if (alias in values && values[alias] !== undefined) {
          matchedVal = values[alias];
          break;
        }
      }
    }

    if (matchedVal !== undefined && matchedVal !== null) {
      const textValue =
        typeof matchedVal === "object" ? JSON.stringify(matchedVal) : String(matchedVal);

      contentRows.push({
        invitation_version_id: invitationVersionId,
        template_field_id: field.id,
        value: textValue,
      });
    }
  }

  return contentRows;
}

/**
 * Konversi baris database invitation_contents kembali ke dictionary nilai konten
 */
export function invitationContentsToValues(
  contentRows: DbInvitationContentRow[],
  fieldsRows: DbTemplateFieldRow[]
): InvitationContentValues {
  const result: InvitationContentValues = {};
  const fieldMap = new Map<string, DbTemplateFieldRow>();
  fieldsRows.forEach((f) => fieldMap.set(String(f.id), f));

  for (const row of contentRows) {
    const fieldDef = fieldMap.get(String(row.template_field_id));
    if (fieldDef) {
      let val: unknown = row.value;
      if (
        fieldDef.field_type === "json" ||
        (row.value && (row.value.startsWith("{") || row.value.startsWith("[")))
      ) {
        try {
          val = JSON.parse(row.value);
        } catch {
          val = row.value;
        }
      } else if (fieldDef.field_type === "number") {
        val = Number(row.value) || 0;
      }
      result[fieldDef.field_key] = val;
    }
  }

  return result;
}

/**
 * Konversi Tema Bawaan (Wedding Theme / template.json) ke Skema Template Package
 */
export function convertThemeToSchemaPackage(theme: TemplateTheme): TemplateSchemaPackage {
  const sections = convertThemeToSections(theme);
  return serializeBuilderToSchema(
    {
      id: theme.id,
      name: theme.name,
      slug: theme.slug,
      version: theme.version,
      themeCategory: theme.themeCategory,
      primaryColor: theme.colorPalette.primary,
      secondaryColor: theme.colorPalette.secondary,
    },
    sections
  );
}

// =============================================================================
// 4. VALIDASI SKEMA DAN FIELD
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Memvalidasi struktur skema template, section, dan field
 */
export function validateTemplateSchema(schema: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema || typeof schema !== "object") {
    return {
      valid: false,
      errors: ["Skema template harus berupa objek JSON yang valid."],
      warnings: [],
    };
  }

  const pkg = schema as Partial<TemplateSchemaPackage>;

  // Validasi Metadata
  if (!pkg.name || typeof pkg.name !== "string" || !pkg.name.trim()) {
    errors.push("Template wajib memiliki atribut 'name' bertipe string non-kosong.");
  }
  if (!pkg.slug || typeof pkg.slug !== "string" || !pkg.slug.trim()) {
    errors.push("Template wajib memiliki atribut 'slug' bertipe string non-kosong.");
  }
  if (!Array.isArray(pkg.sections)) {
    errors.push("Template wajib memiliki array 'sections'.");
    return { valid: false, errors, warnings };
  }

  if (pkg.sections.length === 0) {
    warnings.push("Template tidak memiliki section apapun (kanvas kosong).");
  }

  // Validasi Section
  const sectionIds = new Set<string | number>();
  let hasCoverSection = false;
  let hasEventDetailsSection = false;

  pkg.sections.forEach((sec, idx) => {
    if (sec.id === undefined || sec.id === null || sec.id === "") {
      errors.push(`Section index #${idx} tidak memiliki 'id'.`);
    } else {
      if (sectionIds.has(sec.id)) {
        errors.push(`Duplikasi section ID terdeteksi: '${sec.id}'.`);
      }
      sectionIds.add(sec.id);
    }

    if (!sec.type || typeof sec.type !== "string") {
      errors.push(`Section index #${idx} ('${sec.name || "unnamed"}') tidak memiliki 'type' valid.`);
    }

    if (sec.type === "cover") hasCoverSection = true;
    if (sec.type === "event_details") hasEventDetailsSection = true;

    if (!sec.settings || typeof sec.settings !== "object") {
      errors.push(`Section '${sec.name || idx}' harus memiliki objek 'settings'.`);
    }

    // Validasi Fields
    if (!Array.isArray(sec.fields)) {
      errors.push(`Section '${sec.name || idx}' harus memiliki array 'fields'.`);
    } else {
      const fieldKeys = new Set<string>();
      sec.fields.forEach((fld, fIdx) => {
        if (!fld.field_key || typeof fld.field_key !== "string" || !fld.field_key.trim()) {
          errors.push(
            `Field index #${fIdx} pada section '${sec.name || idx}' tidak memiliki 'field_key'.`
          );
        } else {
          if (fieldKeys.has(fld.field_key)) {
            errors.push(
              `Duplikasi field_key '${fld.field_key}' ditemukan pada section '${sec.name}'.`
            );
          }
          fieldKeys.add(fld.field_key);
        }

        if (!fld.field_type) {
          errors.push(
            `Field '${fld.field_key}' pada section '${sec.name}' tidak memiliki 'field_type'.`
          );
        }

        if (fld.binding_type && !["dynamic", "static", "default"].includes(fld.binding_type)) {
          errors.push(
            `Field '${fld.field_key}' memiliki binding_type tidak valid: '${fld.binding_type}'.`
          );
        }
      });
    }
  });

  if (!hasCoverSection) {
    warnings.push("Direkomendasikan memiliki section bertipe 'cover' untuk tampilan awal undangan.");
  }
  if (!hasEventDetailsSection) {
    warnings.push("Direkomendasikan memiliki section bertipe 'event_details' untuk informasi waktu & lokasi.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// 5. DUMMY DATA UNTUK PREVIEW DATA BINDING
// =============================================================================

/**
 * Menyediakan data dummy lengkap untuk pratinjau data binding Partner
 */
export function getDummyInvitationContent(): InvitationContentValues {
  return {
    // Nama pasangan & panggilan
    couple_names: "Raden Arya & Citra Lestari",
    coupleTitle: "ARYA & CITRA",
    groom_name: "Raden Arya Wijaya, S.T.",
    bride_name: "Citra Lestari Dewi, S.Ked.",
    groom_nickname: "Arya",
    bride_nickname: "Citra",
    groom: "ARYA",
    bride: "CITRA",

    // Tanggal dan waktu acara
    event_date: "2026-11-20",
    event_time: "10:00 - 14:00 WIB",
    dateText: "Sabtu, 20 November 2026",
    timeText: "10:00 - 14:00 WIB",
    days: 21,
    hours: 8,
    minutes: 45,
    seconds: 20,

    // Lokasi dan alamat
    venue_name: "The Royal Ambarrukmo Grand Ballroom",
    placeName: "The Royal Ambarrukmo Ballroom",
    venue_address: "Jl. Laksda Adisucipto No. 81, Caturtunggal, Sleman, D.I. Yogyakarta",
    address: "Jl. Laksda Adisucipto No. 81, Caturtunggal, Sleman, D.I. Yogyakarta",

    // Google Maps URL
    map_url: "https://maps.google.com/?q=The+Royal+Ambarrukmo+Yogyakarta",
    mapUrl: "https://maps.google.com/?q=The+Royal+Ambarrukmo+Yogyakarta",

    // Foto pasangan
    hero_image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",

    // Gallery foto
    gallery_images: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
    ],

    // Love Story milestones
    love_story: [
      { id: "1", year: "2019", title: "Kampus Gadjah Mada", story: "Pertama kali bertukar senyum di perpustakaan pusat UGM." },
      { id: "2", year: "2022", title: "Janji Komitmen", story: "Bersama merintis masa depan dan saling mendukung dalam karir." },
      { id: "3", year: "2026", title: "Menuju Mahligai Suci", story: "Melangkah bersama mengikat ikrar sehidup semati." },
    ],
    milestones: [
      { id: "1", year: "2019", title: "Kampus Gadjah Mada", story: "Pertama kali bertukar senyum di perpustakaan pusat UGM." },
      { id: "2", year: "2022", title: "Janji Komitmen", story: "Bersama merintis masa depan dan saling mendukung dalam karir." },
      { id: "3", year: "2026", title: "Menuju Mahligai Suci", story: "Melangkah bersama mengikat ikrar sehidup semati." },
    ],

    // Digital Gift
    bank_name: "Bank Central Asia (BCA)",
    bankName: "BCA",
    account_number: "8820 1928 33",
    accountNumber: "8820 1928 33",
    account_holder: "Raden Arya Wijaya",
    accountHolder: "Arya & Citra",
    giftNote: "Doa restu Anda adalah karunia yang terindah bagi kami.",

    // Pesan & Tagline
    title: "A Celebration of Love",
    subtitle: "Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam momen bahagia kami.",
    tag: "Two Souls, One Destiny",
    message: "Dengan penuh rasa syukur dan sukacita, kami memohon kehadiran dan doa restu Anda sekalian.",
  };
}

// =============================================================================
// 6. DATA BINDING ENGINE
// =============================================================================

/**
 * Menggabungkan nilai dinamis Partner ke dalam section template.
 * - Field DINAMIS atau DEFAULT di-override dengan nilai Partner.
 * - Field STATIS (yang dikunci oleh Designer) TETAP TERJAGA dan tidak di-override.
 * - Settings layout dan styling Designer 100% terjaga.
 */
export function bindInvitationContentToSections(
  sections: SectionConfig[],
  contentValues: InvitationContentValues
): SectionConfig[] {
  return sections.map((sec) => {
    const boundContent: Record<string, unknown> = { ...sec.content };

    // Dapatkan daftar field_key yang ada di section
    for (const key of Object.keys(boundContent)) {
      // Abaikan kunci metadata internal
      if (key.startsWith("_")) continue;

      // Cek apakah field ini dikunci sebagai STATIS oleh Designer
      const isExplicitStatic =
        boundContent[`_is_static_${key}`] === true ||
        boundContent[`_binding_type_${key}`] === "static";

      if (isExplicitStatic) {
        // Konten statis desainer TIDAK BOLEH di-override oleh data Partner
        continue;
      }

      // Cari nilai pengganti dari data Partner, baik direct key maupun alias
      let replacementVal: unknown = undefined;

      if (key in contentValues && contentValues[key] !== undefined && contentValues[key] !== null) {
        replacementVal = contentValues[key];
      } else {
        const aliases = FIELD_KEY_ALIASES[key] || [];
        for (const alias of aliases) {
          if (
            alias in contentValues &&
            contentValues[alias] !== undefined &&
            contentValues[alias] !== null
          ) {
            replacementVal = contentValues[alias];
            break;
          }
        }
      }

      if (replacementVal !== undefined) {
        boundContent[key] = replacementVal;
      }
    }

    // Periksa juga field standar yang mungkin belum ada di initial content tapi dibutuhkan widget
    for (const [valKey, val] of Object.entries(contentValues)) {
      if (val === undefined || val === null) continue;

      if (isKeyRelevantToSection(valKey, sec.type)) {
        const isStatic =
          boundContent[`_is_static_${valKey}`] === true ||
          boundContent[`_binding_type_${valKey}`] === "static";

        if (!isStatic && !(valKey in boundContent)) {
          boundContent[valKey] = val;
        }
      }
    }

    return {
      ...sec,
      content: boundContent,
    };
  });
}

function isKeyRelevantToSection(key: string, sectionType: string): boolean {
  switch (sectionType) {
    case "cover":
      return ["coupleTitle", "couple_names", "title", "subtitle", "imageUrl", "hero_image", "dateText"].includes(key);
    case "event_details":
      return ["placeName", "venue_name", "address", "venue_address", "dateText", "timeText", "mapUrl", "map_url"].includes(key);
    case "gallery":
      return ["galleryImages", "gallery_images", "title"].includes(key);
    case "love_story":
      return ["milestones", "love_story", "title", "subtitle"].includes(key);
    case "digital_gift":
      return ["bankName", "bank_name", "accountNumber", "account_number", "accountHolder", "account_holder", "giftNote"].includes(key);
    case "countdown":
      return ["days", "hours", "minutes", "seconds", "dateText", "title"].includes(key);
    case "quote_banner":
      return ["tag", "message", "groom", "bride", "coupleTitle"].includes(key);
    default:
      return false;
  }
}
