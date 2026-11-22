import React from "react";

export type WidgetCategory = "core" | "event" | "interactive" | "media" | "addon";

export type FieldControlType =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "select"
  | "image"
  | "boolean";

export interface EditableFieldDef {
  name: string; // key in content or settings
  label: string;
  type: FieldControlType;
  target: "content" | "settings"; // target modification
  category?: "content" | "style" | "spacing";
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface SectionSettings {
  alignment?: "left" | "center" | "right";
  fontFamily?: "serif" | "sans" | "mono" | "script";
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  cardBackground?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  borderWidth?: "none" | "thin" | "medium" | "thick";
  borderColor?: string;
  bgImage?: string;
  bgImageOpacity?: number; // 0 - 100
  bgImagePosition?: "center" | "top" | "bottom" | "left" | "right";
  bgImageSize?: "cover" | "contain" | "100% 100%";
  layoutVariant?: "default" | "card" | "minimal" | "compact" | "grid-3" | "carousel" | "masonry";
  shadow?: "none" | "sm" | "md" | "lg";
  [key: string]: unknown;
}

export interface SectionConfig<TContent = Record<string, unknown>> {
  id: string; // Unik ID: "sec-cover-1730000000000"
  type: string; // Widget Type ID: "cover"
  name: string; // Display Name (editable)
  sortOrder: number; // Urutan tampilan (0, 1, 2, ...)
  visible: boolean; // Status visibilitas (true / false)
  settings: SectionSettings; // Konfigurasi gaya & layout
  content: TContent; // Data spesifik konten widget
}

export interface WidgetRendererProps<TContent = Record<string, unknown>> {
  id: string;
  name: string;
  settings: SectionSettings;
  content: TContent;
  isEditMode?: boolean;
}

export interface MasterWidget<TContent = Record<string, unknown>> {
  id: string;
  name: string;
  category: WidgetCategory;
  description: string;
  icon: string;
  isAddon?: boolean;
  defaultSettings: SectionSettings;
  defaultContent: TContent;
  editableFields: EditableFieldDef[];
  renderer: React.ComponentType<WidgetRendererProps<TContent>>;
}
