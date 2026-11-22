"use client";

import React, { useEffect, useRef, useState } from "react";
import { BuilderSection, BuilderSectionChild } from "./model";
import { ElementRenderer } from "./ElementRenderer";
import { WidgetRenderer } from "./WidgetRenderer";
import { BuilderDevice, getResponsiveSize } from "./model";
import { ObjectManipulationFrame } from "./ObjectManipulationFrame";
import { getResponsiveProps } from "./model";
import { getBuilderObjectStyle } from "./styles";
import { DecorativeAnimationOverlay } from "./animation/DecorativeAnimationOverlay";
import { DecorativeAnimationType } from "./animation/animationTypes";

interface SectionContainerProps {
  section: BuilderSection;
  selectedId: string | null;
  device: BuilderDevice;
  zoom: number;
  editable?: boolean;
  preview?: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  onSizeChange: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  onDirectTextChange?: (id: string, text: string, fieldKey?: string) => void;
  onCopyStyle?: (id: string) => void;
  onPasteStyle?: (id: string) => void;
  hasCopiedStyle?: boolean;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onMoveLayer?: (id: string, direction: -1 | 1) => void;
  onDropFromPanel?: (sectionId: string, action: string, containerId?: string) => void;
}

export function SectionContainer({
  section,
  selectedId,
  device,
  zoom,
  editable = true,
  preview = false,
  onSelect,
  onPositionChange,
  onSizeChange,
  onDirectTextChange,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveLayer,
  onDropFromPanel,
}: SectionContainerProps) {
  // Hooks must be called unconditionally before any early return
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined
  );
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    // Set initial value
    setContainerWidth(el.offsetWidth);
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Early return after hooks
  if (!section.visible) return null;

  const size = getResponsiveSize(section, device);
  const props = getResponsiveProps(section, device);
  const objectStyle = getBuilderObjectStyle(props);
  const selectedChild = section.children.find((c) => c.id === selectedId);
  const selectedGroupId = selectedChild?.groupId;

  const isRootChild = (child: BuilderSectionChild) =>
    !child.parentContainerId ||
    !section.children.some((c) => c.id === child.parentContainerId);

  const rootChildren = section.children.filter(
    (child) => isRootChild(child) && child.visible
  );

  const renderChildNode = (child: BuilderSectionChild): React.ReactNode => {
    if (!child.visible) return null;

    let childInnerContent: React.ReactNode;
    if (child.kind === "widget") {
      const isThisWidgetSelected = selectedId === child.id || (selectedId?.startsWith(child.id + "::") ?? false);
      const subKey = selectedId?.startsWith(child.id + "::") ? selectedId.split("::")[1] : null;

      childInnerContent = (
        <WidgetRenderer
          widget={child}
          device={device}
          onSelect={() => onSelect(child.id)}
          previewMode={preview}
          parentSectionProps={props}
          selectedSubElementId={subKey}
          onSelectSubElement={(subFieldKey) => {
            onSelect(`${child.id}::${subFieldKey}`);
          }}
          onDirectFieldChange={
            onDirectTextChange
              ? (fieldKey, text) => onDirectTextChange(child.id, text, fieldKey)
              : undefined
          }
        />
      );
    } else if (child.elementType === "container") {
      const containerChildren = section.children.filter(
        (c) => c.parentContainerId === child.id && c.visible
      );
      childInnerContent = (
        <ElementRenderer
          element={child}
          device={device}
          previewMode={preview}
          onSelect={() => onSelect(child.id)}
          parentSectionProps={props}
          childrenNodes={
            <div
              className="h-full w-full"
              onDragOver={(e) => {
                if (preview || !editable) return;
                if (e.dataTransfer.types.includes("application/x-inviteu-element")) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "copy";
                }
              }}
              onDrop={(e) => {
                if (preview || !editable) return;
                const data = e.dataTransfer.getData("application/x-inviteu-element");
                if (data && onDropFromPanel) {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.action) {
                      onDropFromPanel(section.id, parsed.action, child.id);
                    }
                  } catch {
                    // ignore
                  }
                }
              }}
            >
              {containerChildren.map((c) => renderChildNode(c))}
            </div>
          }
        />
      );
    } else {
      childInnerContent = (
        <ElementRenderer
          element={child}
          device={device}
          previewMode={preview}
          onSelect={() => onSelect(child.id)}
          parentSectionProps={props}
          onDirectTextChange={
            onDirectTextChange
              ? (text) => onDirectTextChange(child.id, text)
              : undefined
          }
        />
      );
    }

    return (
      <ObjectManipulationFrame
        key={child.id}
        node={child}
        device={device}
        zoom={zoom}
        selected={selectedId === child.id || (selectedId?.startsWith(child.id + "::") ?? false)}
        selectedGroupId={selectedGroupId}
        editable={editable}
        containerWidth={containerWidth}
        onSelect={() => onSelect(child.id)}
        onPositionChange={onPositionChange}
        onSizeChange={onSizeChange}
        onCopyStyle={onCopyStyle}
        onPasteStyle={onPasteStyle}
        hasCopiedStyle={hasCopiedStyle}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleLock={onToggleLock}
        onMoveLayer={onMoveLayer}
      >
        {childInnerContent}
      </ObjectManipulationFrame>
    );
  };

  return (
    <section
      onClick={(event) => {
        event.stopPropagation();
        onSelect(section.id);
      }}
      onDragOver={(event) => {
        if (preview || !editable) return;
        if (event.dataTransfer.types.includes("application/x-inviteu-element")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          if (!isDragOver) setIsDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (preview || !editable) return;
        event.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(event) => {
        if (preview || !editable) return;
        setIsDragOver(false);
        const data = event.dataTransfer.getData("application/x-inviteu-element");
        if (data && onDropFromPanel) {
          event.preventDefault();
          event.stopPropagation();
          try {
            const parsed = JSON.parse(data);
            if (parsed.action) {
              onDropFromPanel(section.id, parsed.action);
            }
          } catch {
            // ignore
          }
        }
      }}
      className={
        preview
          ? "relative mx-auto w-full max-w-none"
          : `relative mx-auto w-full max-w-none border border-dashed bg-white transition-[border-color,box-shadow] ${
              isDragOver
                ? "z-[2] border-[#FFAD38] shadow-[0_0_0_2px_#FFAD38]"
                : selectedId === section.id
                ? "z-[1] border-[#FFAD38] shadow-[inset_0_0_0_1px_rgba(255,173,56,0.3)]"
                : "border-[#EAE5DF] hover:border-[#FFAD38]"
            }`
      }
      style={{
        width: `${size.width}%`,
        minHeight: size.height || Number(props.minHeight) || 180,
        paddingTop: props.paddingTop !== undefined ? Number(props.paddingTop) : Number(props.padding) || 0,
        paddingBottom: props.paddingBottom !== undefined ? Number(props.paddingBottom) : Number(props.padding) || 0,
        paddingLeft: props.paddingLeft !== undefined ? Number(props.paddingLeft) : Number(props.padding) || 0,
        paddingRight: props.paddingRight !== undefined ? Number(props.paddingRight) : Number(props.padding) || 0,
        marginTop: props.marginTop !== undefined ? Number(props.marginTop) : Number(props.margin) || 0,
        marginBottom: props.marginBottom !== undefined ? Number(props.marginBottom) : Number(props.margin) || 0,
        marginLeft: props.marginLeft !== undefined ? Number(props.marginLeft) : (Number(props.margin) ? Number(props.margin) : undefined),
        marginRight: props.marginRight !== undefined ? Number(props.marginRight) : (Number(props.margin) ? Number(props.margin) : undefined),
        ...objectStyle,
        display: "block",
        backgroundSize: String(props.backgroundSize || "cover"),
        backgroundPosition: String(props.backgroundPosition || "center"),
        boxSizing: "border-box",
        overflow: preview ? "hidden" : undefined,
      }}
    >
      {/* Background Video if configured */}
      {props.backgroundType === "video" && props.backgroundVideo && (
        <video
          src={String(props.backgroundVideo)}
          poster={String(props.backgroundPoster || props.backgroundImage || "") || undefined}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover -z-10"
        />
      )}

      {/* Background Overlay */}
      {Number(props.overlayOpacity) > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-5"
          style={{
            backgroundColor: String(props.overlayColor || "#000000"),
            opacity: Math.max(0, Math.min(100, Number(props.overlayOpacity) || 0)) / 100,
          }}
        />
      )}

      {isDragOver && !preview && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#FFAD38]/10 border-2 border-dashed border-[#FFAD38] transition-all">
          <span className="rounded bg-[#FFAD38] px-3 py-1 text-xs font-semibold text-[#3D2516] shadow-md">
            + Lepaskan elemen ke dalam Section ini
          </span>
        </div>
      )}
      {!preview && (
        <span className="absolute left-2 top-2 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#422B1C]">
          {section.name}
        </span>
      )}
      {/* Decorative Animation Overlay if configured */}
      {props.decorativeAnimation && props.decorativeAnimation !== "none" && (
        <DecorativeAnimationOverlay
          type={props.decorativeAnimation as DecorativeAnimationType}
          density="medium"
        />
      )}

      <div
        ref={innerRef}
        className="relative"
        style={{
          minHeight: size.height,
          maxWidth:
            Number(props.contentMaxWidth) > 0
              ? `${Number(props.contentMaxWidth)}px`
              : undefined,
          margin: Number(props.contentMaxWidth) > 0 ? "0 auto" : undefined,
          width: "100%",
          display: String(props.display || "flex"),
          flexDirection: (device === "mobile" && (props.autoStackMobile !== false || !props.flexDirection)
            ? "column"
            : String(props.flexDirection || "column")) as "row" | "column",
          flexWrap: props.flexWrap === "wrap" ? "wrap" : undefined,
          gridTemplateColumns:
            props.display === "grid"
              ? (props.gridTemplateColumns ? String(props.gridTemplateColumns) : `repeat(${Number(props.gridColumns) || 2}, minmax(0, 1fr))`)
              : undefined,
          gap: Number(props.gap) || 0,
          rowGap: props.rowGap !== undefined ? Number(props.rowGap) : undefined,
          columnGap: props.columnGap !== undefined ? Number(props.columnGap) : undefined,
          alignItems: String(props.alignment || "stretch"),
          justifyContent: String(props.justify || "flex-start"),
          boxSizing: "border-box",
        }}
      >
        {!preview && rootChildren.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#9aa1ad]">
            Empty section
          </div>
        ) : (
          rootChildren.map((child) => renderChildNode(child))
        )}
      </div>
    </section>
  );
}
