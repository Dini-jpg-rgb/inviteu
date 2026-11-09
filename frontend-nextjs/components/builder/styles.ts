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
    boxShadow: (
      props.boxShadow === "subtle"
        ? "0 1px 4px rgba(16, 24, 40, 0.12)"
        : props.boxShadow === "medium"
          ? "0 4px 12px rgba(16, 24, 40, 0.16)"
          : props.boxShadow === "none"
            ? "none"
            : String(props.boxShadow || "none")
    ) as CSSProperties["boxShadow"],
    padding: `${Math.max(0, Number(props.padding) || 0)}px`,
    margin: `${Math.max(0, Number(props.margin) || 0)}px`,
    gap: `${Math.max(0, Number(props.gap) || 0)}px`,
    display: props.display ? String(props.display) : undefined,
    flexDirection:
      props.flexDirection === "row" || props.flexDirection === "column"
        ? props.flexDirection
        : undefined,
    alignItems: ["stretch", "flex-start", "center", "flex-end"].includes(
      String(props.alignment)
    )
      ? String(props.alignment)
      : undefined,
    textAlign: ["left", "center", "right", "justify"].includes(
      String(props.alignment)
    )
      ? (String(props.alignment) as CSSProperties["textAlign"])
      : undefined,
    justifyContent: props.justify ? String(props.justify) : undefined,
    position:
      props.position === "static" ||
      props.position === "relative" ||
      props.position === "absolute" ||
      props.position === "fixed" ||
      props.position === "sticky"
        ? props.position
        : undefined,
    minWidth: minWidth > 0 ? `${minWidth}px` : undefined,
    maxWidth: maxWidth > 0 ? `${maxWidth}px` : undefined,
    minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
    maxHeight: maxHeight > 0 ? `${maxHeight}px` : undefined,
    transform: props.rotation ? `rotate(${Number(props.rotation) || 0}deg)` : undefined,
  };
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
      /^InviteUFont-[a-zA-Z0-9_-]+$/.test(fontFamily)
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
