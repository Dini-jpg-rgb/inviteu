"use client";

import React from "react";
import { Button, Typography } from "antd";
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

interface ElementRendererProps {
  element: BuilderElement;
  device: BuilderDevice;
  onSelect: () => void;
  previewMode?: boolean;
  parentSectionProps?: Record<string, BuilderPropertyValue>;
  onDirectTextChange?: (text: string) => void;
}

export function ElementRenderer({
  element,
  device,
  onSelect,
  previewMode = false,
  parentSectionProps,
  onDirectTextChange,
}: ElementRendererProps) {
  const [isEditingText, setIsEditingText] = React.useState(false);
  const rawProps = getResponsiveProps(element, device);

  // Follow Section Style: if styleMode is inherit or not custom, inherit section fonts and colors
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

  let content: React.ReactNode;
  switch (element.elementType) {
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
            whiteSpace: "pre-wrap",
          }}
        >
          {String(props.text || "")}
        </div>
      );
      break;
    case "image":
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
                  <img
                    src={src}
                    alt={`Galeri ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          );
        } else if (layout === "grid-3") {
          content = (
            <div className="grid h-full w-full grid-cols-3 gap-1.5 overflow-hidden">
              {displayImages.map((src, i) => (
                <div
                  key={i}
                  className="h-full min-h-[70px] overflow-hidden rounded-md bg-[#f2f0ed]"
                >
                  <img
                    src={src}
                    alt={`Galeri ${i + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform"
                  />
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
                  className={`overflow-hidden rounded-md bg-[#f2f0ed] ${
                    i % 2 === 0 ? "h-28" : "h-36"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Galeri ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          );
        } else {
          // grid-2 (default)
          content = (
            <div className="grid h-full w-full grid-cols-2 gap-2 overflow-hidden">
              {displayImages.map((src, i) => (
                <div
                  key={i}
                  className="h-full min-h-[90px] overflow-hidden rounded-md bg-[#f2f0ed]"
                >
                  <img
                    src={src}
                    alt={`Galeri ${i + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          );
        }
      } else {
        content = props.src ? (
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(props.src)}
              alt={String(props.alt || "")}
              className="h-full w-full object-cover"
              style={{
                objectFit:
                  props.objectFit === "contain" ||
                  props.objectFit === "fill" ||
                  props.objectFit === "none" ||
                  props.objectFit === "scale-down"
                    ? props.objectFit
                    : "cover",
                objectPosition: String(props.objectPosition || "center"),
                ...imageLayoutStyle,
              }}
            />
            {Number(props.overlayOpacity) > 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: String(props.overlayColor || "#000000"),
                  opacity: Math.max(
                    0,
                    Math.min(100, Number(props.overlayOpacity) || 0)
                  ) / 100,
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
    case "video":
      content = props.src ? (
        <video
          src={String(props.src)}
          poster={String(props.poster || "") || undefined}
          title={String(props.title || element.name)}
          className="h-full w-full"
          style={{
            objectFit:
              props.objectFit === "contain" ||
              props.objectFit === "fill" ||
              props.objectFit === "none"
                ? props.objectFit
                : "cover",
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
        <img
          src={String(props.poster)}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : previewMode ? (
        <div className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-[#cfd4dd] bg-[#f7f8fa] text-xs text-[#697386]">
          <span className="text-lg">Video</span>
          <span className="max-w-full truncate px-3">Video URL belum diatur</span>
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
    case "button":
      content = (
        <Button
          className="!h-full !w-full"
          style={{
            ...getBuilderTypographyStyle(props),
            backgroundColor:
              props.backgroundColor === "transparent"
                ? "transparent"
                : String(props.backgroundColor || "#4f46e5"),
            color: String(props.color || "#ffffff"),
            border: boxStyle.border,
            borderRadius: boxStyle.borderRadius,
            boxShadow: boxStyle.boxShadow,
            opacity: boxStyle.opacity,
            padding: boxStyle.padding,
            boxSizing: "border-box",
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
        >
          {String(props.label || "Button")}
        </Button>
      );
      break;
    case "divider":
      content = (
        <div
          style={{
            width: `${Number(props.width) || 80}%`,
            borderTop: `${Number(props.thickness) || 1}px solid ${String(
              props.color || "#d9dce3"
            )}`,
            opacity: Number(props.opacity ?? 100) / 100,
          }}
        />
      );
      break;
    case "container":
      content = (
        <div
          className="flex h-full w-full items-center justify-center border border-dashed border-[#cfd4dd] text-xs text-[#697386]"
          style={{
            ...boxStyle,
            boxSizing: "border-box",
          }}
        >
          {element.name}
        </div>
      );
      break;
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
