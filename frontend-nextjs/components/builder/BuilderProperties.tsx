"use client";

import React from "react";
import {
  Button,
  Checkbox,
  ColorPicker,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import {
  BUILDER_FONT_FAMILIES,
  BuilderDevice,
  BuilderNode,
  BuilderPropertyValue,
  getResponsiveOverride,
  getResponsivePosition,
  getResponsiveProps,
  getResponsiveSize,
} from "./model";
import { BUILDER_COLOR_PRESETS } from "./colorPalette";
import styles from "./BuilderProperties.module.css";

const { Text } = Typography;

export interface BuilderMetadata {
  name: string;
  slug: string;
  description: string;
  category_name: string;
  themeCategory: string;
  primaryColor: string;
  secondaryColor: string;
}

interface BuilderPropertiesProps {
  selectedNode: BuilderNode | null;
  metadata: BuilderMetadata;
  device: BuilderDevice;
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
  onOpenAssets?: () => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
}

type FieldControl =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "select"
  | "checkbox";

interface FieldDefinition {
  key: string;
  label: string;
  control: FieldControl;
  fallback: BuilderPropertyValue;
  options?: { label: string; value: string | number }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const alignmentOptions = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
];

const textAlignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
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
      <span className={styles.unit}>
        {unit}
      </span>
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
          options={definition.options}
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
          collapsible ? "cursor-pointer select-none py-1 hover:text-[#9A5A00]" : ""
        }`}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        <Text className={styles.groupTitle}>{title}</Text>
        {collapsible && (
          <span className="text-[10px] text-[#765D48]">
            {collapsed ? "+ Buka" : "− Tutup"}
          </span>
        )}
      </div>
      {!collapsed && children}
    </section>
  );
}

export function BuilderProperties({
  selectedNode,
  metadata,
  device,
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
}: BuilderPropertiesProps) {
  if (!selectedNode) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <Text strong className={styles.title}>Template</Text>
          <Text type="secondary" className={styles.subtitle}>Design settings</Text>
        </div>
        <div className={styles.scrollArea}>
          <section className={styles.group}>
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Name</Text>
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
          </section>
          <InspectorGroup title="Theme colors">
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Primary</Text>
              <ColorPicker
                value={getSafePickerColor(metadata.primaryColor)}
                presets={BUILDER_COLOR_PRESETS}
                onChange={(color) =>
                  onUpdateMetadata("primaryColor", color.toHexString())
                }
              />
            </label>
            <label className={styles.field}>
              <Text className={styles.fieldLabel}>Secondary</Text>
              <ColorPicker
                value={getSafePickerColor(metadata.secondaryColor)}
                presets={BUILDER_COLOR_PRESETS}
                onChange={(color) =>
                  onUpdateMetadata("secondaryColor", color.toHexString())
                }
              />
            </label>
          </InspectorGroup>
        </div>
      </aside>
    );
  }

  const isSection = selectedNode.kind === "section";
  const isTextOrButton =
    selectedNode.kind === "element" &&
    (selectedNode.elementType === "text" ||
      selectedNode.elementType === "button");
  const supportsOverlay =
    isSection ||
    (selectedNode.kind === "element" && selectedNode.elementType === "image");
  const props = getResponsiveProps(selectedNode, device);
  const position = getResponsivePosition(selectedNode, device);
  const size = getResponsiveSize(selectedNode, device);

  const backgrounds = [
    field("backgroundType", "Background type", "select", "solid", {
      options: [
        { value: "solid", label: "Solid color" },
        { value: "image", label: "Image" },
        { value: "gradient", label: "Gradient" },
      ],
    }),
    field("backgroundColor", "Background color", "color", "#ffffff"),
  ];
  if (props.backgroundType === "image") {
    backgrounds.push(
      field("backgroundImage", "Image URL", "text", "")
    );
  }
  if (props.backgroundType === "gradient") {
    backgrounds.push(
      field("backgroundImage", "Gradient", "select", "linear-gradient(135deg, #f8fafc, #e2e8f0)", {
        options: [
          {
            value: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
            label: "Soft neutral",
          },
          {
            value: "linear-gradient(135deg, #fdf2f8, #e0e7ff)",
            label: "Rose to indigo",
          },
          {
            value: "linear-gradient(135deg, #ecfdf5, #dbeafe)",
            label: "Mint to blue",
          },
        ],
      })
    );
  }

  const spacingFields = [
    field("padding", "Padding", "number", 0, { min: 0, max: 200, unit: "px" }),
    field("margin", "Margin", "number", 0, { min: 0, max: 200, unit: "px" }),
    field("gap", "Gap", "number", 0, { min: 0, max: 200, unit: "px" }),
  ];
  const layoutFields = [
    field("display", "Display", "select", "block", {
      options: [
        { value: "block", label: "Block" },
        { value: "flex", label: "Flex" },
        { value: "grid", label: "Grid" },
      ],
    }),
    field("flexDirection", "Flex direction", "select", "column", {
      options: [
        { value: "row", label: "Row" },
        { value: "column", label: "Column" },
      ],
    }),
    field("alignment", "Alignment", "select", isSection ? "stretch" : "center", {
      options: alignmentOptions,
    }),
    field("justify", "Justify", "select", "flex-start", {
      options: [
        { value: "flex-start", label: "Start" },
        { value: "center", label: "Center" },
        { value: "flex-end", label: "End" },
        { value: "space-between", label: "Space between" },
        { value: "space-around", label: "Space around" },
      ],
    }),
    field("position", "Position", "select", isSection ? "relative" : "absolute", {
      options: [
        { value: "relative", label: "Relative" },
        { value: "absolute", label: "Absolute" },
        { value: "static", label: "Static" },
      ],
    }),
  ];
  const activeLayoutFields = isTextOrButton
    ? layoutFields.filter((definition) => definition.key !== "alignment")
    : layoutFields;
  const borderFields = [
    field("borderWidth", "Border width", "number", 0, {
      min: 0,
      max: 32,
      unit: "px",
    }),
    field("borderColor", "Border color", "color", "#d9dce3"),
    field("borderStyle", "Border style", "select", "solid", {
      options: ["solid", "dashed", "dotted", "none"].map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
    }),
    field("borderRadius", "Corner radius", "number", 0, {
      min: 0,
      max: 100,
      unit: "px",
    }),
  ];
  const typographyFields = [
    field("fontFamily", "Font family", "select", "Arial, sans-serif", {
      options: [
        ...BUILDER_FONT_FAMILIES.map(({ value, label }) => ({ value, label })),
        ...fontOptions,
      ],
    }),
    field("fontSize", "Font size", "number", 16, {
      min: 8,
      max: 160,
      unit: "px",
    }),
    field("fontWeight", "Font weight", "select", 400, {
      options: [300, 400, 500, 600, 700].map((value) => ({
        value,
        label: String(value),
      })),
    }),
    field("lineHeight", "Line height", "number", 1.4, {
      min: 0.5,
      max: 4,
      step: 0.1,
    }),
    field("letterSpacing", "Letter spacing", "number", 0, {
      min: -10,
      max: 30,
      step: 0.1,
      unit: "px",
    }),
    field("alignment", "Text alignment", "select", "left", {
      options: textAlignmentOptions,
    }),
    field("color", "Text color", "color", "#20242c"),
    field("textDecoration", "Text decoration", "select", "none", {
      options: ["none", "underline", "line-through", "overline"].map(
        (value) => ({ value, label: value })
      ),
    }),
    field("textTransform", "Text transform", "select", "none", {
      options: ["none", "uppercase", "lowercase", "capitalize"].map(
        (value) => ({ value, label: value })
      ),
    }),
  ];
  const renderProperty = (definition: FieldDefinition) => {
    const value = props[definition.key] ?? definition.fallback;
    return (
      <PropertyControl
        key={definition.key}
        definition={definition}
        value={value}
        overridden={getResponsiveOverride(
          selectedNode,
          device,
          definition.key
        )}
        onChange={(next) =>
          onUpdateProp(selectedNode.id, definition.key, next)
        }
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

  const contentFields =
    selectedNode.kind === "element"
      ? selectedNode.elementType === "text"
        ? [field("text", "Text content", "textarea", "")]
        : selectedNode.elementType === "button"
          ? [
              field("label", "Button label", "text", "Button"),
              field("url", "Link URL", "text", ""),
            ]
          : selectedNode.elementType === "image"
            ? props.isGallery
              ? [
                  field("galleryLayout", "Layout Galeri", "select", "grid-2", {
                    options: [
                      { value: "grid-2", label: "Grid 2 Kolom" },
                      { value: "grid-3", label: "Grid 3 Kolom" },
                      { value: "masonry", label: "Masonry" },
                      { value: "carousel", label: "Carousel / Swipe" },
                    ],
                  }),
                  field("imageCount", "Jumlah Foto", "number", 4, {
                    min: 1,
                    max: 12,
                    step: 1,
                  }),
                ]
              : [
                  field("src", "Image URL", "text", ""),
                  field("alt", "Alt text", "text", ""),
                  field("objectFit", "Image fit", "select", "cover", {
                    options: ["cover", "contain", "fill"].map((value) => ({
                      value,
                      label: value[0].toUpperCase() + value.slice(1),
                    })),
                  }),
                  field("objectPosition", "Image position", "select", "center", {
                    options: ["center", "top", "bottom", "left", "right"].map(
                      (value) => ({ value, label: value })
                    ),
                  }),
                  field("aspectRatio", "Aspect ratio", "select", "auto", {
                    options: [
                      { value: "auto", label: "Free" },
                      { value: "1/1", label: "1:1" },
                      { value: "4/3", label: "4:3" },
                      { value: "3/2", label: "3:2" },
                      { value: "16/9", label: "16:9" },
                      { value: "9/16", label: "9:16" },
                    ],
                  }),
                ]
            : selectedNode.elementType === "video"
              ? [
                  field("src", "Video URL", "text", ""),
                  field("title", "Video title", "text", ""),
                  field("poster", "Poster image URL", "text", ""),
                  field("aspectRatio", "Aspect ratio", "select", "auto", {
                    options: [
                      { value: "auto", label: "Free" },
                      { value: "1/1", label: "1:1" },
                      { value: "4/3", label: "4:3" },
                      { value: "3/2", label: "3:2" },
                      { value: "16/9", label: "16:9" },
                      { value: "9/16", label: "9:16" },
                    ],
                  }),
                  field("autoplay", "Autoplay", "checkbox", false),
                  field("muted", "Muted", "checkbox", true),
                  field("loop", "Loop", "checkbox", false),
                  field("controls", "Show controls", "checkbox", true),
                ]
              : selectedNode.elementType === "divider"
                ? [
                    field("width", "Rule width", "number", 80, {
                      min: 1,
                      max: 100,
                      unit: "%",
                    }),
                    field("thickness", "Rule thickness", "number", 1, {
                      min: 1,
                      max: 32,
                      unit: "px",
                    }),
                    field("color", "Rule color", "color", "#d9dce3"),
                  ]
              : []
      : selectedNode.kind === "widget"
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

  const isText = selectedNode.kind === "element" && selectedNode.elementType === "text";
  const isImage = selectedNode.kind === "element" && selectedNode.elementType === "image";
  const isVideo = selectedNode.kind === "element" && selectedNode.elementType === "video";
  const isShape =
    selectedNode.kind === "element" &&
    (selectedNode.elementType === "shape" ||
      selectedNode.elementType === "container");
  const isDivider = selectedNode.kind === "element" && selectedNode.elementType === "divider";
  const isWidget = selectedNode.kind === "widget";
  const textContentFields = contentFields.filter((item) => item.key === "text");
  const mediaContentFields = contentFields.filter((item) =>
    ["src", "alt", "title", "poster"].includes(item.key)
  );
  const imageCropFields = contentFields.filter((item) =>
    ["objectFit", "objectPosition", "aspectRatio"].includes(item.key)
  );
  const textStyleFields = typographyFields.filter((item) =>
    [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "color",
      "alignment",
      "lineHeight",
      "letterSpacing",
    ].includes(item.key)
  );
  const objectTitle = isSection
    ? "Section"
    : isText
      ? "Text"
      : isImage
        ? "Image"
        : isVideo
          ? "Video"
          : isShape
            ? "Shape"
            : isDivider
              ? "Divider"
              : isWidget
                ? selectedNode.name
                : "Button";

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text strong className={styles.title}>{objectTitle}</Text>
          <Text type="secondary" className={styles.deviceLabel}>
            {device}
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
            <span className={styles.fieldLabel}>Visible</span>
          </Checkbox>
        </div>
        {/* Quick Action Toolbar for Selected Element */}
        <div className="mt-2 flex items-center gap-1.5 pt-1 border-t border-[#EBD9BE]">
          {onToggleLock && (
            <Button
              size="small"
              type={selectedNode.locked ? "primary" : "default"}
              danger={selectedNode.locked}
              className="!text-[11px] !px-2"
              onClick={() => onToggleLock(selectedNode.id)}
            >
              {selectedNode.locked ? "Unlock" : "Lock"}
            </Button>
          )}
          {onDuplicate && !isSection && (
            <Button
              size="small"
              className="!text-[11px] !px-2"
              onClick={() => onDuplicate(selectedNode.id)}
            >
              Duplicate
            </Button>
          )}
          {onDelete && (
            <Button
              size="small"
              danger
              className="!text-[11px] !px-2"
              onClick={() => onDelete(selectedNode.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <div className={styles.scrollArea}>
        <InspectorGroup title="Size">
          <div className={styles.fieldGrid}>
            {renderSizeField(
              "width",
              "Width",
              selectedNode.size.width,
              isSection ? 10 : 24,
              isSection ? "%" : "px",
              isSection ? 100 : undefined
            )}
            {renderSizeField(
              "height",
              "Height",
              selectedNode.size.height,
              24,
              "px"
            )}
          </div>
        </InspectorGroup>

        {!isSection && (
          <InspectorGroup title="Position">
            <div className={styles.fieldGrid}>
              {renderPositionField("x", "X")}
              {renderPositionField("y", "Y")}
            </div>
            <div className={styles.fieldGrid}>
              {renderProperty(
                field("rotation", "Rotation", "number", 0, {
                  min: -180,
                  max: 180,
                  step: 1,
                  unit: "°",
                })
              )}
              {renderProperty(
                field("opacity", "Opacity", "number", 100, {
                  min: 0,
                  max: 100,
                  step: 1,
                  unit: "%",
                })
              )}
            </div>
          </InspectorGroup>
        )}

        {/* Style Mode: Follow Section Style vs Custom Style (for elements & widgets) */}
        {!isSection && (
          <InspectorGroup title="Gaya Tampilan">
            <PropertyControl
              definition={field("styleMode", "Mode Gaya", "select", "inherit", {
                options: [
                  { value: "inherit", label: "Ikuti Gaya Section" },
                  { value: "custom", label: "Custom Style" },
                ],
              })}
              value={props.styleMode ?? "inherit"}
              overridden={getResponsiveOverride(selectedNode, device, "styleMode")}
              onChange={(next) => onUpdateProp(selectedNode.id, "styleMode", next)}
              onReset={() => onResetProp(selectedNode.id, "styleMode")}
            />
          </InspectorGroup>
        )}

        {isSection && (
          <>
            <InspectorGroup title="Background">
              {backgrounds.map(renderProperty)}
              {props.backgroundType === "image" &&
                renderProperty(
                  field("backgroundSize", "Image fit", "select", "cover", {
                    options: ["cover", "contain", "auto"].map((value) => ({
                      value,
                      label: value,
                    })),
                  })
                )}
              {props.backgroundType === "image" &&
                renderProperty(
                  field("backgroundPosition", "Image position", "select", "center", {
                    options: ["center", "top", "bottom", "left", "right"].map(
                      (value) => ({ value, label: value })
                    ),
                  })
                )}
              {supportsOverlay && (
                <div className={styles.fieldGrid}>
                  {renderProperty(field("overlayColor", "Overlay", "color", "#000000"))}
                  {renderProperty(
                    field("overlayOpacity", "Overlay opacity", "number", 0, {
                      min: 0,
                      max: 100,
                      unit: "%",
                    })
                  )}
                </div>
              )}
            </InspectorGroup>
            <InspectorGroup title="Spacing">
              {spacingFields.map(renderProperty)}
            </InspectorGroup>
          </>
        )}

        {isText && (
          <>
            <InspectorGroup title="Text">
              {textContentFields.map(renderProperty)}
            </InspectorGroup>
            <InspectorGroup title="Typography">
              <div className={styles.fieldGrid}>
                {textStyleFields.map(renderProperty)}
              </div>
            </InspectorGroup>
          </>
        )}

        {isImage && (
          <>
            <InspectorGroup title="Image & Crop">
              {mediaContentFields.map(renderProperty)}
              <div className={styles.fieldGrid}>
                {imageCropFields.map(renderProperty)}
              </div>
              <Button
                size="small"
                block
                icon={<FolderOpenOutlined />}
                onClick={onOpenAssets}
                disabled={!onOpenAssets}
              >
                Browse assets
              </Button>
            </InspectorGroup>
            <InspectorGroup title="Advanced: Style & Effects" collapsible defaultCollapsed>
              <div className={styles.fieldGrid}>
                {renderProperty(borderFields[3])}
                {renderProperty(
                  field("boxShadow", "Shadow", "select", "none", {
                    options: [
                      { value: "none", label: "None" },
                      { value: "subtle", label: "Subtle" },
                      { value: "medium", label: "Medium" },
                    ],
                  })
                )}
              </div>
              <div className={styles.fieldGrid}>
                {renderProperty(
                  field("opacity", "Opacity", "number", 100, {
                    min: 0,
                    max: 100,
                    unit: "%",
                  })
                )}
                {renderProperty(
                  field("rotation", "Rotation", "number", 0, {
                    min: -180,
                    max: 180,
                    unit: "°",
                  })
                )}
              </div>
            </InspectorGroup>
          </>
        )}

        {isVideo && (
          <>
            <InspectorGroup title="Video Settings">
              {contentFields.map(renderProperty)}
              <Button
                size="small"
                block
                icon={<FolderOpenOutlined />}
                onClick={onOpenAssets}
                disabled={!onOpenAssets}
                className="mt-2"
              >
                Browse assets
              </Button>
            </InspectorGroup>
            <InspectorGroup title="Advanced: Style & Aspect" collapsible defaultCollapsed>
              <div className={styles.fieldGrid}>
                {renderProperty(borderFields[3])}
                {renderProperty(
                  field("opacity", "Opacity", "number", 100, {
                    min: 0,
                    max: 100,
                    unit: "%",
                  })
                )}
              </div>
            </InspectorGroup>
          </>
        )}

        {isShape && (
          <>
            <InspectorGroup title="Shape Fill">
              {renderProperty(field("backgroundColor", "Fill", "color", "#ffffff"))}
            </InspectorGroup>
            <InspectorGroup title="Border & Corner">
              <div className={styles.fieldGrid}>
                {renderProperty(borderFields[0])}
                {renderProperty(borderFields[1])}
              </div>
              {renderProperty(borderFields[2])}
              {renderProperty(borderFields[3])}
            </InspectorGroup>
            <InspectorGroup title="Advanced Effects" collapsible defaultCollapsed>
              <div className={styles.fieldGrid}>
                {renderProperty(
                  field("rotation", "Rotation", "number", 0, {
                    min: -180,
                    max: 180,
                    unit: "°",
                  })
                )}
                {renderProperty(
                  field("opacity", "Opacity", "number", 100, {
                    min: 0,
                    max: 100,
                    unit: "%",
                  })
                )}
              </div>
            </InspectorGroup>
          </>
        )}

        {isDivider && (
          <InspectorGroup title="Appearance">
            {contentFields.map(renderProperty)}
            {renderProperty(
              field("opacity", "Opacity", "number", 100, {
                min: 0,
                max: 100,
                unit: "%",
              })
            )}
          </InspectorGroup>
        )}

        {selectedNode.kind === "element" && selectedNode.elementType === "button" && (
          <>
            <InspectorGroup title="Button Details">
              {contentFields.map(renderProperty)}
            </InspectorGroup>
            <InspectorGroup title="Colors & Border">
              <div className={styles.fieldGrid}>
                {renderProperty(field("backgroundColor", "Fill", "color", "#4f46e5"))}
                {renderProperty(field("color", "Text color", "color", "#ffffff"))}
              </div>
              <div className={styles.fieldGrid}>
                {renderProperty(borderFields[3])}
                {renderProperty(
                  field("fontSize", "Font size", "number", 16, {
                    min: 8,
                    max: 72,
                    unit: "px",
                  })
                )}
              </div>
            </InspectorGroup>
            <InspectorGroup title="Advanced Typography" collapsible defaultCollapsed>
              <div className={styles.fieldGrid}>
                {textStyleFields.map(renderProperty)}
              </div>
            </InspectorGroup>
          </>
        )}

        {isWidget && (
          <>
            <InspectorGroup title="Content">
              {contentFields.map(renderProperty)}
            </InspectorGroup>
            <InspectorGroup title="Spacing">
              {spacingFields.map(renderProperty)}
              {activeLayoutFields.slice(0, 3).map(renderProperty)}
            </InspectorGroup>
            <InspectorGroup title="Appearance">
              {renderProperty(field("backgroundColor", "Background", "color", "#ffffff"))}
              {renderProperty(borderFields[3])}
              {renderProperty(
                field("opacity", "Opacity", "number", 100, {
                  min: 0,
                  max: 100,
                  unit: "%",
                })
              )}
            </InspectorGroup>
          </>
        )}

        {isSection && (
          <InspectorGroup title="Layout">
            {activeLayoutFields.slice(0, 4).map(renderProperty)}
          </InspectorGroup>
        )}
      </div>
    </aside>
  );
}
