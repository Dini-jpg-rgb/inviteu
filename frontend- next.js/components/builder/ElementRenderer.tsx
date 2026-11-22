"use client";

import React from "react";
import { Typography } from "antd";
import {
  CalendarOutlined,
  CheckOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SmileOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  BuilderDevice,
  BuilderElement,
  BuilderPropertyValue,
  getResponsiveProps,
} from "./model";
import {
  getBuilderObjectStyle,
  getBuilderTypographyStyle,
} from "./styles";

const { Text } = Typography;

function renderDynamicIcon(iconName: string, style?: React.CSSProperties) {
  switch (iconName) {
    case "heart":
      return <HeartOutlined style={style} />;
    case "star":
      return <StarOutlined style={style} />;
    case "calendar":
      return <CalendarOutlined style={style} />;
    case "map-pin":
    case "location":
      return <EnvironmentOutlined style={style} />;
    case "gift":
      return <GiftOutlined style={style} />;
    case "music":
      return <CustomerServiceOutlined style={style} />;
    case "check":
      return <CheckOutlined style={style} />;
    case "mail":
      return <MailOutlined style={style} />;
    case "phone":
      return <PhoneOutlined style={style} />;
    case "info":
      return <InfoCircleOutlined style={style} />;
    default:
      return <SmileOutlined style={style} />;
  }
}

interface ElementRendererProps {
  element: BuilderElement;
  device: BuilderDevice;
  onSelect: () => void;
  previewMode?: boolean;
  parentSectionProps?: Record<string, BuilderPropertyValue>;
  onDirectTextChange?: (text: string) => void;
  childrenNodes?: React.ReactNode;
}

export function ElementRenderer({
  element,
  device,
  onSelect,
  previewMode = false,
  parentSectionProps,
  onDirectTextChange,
  childrenNodes,
}: ElementRendererProps) {
  const [isEditingText, setIsEditingText] = React.useState(false);
  const rawProps = getResponsiveProps(element, device);

  // Follow Section Style: if styleMode is inherit (default), inherit section fonts/colors
  const isCustomStyle = rawProps.styleMode === "custom";
  const props: Record<string, BuilderPropertyValue> = {
    ...rawProps,
    fontFamily: isCustomStyle
      ? rawProps.fontFamily
      : (parentSectionProps?.fontFamily as string) || rawProps.fontFamily,
    color: isCustomStyle
      ? rawProps.color
      : (parentSectionProps?.textColor as string) ||
        (parentSectionProps?.color as string) ||
        rawProps.color,
  };

  const baseClass = "h-full w-full cursor-pointer";
  const boxStyle = getBuilderObjectStyle(props);
  const imageLayoutStyle = {
    backgroundSize: String(props.backgroundSize || "cover"),
    backgroundPosition: String(props.backgroundPosition || "center"),
    boxSizing: "border-box" as const,
  };

  // Aspect-ratio CSS value helper
  const resolvedAspectRatio =
    props.aspectRatio && props.aspectRatio !== "auto"
      ? String(props.aspectRatio).replace("/", " / ")
      : undefined;

  let content: React.ReactNode;
  switch (element.elementType) {
    case "heading": {
      const headingTag = (["h1", "h2", "h3", "h4", "h5", "h6"].includes(String(props.tag))
        ? String(props.tag)
        : "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

      content = isEditingText && !previewMode ? (
        <textarea
          autoFocus
          className="h-full w-full resize-none border border-[#E99B22] bg-white/95 p-1 outline-none font-bold"
          style={{
            ...getBuilderTypographyStyle(props),
            boxSizing: "border-box",
          }}
          defaultValue={String(props.text || "")}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            setIsEditingText(false);
            if (onDirectTextChange) {
              onDirectTextChange(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditingText(false);
            }
          }}
        />
      ) : React.createElement(
          headingTag,
          {
            onDoubleClick: (e: React.MouseEvent) => {
              if (!previewMode && onDirectTextChange) {
                e.stopPropagation();
                setIsEditingText(true);
              }
            },
            title: !previewMode ? "Double click untuk edit heading langsung" : undefined,
            style: {
              ...getBuilderTypographyStyle(props),
              ...boxStyle,
              margin: 0,
              boxSizing: "border-box",
              height: "100%",
              wordBreak: "break-word",
              whiteSpace: props.textWrap === "nowrap" ? "nowrap" : "pre-wrap",
            },
          },
          String(props.text || "")
        );
      break;
    }

    case "text":
      content = isEditingText && !previewMode ? (
        <textarea
          autoFocus
          className="h-full w-full resize-none border border-[#E99B22] bg-white/95 p-1 outline-none"
          style={{
            ...getBuilderTypographyStyle(props),
            boxSizing: "border-box",
          }}
          defaultValue={String(props.text || "")}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            setIsEditingText(false);
            if (onDirectTextChange) {
              onDirectTextChange(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditingText(false);
            }
          }}
        />
      ) : (
        <div
          onDoubleClick={(e) => {
            if (!previewMode && onDirectTextChange) {
              e.stopPropagation();
              setIsEditingText(true);
            }
          }}
          title={!previewMode ? "Double click untuk edit teks langsung" : undefined}
          style={{
            ...getBuilderTypographyStyle(props),
            ...boxStyle,
            boxSizing: "border-box",
            height: "100%",
            wordBreak: "break-word",
            // respect textWrap from props; default pre-wrap
            whiteSpace: props.textWrap === "nowrap" ? "nowrap" : "pre-wrap",
          }}
        >
          {String(props.text || "")}
        </div>
      );
      break;

    case "image": {
      const isGallery = Boolean(props.isGallery || props.galleryLayout);
      if (isGallery) {
        const layout = String(props.galleryLayout || "grid-2");
        const count = Number(props.imageCount) || 4;
        const defaultImgs = [
          "/templates/wedding/gallery-1.jpg",
          "/templates/wedding/gallery-2.jpg",
          "/templates/wedding/gallery-3.jpg",
          "/templates/wedding/gallery-4.jpg",
          "/templates/wedding/couple-main.jpg",
          "/templates/wedding/venue.jpg",
        ];
        const rawImages =
          Array.isArray(props.images) && props.images.length
            ? (props.images as string[])
            : defaultImgs;
        const displayImages = rawImages.slice(0, count);

        if (layout === "carousel") {
          content = (
            <div className="flex h-full w-full gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
              {displayImages.map((src, i) => (
                <div
                  key={i}
                  className="h-full min-w-[70%] shrink-0 snap-center overflow-hidden rounded-md bg-[#f2f0ed]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          );
        } else if (layout === "grid-3") {
          content = (
            <div className="grid h-full w-full grid-cols-3 gap-1.5 overflow-hidden">
              {displayImages.map((src, i) => (
                <div key={i} className="h-full min-h-[70px] overflow-hidden rounded-md bg-[#f2f0ed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          );
        } else if (layout === "masonry") {
          content = (
            <div className="columns-2 gap-2 space-y-2 overflow-hidden h-full w-full">
              {displayImages.map((src, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-md bg-[#f2f0ed] ${i % 2 === 0 ? "h-28" : "h-36"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          );
        } else {
          content = (
            <div className="grid h-full w-full grid-cols-2 gap-2 overflow-hidden">
              {displayImages.map((src, i) => (
                <div key={i} className="h-full min-h-[90px] overflow-hidden rounded-md bg-[#f2f0ed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Galeri ${i + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          );
        }
      } else {
        const objectFit = ["contain", "fill", "none", "scale-down"].includes(
          String(props.objectFit)
        )
          ? (props.objectFit as React.CSSProperties["objectFit"])
          : "cover";
        // focalPoint = objectPosition
        const objectPosition = String(props.objectPosition || "center center");

        content = props.src ? (
          <div
            className="relative h-full w-full"
            style={{ aspectRatio: resolvedAspectRatio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(props.src)}
              alt={String(props.alt || "")}
              className="h-full w-full"
              style={{
                objectFit,
                objectPosition,
                display: "block",
              }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = "true";
                  target.src = "/templates/wedding/couple-main.jpg";
                }
              }}
            />
            {Number(props.overlayOpacity) > 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: String(props.overlayColor || "#000000"),
                  opacity: Math.max(0, Math.min(100, Number(props.overlayOpacity) || 0)) / 100,
                }}
              />
            )}
          </div>
        ) : previewMode ? (
          <div className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-dashed border-[#cfd4dd] bg-[#f7f8fa] text-xs text-[#697386]">
            Image placeholder
          </div>
        );
      }
      break;
    }

    case "video":
      content = props.src ? (
        <video
          src={String(props.src)}
          poster={String(props.poster || "") || undefined}
          title={String(props.title || element.name)}
          className="h-full w-full"
          style={{
            objectFit: ["contain", "fill", "none"].includes(String(props.objectFit))
              ? (props.objectFit as React.CSSProperties["objectFit"])
              : "cover",
            aspectRatio: resolvedAspectRatio,
          }}
          autoPlay={props.autoplay === true && props.muted === true}
          muted={props.muted === true}
          loop={props.loop === true}
          controls={props.controls !== false}
          playsInline
          onClick={(event) => event.stopPropagation()}
        />
      ) : previewMode && props.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(props.poster)} alt="" className="h-full w-full object-cover" />
      ) : previewMode ? (
        <div className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-[#cfd4dd] bg-[#f7f8fa] text-xs text-[#697386]">
          <span className="text-lg">▶</span>
          <span className="max-w-full truncate px-3">Video URL not set</span>
        </div>
      );
      break;

    case "shape":
      content = (
        <div
          style={{
            width: "100%",
            height: "100%",
            ...boxStyle,
          }}
        />
      );
      break;

    case "button": {
      // Map buttonSize preset to padding if element has default padding
      const buttonSizePadding =
        props.buttonSize === "small"
          ? "4px 12px"
          : props.buttonSize === "large"
            ? "12px 28px"
            : "8px 18px"; // medium / default
      const pad = boxStyle.padding !== "0px" ? boxStyle.padding : buttonSizePadding;
      const buttonBg =
        !isCustomStyle && parentSectionProps?.primaryColor
          ? String(parentSectionProps.primaryColor)
          : props.backgroundColor === "transparent"
            ? "transparent"
            : String(props.backgroundColor || "#4f46e5");
      const buttonTextColor =
        !isCustomStyle && parentSectionProps?.buttonTextColor
          ? String(parentSectionProps.buttonTextColor)
          : String(props.color || "#ffffff");
      const buttonBorder =
        !isCustomStyle && parentSectionProps?.primaryColor && (boxStyle.border || Number(props.borderWidth) > 0)
          ? `${Number(props.borderWidth) || 1}px ${String(props.borderStyle || "solid")} ${String(parentSectionProps.primaryColor)}`
          : boxStyle.border ?? "none";

      content = (
        <button
          type="button"
          style={{
            ...getBuilderTypographyStyle(props),
            backgroundColor: buttonBg,
            color: buttonTextColor,
            border: buttonBorder,
            borderRadius: boxStyle.borderRadius,
            boxShadow: boxStyle.boxShadow,
            opacity: boxStyle.opacity,
            padding: pad,
            boxSizing: "border-box",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
        >
          {String(props.label || "Button")}
        </button>
      );
      break;
    }

    case "divider": {
      const dividerColor =
        !isCustomStyle &&
        (parentSectionProps?.primaryColor ||
          parentSectionProps?.textColor ||
          parentSectionProps?.color)
          ? String(
              parentSectionProps.primaryColor ||
                parentSectionProps.textColor ||
                parentSectionProps.color
            )
          : String(props.color || "#d9dce3");
      content = (
        <div
          style={{
            width: `${Number(props.width) || 80}%`,
            borderTop: `${Number(props.thickness) || 1}px solid ${dividerColor}`,
            opacity: Number(props.opacity ?? 100) / 100,
          }}
        />
      );
      break;
    }

    case "spacer": {
      const spacerHeight = Number(props.height) || 32;
      content = previewMode ? (
        <div style={{ height: `${spacerHeight}px`, width: "100%" }} />
      ) : (
        <div
          style={{ height: `${spacerHeight}px`, width: "100%" }}
          className="flex h-full w-full items-center justify-center border border-dashed border-[#d9dce3] bg-[#fafafa]/80 text-[10px] text-[#9aa1ad] select-none"
        >
          Spacer ({spacerHeight}px)
        </div>
      );
      break;
    }

    case "icon": {
      const iconName = String(props.iconName || "heart");
      const iconSize = Number(props.iconSize) || 32;
      const iconColor =
        !isCustomStyle && parentSectionProps?.primaryColor
          ? String(parentSectionProps.primaryColor)
          : String(props.color || "#4f46e5");
      content = (
        <div
          style={{
            ...boxStyle,
            display: "flex",
            alignItems: "center",
            justifyContent:
              props.alignment === "left"
                ? "flex-start"
                : props.alignment === "right"
                  ? "flex-end"
                  : "center",
            width: "100%",
            height: "100%",
          }}
        >
          {renderDynamicIcon(iconName, {
            fontSize: `${iconSize}px`,
            color: iconColor,
          })}
        </div>
      );
      break;
    }

    case "container": {
      const containerStyle: React.CSSProperties = {
        ...boxStyle,
        display: String(props.display || "flex"),
        flexDirection: String(props.flexDirection || "column") as "row" | "column",
        flexWrap: String(props.flexWrap || "nowrap") as "wrap" | "nowrap",
        justifyContent: String(props.justify || props.justifyContent || "flex-start"),
        alignItems: String(props.alignment || props.alignItems || "stretch"),
        gap: `${Number(props.gap) || 0}px`,
        gridTemplateColumns:
          props.display === "grid"
            ? (props.gridTemplateColumns ? String(props.gridTemplateColumns) : `repeat(${Number(props.gridColumns) || 2}, minmax(0, 1fr))`)
            : undefined,
        boxSizing: "border-box",
        minHeight: Number(props.minHeight) || 60,
        width: "100%",
        height: "100%",
      };

      content = (
        <div style={containerStyle} className="relative transition-all">
          {childrenNodes ? (
            childrenNodes
          ) : !previewMode ? (
            <div className="flex w-full items-center justify-center border border-dashed border-[#d9dce3] py-4 text-xs text-[#9aa1ad]">
              Container ({element.name}) — Siap diisi elemen
            </div>
          ) : null}
        </div>
      );
      break;
    }

    default:
      content = <Text type="secondary">{element.name}</Text>;
  }

  return (
    <div
      className={baseClass}
      style={{
        ...boxStyle,
        ...imageLayoutStyle,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {content}
    </div>
  );
}
