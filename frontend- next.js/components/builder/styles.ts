import type { CSSProperties } from "react";
import {
  BUILDER_FONT_FAMILIES,
  BuilderPropertyValue,
  BuilderDevice,
  BuilderObjectBase,
  getResponsiveProps,
} from "./model";

export function getBuilderStyleValue(
  node: BuilderObjectBase,
  device: BuilderDevice,
  key: string,
  fallback?: BuilderPropertyValue
): BuilderPropertyValue | undefined {
  return getResponsiveProps(node, device)[key] ?? fallback;
}

export function getBuilderBackgroundImage(
  props: Record<string, BuilderPropertyValue>
) {
  const image = String(props.backgroundImage || "").trim();
  const type = String(props.backgroundType || "solid");
  let background: string | undefined;
  if (image && type === "gradient") {
    background = image;
  } else if (image && type === "image") {
    background = image.startsWith("url(")
      ? image
      : `url("${image.replace(/["\\]/g, "")}")`;
  } else if (!props.backgroundType && image) {
    background = image.startsWith("linear-gradient(") ||
      image.startsWith("radial-gradient(") ||
      image.startsWith("url(")
      ? image
      : `url("${image.replace(/["\\]/g, "")}")`;
  }
  const overlay = getBuilderBackgroundColor(props);
  if (overlay) {
    const overlayLayer = `linear-gradient(${overlay}, ${overlay})`;
    return background ? `${overlayLayer}, ${background}` : overlayLayer;
  }
  return background;
}

export function getBuilderBackgroundColor(
  props: Record<string, BuilderPropertyValue>
) {
  const color = String(props.overlayColor || "#000000").trim();
  const opacity = Math.max(0, Math.min(100, Number(props.overlayOpacity) || 0));
  if (!opacity) return undefined;
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((character) => `${character}${character}`)
            .join("")
        : hex;
    const red = parseInt(expanded.slice(0, 2), 16);
    const green = parseInt(expanded.slice(2, 4), 16);
    const blue = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
  }
  return color;
}

export function getBuilderObjectStyle(
  props: Record<string, BuilderPropertyValue>
): CSSProperties {
  const minWidth = Number(props.minWidth);
  const maxWidth = Number(props.maxWidth);
  const minHeight = Number(props.minHeight);
  const maxHeight = Number(props.maxHeight);
  const borderWidth = Number(props.borderWidth) || 0;

  // Resolve boxShadow: support both legacy labels and raw CSS values
  let resolvedBoxShadow: string;
  if (props.boxShadow === "subtle" || props.boxShadow === "0 1px 3px rgba(0,0,0,0.12)") {
    resolvedBoxShadow = "0 1px 3px rgba(0,0,0,0.12)";
  } else if (props.boxShadow === "medium" || props.boxShadow === "0 4px 12px rgba(0,0,0,0.15)") {
    resolvedBoxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  } else if (props.boxShadow === "none" || !props.boxShadow) {
    resolvedBoxShadow = "none";
  } else {
    resolvedBoxShadow = String(props.boxShadow);
  }

  const style: CSSProperties = {
    backgroundColor:
      props.backgroundColor === "transparent"
        ? "transparent"
        : String(props.backgroundColor || "#ffffff"),
    backgroundImage: getBuilderBackgroundImage(props),
    backgroundSize: String(props.backgroundSize || "cover"),
    backgroundPosition: String(props.backgroundPosition || "center"),
    opacity: Math.max(0, Math.min(100, Number(props.opacity ?? 100))) / 100,
    border:
      borderWidth > 0
        ? `${borderWidth}px ${String(props.borderStyle || "solid")} ${String(
            props.borderColor || "#d9dce3"
          )}`
        : undefined,
    borderRadius: `${Math.max(0, Number(props.borderRadius) || 0)}px`,
    boxShadow: resolvedBoxShadow as CSSProperties["boxShadow"],
    padding:
      props.paddingTop !== undefined ||
      props.paddingBottom !== undefined ||
      props.paddingLeft !== undefined ||
      props.paddingRight !== undefined
        ? `${Number(props.paddingTop ?? props.padding ?? 0)}px ${Number(
            props.paddingRight ?? props.padding ?? 0
          )}px ${Number(props.paddingBottom ?? props.padding ?? 0)}px ${Number(
            props.paddingLeft ?? props.padding ?? 0
          )}px`
        : `${Math.max(0, Number(props.padding) || 0)}px`,
    margin:
      props.marginTop !== undefined ||
      props.marginBottom !== undefined ||
      props.marginLeft !== undefined ||
      props.marginRight !== undefined
        ? `${Number(props.marginTop ?? props.margin ?? 0)}px ${Number(
            props.marginRight ?? props.margin ?? 0
          )}px ${Number(props.marginBottom ?? props.margin ?? 0)}px ${Number(
            props.marginLeft ?? props.margin ?? 0
          )}px`
        : `${Math.max(0, Number(props.margin) || 0)}px`,
    ...(props.rowGap !== undefined || props.columnGap !== undefined
      ? {
          rowGap: props.rowGap !== undefined ? `${Number(props.rowGap)}px` : undefined,
          columnGap: props.columnGap !== undefined ? `${Number(props.columnGap)}px` : undefined,
        }
      : {
          gap: `${Math.max(0, Number(props.gap) || 0)}px`,
        }),
    display: props.display ? String(props.display) : undefined,
    flexDirection:
      props.flexDirection === "row" || props.flexDirection === "column"
        ? props.flexDirection
        : undefined,
    flexWrap:
      props.flexWrap === "wrap" || props.flexWrap === "nowrap" || props.flexWrap === "wrap-reverse"
        ? (props.flexWrap as CSSProperties["flexWrap"])
        : undefined,
    gridTemplateColumns:
      props.display === "grid"
        ? (props.gridTemplateColumns ? String(props.gridTemplateColumns) : `repeat(${Number(props.gridColumns) || 2}, minmax(0, 1fr))`)
        : undefined,
    gridTemplateRows:
      props.display === "grid" && props.gridRows
        ? `repeat(${Number(props.gridRows) || 1}, minmax(0, 1fr))`
        : undefined,
    alignItems: ["stretch", "flex-start", "center", "flex-end", "baseline"].includes(
      String(props.alignment || props.alignItems)
    )
      ? String(props.alignment || props.alignItems)
      : undefined,
    alignSelf: ["auto", "flex-start", "center", "flex-end", "stretch"].includes(
      String(props.alignSelf)
    )
      ? (String(props.alignSelf) as CSSProperties["alignSelf"])
      : undefined,
    textAlign: ["left", "center", "right", "justify"].includes(
      String(props.alignment)
    )
      ? (String(props.alignment) as CSSProperties["textAlign"])
      : undefined,
    justifyContent: props.justifyContent || props.justify
      ? String(props.justifyContent || props.justify)
      : undefined,
    position:
      props.position === "static" ||
      props.position === "relative" ||
      props.position === "absolute" ||
      props.position === "fixed" ||
      props.position === "sticky"
        ? props.position
        : undefined,
    zIndex: props.zIndex !== undefined && props.zIndex !== "" ? Number(props.zIndex) : undefined,
    overflow: props.overflow ? (String(props.overflow) as CSSProperties["overflow"]) : undefined,
    top: props.top !== undefined && props.top !== "" ? (typeof props.top === "number" ? `${props.top}px` : String(props.top)) : undefined,
    right: props.right !== undefined && props.right !== "" ? (typeof props.right === "number" ? `${props.right}px` : String(props.right)) : undefined,
    bottom: props.bottom !== undefined && props.bottom !== "" ? (typeof props.bottom === "number" ? `${props.bottom}px` : String(props.bottom)) : undefined,
    left: props.left !== undefined && props.left !== "" ? (typeof props.left === "number" ? `${props.left}px` : String(props.left)) : undefined,
    minWidth: minWidth > 0 ? `${minWidth}px` : undefined,
    maxWidth: maxWidth > 0 ? `${maxWidth}px` : undefined,
    minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
    maxHeight: maxHeight > 0 ? `${maxHeight}px` : undefined,
    transform: props.rotation ? `rotate(${Number(props.rotation) || 0}deg)` : undefined,
    // Responsive text wrapping
    whiteSpace: props.textWrap === "nowrap" ? "nowrap" : undefined,
    // sizingMode: fill or hug
    ...(props.sizingMode === "fill" ? { width: "100%", alignSelf: "stretch" as const } : {}),
    ...(props.sizingMode === "hug" ? { width: "fit-content", alignSelf: "flex-start" as const } : {}),
  };

  // text-wrap: balance — extended CSS not in React types yet, cast safely
  if (props.textWrap === "balance") {
    (style as Record<string, unknown>).textWrap = "balance";
  }

  return style;
}

export function getBuilderTypographyStyle(
  props: Record<string, BuilderPropertyValue>
): CSSProperties {
  const fontSize = Number(props.fontSize);
  const lineHeight = Number(props.lineHeight);
  const letterSpacing = Number(props.letterSpacing);
  const fontFamily = String(props.fontFamily || "");
  return {
    fontFamily:
      BUILDER_FONT_FAMILIES.some((font) => font.value === fontFamily) ||
      /^InviteUFont-[a-zA-Z0-9_-]+$/.test(fontFamily) ||
      fontFamily.trim().length > 0
      ? fontFamily
      : BUILDER_FONT_FAMILIES[0].value,
    fontSize: fontSize > 0 ? `${fontSize}px` : undefined,
    fontWeight: props.fontWeight ? String(props.fontWeight) : undefined,
    lineHeight: lineHeight > 0 ? lineHeight : undefined,
    letterSpacing: `${letterSpacing || 0}px`,
    textAlign:
      ["left", "center", "right", "justify"].includes(String(props.alignment))
        ? (String(props.alignment) as CSSProperties["textAlign"])
        : undefined,
    color: props.color ? String(props.color) : undefined,
    textDecoration: props.textDecoration
      ? String(props.textDecoration)
      : undefined,
    textTransform: props.textTransform
      ? String(props.textTransform)
      : undefined,
  };
}

export function getBuilderCanvasStyle(width: number | string): CSSProperties {
  return {
    maxWidth: "100%",
    width: typeof width === "number" ? `${width}px` : width,
    overflowX: "hidden",
    boxSizing: "border-box",
  };
}
