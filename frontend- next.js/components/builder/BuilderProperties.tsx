"use client";

import React from "react";
import {
  Alert,
  Button,
  Checkbox,
  ColorPicker,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Slider,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  ControlOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  FormatPainterOutlined,
  LinkOutlined,
  LockOutlined,
  PlayCircleOutlined,
  SnippetsOutlined,
  UnlockOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
} from "@ant-design/icons";
import {
  OPENING_ANIMATION_OPTIONS,
  DECORATIVE_ANIMATION_OPTIONS,
} from "./animation/animationTypes";
import {
  BUILDER_FONT_FAMILIES,
  BuilderDevice,
  BuilderDocument,
  BuilderNode,
  BuilderPropertyValue,
  BuilderSection,
  ElementType,
  getResponsiveOverride,
  getResponsivePosition,
  getResponsiveProps,
  getResponsiveSize,
} from "./model";
import { BUILDER_COLOR_PRESETS } from "./colorPalette";
import styles from "./BuilderProperties.module.css";
import {
  getAllGlobalThemePresets,
  getGlobalThemePreset,
  DEFAULT_THEME_ID,
  TemplateThemeConfigOverride,
  GlobalThemePreset,
} from "@/lib/theme-system";
import {
  PackageTier,
  TemplateStatus,
  formatPackageTierLabel,
  normalizePackageTier,
  normalizeTemplateStatus,
} from "@/lib/template-json";

const { Text } = Typography;

export interface BuilderMetadata {
  name: string;
  slug: string;
  description: string;
  category_name: string;
  themeCategory: string;
  primaryColor: string;
  secondaryColor: string;
  canvasBackground?: string;
  defaultFontFamily?: string;
  packageTier?: PackageTier | string;
  status?: TemplateStatus | string;
  themeId?: string;
  themeConfig?: TemplateThemeConfigOverride;
}

interface BuilderPropertiesProps {
  selectedNode: BuilderNode | null;
  parentSection?: BuilderSection | null;
  document?: BuilderDocument;
  onSelectNode?: (id: string | null) => void;
  metadata: BuilderMetadata;
  device: BuilderDevice;
  activeSubField?: string | null;
  onSubFieldChange?: (subFieldKey: string) => void;
  onUpdateMetadata: <K extends keyof BuilderMetadata>(
    key: K,
    value: BuilderMetadata[K]
  ) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateProp: (
    id: string,
    key: string,
    value: BuilderPropertyValue
  ) => void;
  onResetProp: (id: string, key: string) => void;
  onUpdateVisibility: (id: string, visible: boolean) => void;
  onUpdatePosition: (
    id: string,
    position: { x?: number; y?: number }
  ) => void;
  onResetPosition: (id: string, key: "x" | "y") => void;
  onUpdateSize: (
    id: string,
    size: { width?: number; height?: number }
  ) => void;
  onResetSize: (id: string, key: "width" | "height") => void;
  fontOptions?: { value: string; label: string }[];
  onOpenAssets?: (field?: string, title?: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onMoveToSection?: (id: string, targetSectionId: string) => void;
  onMoveToContainer?: (elementId: string, containerId?: string) => void;
  onCopyStyle?: (id: string) => void;
  onPasteStyle?: (id: string) => void;
  hasCopiedStyle?: boolean;
  onGroupElements?: (ids: string[]) => void;
  onUngroupElements?: (groupId: string) => void;
  onRemoveFromGroup?: (id: string) => void;
  onAddToGroup?: (id: string, groupId: string) => void;
  onAddElement?: (
    type: ElementType,
    sectionId?: string,
    parentContainerId?: string
  ) => void;
}

type FieldControl =
  | "text"
  | "textarea"
  | "number"
  | "slider"
  | "color"
  | "select"
  | "segmented"
  | "checkbox";

interface FieldDefinition {
  key: string;
  label: string;
  control: FieldControl;
  fallback: BuilderPropertyValue;
  options?: { label: React.ReactNode; value: string | number }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const focalPointOptions = [
  { value: "center center", label: "Center" },
  { value: "top left", label: "Top Left" },
  { value: "top center", label: "Top Center" },
  { value: "top right", label: "Top Right" },
  { value: "center left", label: "Middle Left" },
  { value: "center right", label: "Middle Right" },
  { value: "bottom left", label: "Bottom Left" },
  { value: "bottom center", label: "Bottom Center" },
  { value: "bottom right", label: "Bottom Right" },
];

const aspectRatioOptions = [
  { value: "auto", label: "Free" },
  { value: "1/1", label: "1:1" },
  { value: "4/3", label: "4:3" },
  { value: "3/2", label: "3:2" },
  { value: "16/9", label: "16:9" },
  { value: "9/16", label: "9:16" },
  { value: "21/9", label: "21:9" },
];

const shadowOptions = [
  { value: "none", label: "None" },
  { value: "0 1px 3px rgba(0,0,0,0.12)", label: "Subtle" },
  { value: "0 4px 12px rgba(0,0,0,0.15)", label: "Medium" },
  { value: "0 8px 24px rgba(0,0,0,0.20)", label: "Strong" },
  {
    value: "0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04)",
    label: "Soft border",
  },
];

function field(
  key: string,
  label: string,
  control: FieldControl,
  fallback: BuilderPropertyValue,
  additional: Partial<FieldDefinition> = {}
): FieldDefinition {
  return { key, label, control, fallback, ...additional };
}

function getSafePickerColor(value: BuilderPropertyValue) {
  const color = String(value ?? "").trim();
  if (
    /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color) ||
    /^(?:rgba?|hsla?)\([\d.%\s,\/+-]+\)$/i.test(color)
  ) {
    return color;
  }
  return "#ffffff";
}

function UnitInputNumber({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const input = (
    <InputNumber
      value={value}
      min={min}
      max={max}
      step={step}
      size="small"
      className={unit ? "!w-0 !flex-auto" : "!w-full"}
      onChange={(next) => {
        if (next !== null) onChange(next);
      }}
    />
  );

  if (!unit) return input;
  return (
    <Space.Compact block className="w-full">
      {input}
      <span className={styles.unit}>{unit}</span>
    </Space.Compact>
  );
}

function PropertyControl({
  definition,
  value,
  overridden,
  onChange,
  onReset,
}: {
  definition: FieldDefinition;
  value: BuilderPropertyValue;
  overridden: boolean;
  onChange: (value: BuilderPropertyValue) => void;
  onReset: () => void;
}) {
  let control: React.ReactNode;
  switch (definition.control) {
    case "color":
      control = (
        <Space.Compact className={styles.colorControl}>
          <ColorPicker
            value={getSafePickerColor(value)}
            presets={BUILDER_COLOR_PRESETS}
            onChange={(color) => onChange(color.toHexString())}
          />
          <Input
            value={String(value)}
            size="small"
            aria-label={`${definition.label} value`}
            onChange={(event) => onChange(event.target.value)}
          />
        </Space.Compact>
      );
      break;
    case "number":
      control = (
        <UnitInputNumber
          value={Number.isFinite(Number(value)) ? Number(value) : 0}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          unit={definition.unit}
          onChange={onChange}
        />
      );
      break;
    case "slider":
      control = (
        <div className="flex items-center gap-2">
          <Slider
            min={definition.min ?? 0}
            max={definition.max ?? 100}
            step={definition.step ?? 1}
            value={Number.isFinite(Number(value)) ? Number(value) : 0}
            className="flex-1 !my-0"
            onChange={onChange}
          />
          <InputNumber
            value={Number.isFinite(Number(value)) ? Number(value) : 0}
            min={definition.min}
            max={definition.max}
            step={definition.step}
            size="small"
            className="!w-14 flex-shrink-0"
            suffix={definition.unit}
            onChange={(next) => {
              if (next !== null) onChange(next);
            }}
          />
        </div>
      );
      break;
    case "textarea":
      control = (
        <Input.TextArea
          value={String(value)}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      );
      break;
    case "select":
      control = (
        <Select
          size="small"
          className="w-full"
          value={value}
          options={definition.options as { label: string; value: string | number }[]}
          onChange={onChange}
        />
      );
      break;
    case "segmented":
      control = (
        <Segmented
          block
          size="small"
          className={styles.segmentedControl}
          value={value as string | number}
          options={definition.options || []}
          onChange={onChange}
        />
      );
      break;
    case "checkbox":
      control = (
        <Checkbox
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        >
          Enabled
        </Checkbox>
      );
      break;
    default:
      control = (
        <Input
          size="small"
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }

  return (
    <label className={styles.field}>
      <span className={styles.fieldHeading}>
        <Text className={styles.fieldLabel}>{definition.label}</Text>
        {overridden && (
          <Button
            type="link"
            size="small"
            className={styles.resetButton}
            onClick={onReset}
          >
            Reset
          </Button>
        )}
      </span>
      {control}
    </label>
  );
}

function InspectorGroup({
  title,
  defaultCollapsed = false,
  collapsible = false,
  children,
}: {
  title: string;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <section className={styles.group}>
      <div
        className={`flex items-center justify-between ${
          collapsible ? "cursor-pointer select-none py-0.5 hover:text-[#FFAD38]" : ""
        }`}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        <Text className={styles.groupTitle}>{title}</Text>
        {collapsible && (
          <span className="text-[10px] text-[#99918A] leading-none">
            {collapsed ? "▶" : "▼"}
          </span>
        )}
      </div>
      {!collapsed && <div className={styles.groupBody}>{children}</div>}
    </section>
  );
}

export function BuilderProperties({
  selectedNode,
  parentSection,
  document,
  onSelectNode,
  metadata,
  device,
  activeSubField,
  onSubFieldChange,
  onUpdateMetadata,
  onUpdateName,
  onUpdateProp,
  onResetProp,
  onUpdateVisibility,
  onUpdatePosition,
  onResetPosition,
  onUpdateSize,
  onResetSize,
  fontOptions = [],
  onOpenAssets,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveToSection,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle = false,
  onGroupElements,
  onUngroupElements,
  onRemoveFromGroup,
  onAddToGroup,
  onAddElement,
}: BuilderPropertiesProps) {
  // All combined font choices
  const allFontOptions = React.useMemo(() => {
    return [
      ...BUILDER_FONT_FAMILIES.map(({ value, label }) => ({ value, label })),
      ...fontOptions,
    ];
  }, [fontOptions]);

  const globalThemes = React.useMemo(() => getAllGlobalThemePresets(), []);
  const activePreset: GlobalThemePreset = React.useMemo(() => {
    return (
      getGlobalThemePreset(metadata.themeId) ||
      getGlobalThemePreset(metadata.themeCategory) ||
      getGlobalThemePreset(DEFAULT_THEME_ID) ||
      globalThemes[0]
    );
  }, [metadata.themeId, metadata.themeCategory, globalThemes]);

  const [activeTab, setActiveTab] = React.useState<"content" | "style" | "animation" | "advanced">("content");
  const [activeEventSubField, setActiveEventSubField] = React.useState<string>(() => activeSubField || "title");

  React.useEffect(() => {
    if (activeSubField) {
      setActiveEventSubField(activeSubField);
    }
  }, [activeSubField]);

  // ═══════════════════════════════════════════════════════════════════════════
  // NO SELECTION: Canvas & Global Page Settings + Section Overview
  // ═══════════════════════════════════════════════════════════════════════════
  if (!selectedNode) {
    const sections = document?.sections || [];
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <div className="flex items-center gap-1.5">
            <AppstoreOutlined className="text-[#FFAD38] text-sm" />
            <Text strong className={styles.title}>
              Canvas &amp; Global Style
            </Text>
          </div>
          <Text type="secondary" className={styles.subtitle}>
            Page canvas, typography, and section manager
          </Text>
        </div>
        <div className={styles.scrollArea}>
          {/* Global Theme System - Cards Grid */}
          <InspectorGroup title="Pilihan Tema Desain Global">
            <Alert
              type="info"
              showIcon
              className="!mb-3 !text-xs !bg-[#FFF8EE] !border-[#EAE5DF] !text-[#422B1C]"
              title="Preset Tema Global (Admin Managed)"
              description="Pilih salah satu tema global InviteU. Perubahan tema akan memperbarui gaya visual tanpa menghapus section, widget, atau konten teks."
            />

            <div className="space-y-2.5">
              {globalThemes.map((t) => {
                const isActive = activePreset.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border p-2.5 transition-all ${
                      isActive
                        ? "border-[#FFAD38] bg-[#FFF8EE] shadow-xs ring-1 ring-[#FFAD38]"
                        : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]/60 hover:bg-[#F7F6F4]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-[#EAE5DF] bg-[#F7F6F4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.thumbnail || "/templates/wedding/couple-main.jpg"}
                          alt={t.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <Text strong className="text-xs text-[#422B1C] truncate">
                            {t.name}
                          </Text>
                          {isActive && (
                            <Tag color="gold" className="!mr-0 !text-[9px] !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30">
                              Aktif
                            </Tag>
                          )}
                        </div>
                        <p className="line-clamp-2 text-[10px] text-[#99918A] leading-tight mt-0.5 mb-1.5">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span
                              className="h-3 w-3 rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: t.colorPalette.primary }}
                              title={`Primary: ${t.colorPalette.primary}`}
                            />
                            <span
                              className="h-3 w-3 rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: t.colorPalette.secondary }}
                              title={`Secondary: ${t.colorPalette.secondary}`}
                            />
                            <span
                              className="h-3 w-3 rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: t.colorPalette.accent }}
                              title={`Accent: ${t.colorPalette.accent}`}
                            />
                            <span
                              className="h-3 w-3 rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: t.colorPalette.background }}
                              title={`Background: ${t.colorPalette.background}`}
                            />
                          </div>

                          {!isActive ? (
                            <Button
                              size="small"
                              type="link"
                              className="!h-auto !p-0 !text-[11px] text-[#FFAD38] font-semibold hover:text-[#F5A623]"
                              onClick={() => {
                                Modal.confirm({
                                  title: `Terapkan Tema ${t.name}?`,
                                  content:
                                    "Menerapkan tema baru akan memperbarui palet warna dan tipografi global template. Seluruh susunan section, widget InviteU, dan teks/gambar tidak akan hilang atau terhapus.",
                                  okText: "Terapkan Tema",
                                  cancelText: "Batal",
                                  onOk: () => {
                                    onUpdateMetadata("themeId", t.id);
                                    onUpdateMetadata("themeCategory", t.name);
                                    onUpdateMetadata("primaryColor", t.colorPalette.primary);
                                    onUpdateMetadata("secondaryColor", t.colorPalette.secondary);
                                    onUpdateMetadata("canvasBackground", t.colorPalette.background);
                                    onUpdateMetadata("defaultFontFamily", t.typography.fontFamily);
                                    onUpdateMetadata("themeConfig", {});
                                  },
                                });
                              }}
                            >
                              Terapkan Tema
                            </Button>
                          ) : (
                            <span className="text-[10px] text-[#258447] font-medium">
                              Tema Sedang Digunakan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InspectorGroup>

          {/* Theme Customization (Local Overrides) */}
          <InspectorGroup title="Penyesuaian Tema (Custom Override)">
            <Text className="text-[11px] text-[#765D48] mb-2 block">
              Sesuaikan palet &amp; tipografi khusus untuk template aktif ini. Perubahan lokal tidak akan mengubah preset tema global di sistem.
            </Text>

            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Warna Background Canvas</Text>
              <Space.Compact className={styles.colorControl}>
                <ColorPicker
                  value={getSafePickerColor(metadata.canvasBackground || activePreset.colorPalette.background)}
                  presets={BUILDER_COLOR_PRESETS}
                  onChange={(color) => {
                    const hex = color.toHexString();
                    onUpdateMetadata("canvasBackground", hex);
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      colorPalette: {
                        ...(metadata.themeConfig?.colorPalette || {}),
                        background: hex,
                      },
                    });
                  }}
                />
                <Input
                  value={metadata.canvasBackground || activePreset.colorPalette.background}
                  size="small"
                  onChange={(event) => {
                    const val = event.target.value;
                    onUpdateMetadata("canvasBackground", val);
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      colorPalette: {
                        ...(metadata.themeConfig?.colorPalette || {}),
                        background: val,
                      },
                    });
                  }}
                />
              </Space.Compact>
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Primary Color</Text>
                <ColorPicker
                  value={getSafePickerColor(metadata.primaryColor || activePreset.colorPalette.primary)}
                  presets={BUILDER_COLOR_PRESETS}
                  onChange={(color) => {
                    const hex = color.toHexString();
                    onUpdateMetadata("primaryColor", hex);
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      colorPalette: {
                        ...(metadata.themeConfig?.colorPalette || {}),
                        primary: hex,
                      },
                    });
                  }}
                />
              </label>
              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Secondary Color</Text>
                <ColorPicker
                  value={getSafePickerColor(metadata.secondaryColor || activePreset.colorPalette.secondary)}
                  presets={BUILDER_COLOR_PRESETS}
                  onChange={(color) => {
                    const hex = color.toHexString();
                    onUpdateMetadata("secondaryColor", hex);
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      colorPalette: {
                        ...(metadata.themeConfig?.colorPalette || {}),
                        secondary: hex,
                      },
                    });
                  }}
                />
              </label>
            </div>

            <div className="pt-2 space-y-2 border-t border-[#EAE5DF] mt-2">
              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Font Utama (Body)</Text>
                <Select
                  size="small"
                  className="w-full"
                  value={metadata.defaultFontFamily || activePreset.typography.fontFamily}
                  options={allFontOptions}
                  onChange={(font) => {
                    onUpdateMetadata("defaultFontFamily", font);
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      typography: {
                        ...(metadata.themeConfig?.typography || {}),
                        fontFamily: font,
                      },
                    });
                  }}
                />
              </label>

              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Heading Font</Text>
                <Select
                  size="small"
                  className="w-full"
                  value={String(metadata.themeConfig?.typography?.headingFontFamily || activePreset.typography.headingFontFamily)}
                  options={allFontOptions}
                  onChange={(font) => {
                    onUpdateMetadata("themeConfig", {
                      ...(metadata.themeConfig || {}),
                      typography: {
                        ...(metadata.themeConfig?.typography || {}),
                        headingFontFamily: font,
                      },
                    });
                  }}
                />
              </label>
            </div>

            <Button
              size="small"
              className="w-full mt-3 !border-[#EAE5DF] !text-[#422B1C] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
              onClick={() => {
                onUpdateMetadata("primaryColor", activePreset.colorPalette.primary);
                onUpdateMetadata("secondaryColor", activePreset.colorPalette.secondary);
                onUpdateMetadata("canvasBackground", activePreset.colorPalette.background);
                onUpdateMetadata("defaultFontFamily", activePreset.typography.fontFamily);
                onUpdateMetadata("themeConfig", {});
              }}
            >
              Reset ke Tema Default
            </Button>
          </InspectorGroup>

          {/* Package Tier & Status (Separated as required by MVP 1) */}
          <InspectorGroup title="Package Tier & Status">
            <label className={styles.field}>
              <div className="flex items-center justify-between">
                <Text className={styles.fieldLabel}>Package Tier</Text>
                <Tooltip title="Tier menunjukkan kompatibilitas template terhadap paket produk InviteU (bukan tema atau status)">
                  <span className="text-[10px] text-[#FFAD38] cursor-help">Info Tier</span>
                </Tooltip>
              </div>
              <Segmented
                size="small"
                block
                value={formatPackageTierLabel(metadata.packageTier)}
                options={["Basic", "Medium", "Pro"]}
                onChange={(val) => {
                  onUpdateMetadata("packageTier", normalizePackageTier(val));
                }}
              />
            </label>

            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Status Template</Text>
              <Select
                size="small"
                className="w-full"
                value={normalizeTemplateStatus(metadata.status)}
                onChange={(val) => {
                  onUpdateMetadata("status", val);
                }}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "pending_review", label: "Pending Review" },
                  { value: "revision_needed", label: "Revision Needed" },
                  { value: "rejected", label: "Rejected" },
                  { value: "published", label: "Published" },
                ]}
              />
            </label>
          </InspectorGroup>

          {/* Page Sections Manager */}
          <InspectorGroup title={`Sections in Page (${sections.length})`}>
            {sections.length > 0 && onSelectNode && (
              <div className="mb-2">
                <Text className="text-[10px] text-[#765D48] mb-1 block">
                  Select a section to customize:
                </Text>
                <Select
                  size="small"
                  className="w-full"
                  placeholder="Choose section to edit..."
                  options={sections.map((sec, idx) => ({
                    value: sec.id,
                    label: `${idx + 1}. ${sec.name} (${sec.children.length} items)`,
                  }))}
                  onChange={(sectionId) => onSelectNode(sectionId)}
                />
              </div>
            )}
            <div className={styles.sectionOverviewList}>
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={styles.sectionOverviewItem}
                  onClick={() => onSelectNode?.(section.id)}
                  title="Click to edit this section"
                >
                  <span className={styles.sectionOverviewName}>
                    {idx + 1}. {section.name}
                  </span>
                  <div className={styles.sectionOverviewMeta}>
                    <span className={styles.sectionOverviewCount}>
                      {section.children.length} obj
                    </span>
                    <Button
                      size="small"
                      type="link"
                      className="!text-[10px] !p-0 !h-auto text-[#FFAD38] font-semibold hover:text-[#F5A623]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode?.(section.id);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </InspectorGroup>

          {/* Template Metadata */}
          <InspectorGroup title="Template Information" collapsible defaultCollapsed>
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Template Name</Text>
              <Input
                size="small"
                value={metadata.name}
                maxLength={80}
                onChange={(event) => onUpdateMetadata("name", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Description</Text>
              <Input.TextArea
                size="small"
                value={metadata.description}
                rows={2}
                onChange={(event) =>
                  onUpdateMetadata("description", event.target.value)
                }
              />
            </label>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Category</Text>
                <Input
                  size="small"
                  value={metadata.category_name}
                  onChange={(event) =>
                    onUpdateMetadata("category_name", event.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <Text className={styles.fieldLabel}>Style</Text>
                <Input
                  size="small"
                  value={metadata.themeCategory}
                  onChange={(event) =>
                    onUpdateMetadata("themeCategory", event.target.value)
                  }
                />
              </label>
            </div>
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Slug</Text>
              <Input
                size="small"
                value={metadata.slug}
                onChange={(event) => onUpdateMetadata("slug", event.target.value)}
              />
            </label>
          </InspectorGroup>
        </div>
      </aside>
    );
  }

  // ─── Derived Flags ────────────────────────────────────────────────────────
  const isSection = selectedNode.kind === "section";
  const isContainer =
    selectedNode.kind === "element" &&
    selectedNode.elementType === "container";
  const isHeading =
    selectedNode.kind === "element" &&
    selectedNode.elementType === "heading";
  const isText =
    selectedNode.kind === "element" && selectedNode.elementType === "text";
  const isImage =
    selectedNode.kind === "element" && selectedNode.elementType === "image";
  const isVideo =
    selectedNode.kind === "element" && selectedNode.elementType === "video";
  const isButton =
    selectedNode.kind === "element" && selectedNode.elementType === "button";
  const isShape =
    selectedNode.kind === "element" && selectedNode.elementType === "shape";
  const isDivider =
    selectedNode.kind === "element" && selectedNode.elementType === "divider";
  const isSpacer =
    selectedNode.kind === "element" && selectedNode.elementType === "spacer";
  const isIcon =
    selectedNode.kind === "element" && selectedNode.elementType === "icon";
  const isWidget = selectedNode.kind === "widget";
  const isGallery =
    isImage &&
    Boolean(
      (selectedNode as { props: Record<string, BuilderPropertyValue> }).props?.isGallery
    );

  const props = getResponsiveProps(selectedNode, device);
  const position = getResponsivePosition(selectedNode, device);
  const size = getResponsiveSize(selectedNode, device);

  // Style Mode check
  const isCustomStyle = props.styleMode === "custom";
  const parentSectionProps = parentSection
    ? getResponsiveProps(parentSection, device)
    : {};
  const sectionFontFamily = String(
    parentSectionProps.fontFamily || metadata.defaultFontFamily || "Georgia, serif"
  );
  const sectionTextColor = String(
    parentSectionProps.textColor || parentSectionProps.color || "#422B1C"
  );
  const sectionPrimaryColor = String(
    parentSectionProps.primaryColor || metadata.primaryColor || "#FFAD38"
  );

  const siblingElements = parentSection
    ? parentSection.children.filter((c) => c.id !== selectedNode.id)
    : [];
  const ungroupedSiblings = siblingElements.filter((c) => !c.groupId);
  const existingGroupIds = Array.from(
    new Set(
      siblingElements
        .map((c) => c.groupId)
        .filter((g): g is string => Boolean(g && g !== selectedNode.groupId))
    )
  );

  // ─── Shared Render Helpers ────────────────────────────────────────────────
  const renderProperty = (definition: FieldDefinition) => {
    const value = props[definition.key] ?? definition.fallback;
    return (
      <PropertyControl
        key={definition.key}
        definition={definition}
        value={value}
        overridden={getResponsiveOverride(selectedNode, device, definition.key)}
        onChange={(next) => onUpdateProp(selectedNode.id, definition.key, next)}
        onReset={() => onResetProp(selectedNode.id, definition.key)}
      />
    );
  };

  const renderSizeField = (
    key: "width" | "height",
    label: string,
    fallback: number,
    min: number,
    unit: string,
    max?: number
  ) => {
    const overridden = selectedNode.responsive?.[device]?.size?.[key] !== undefined;
    return (
      <label key={key} className={styles.field}>
        <span className={styles.fieldHeading}>
          <Text className={styles.fieldLabel}>{label}</Text>
          {overridden && (
            <Button
              type="link"
              size="small"
              className={styles.resetButton}
              onClick={() => onResetSize(selectedNode.id, key)}
            >
              Reset
            </Button>
          )}
        </span>
        <UnitInputNumber
          value={size[key] ?? fallback}
          min={min}
          max={max}
          unit={unit}
          onChange={(next) => onUpdateSize(selectedNode.id, { [key]: next })}
        />
      </label>
    );
  };

  const renderPositionField = (key: "x" | "y", label: string) => {
    const overridden =
      selectedNode.responsive?.[device]?.position?.[key] !== undefined;
    return (
      <label key={key} className={styles.field}>
        <span className={styles.fieldHeading}>
          <Text className={styles.fieldLabel}>{label}</Text>
          {overridden && (
            <Button
              type="link"
              size="small"
              className={styles.resetButton}
              onClick={() => onResetPosition(selectedNode.id, key)}
            >
              Reset
            </Button>
          )}
        </span>
        <UnitInputNumber
          value={position[key]}
          min={0}
          unit="px"
          onChange={(next) => onUpdatePosition(selectedNode.id, { [key]: next })}
        />
      </label>
    );
  };

  // ─── Border & Effects Definition ──────────────────────────────────────────
  const borderFields = [
    field("borderWidth", "Border Width", "slider", 0, {
      min: 0,
      max: 24,
      step: 1,
      unit: "px",
    }),
    field("borderStyle", "Style", "select", "solid", {
      options: ["solid", "dashed", "dotted", "none"].map((v) => ({
        value: v,
        label: v[0].toUpperCase() + v.slice(1),
      })),
    }),
    field("borderColor", "Color", "color", "#d9dce3"),
    field("borderRadius", "Radius", "slider", 0, {
      min: 0,
      max: 100,
      step: 1,
      unit: "px",
    }),
  ];

  // ─── Background Fields ────────────────────────────────────────────────────
  const backgroundType = props.backgroundType ?? "solid";
  const backgroundFields = [
    field("backgroundType", "Type", "select", "solid", {
      options: [
        { value: "solid", label: "Solid Color" },
        { value: "image", label: "Image" },
        { value: "gradient", label: "Gradient" },
        { value: "video", label: "Video" },
      ],
    }),
    field("backgroundColor", "Color", "color", isSection ? "#ffffff" : "transparent"),
  ];

  // Widget Content Fields
  const widgetContentFields = isWidget
    ? Object.entries(selectedNode.props)
        .filter(
          ([key]) =>
            ![
              "backgroundColor",
              "backgroundType",
              "backgroundImage",
              "padding",
              "margin",
              "gap",
              "alignment",
              "justify",
              "display",
              "flexDirection",
              "position",
              "minWidth",
              "maxWidth",
              "minHeight",
              "maxHeight",
              "borderWidth",
              "borderColor",
              "borderStyle",
              "borderRadius",
              "boxShadow",
              "opacity",
              "overlayColor",
              "overlayOpacity",
              "styleMode",
            ].includes(key)
        )
        .map(([key, value]) =>
          field(
            key,
            key.replace(/([A-Z])/g, " $1"),
            typeof value === "number"
              ? "number"
              : typeof value === "boolean"
                ? "checkbox"
                : key.toLowerCase().includes("color")
                  ? "color"
                  : "text",
            value
          )
        )
    : [];

  const objectTitle = isSection
    ? `Section`
    : isContainer
      ? "Container"
      : isHeading
        ? "Heading"
        : isText
          ? "Text"
          : isImage
            ? "Image"
            : isVideo
              ? "Video"
              : isButton
                ? "Button"
                : isShape
                  ? "Shape"
                  : isDivider
                    ? "Divider"
                    : isSpacer
                      ? "Spacer"
                      : isIcon
                        ? "Icon"
                        : isWidget
                          ? selectedNode.name
                          : "Element";

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Properties Panel
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <aside className={styles.panel}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Tag color={isSection ? "gold" : isContainer ? "cyan" : "blue"} className="!mr-0 font-medium">
              {objectTitle}
            </Tag>
            <Text strong className={styles.title}>
              {selectedNode.name}
            </Text>
          </div>
          <Text type="secondary" className={`${styles.deviceLabel} inline-flex items-center gap-1`}>
            {device === "mobile" ? <MobileOutlined /> : device === "tablet" ? <TabletOutlined /> : <DesktopOutlined />} {device.toUpperCase()}
          </Text>
        </div>

        <div className={styles.nameRow}>
          <Input
            size="small"
            aria-label="Object name"
            value={selectedNode.name}
            onChange={(event) => onUpdateName(selectedNode.id, event.target.value)}
          />
          <Checkbox
            checked={selectedNode.visible}
            aria-label="Visible"
            onChange={(event) =>
              onUpdateVisibility(selectedNode.id, event.target.checked)
            }
          >
            <span className={styles.fieldLabel}>Show</span>
          </Checkbox>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {onCopyStyle && (
            <Tooltip title="Copy Style">
              <Button
                size="small"
                icon={<FormatPainterOutlined />}
                className={styles.quickBtn}
                onClick={() => onCopyStyle(selectedNode.id)}
              />
            </Tooltip>
          )}
          {onPasteStyle && hasCopiedStyle && (
            <Tooltip title="Paste Style">
              <Button
                size="small"
                icon={<SnippetsOutlined />}
                className={styles.quickBtn}
                style={{ color: "#059669", borderColor: "#059669" }}
                onClick={() => onPasteStyle(selectedNode.id)}
              />
            </Tooltip>
          )}
          {onToggleLock && (
            <Tooltip title={selectedNode.locked ? "Unlock" : "Lock"}>
              <Button
                size="small"
                type={selectedNode.locked ? "primary" : "default"}
                danger={selectedNode.locked}
                icon={selectedNode.locked ? <LockOutlined /> : <UnlockOutlined />}
                className={styles.quickBtn}
                onClick={() => onToggleLock(selectedNode.id)}
              />
            </Tooltip>
          )}
          {onDuplicate && !isSection && (
            <Tooltip title="Duplicate">
              <Button
                size="small"
                icon={<CopyOutlined />}
                className={styles.quickBtn}
                onClick={() => onDuplicate(selectedNode.id)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                className={styles.quickBtn}
                onClick={() => onDelete(selectedNode.id)}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* ── Contextual Tabs (Content | Style | Animation | Responsive) ── */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "content" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("content")}
        >
          <EditOutlined /> Content
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "style" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("style")}
        >
          <BgColorsOutlined /> Style
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "animation" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("animation")}
        >
          <PlayCircleOutlined /> Animation
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "advanced" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("advanced")}
        >
          <ControlOutlined /> Responsive
        </button>
      </div>

      {/* ── Scroll Area ──────────────────────────────────────────────────── */}
      <div className={styles.scrollArea}>
        {/* ════ SECTION SPECIFIC CONTROLS ══════════════════════════════════ */}
        {isSection && (
          <>
            {activeTab === "content" && (
              <>
                {/* Section Layout & Alignment */}
                <InspectorGroup title="Layout & Alignment">
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("display", "Display", "segmented", "flex", {
                        options: [
                          { value: "flex", label: "Flex" },
                          { value: "grid", label: "Grid" },
                          { value: "block", label: "Block" },
                        ],
                      })
                    )}
                    {props.display === "grid" ? (
                      renderProperty(
                        field("gridColumns", "Columns", "slider", 2, {
                          min: 1,
                          max: 6,
                          step: 1,
                        })
                      )
                    ) : (
                      renderProperty(
                        field("flexDirection", "Direction", "segmented", "column", {
                          options: [
                            { value: "column", label: "Col" },
                            { value: "row", label: "Row" },
                          ],
                        })
                      )
                    )}
                  </div>
                  {props.display !== "grid" && props.flexDirection === "row" && (
                    renderProperty(
                      field("flexWrap", "Wrap Items", "segmented", "nowrap", {
                        options: [
                          { value: "nowrap", label: "No Wrap" },
                          { value: "wrap", label: "Wrap" },
                        ],
                      })
                    )
                  )}
                  {renderProperty(
                    field("alignment", "Align Items", "segmented", "stretch", {
                      options: [
                        { value: "stretch", label: "Stretch" },
                        { value: "flex-start", label: "Start" },
                        { value: "center", label: "Center" },
                        { value: "flex-end", label: "End" },
                      ],
                    })
                  )}
                  {renderProperty(
                    field("justify", "Justify Content", "select", "flex-start", {
                      options: [
                        { value: "flex-start", label: "Start (Kiri/Atas)" },
                        { value: "center", label: "Center (Tengah)" },
                        { value: "flex-end", label: "End (Kanan/Bawah)" },
                        { value: "space-between", label: "Space Between" },
                        { value: "space-around", label: "Space Around" },
                      ],
                    })
                  )}
                </InspectorGroup>

                {/* Section Spacing & Presets */}
                <InspectorGroup title="Pengaturan Spacing Section">
                  <div className="mb-2">
                    <Text className="text-[11px] text-[#99918A] block mb-1">Preset Spacing</Text>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "padding", 16);
                          onUpdateProp(selectedNode.id, "paddingTop", 16);
                          onUpdateProp(selectedNode.id, "paddingBottom", 16);
                          onUpdateProp(selectedNode.id, "paddingLeft", 12);
                          onUpdateProp(selectedNode.id, "paddingRight", 12);
                          onUpdateProp(selectedNode.id, "gap", 8);
                        }}
                      >
                        Compact
                      </Button>
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "padding", 32);
                          onUpdateProp(selectedNode.id, "paddingTop", 32);
                          onUpdateProp(selectedNode.id, "paddingBottom", 32);
                          onUpdateProp(selectedNode.id, "paddingLeft", 20);
                          onUpdateProp(selectedNode.id, "paddingRight", 20);
                          onUpdateProp(selectedNode.id, "gap", 16);
                        }}
                      >
                        Normal
                      </Button>
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "padding", 64);
                          onUpdateProp(selectedNode.id, "paddingTop", 64);
                          onUpdateProp(selectedNode.id, "paddingBottom", 64);
                          onUpdateProp(selectedNode.id, "paddingLeft", 32);
                          onUpdateProp(selectedNode.id, "paddingRight", 32);
                          onUpdateProp(selectedNode.id, "gap", 28);
                        }}
                      >
                        Spacious
                      </Button>
                    </div>
                  </div>
                  {renderProperty(
                    field("padding", "Section Padding (Uniform)", "slider", 32, {
                      min: 0,
                      max: 160,
                      step: 4,
                      unit: "px",
                    })
                  )}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("paddingTop", "Padding Top", "number", Number(props.padding) || 0, {
                        min: 0,
                        max: 200,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("paddingBottom", "Padding Bottom", "number", Number(props.padding) || 0, {
                        min: 0,
                        max: 200,
                        unit: "px",
                      })
                    )}
                  </div>
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("paddingLeft", "Padding Left", "number", Number(props.padding) || 0, {
                        min: 0,
                        max: 200,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("paddingRight", "Padding Right", "number", Number(props.padding) || 0, {
                        min: 0,
                        max: 200,
                        unit: "px",
                      })
                    )}
                  </div>
                  {renderProperty(
                    field("gap", "Gap Antar Elemen", "slider", 16, {
                      min: 0,
                      max: 100,
                      step: 2,
                      unit: "px",
                    })
                  )}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("marginTop", "Margin Atas", "number", 0, {
                        min: -100,
                        max: 200,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("marginBottom", "Margin Bawah", "number", 0, {
                        min: -100,
                        max: 200,
                        unit: "px",
                      })
                    )}
                  </div>
                </InspectorGroup>

                {/* Dimensions & Content Width */}
                <InspectorGroup title="Dimensions & Content Width">
                  {renderSizeField("width", "Section Width", 100, 20, "%", 100)}
                  {renderSizeField("height", "Min Height", 300, 60, "px")}
                  <label className={styles.field}>
                    <Text className={styles.fieldLabel}>Content Max Width</Text>
                    <Select
                      size="small"
                      className="w-full"
                      value={Number(props.contentMaxWidth) || 0}
                      options={[
                        { value: 0, label: "Full Width (No limit)" },
                        { value: 390, label: "390px (Mobile portrait)" },
                        { value: 480, label: "480px (Standard card)" },
                        { value: 600, label: "600px (Medium card)" },
                        { value: 768, label: "768px (Tablet)" },
                        { value: 1024, label: "1024px (Desktop compact)" },
                      ]}
                      onChange={(val) =>
                        onUpdateProp(selectedNode.id, "contentMaxWidth", val)
                      }
                    />
                  </label>
                </InspectorGroup>
              </>
            )}

            {activeTab === "style" && (
              <>
                <InspectorGroup title="Section Theme & Typography">
                  <div className="p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded text-[11px] text-[#99918A] leading-tight mb-2">
                    Elements inside with <strong>Follow Section Style</strong> will
                    automatically inherit this font and text color.
                  </div>
                  <label className={styles.field}>
                    <Text className={styles.fieldLabel}>Section Font Family</Text>
                    <Select
                      size="small"
                      className="w-full"
                      value={String(props.fontFamily || metadata.defaultFontFamily || "Georgia, serif")}
                      options={allFontOptions}
                      onChange={(val) => onUpdateProp(selectedNode.id, "fontFamily", val)}
                    />
                  </label>

                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("textColor", "Text Color", "color", "#422B1C")
                    )}
                    {renderProperty(
                      field("primaryColor", "Accent / Button", "color", "#FFAD38")
                    )}
                  </div>
                </InspectorGroup>

                {/* Section Background */}
                <InspectorGroup title="Background">
                  {renderProperty(backgroundFields[0])}
                  {renderProperty(backgroundFields[1])}
                  {backgroundType === "image" && (
                    <>
                      <label className={styles.field}>
                        <Text className={styles.fieldLabel}>Image URL</Text>
                        <Input
                          size="small"
                          value={String(props.backgroundImage || "")}
                          onChange={(e) =>
                            onUpdateProp(selectedNode.id, "backgroundImage", e.target.value)
                          }
                        />
                      </label>
                      {onOpenAssets && (
                        <Button
                          size="small"
                          block
                          icon={<FolderOpenOutlined />}
                          onClick={() => onOpenAssets("backgroundImage", "Pilih Gambar Background Section")}
                        >
                          Browse Assets
                        </Button>
                      )}
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("backgroundSize", "Fit", "select", "cover", {
                            options: ["cover", "contain", "auto"].map((v) => ({
                              value: v,
                              label: v[0].toUpperCase() + v.slice(1),
                            })),
                          })
                        )}
                        {renderProperty(
                          field("backgroundPosition", "Position", "select", "center", {
                            options: [
                              "center",
                              "top",
                              "bottom",
                              "left",
                              "right",
                            ].map((v) => ({
                              value: v,
                              label: v[0].toUpperCase() + v.slice(1),
                            })),
                          })
                        )}
                      </div>
                    </>
                  )}
                  {backgroundType === "video" && (
                    <>
                      <label className={styles.field}>
                        <Text className={styles.fieldLabel}>Video URL</Text>
                        <Input
                          size="small"
                          placeholder="https://.../video.mp4"
                          value={String(props.backgroundVideo || "")}
                          onChange={(e) =>
                            onUpdateProp(selectedNode.id, "backgroundVideo", e.target.value)
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <Text className={styles.fieldLabel}>Poster / Fallback Image URL</Text>
                        <Input
                          size="small"
                          placeholder="https://.../poster.jpg"
                          value={String(props.backgroundPoster || "")}
                          onChange={(e) =>
                            onUpdateProp(selectedNode.id, "backgroundPoster", e.target.value)
                          }
                        />
                      </label>
                      {onOpenAssets && (
                        <Button
                          size="small"
                          block
                          icon={<FolderOpenOutlined />}
                          onClick={() => onOpenAssets("backgroundVideo", "Pilih Video Background Section")}
                        >
                          Browse Assets
                        </Button>
                      )}
                    </>
                  )}
                  {backgroundType === "gradient" && (
                    <label className={styles.field}>
                      <Text className={styles.fieldLabel}>Gradient Preset</Text>
                      <Select
                        size="small"
                        className="w-full"
                        value={String(
                          props.backgroundImage ||
                            "linear-gradient(135deg, #f8fafc, #e2e8f0)"
                        )}
                        options={[
                          {
                            value: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
                            label: "Soft neutral",
                          },
                          {
                            value: "linear-gradient(135deg, #fdf2f8, #e0e7ff)",
                            label: "Rose → Indigo",
                          },
                          {
                            value: "linear-gradient(135deg, #ecfdf5, #dbeafe)",
                            label: "Mint → Blue",
                          },
                          {
                            value: "linear-gradient(180deg, #fef9c3, #fde68a)",
                            label: "Gold Elegance",
                          },
                          {
                            value: "linear-gradient(180deg, #fff1f2, #ffe4e6)",
                            label: "Blush Floral",
                          },
                          {
                            value: "linear-gradient(180deg, #1f2937, #111827)",
                            label: "Dark Luxury",
                          },
                        ]}
                        onChange={(val) =>
                          onUpdateProp(selectedNode.id, "backgroundImage", val)
                        }
                      />
                    </label>
                  )}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("overlayColor", "Overlay Color", "color", "#000000")
                    )}
                    {renderProperty(
                      field("overlayOpacity", "Overlay Opacity", "slider", 0, {
                        min: 0,
                        max: 100,
                        step: 1,
                        unit: "%",
                      })
                    )}
                  </div>
                </InspectorGroup>

                {/* Border & Effects */}
                <InspectorGroup title="Border & Effects" collapsible defaultCollapsed>
                  {renderProperty(borderFields[0])}
                  <div className={styles.fieldGrid}>
                    {renderProperty(borderFields[1])}
                    {renderProperty(borderFields[2])}
                  </div>
                  {renderProperty(borderFields[3])}
                  {renderProperty(
                    field("boxShadow", "Shadow", "select", "none", {
                      options: shadowOptions,
                    })
                  )}
                </InspectorGroup>
              </>
            )}

            {/* ════ SECTION ANIMATION TAB ══════════════════════════════════ */}
            {activeTab === "animation" && (
              <>
                {/* Opening Animation (Khusus Section Pertama / Cover) */}
                {(selectedNode.id.toLowerCase().includes("cover") ||
                  selectedNode.name.toLowerCase().includes("cover") ||
                  document?.sections[0]?.id === selectedNode.id) && (
                  <InspectorGroup title="Opening Animation (Amplop Interaktif)">
                    <div className="mb-2.5 rounded border border-[#EAE5DF] bg-[#FFF8EE] p-2 text-[11px] leading-relaxed text-[#422B1C]">
                      Animasi amplop pembuka muncul sebelum tamu melihat lembaran undangan. Tamu dapat mengklik untuk membuka atau melewatinya.
                    </div>
                    {renderProperty(
                      field("openingAnimation", "Tipe Opening", "select", "none", {
                        options: [
                          { value: "none", label: "Tidak Ada (Langsung Isi)" },
                          ...OPENING_ANIMATION_OPTIONS.map((o) => ({
                            value: o.value,
                            label: o.label,
                          })),
                        ],
                      })
                    )}
                  </InspectorGroup>
                )}

                {/* Decorative Background Animation */}
                <InspectorGroup title="Decorative Animation (Efek Latar)">
                  <div className="mb-2.5 rounded border border-[#EAE5DF] bg-[#FFF8EE] p-2 text-[11px] leading-relaxed text-[#422B1C]">
                    Efek dekorasi partikel melayang (bunga, daun, kilau, kupu-kupu) di latar belakang section. Tetap ringan dan menghormati reduced motion.
                  </div>
                  {renderProperty(
                    field("decorativeAnimation", "Efek Dekorasi", "select", "none", {
                      options: [
                        { value: "none", label: "Tidak Ada" },
                        ...DECORATIVE_ANIMATION_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        })),
                      ],
                    })
                  )}
                </InspectorGroup>

                {/* Scroll Entrance Animation */}
                <InspectorGroup title="Scroll Entrance Animation">
                  {renderProperty(
                    field("scrollAnimation", "Animasi Masuk Section", "select", "none", {
                      options: [
                        { value: "none", label: "None (Langsung Tampak)" },
                        { value: "fade_in", label: "Fade In" },
                        { value: "slide_up", label: "Slide In Up" },
                        { value: "zoom_in", label: "Zoom In" },
                        { value: "flip", label: "Flip 3D" },
                      ],
                    })
                  )}
                </InspectorGroup>
              </>
            )}

            {activeTab === "advanced" && (
              <>
                {/* Padding & Spacing */}
                <InspectorGroup title="Padding & Spacing">
                  {renderProperty(
                    field("padding", "Section Padding", "slider", 32, {
                      min: 0,
                      max: 160,
                      step: 4,
                      unit: "px",
                    })
                  )}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("gap", "Items Gap", "slider", 16, {
                        min: 0,
                        max: 80,
                        step: 2,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("margin", "Section Margin", "slider", 0, {
                        min: 0,
                        max: 100,
                        step: 4,
                        unit: "px",
                      })
                    )}
                  </div>
                </InspectorGroup>
              </>
            )}
          </>
        )}

        {/* ════ NON-SECTION (ELEMENTS & WIDGETS) ════════════════════════════ */}
        {!isSection && (
          <>
            {activeTab === "content" && (
              <>
                {/* ── SECTION & GROUPING ──────────────────────────────────── */}
                <InspectorGroup title="Section & Hierarchy">
                  {document && onMoveToSection && (
                    <label className={styles.field}>
                      <Text className={styles.fieldLabel}>Pindahkan ke Section</Text>
                      <Select
                        size="small"
                        className="w-full"
                        value={parentSection?.id}
                        options={document.sections.map((s, idx) => ({
                          value: s.id,
                          label: `${idx + 1}. ${s.name}`,
                        }))}
                        onChange={(targetSecId) => {
                          if (targetSecId && targetSecId !== parentSection?.id) {
                            onMoveToSection(selectedNode.id, targetSecId);
                          }
                        }}
                      />
                    </label>
                  )}

                  {/* Grouping Controls */}
                  <div className="pt-1">
                    <Text className={styles.fieldLabel}>Grouping Elemen</Text>
                    {selectedNode.groupId ? (
                      <div className="flex flex-col gap-1.5 rounded-md border border-[#EAE5DF] bg-[#FFF8EE] p-2 mt-1">
                        <div className="flex items-center justify-between">
                          <Tag className="!mr-0 !text-[10px] !bg-white !text-[#422B1C] !border-[#EAE5DF]">
                            Tergabung dalam Grup
                          </Tag>
                          <span className="text-[10px] text-[#99918A]">
                            Bergerak sebagai satu kesatuan
                          </span>
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          {onUngroupElements && (
                            <Button
                              size="small"
                              danger
                              className="!text-xs flex-1"
                              onClick={() => onUngroupElements(selectedNode.groupId!)}
                            >
                              Ungroup Semua
                            </Button>
                          )}
                          {onRemoveFromGroup && (
                            <Button
                              size="small"
                              className="!text-xs flex-1"
                              onClick={() => onRemoveFromGroup(selectedNode.id)}
                            >
                              Keluarkan
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-1">
                        {onGroupElements && ungroupedSiblings.length > 0 && (
                          <Select
                            size="small"
                            className="w-full"
                            placeholder="Gabungkan (Group) dengan..."
                            value={null}
                            options={ungroupedSiblings.map((s) => ({
                              value: s.id,
                              label: `+ Group dengan: ${s.name}`,
                            }))}
                            onChange={(siblingId) => {
                              if (siblingId) {
                                onGroupElements([selectedNode.id, siblingId]);
                              }
                            }}
                          />
                        )}
                        {onAddToGroup && existingGroupIds.length > 0 && (
                          <Select
                            size="small"
                            className="w-full"
                            placeholder="Gabungkan ke Grup yang Ada..."
                            value={null}
                            options={existingGroupIds.map((gid) => ({
                              value: gid,
                              label: `Gabung ke Grup (${siblingElements.filter((s) => s.groupId === gid).length} elemen)`,
                            }))}
                            onChange={(gid) => {
                              if (gid) {
                                onAddToGroup(selectedNode.id, gid);
                              }
                            }}
                          />
                        )}
                        {!ungroupedSiblings.length && !existingGroupIds.length && (
                          <span className="text-[11px] text-[#9A7B60] italic block">
                            Tidak ada elemen lain di section ini untuk di-group.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </InspectorGroup>

                {/* ── ELEMENT-SPECIFIC CONTENT ──────────────────────────────── */}
            {isContainer && (
              <>
                <InspectorGroup title="Tata Letak Container">
                  {renderProperty(
                    field("display", "Display Mode", "segmented", "flex", {
                      options: [
                        { value: "flex", label: "Flexbox" },
                        { value: "grid", label: "Grid" },
                      ],
                    })
                  )}

                  {props.display !== "grid" ? (
                    <>
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("flexDirection", "Direction", "select", "column", {
                            options: [
                              { value: "column", label: "Column (Vertikal)" },
                              { value: "row", label: "Row (Horizontal)" },
                              { value: "column-reverse", label: "Col-Reverse" },
                              { value: "row-reverse", label: "Row-Reverse" },
                            ],
                          })
                        )}
                        {renderProperty(
                          field("flexWrap", "Flex Wrap", "segmented", "nowrap", {
                            options: [
                              { value: "nowrap", label: "No Wrap" },
                              { value: "wrap", label: "Wrap" },
                            ],
                          })
                        )}
                      </div>
                      {renderProperty(
                        field("justifyContent", "Justify Content", "select", "flex-start", {
                          options: [
                            { value: "flex-start", label: "Start" },
                            { value: "center", label: "Center" },
                            { value: "flex-end", label: "End" },
                            { value: "space-between", label: "Space Between" },
                            { value: "space-around", label: "Space Around" },
                            { value: "space-evenly", label: "Space Evenly" },
                          ],
                        })
                      )}
                      {renderProperty(
                        field("alignment", "Align Items", "select", "stretch", {
                          options: [
                            { value: "stretch", label: "Stretch" },
                            { value: "flex-start", label: "Start" },
                            { value: "center", label: "Center" },
                            { value: "flex-end", label: "End" },
                            { value: "baseline", label: "Baseline" },
                          ],
                        })
                      )}
                      {renderProperty(
                        field("gap", "Items Gap", "slider", 12, {
                          min: 0,
                          max: 100,
                          step: 2,
                          unit: "px",
                        })
                      )}
                    </>
                  ) : (
                    <>
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("gridColumns", "Columns (Kolom)", "slider", 2, {
                            min: 1,
                            max: 12,
                            step: 1,
                          })
                        )}
                        {renderProperty(
                          field("gridRows", "Rows (Baris)", "slider", 1, {
                            min: 1,
                            max: 12,
                            step: 1,
                          })
                        )}
                      </div>
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("columnGap", "Horizontal Gap", "slider", 12, {
                            min: 0,
                            max: 100,
                            step: 2,
                            unit: "px",
                          })
                        )}
                        {renderProperty(
                          field("rowGap", "Vertical Gap", "slider", 12, {
                            min: 0,
                            max: 100,
                            step: 2,
                            unit: "px",
                          })
                        )}
                      </div>
                      {renderProperty(
                        field("alignment", "Align Items", "select", "stretch", {
                          options: [
                            { value: "stretch", label: "Stretch" },
                            { value: "flex-start", label: "Start" },
                            { value: "center", label: "Center" },
                            { value: "flex-end", label: "End" },
                          ],
                        })
                      )}
                    </>
                  )}
                </InspectorGroup>

                <InspectorGroup title="Aksi Container">
                  {onAddElement && (
                    <Button
                      type="dashed"
                      block
                      className="!text-xs !border-[#EAE5DF] !text-[#FFAD38] font-medium hover:!border-[#FFAD38] hover:!text-[#F5A623]"
                      onClick={() => {
                        onAddElement("container", parentSection?.id, selectedNode.id);
                      }}
                    >
                      + Tambah Nested Container
                    </Button>
                  )}
                </InspectorGroup>
              </>
            )}

            {isHeading && (
              <InspectorGroup title="Heading Content">
                {renderProperty(field("text", "Heading Text", "textarea", "Judul Heading"))}
                <div className={styles.fieldGrid}>
                  {renderProperty(
                    field("tag", "HTML Tag", "select", "h2", {
                      options: [
                        { value: "h1", label: "H1 - Utama" },
                        { value: "h2", label: "H2 - Sekunder" },
                        { value: "h3", label: "H3 - Tersier" },
                        { value: "h4", label: "H4 - Sub" },
                        { value: "h5", label: "H5 - Kecil" },
                        { value: "h6", label: "H6 - Terkecil" },
                      ],
                    })
                  )}
                  {renderProperty(
                    field("alignment", "Alignment", "select", "left", {
                      options: [
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                        { value: "justify", label: "Justify" },
                      ],
                    })
                  )}
                </div>
              </InspectorGroup>
            )}

            {isSpacer && (
              <InspectorGroup title="Spacer Height">
                {renderProperty(
                  field("height", "Tinggi Spacer", "slider", 32, {
                    min: 8,
                    max: 240,
                    step: 4,
                    unit: "px",
                  })
                )}
              </InspectorGroup>
            )}

            {isIcon && (
              <InspectorGroup title="Icon Settings">
                {renderProperty(
                  field("iconName", "Pilih Ikon", "select", "heart", {
                    options: [
                      { value: "heart", label: "Heart (Cinta)" },
                      { value: "star", label: "Star (Bintang)" },
                      { value: "calendar", label: "Calendar (Tanggal)" },
                      { value: "map-pin", label: "Map Pin (Lokasi)" },
                      { value: "gift", label: "Gift (Hadiah)" },
                      { value: "music", label: "Music (Musik)" },
                      { value: "check", label: "Check (Centang)" },
                      { value: "mail", label: "Mail (Surat)" },
                      { value: "phone", label: "Phone (Telepon)" },
                      { value: "info", label: "Info (Informasi)" },
                      { value: "smile", label: "Smile (Senyum)" },
                    ],
                  })
                )}
                <div className={styles.fieldGrid}>
                  {renderProperty(
                    field("iconSize", "Ukuran Ikon", "slider", 32, {
                      min: 12,
                      max: 128,
                      step: 2,
                      unit: "px",
                    })
                  )}
                  {renderProperty(
                    field("alignment", "Alignment", "select", "center", {
                      options: [
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                      ],
                    })
                  )}
                </div>
              </InspectorGroup>
            )}

            {isText && (
              <InspectorGroup title="Content">
                {renderProperty(field("text", "Text Content", "textarea", ""))}
              </InspectorGroup>
            )}

            {isButton && (
              <InspectorGroup title="Button Content">
                {renderProperty(field("label", "Label", "text", "Button"))}
                {renderProperty(field("url", "Link URL", "text", "#"))}
                {renderProperty(
                  field("buttonSize", "Size Preset", "segmented", "medium", {
                    options: [
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ],
                  })
                )}
              </InspectorGroup>
            )}

            {isImage && !isGallery && (
              <InspectorGroup title="Image Source">
                {renderProperty(field("src", "Image URL", "text", ""))}
                {renderProperty(field("alt", "Alt Text", "text", ""))}
                {onOpenAssets && (
                  <Button
                    size="small"
                    block
                    icon={<FolderOpenOutlined />}
                    onClick={() => onOpenAssets("src", "Pilih Gambar Elemen")}
                  >
                    Browse Assets
                  </Button>
                )}
                <div className={styles.fieldGrid}>
                  {renderProperty(
                    field("objectFit", "Fit", "select", "cover", {
                      options: [
                        "cover",
                        "contain",
                        "fill",
                        "none",
                        "scale-down",
                      ].map((v) => ({
                        value: v,
                        label: v[0].toUpperCase() + v.slice(1),
                      })),
                    })
                  )}
                  {renderProperty(
                    field("aspectRatio", "Aspect Ratio", "select", "auto", {
                      options: aspectRatioOptions,
                    })
                  )}
                </div>
                {renderProperty(
                  field(
                    "objectPosition",
                    "Focal Point",
                    "select",
                    "center center",
                    { options: focalPointOptions }
                  )
                )}
              </InspectorGroup>
            )}

            {isGallery && (
              <InspectorGroup title="Gallery Settings">
                {renderProperty(
                  field("galleryLayout", "Layout", "select", "grid-2", {
                    options: [
                      { value: "grid-2", label: "Grid 2 col" },
                      { value: "grid-3", label: "Grid 3 col" },
                      { value: "masonry", label: "Masonry" },
                      { value: "carousel", label: "Carousel" },
                    ],
                  })
                )}
                {renderProperty(
                  field("imageCount", "Count", "number", 4, {
                    min: 1,
                    max: 12,
                    step: 1,
                  })
                )}
              </InspectorGroup>
            )}

            {isVideo && (
              <InspectorGroup title="Video Source">
                {renderProperty(field("src", "Video URL", "text", ""))}
                {renderProperty(field("poster", "Poster URL", "text", ""))}
                {renderProperty(
                  field("aspectRatio", "Aspect Ratio", "select", "16/9", {
                    options: aspectRatioOptions,
                  })
                )}
                {onOpenAssets && (
                  <Button
                    size="small"
                    block
                    icon={<FolderOpenOutlined />}
                    onClick={() => onOpenAssets("src", "Pilih Video Elemen")}
                  >
                    Browse Assets
                  </Button>
                )}
                <div className={styles.checkboxRow}>
                  {renderProperty(field("controls", "Controls", "checkbox", true))}
                  {renderProperty(field("autoplay", "Autoplay", "checkbox", false))}
                  {renderProperty(field("muted", "Muted", "checkbox", true))}
                  {renderProperty(field("loop", "Loop", "checkbox", false))}
                </div>
              </InspectorGroup>
            )}

            {isDivider && (
              <InspectorGroup title="Divider Settings">
                <div className={styles.fieldGrid}>
                  {renderProperty(
                    field("width", "Width (%)", "slider", 80, {
                      min: 10,
                      max: 100,
                      step: 5,
                      unit: "%",
                    })
                  )}
                  {renderProperty(
                    field("thickness", "Thickness", "slider", 1, {
                      min: 1,
                      max: 20,
                      step: 1,
                      unit: "px",
                    })
                  )}
                </div>
                {isCustomStyle ? (
                  renderProperty(field("color", "Divider Color", "color", "#d9dce3"))
                ) : (
                  <div className="flex items-center justify-between p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded">
                    <span className="text-[11px] text-[#99918A]">
                      Color (Inherited from section)
                    </span>
                    <span className={styles.inheritedBadge}>
                      {sectionPrimaryColor || sectionTextColor}
                    </span>
                  </div>
                )}
              </InspectorGroup>
            )}

            {/* ── WIDGET SPECIFIC CONFIGURATION ─────────────────────────── */}
            {isWidget && (
              <>
                {selectedNode.widgetType === "cover" && (
                  <InspectorGroup title="Konfigurasi Cover & Hero">
                    {renderProperty(
                      field("coupleTitle", "Nama Mempelai", "text", "MOGRAN & LAURA")
                    )}
                    {renderProperty(
                      field("title", "Tagline / Judul Atas", "text", "Two Hearts, One Journey")
                    )}
                    {renderProperty(
                      field("subtitle", "Pesan Pembuka", "textarea", "With joyful hearts, we invite you...")
                    )}
                    {renderProperty(
                      field("dateText", "Hari & Tanggal", "text", "Senin, 28 Desember 2026")
                    )}
                    {renderProperty(
                      field("imageUrl", "URL Foto Cover", "text", "/templates/wedding/couple-main.jpg")
                    )}
                    {onOpenAssets && (
                      <Button
                        size="small"
                        block
                        icon={<FolderOpenOutlined />}
                        className="!mt-1"
                        onClick={() => onOpenAssets("imageUrl", "Pilih Foto Cover")}
                      >
                        Pilih dari Aset
                      </Button>
                    )}
                  </InspectorGroup>
                )}

                {(selectedNode.widgetType === "story" || selectedNode.widgetType === "love_story") && (
                  <InspectorGroup title="Konfigurasi Story / Timeline">
                    {renderProperty(
                      field("title", "Judul Story", "text", "Our Love Story")
                    )}
                    {renderProperty(
                      field("subtitle", "Pesan Pengantar", "textarea", "Perjalanan cinta kami...")
                    )}
                    <div className="p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded text-[11px] text-[#99918A] leading-tight">
                      Milestone perjalanan cinta dirender dalam format timeline vertikal yang rapi.
                    </div>
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "countdown" && (
                  <InspectorGroup title="Konfigurasi Countdown">
                    {renderProperty(
                      field("title", "Judul", "text", "Menghitung Hari Bahagia")
                    )}
                    {renderProperty(
                      field(
                        "eventDate",
                        "Target Tanggal Acara",
                        "text",
                        "2026-12-28T09:00:00"
                      )
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "rsvp" && (
                  <InspectorGroup title="Konfigurasi RSVP">
                    <div className="p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded text-[11px] text-[#99918A] leading-tight mb-2">
                      Definisi field form dan validasi inti dikelola oleh sistem. Anda
                      dapat menyesuaikan label dan tampilan visualnya di sini.
                    </div>
                    {renderProperty(
                      field(
                        "title",
                        "Judul Form",
                        "text",
                        "Konfirmasi Kehadiran (RSVP)"
                      )
                    )}
                    {renderProperty(
                      field("subtitle", "Pesan Pengantar", "text", "")
                    )}
                    {renderProperty(
                      field(
                        "buttonLabel",
                        "Label Tombol Kirim",
                        "text",
                        "Kirim Konfirmasi"
                      )
                    )}
                    {renderProperty(
                      field(
                        "showGuestCount",
                        "Tampilkan Opsi Jumlah Tamu",
                        "checkbox",
                        false
                      )
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "music" && (
                  <InspectorGroup title="Konfigurasi Musik Latar">
                    {renderProperty(
                      field(
                        "title",
                        "Judul Widget",
                        "text",
                        "Musik Latar Pernikahan"
                      )
                    )}
                    {renderProperty(
                      field("songTitle", "Judul Lagu", "text", "A Thousand Years")
                    )}
                    {renderProperty(
                      field(
                        "artistName",
                        "Nama Penyanyi",
                        "text",
                        "Christina Perri"
                      )
                    )}
                    {renderProperty(
                      field("audioUrl", "URL File Audio (MP3)", "text", "")
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "digital_gift" && (
                  <InspectorGroup title="Konfigurasi Digital Gift">
                    {renderProperty(
                      field(
                        "title",
                        "Judul Widget",
                        "text",
                        "Tanda Kasih (Digital Gift)"
                      )
                    )}
                    {renderProperty(
                      field("subtitle", "Pesan Pengantar", "textarea", "")
                    )}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("bankName", "Nama Bank / E-Wallet", "text", "BCA")
                      )}
                      {renderProperty(
                        field(
                          "accountNumber",
                          "Nomor Rekening",
                          "text",
                          "1234 5678 90"
                        )
                      )}
                    </div>
                    {renderProperty(
                      field(
                        "accountHolder",
                        "Nama Pemilik Rekening",
                        "text",
                        "Mogran & Laura"
                      )
                    )}
                    {renderProperty(
                      field(
                        "showCopyButton",
                        "Tombol Salin Rekening",
                        "checkbox",
                        true
                      )
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "event_details" && (
                  <InspectorGroup title="Konfigurasi Event Details">
                    {renderProperty(
                      field("title", "Judul Acara", "text", "Waktu & Tempat Acara")
                    )}
                    {renderProperty(
                      field("badge", "Badge / Label Acara", "text", "Akad & Resepsi")
                    )}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field(
                          "dateText",
                          "Tanggal Acara",
                          "text",
                          "Senin, 28 Desember 2026"
                        )
                      )}
                      {renderProperty(
                        field(
                          "timeText",
                          "Waktu Acara",
                          "text",
                          "08.00 - 13.00 WIB"
                        )
                      )}
                    </div>
                    {renderProperty(
                      field(
                        "placeName",
                        "Nama Gedung / Venue",
                        "text",
                        "Grand Ballroom Hotel Mulia"
                      )
                    )}
                    {renderProperty(
                      field(
                        "address",
                        "Alamat Lengkap",
                        "textarea",
                        "Jl. Asia Afrika, Senayan, Jakarta Pusat"
                      )
                    )}
                    {renderProperty(
                      field("mapUrl", "URL Google Maps", "text", "https://maps.google.com")
                    )}

                    <div className="mt-3 pt-3 border-t border-[#EAE5DF]">
                      <span className="text-xs font-semibold text-[#422B1C] block mb-1.5">
                        Kustomisasi Field Mandiri (Individual Field)
                      </span>
                      <div className="mb-2">
                        <Select
                          size="small"
                          className="w-full"
                          value={activeEventSubField}
                          onChange={(val) => {
                            setActiveEventSubField(val);
                            if (onSubFieldChange) onSubFieldChange(val);
                          }}
                          options={[
                            { value: "title", label: "Judul Acara (Title)" },
                            { value: "badge", label: "Badge / Label" },
                            { value: "dateText", label: "Tanggal Acara (Date)" },
                            { value: "timeText", label: "Waktu Acara (Time)" },
                            { value: "placeName", label: "Nama Gedung (Venue)" },
                            { value: "address", label: "Alamat Lengkap (Address)" },
                            { value: "mapButton", label: "Tombol Peta (Map Button)" },
                          ]}
                        />
                      </div>
                      <div className="space-y-2 p-2.5 rounded-md bg-[#F7F6F4] border border-[#EAE5DF]">
                        {renderProperty(
                          field(
                            `${activeEventSubField}_visible`,
                            `Tampilkan ${activeEventSubField}`,
                            "checkbox",
                            true
                          )
                        )}
                        <div className={styles.fieldGrid}>
                          {renderProperty(
                            field(
                              `${activeEventSubField}_fontSize`,
                              "Ukuran Font (px)",
                              "number",
                              14,
                              { min: 8, max: 72, step: 1, unit: "px" }
                            )
                          )}
                          {renderProperty(
                            field(
                              `${activeEventSubField}_color`,
                              "Warna Teks Field",
                              "color",
                              "#422B1C"
                            )
                          )}
                        </div>
                        {renderProperty(
                          field(
                            `${activeEventSubField}_fontFamily`,
                            "Font Family",
                            "select",
                            "",
                            { options: allFontOptions }
                          )
                        )}
                        <div className={styles.fieldGrid}>
                          {renderProperty(
                            field(
                              `${activeEventSubField}_fontWeight`,
                              "Ketebalan Font",
                              "select",
                              "normal",
                              {
                                options: [
                                  { value: "normal", label: "Normal (400)" },
                                  { value: "500", label: "Medium (500)" },
                                  { value: "600", label: "Semi Bold (600)" },
                                  { value: "bold", label: "Bold (700)" },
                                ],
                              }
                            )
                          )}
                          {renderProperty(
                            field(
                              `${activeEventSubField}_alignment`,
                              "Alignment",
                              "segmented",
                              "left",
                              {
                                options: [
                                  { value: "left", label: "Left" },
                                  { value: "center", label: "Center" },
                                  { value: "right", label: "Right" },
                                ],
                              }
                            )
                          )}
                        </div>
                        <div className={styles.fieldGrid}>
                          {renderProperty(
                            field(
                              `${activeEventSubField}_spacing`,
                              "Spacing Bawah (px)",
                              "number",
                              0,
                              { min: 0, max: 48, step: 1, unit: "px" }
                            )
                          )}
                          {renderProperty(
                            field(
                              `${activeEventSubField}_padding`,
                              "Padding (px)",
                              "number",
                              0,
                              { min: 0, max: 48, step: 1, unit: "px" }
                            )
                          )}
                        </div>
                        <div className={styles.fieldGrid}>
                          {renderProperty(
                            field(
                              `${activeEventSubField}_margin`,
                              "Margin (px)",
                              "number",
                              0,
                              { min: 0, max: 48, step: 1, unit: "px" }
                            )
                          )}
                          {renderProperty(
                            field(
                              `${activeEventSubField}_width`,
                              "Lebar / Width",
                              "text",
                              "auto"
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "gallery" && (
                  <InspectorGroup title="Konfigurasi Galeri Foto">
                    {renderProperty(
                      field("title", "Judul Galeri", "text", "Galeri Foto Bahagia")
                    )}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field(
                          "galleryLayout",
                          "Tata Letak (Layout)",
                          "select",
                          "grid-2",
                          {
                            options: [
                              { value: "grid-2", label: "Grid 2 Kolom" },
                              { value: "grid-3", label: "Grid 3 Kolom" },
                              { value: "carousel", label: "Carousel Slider" },
                              { value: "masonry", label: "Masonry" },
                            ],
                          }
                        )
                      )}
                      {renderProperty(
                        field("columns", "Jumlah Kolom", "select", 2, {
                          options: [
                            { value: 2, label: "2 Kolom" },
                            { value: 3, label: "3 Kolom" },
                            { value: 4, label: "4 Kolom" },
                          ],
                        })
                      )}
                    </div>
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("imageCount", "Jumlah Foto", "slider", 4, {
                          min: 1,
                          max: 12,
                          step: 1,
                        })
                      )}
                      {renderProperty(
                        field("aspectRatio", "Rasio Foto", "select", "1/1", {
                          options: aspectRatioOptions,
                        })
                      )}
                    </div>
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "guestbook" && (
                  <InspectorGroup title="Konfigurasi Buku Tamu">
                    <div className="p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded text-[11px] text-[#99918A] leading-tight mb-2">
                      Penyimpanan pesan dan validasi formulir dikelola otomatis oleh
                      sistem. Anda dapat menyesuaikan label teks dan tampilan di bawah.
                    </div>
                    {renderProperty(
                      field("title", "Judul Buku Tamu", "text", "Buku Tamu & Doa Restu")
                    )}
                    {renderProperty(
                      field("subtitle", "Pesan Pengantar", "text", "")
                    )}
                    {renderProperty(
                      field("buttonLabel", "Label Tombol Kirim", "text", "Kirim Ucapan")
                    )}
                    {renderProperty(
                      field(
                        "showCount",
                        "Tampilkan Jumlah Pesan",
                        "checkbox",
                        true
                      )
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "maps" && (
                  <InspectorGroup title="Konfigurasi Peta & Lokasi">
                    {renderProperty(
                      field("title", "Judul Lokasi", "text", "Lokasi Acara")
                    )}
                    {renderProperty(
                      field(
                        "placeName",
                        "Nama Venue",
                        "text",
                        "Grand Ballroom Hotel Mulia"
                      )
                    )}
                    {renderProperty(
                      field(
                        "address",
                        "Alamat Venue",
                        "textarea",
                        "Jl. Asia Afrika, Senayan, Jakarta Pusat"
                      )
                    )}
                    {renderProperty(
                      field("mapUrl", "Link Google Maps", "text", "https://maps.google.com")
                    )}
                    {renderProperty(
                      field(
                        "buttonLabel",
                        "Label Tombol Navigasi",
                        "text",
                        "Buka Petunjuk Arah"
                      )
                    )}
                  </InspectorGroup>
                )}

                {selectedNode.widgetType === "video_greeting" && (
                  <InspectorGroup title="Konfigurasi Video Greeting">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="!text-[10px] !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30 font-medium">
                        Add-on
                      </Tag>
                      <span className="text-[11px] text-[#99918A]">
                        Fitur add-on video pesan bahagia
                      </span>
                    </div>
                    {renderProperty(
                      field("title", "Judul Video", "text", "Video Momen Bahagia")
                    )}
                    {renderProperty(
                      field("src", "URL Video (MP4 / WebM)", "text", "")
                    )}
                    {renderProperty(
                      field("poster", "URL Thumbnail / Poster", "text", "")
                    )}
                    {renderProperty(
                      field("aspectRatio", "Rasio Video", "select", "16/9", {
                        options: aspectRatioOptions,
                      })
                    )}
                    <div className={styles.checkboxRow}>
                      {renderProperty(
                        field("controls", "Tampilkan Kontrol", "checkbox", true)
                      )}
                      {renderProperty(
                        field("autoplay", "Putar Otomatis", "checkbox", false)
                      )}
                    </div>
                  </InspectorGroup>
                )}
              </>
            )}

            {isWidget && widgetContentFields.length > 0 && (
              <InspectorGroup title="Additional Props" collapsible defaultCollapsed>
                {widgetContentFields.map(renderProperty)}
              </InspectorGroup>
            )}

              </>
            )}

            {/* ════ STYLE TAB (VISUALS, TYPOGRAPHY, COLORS, SPACING) ════ */}
            {activeTab === "style" && (
              <>
                {/* ── STYLE MODE SELECTOR ───────────────────────────────────── */}
                <div className={styles.styleModeContainer}>
                  <div className={styles.styleModeHeader}>
                    <span className={styles.styleModeLabel}>Styling Mode</span>
                    <span
                      className={`${styles.styleModeBadge} ${
                        isCustomStyle
                          ? styles.styleModeBadgeCustom
                          : styles.styleModeBadgeInherit
                      }`}
                    >
                      {isCustomStyle ? "Custom Style" : "Follow Section"}
                    </span>
                  </div>
                  <Segmented
                    block
                    size="small"
                    value={isCustomStyle ? "custom" : "inherit"}
                    className={styles.segmentedControl}
                    onChange={(val) =>
                      onUpdateProp(selectedNode.id, "styleMode", val)
                    }
                    options={[
                      {
                        value: "inherit",
                        label: "Follow Section",
                        icon: <LinkOutlined />,
                      },
                      {
                        value: "custom",
                        label: "Custom Style",
                        icon: <FormatPainterOutlined />,
                      },
                    ]}
                  />
                  {!isCustomStyle && (
                    <div className={styles.inheritedNotice}>
                      <span className={styles.inheritedDot} />
                      <span>
                        Linked to <strong>{parentSection?.name || "Section"}</strong>.
                        Typography ({sectionFontFamily.split(",")[0]}) and colors are
                        synced with the section.
                      </span>
                    </div>
                  )}
                </div>

                {/* ── TYPOGRAPHY (for heading, text, button, widget) ───────── */}
                {(isHeading || isText || isButton || isWidget) && (
                  <InspectorGroup title="Typography">
                    {/* Font Family */}
                    {isCustomStyle ? (
                      <label className={styles.field}>
                        <Text className={styles.fieldLabel}>Font Family</Text>
                        <Select
                          size="small"
                          className="w-full"
                          value={String(props.fontFamily || BUILDER_FONT_FAMILIES[0].value)}
                          options={allFontOptions}
                          onChange={(font) =>
                            onUpdateProp(selectedNode.id, "fontFamily", font)
                          }
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded mb-1">
                        <span className="text-[11px] text-[#99918A]">
                          Font: <strong>{sectionFontFamily.split(",")[0]}</strong>
                        </span>
                        <span className={styles.inheritedBadge}>Section</span>
                      </div>
                    )}

                    {/* Font Size & Weight */}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("fontSize", "Size", "slider", isHeading ? 28 : isButton ? 16 : 18, {
                          min: 8,
                          max: 120,
                          step: 1,
                          unit: "px",
                        })
                      )}
                      {renderProperty(
                        field("fontWeight", "Weight", "select", isHeading ? 700 : isButton ? 600 : 400, {
                          options: [300, 400, 500, 600, 700, 800].map((v) => ({
                            value: v,
                            label: String(v),
                          })),
                        })
                      )}
                    </div>

                    {/* Text Alignment */}
                    <label className={styles.field}>
                      <Text className={styles.fieldLabel}>Alignment</Text>
                      <Segmented
                        block
                        size="small"
                        className={styles.segmentedControl}
                        value={String(props.alignment || "left")}
                        options={[
                          { value: "left", icon: <AlignLeftOutlined /> },
                          { value: "center", icon: <AlignCenterOutlined /> },
                          { value: "right", icon: <AlignRightOutlined /> },
                          { value: "justify", label: "Justify" },
                        ]}
                        onChange={(val) =>
                          onUpdateProp(selectedNode.id, "alignment", val)
                        }
                      />
                    </label>

                    {/* Line Height & Letter Spacing */}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("lineHeight", "Line Height", "slider", 1.4, {
                          min: 0.8,
                          max: 3.0,
                          step: 0.1,
                        })
                      )}
                      {renderProperty(
                        field("letterSpacing", "Letter Spacing", "slider", 0, {
                          min: -2,
                          max: 20,
                          step: 0.5,
                          unit: "px",
                        })
                      )}
                    </div>

                    {/* Text Transform & Decoration */}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("textTransform", "Transform", "select", "none", {
                          options: [
                            { value: "none", label: "None" },
                            { value: "uppercase", label: "UPPER" },
                            { value: "lowercase", label: "lower" },
                            { value: "capitalize", label: "Capitalize" },
                          ],
                        })
                      )}
                      {renderProperty(
                        field("textDecoration", "Decoration", "select", "none", {
                          options: [
                            { value: "none", label: "None" },
                            { value: "underline", label: "Underline" },
                            { value: "line-through", label: "Line-through" },
                          ],
                        })
                      )}
                    </div>

                    {renderProperty(
                      field("textWrap", "Text Wrap", "select", "wrap", {
                        options: [
                          { value: "wrap", label: "Wrap (Default)" },
                          { value: "nowrap", label: "No Wrap" },
                          { value: "balance", label: "Balance" },
                        ],
                      })
                    )}
                  </InspectorGroup>
                )}

                {/* ── COLOR & FILL ──────────────────────────────────────────── */}
                <InspectorGroup title="Color & Fill">
                  {(isHeading || isText || isButton) && (
                    <>
                      {isCustomStyle ? (
                        renderProperty(
                          field(
                            "color",
                            "Text Color",
                            "color",
                            isButton ? "#ffffff" : isHeading ? "#1f2937" : "#20242c"
                          )
                        )
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded mb-1">
                          <span className="text-[11px] text-[#99918A]">
                            Text Color: <strong>{sectionTextColor}</strong>
                          </span>
                          <span className={styles.inheritedBadge}>Section</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Background Color / Fill */}
                  {isCustomStyle || (!isButton && !isDivider) ? (
                    renderProperty(
                      field(
                        "backgroundColor",
                        isButton
                          ? "Button Fill Color"
                          : isContainer
                          ? "Container Background"
                          : "Background Color",
                        "color",
                        isButton ? "#4f46e5" : isShape ? "#e9eaf0" : "transparent"
                      )
                    )
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-[#F7F6F4] border border-[#EAE5DF] rounded mb-1">
                      <span className="text-[11px] text-[#99918A]">
                        Button Fill (Section Accent)
                      </span>
                      <span className={styles.inheritedBadge}>
                        {sectionPrimaryColor}
                      </span>
                    </div>
                  )}

                  {/* Opacity */}
                  {renderProperty(
                    field("opacity", "Opacity", "slider", 100, {
                      min: 0,
                      max: 100,
                      step: 1,
                      unit: "%",
                    })
                  )}
                </InspectorGroup>

                {/* ── SPACING (MARGIN & PADDING) ─────────────────────────────── */}
                <InspectorGroup title="Pengaturan Spacing Elemen">
                  <div className="mb-2">
                    <Text className="text-[11px] text-[#99918A] block mb-1">Preset Spacing Elemen</Text>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "marginTop", 4);
                          onUpdateProp(selectedNode.id, "marginBottom", 4);
                          onUpdateProp(selectedNode.id, "marginLeft", 0);
                          onUpdateProp(selectedNode.id, "marginRight", 0);
                          onUpdateProp(selectedNode.id, "margin", 4);
                        }}
                      >
                        Compact
                      </Button>
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "marginTop", 12);
                          onUpdateProp(selectedNode.id, "marginBottom", 12);
                          onUpdateProp(selectedNode.id, "marginLeft", 0);
                          onUpdateProp(selectedNode.id, "marginRight", 0);
                          onUpdateProp(selectedNode.id, "margin", 12);
                        }}
                      >
                        Normal
                      </Button>
                      <Button
                        size="small"
                        className="!text-[11px] !h-7 !border-[#EAE5DF] hover:!border-[#FFAD38] hover:!text-[#FFAD38]"
                        onClick={() => {
                          onUpdateProp(selectedNode.id, "marginTop", 24);
                          onUpdateProp(selectedNode.id, "marginBottom", 24);
                          onUpdateProp(selectedNode.id, "marginLeft", 0);
                          onUpdateProp(selectedNode.id, "marginRight", 0);
                          onUpdateProp(selectedNode.id, "margin", 24);
                        }}
                      >
                        Spacious
                      </Button>
                    </div>
                  </div>

                  {/* Vertical Spacing (Margin Top & Bottom) */}
                  <div className="pt-1">
                    <Text className="text-[11px] font-semibold text-[#422B1C] block mb-1.5">Vertical Spacing (Margin Atas & Bawah)</Text>
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("marginTop", "Margin Atas", "number", Number(props.marginTop ?? props.margin ?? 0), {
                          min: -100,
                          max: 200,
                          unit: "px",
                        })
                      )}
                      {renderProperty(
                        field("marginBottom", "Margin Bawah", "number", Number(props.marginBottom ?? props.margin ?? 0), {
                          min: -100,
                          max: 200,
                          unit: "px",
                        })
                      )}
                    </div>
                  </div>

                  {/* Horizontal Spacing (Margin Left & Right) */}
                  <div className="pt-1">
                    <Text className="text-[11px] font-semibold text-[#422B1C] block mb-1.5">Horizontal Spacing (Margin Kiri & Kanan)</Text>
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("marginLeft", "Margin Kiri", "number", Number(props.marginLeft ?? props.margin ?? 0), {
                          min: -100,
                          max: 200,
                          unit: "px",
                        })
                      )}
                      {renderProperty(
                        field("marginRight", "Margin Kanan", "number", Number(props.marginRight ?? props.margin ?? 0), {
                          min: -100,
                          max: 200,
                          unit: "px",
                        })
                      )}
                    </div>
                  </div>

                  {/* Element Padding */}
                  <div className="pt-1">
                    <Text className="text-[11px] font-semibold text-[#422B1C] block mb-1.5">Element Padding (Jarak Dalam)</Text>
                    {renderProperty(
                      field("padding", "Padding (Uniform)", "slider", 0, {
                        min: 0,
                        max: 100,
                        step: 2,
                        unit: "px",
                      })
                    )}
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("paddingTop", "Padding Top", "number", Number(props.paddingTop ?? props.padding ?? 0), {
                          min: 0,
                          max: 100,
                          unit: "px",
                        })
                      )}
                      {renderProperty(
                        field("paddingBottom", "Padding Bottom", "number", Number(props.paddingBottom ?? props.padding ?? 0), {
                          min: 0,
                          max: 100,
                          unit: "px",
                        })
                      )}
                    </div>
                    <div className={styles.fieldGrid}>
                      {renderProperty(
                        field("paddingLeft", "Padding Left", "number", Number(props.paddingLeft ?? props.padding ?? 0), {
                          min: 0,
                          max: 100,
                          unit: "px",
                        })
                      )}
                      {renderProperty(
                        field("paddingRight", "Padding Right", "number", Number(props.paddingRight ?? props.padding ?? 0), {
                          min: 0,
                          max: 100,
                          unit: "px",
                        })
                      )}
                    </div>
                  </div>

                  {/* Alignment & Flex Justification for Element */}
                  <div className="pt-2 border-t border-[#EAE5DF]">
                    <Text className="text-[11px] font-semibold text-[#422B1C] block mb-1.5">Alignment Posisi Elemen</Text>
                    {renderProperty(
                      field("alignment", "Text / Self Alignment", "segmented", "left", {
                        options: [
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                          { value: "justify", label: "Justify" },
                        ],
                      })
                    )}
                    {renderProperty(
                      field("alignSelf", "Align Self (Flex Layout)", "segmented", "auto", {
                        options: [
                          { value: "auto", label: "Auto" },
                          { value: "flex-start", label: "Start" },
                          { value: "center", label: "Center" },
                          { value: "flex-end", label: "End" },
                          { value: "stretch", label: "Stretch" },
                        ],
                      })
                    )}
                  </div>
                </InspectorGroup>

                {/* ── BORDER & SHADOW ───────────────────────────────────────── */}
                <InspectorGroup title="Border & Shadow" collapsible defaultCollapsed>
                  {renderProperty(borderFields[0])}
                  <div className={styles.fieldGrid}>
                    {renderProperty(borderFields[1])}
                    {renderProperty(borderFields[2])}
                  </div>
                  {renderProperty(borderFields[3])}
                  {renderProperty(
                    field("boxShadow", "Box Shadow", "select", "none", {
                      options: shadowOptions,
                    })
                  )}
                </InspectorGroup>
              </>
            )}

            {/* ════ ELEMENT / WIDGET ANIMATION TAB ════════════════════════ */}
            {activeTab === "animation" && (
              <>
                <InspectorGroup title="Pengaturan Animasi Elemen">
                  {/* Current Active Animation Badge */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#FFAD38] block">
                        Animasi Terpasang
                      </span>
                      <span className="text-xs font-semibold text-[#422B1C]">
                        {props.animationType && props.animationType !== "none"
                          ? String(props.animationType)
                          : "Belum Ada Animasi"}
                      </span>
                    </div>
                    {props.animationType && props.animationType !== "none" ? (
                      <Tag color="gold" className="!mr-0 !text-[11px] !font-medium !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30">
                        Aktif
                      </Tag>
                    ) : (
                      <Tag color="default" className="!mr-0 !text-[11px]">
                        Nonaktif
                      </Tag>
                    )}
                  </div>

                  {/* Animation Type selector */}
                  {renderProperty(
                    field("animationType", "Tipe Animasi", "select", "none", {
                      options: [
                        { value: "none", label: "None (Tidak Ada)" },
                        // Scroll / Entrance animations
                        { value: "fade_in", label: "Fade In (Masuk)" },
                        { value: "slide_up", label: "Slide In Up (Meluncur Naik)" },
                        { value: "slide_down", label: "Slide In Down (Meluncur Turun)" },
                        { value: "slide_left", label: "Slide In Left (Meluncur Kiri)" },
                        { value: "slide_right", label: "Slide In Right (Meluncur Kanan)" },
                        { value: "zoom_in", label: "Zoom In (Membesar)" },
                        { value: "zoom_out", label: "Zoom Out (Mengecil)" },
                        { value: "flip", label: "Flip 3D (Membalik)" },
                        { value: "rotate", label: "Rotate In (Memutar Masuk)" },
                        { value: "parallax", label: "Parallax Float (Mengambang)" },
                        // Exit animations
                        { value: "fade_out", label: "Fade Out (Keluar Memudar)" },
                        { value: "slide_out", label: "Slide Out (Keluar Meluncur)" },
                        // Functional & Emphasis animations
                        { value: "pulse", label: "Pulse (Denyut / CTA)" },
                        { value: "bounce", label: "Bounce (Memantul)" },
                        { value: "shake", label: "Shake (Getar / Penekanan)" },
                        { value: "subtle_hover", label: "Subtle Hover & Glow" },
                        { value: "countdown_tick", label: "Countdown Flip" },
                        { value: "music_vinyl_spin", label: "Vinyl Spin (Musik)" },
                        // Character & Motion
                        { value: "wedding_character_3d", label: "3D Wedding Character" },
                        { value: "motion_graphic", label: "Motion Graphic Monogram" },
                        { value: "animated_illustration", label: "Animated Illustration" },
                      ],
                    })
                  )}

                  {props.animationType && props.animationType !== "none" && (
                    <>
                      {/* Disable / Enable toggle */}
                      {renderProperty(
                        field("animationDisabled", "Matikan Animasi (Tampilan Statis)", "checkbox", false)
                      )}

                      {/* Trigger */}
                      {renderProperty(
                        field("animationTrigger", "Pemicu (Trigger)", "select", "on_scroll", {
                          options: [
                            { value: "on_scroll", label: "Saat Digulir ke Layar (On Scroll)" },
                            { value: "on_load", label: "Saat Halaman Dimuat (On Load)" },
                            { value: "continuous", label: "Terus Menerus (Continuous Loop)" },
                            { value: "on_click", label: "Saat Diklik (On Click)" },
                          ],
                        })
                      )}

                      {/* Duration & Delay */}
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("animationDuration", "Durasi (dtk)", "slider", 0.8, {
                            min: 0.2,
                            max: 6.0,
                            step: 0.1,
                            unit: "s",
                          })
                        )}
                        {renderProperty(
                          field("animationDelay", "Jeda/Delay (dtk)", "slider", 0, {
                            min: 0,
                            max: 3.0,
                            step: 0.1,
                            unit: "s",
                          })
                        )}
                      </div>

                      {/* Easing */}
                      {renderProperty(
                        field("animationEasing", "Kurva Kecepatan (Easing)", "select", "ease-in-out", {
                          options: [
                            { value: "ease", label: "Ease (Halus)" },
                            { value: "linear", label: "Linear (Konstan)" },
                            { value: "ease-in", label: "Ease In (Percepat di Awal)" },
                            { value: "ease-out", label: "Ease Out (Perlambat di Akhir)" },
                            { value: "ease-in-out", label: "Ease In Out (Mulus Alami)" },
                          ],
                        })
                      )}

                      {/* Repeat */}
                      {renderProperty(
                        field("animationRepeat", "Perulangan", "select", "once", {
                          options: [
                            { value: "once", label: "Satu Kali (Once)" },
                            { value: "infinite", label: "Berulang Terus (Infinite Loop)" },
                          ],
                        })
                      )}

                      {/* Intensity */}
                      {renderProperty(
                        field("animationIntensity", "Intensitas", "segmented", "normal", {
                          options: [
                            { value: "subtle", label: "Halus" },
                            { value: "normal", label: "Normal" },
                            { value: "high", label: "Tegas" },
                          ],
                        })
                      )}

                      {/* Actions: Preview & Remove */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="small"
                          icon={<PlayCircleOutlined />}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              const nodeEl = window.document.getElementById(selectedNode.id);
                              if (nodeEl) {
                                nodeEl.style.animation = "none";
                                void nodeEl.offsetWidth;
                                nodeEl.style.animation = "";
                              }
                            }
                          }}
                          className="!text-xs flex-1 !border-[#FFAD38] !text-[#422B1C] !font-medium hover:!bg-[#FFF8EE]"
                        >
                          Preview Animasi
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            onUpdateProp(selectedNode.id, "animationType", "none");
                            onUpdateProp(selectedNode.id, "animation", undefined as unknown as string);
                          }}
                          className="!text-xs"
                        >
                          Hapus
                        </Button>
                      </div>
                    </>
                  )}
                </InspectorGroup>
              </>
            )}

            {/* ════ ADVANCED & RESPONSIVE TAB ══════════════════════════════════ */}
            {activeTab === "advanced" && (
              <>
                {/* ── RESPONSIVE SYSTEM OVERVIEW ─────────────────────────────── */}
                <InspectorGroup title="Responsive: Design Once, Adapt Everywhere">
                  <div className="rounded-lg border border-[#EAE5DF] bg-[#FFF8EE] p-3 text-xs space-y-2 mb-2">
                    <div className="flex items-center justify-between font-semibold text-[#422B1C]">
                      <span>Device Aktif: <span className="uppercase text-[#FFAD38] font-bold">{device}</span></span>
                      {device === "desktop" ? (
                        <Tag className="!mr-0 !bg-[#F7F6F4] !text-[#422B1C] !border-[#EAE5DF]">Baseline Utama</Tag>
                      ) : (
                        <Tag className="!mr-0 !bg-[#FFF8EE] !text-[#FFAD38] !border-[#FFAD38]/30">Preview Adaptif</Tag>
                      )}
                    </div>
                    <p className="text-[11px] text-[#99918A] mb-0 leading-relaxed">
                      {device === "desktop"
                        ? "Desain pada Desktop otomatis berlaku di Tablet dan Mobile. Anda tidak perlu mendesain ulang untuk setiap layar."
                        : `Perubahan properti di bawah ini hanya berlaku sebagai penyesuaian khusus (override) untuk layar ${device.toUpperCase()}.`}
                    </p>
                  </div>

                  {/* Overrides Indicator & Reset All */}
                  {device !== "desktop" && (
                    <div className="flex items-center justify-between p-2 rounded bg-[#F7F6F4] border border-[#EAE5DF] mb-2">
                      <span className="text-[11px] text-[#99918A]">
                        Status:{" "}
                        {Object.keys(selectedNode.responsive?.[device]?.props || {}).length > 0 ? (
                          <strong className="text-[#FFAD38]">
                            {Object.keys(selectedNode.responsive?.[device]?.props || {}).length} properti di-override
                          </strong>
                        ) : (
                          <span className="text-[#258447]">Mewarisi Desktop</span>
                        )}
                      </span>
                      {Object.keys(selectedNode.responsive?.[device]?.props || {}).length > 0 && (
                        <Button
                          type="link"
                          size="small"
                          danger
                          className="!p-0 !text-[11px]"
                          onClick={() => {
                            const keys = Object.keys(selectedNode.responsive?.[device]?.props || {});
                            keys.forEach((k) => onResetProp(selectedNode.id, k));
                          }}
                        >
                          Reset Semua Override
                        </Button>
                      )}
                    </div>
                  )}
                </InspectorGroup>

                {/* ── POSITIONING & LAYERING (MVP 2 Section 10) ─────────────── */}
                <InspectorGroup title="Positioning & Layering">
                  {renderProperty(
                    field("position", "Position", "select", "static", {
                      options: [
                        { value: "static", label: "Static (Default)" },
                        { value: "relative", label: "Relative" },
                        { value: "absolute", label: "Absolute" },
                        { value: "fixed", label: "Fixed" },
                      ],
                    })
                  )}
                  {props.position && props.position !== "static" && (
                    <div className="space-y-2 pt-1 pb-1">
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("top", "Top", "number", 0, {
                            unit: "px",
                          })
                        )}
                        {renderProperty(
                          field("bottom", "Bottom", "number", 0, {
                            unit: "px",
                          })
                        )}
                      </div>
                      <div className={styles.fieldGrid}>
                        {renderProperty(
                          field("left", "Left", "number", 0, {
                            unit: "px",
                          })
                        )}
                        {renderProperty(
                          field("right", "Right", "number", 0, {
                            unit: "px",
                          })
                        )}
                      </div>
                    </div>
                  )}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("zIndex", "Z-Index", "number", 1, {
                        min: -10,
                        max: 9999,
                        step: 1,
                      })
                    )}
                    {renderProperty(
                      field("overflow", "Overflow", "select", "visible", {
                        options: [
                          { value: "visible", label: "Visible" },
                          { value: "hidden", label: "Hidden" },
                          { value: "scroll", label: "Scroll" },
                          { value: "auto", label: "Auto" },
                        ],
                      })
                    )}
                  </div>
                </InspectorGroup>

                {/* ── DIMENSIONS & SIZING ────────────────────────────────────── */}
                <InspectorGroup title="Dimensions & Sizing">
                  <div className={styles.fieldGrid}>
                    {renderSizeField("width", "Width", selectedNode.size.width, 10, "px")}
                    {renderSizeField("height", "Height", selectedNode.size.height, 10, "px")}
                  </div>

                  {/* Sizing Mode: fixed, hug, fill */}
                  <label className={styles.field}>
                    <Text className={styles.fieldLabel}>Sizing Mode</Text>
                    <Segmented
                      block
                      size="small"
                      className={styles.segmentedControl}
                      value={String(props.sizingMode || "fixed")}
                      options={[
                        { value: "fixed", label: "Fixed" },
                        { value: "hug", label: "Hug Content" },
                        { value: "fill", label: "Fill Container" },
                      ]}
                      onChange={(val) =>
                        onUpdateProp(selectedNode.id, "sizingMode", val)
                      }
                    />
                  </label>

                  {/* Min & Max Width / Height */}
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("minWidth", "Min W", "number", 0, {
                        min: 0,
                        max: 2000,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("maxWidth", "Max W", "number", 0, {
                        min: 0,
                        max: 2000,
                        unit: "px",
                      })
                    )}
                  </div>
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("minHeight", "Min H", "number", 0, {
                        min: 0,
                        max: 2000,
                        unit: "px",
                      })
                    )}
                    {renderProperty(
                      field("maxHeight", "Max H", "number", 0, {
                        min: 0,
                        max: 2000,
                        unit: "px",
                      })
                    )}
                  </div>
                </InspectorGroup>

                {/* ── POSITION & TRANSFORM ──────────────────────────────────── */}
                <InspectorGroup title="Position & Transform">
                  <div className={styles.fieldGrid}>
                    {renderPositionField("x", "Position X")}
                    {renderPositionField("y", "Position Y")}
                  </div>
                  <div className={styles.fieldGrid}>
                    {renderProperty(
                      field("rotation", "Rotation", "slider", 0, {
                        min: -180,
                        max: 180,
                        step: 1,
                        unit: "°",
                      })
                    )}
                    {renderProperty(
                      field("alignSelf", "Align Self", "select", "auto", {
                        options: [
                          { value: "auto", label: "Auto" },
                          { value: "flex-start", label: "Start" },
                          { value: "center", label: "Center" },
                          { value: "flex-end", label: "End" },
                          { value: "stretch", label: "Stretch" },
                        ],
                      })
                    )}
                  </div>
                </InspectorGroup>
              </>
            )}
          </>
        )}

        {/* ════ RESPONSIVE BREAKPOINT RULES ══════════════════════════════ */}
        <InspectorGroup title="Responsive Breakpoint" collapsible defaultCollapsed>
          <div className={styles.responsiveHint}>
            <span className={styles.responsiveLabel}>Currently editing:</span>
            <span
              className={`${styles.devicePill} ${styles[`devicePill_${device}`]} inline-flex items-center gap-1`}
            >
              {device === "mobile" ? <MobileOutlined /> : device === "tablet" ? <TabletOutlined /> : <DesktopOutlined />}{" "}
              {device.toUpperCase()}
            </span>
          </div>
          <Text className={styles.hintText}>
            {device === "desktop"
              ? "Desktop adalah baseline utama. Desain dasar ini otomatis diwariskan ke Tablet dan Mobile."
              : `Sedang mengedit override ${device}. Properti yang diubah di sini berlaku khusus untuk tampilan ${device}. Properti tanpa override mewarisi nilai Desktop.`}
          </Text>
          {device !== "desktop" && (
            <div className="mt-2 rounded-md border border-[#EAE5DF] bg-[#FFF8EE] px-3 py-2">
              <Text className="block text-[11px] font-semibold text-[#FFAD38] mb-1 inline-flex items-center gap-1">
                {device === "tablet" ? <TabletOutlined /> : <MobileOutlined />} Mode Override {device.toUpperCase()} Aktif
              </Text>
              <Text className="block text-[11px] text-[#99918A]">
                Properti dengan tombol <strong>Reset</strong> memiliki nilai khusus perangkat ini.
                Klik Reset untuk mengembalikan ke nilai warisan Desktop.
              </Text>
            </div>
          )}
        </InspectorGroup>
      </div>
    </aside>
  );
}
