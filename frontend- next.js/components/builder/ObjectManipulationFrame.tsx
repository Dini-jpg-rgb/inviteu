"use client";

import React, { useRef, useState } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  DragOutlined,
  ExpandOutlined,
  LockOutlined,
  SnippetsOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import {
  BuilderDevice,
  BuilderNode,
  getResponsivePosition,
  getResponsiveProps,
  getResponsiveSize,
} from "./model";
import {
  getAnimationClassName,
  getAnimationStyle,
} from "./animation/useAnimationObserver";
import { ElementAnimationConfig } from "./animation/animationTypes";

type Point = { x: number; y: number };
type Gesture = {
  pointerId: number;
  mode: "move" | "resize";
  start: Point;
  position: Point;
  size: { width: number; height: number };
};

type ActiveGuide = {
  /** Grid-snap guide X coordinate (absolute within element) */
  gridX?: number;
  /** Grid-snap guide Y coordinate (absolute within element) */
  gridY?: number;
  /** Center-snap: show vertical guide at container center X */
  centerX?: number;
  /** Top-snap: show guide at y=0 */
  topSnap?: boolean;
};

interface ObjectManipulationFrameProps {
  node: Exclude<BuilderNode, { kind: "section" }>;
  device: BuilderDevice;
  zoom: number;
  selected: boolean;
  selectedGroupId?: string;
  editable?: boolean;
  /** Width of the parent section container in px for center-snap calculation */
  containerWidth?: number;
  onSelect: () => void;
  onPositionChange: (id: string, position: Point) => void;
  onSizeChange: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  onCopyStyle?: (id: string) => void;
  onPasteStyle?: (id: string) => void;
  hasCopiedStyle?: boolean;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onMoveLayer?: (id: string, direction: -1 | 1) => void;
  children: React.ReactNode;
}

const SNAP_THRESHOLD = 6;
const GRID_SIZE = 8;

/**
 * Snap a value to the nearest grid line.
 * Returns the snapped value and whether snapping occurred.
 */
function snapToGrid(val: number): { snapped: number; didSnap: boolean } {
  const remainder = val % GRID_SIZE;
  if (remainder < SNAP_THRESHOLD) {
    return { snapped: val - remainder, didSnap: remainder !== 0 };
  }
  if (GRID_SIZE - remainder < SNAP_THRESHOLD) {
    return { snapped: val + (GRID_SIZE - remainder), didSnap: true };
  }
  return { snapped: val, didSnap: false };
}

/**
 * Snap a coordinate to the grid. Pure value version for finishGesture.
 */
function snapCoordinate(val: number): number {
  return snapToGrid(val).snapped;
}

export function ObjectManipulationFrame({
  node,
  device,
  zoom,
  selected,
  selectedGroupId,
  editable = true,
  containerWidth,
  onSelect,
  onPositionChange,
  onSizeChange,
  onCopyStyle,
  onPasteStyle,
  hasCopiedStyle,
  onDuplicate,
  onDelete,
  onToggleLock,
  onMoveLayer,
  children,
}: ObjectManipulationFrameProps) {
  const [gesturePreview, setGesturePreview] = useState<{
    position: Point;
    size: { width: number; height: number };
  } | null>(null);
  const [activeGuide, setActiveGuide] = useState<ActiveGuide | null>(null);
  const gestureRef = useRef<Gesture | null>(null);

  const position = getResponsivePosition(node, device);
  const size = getResponsiveSize(node, device);
  const props = getResponsiveProps(node, device);
  const positionMode = String(props.position || "absolute");
  const currentPosition = gesturePreview?.position ?? position;
  const currentSize = gesturePreview?.size ?? size;
  const isLocked = Boolean(node.locked);

  /**
   * Calculate snapped position for move gestures.
   * Priority: center-snap > grid-snap.
   */
  function computeSnappedMove(
    rawX: number,
    rawY: number,
    elWidth: number
  ): { x: number; y: number; guide: ActiveGuide } {
    const guide: ActiveGuide = {};
    let x = rawX;
    let y = rawY;

    // Center-snap: snap element horizontal center to container center
    if (containerWidth) {
      const containerCenter = containerWidth / 2;
      const elementCenter = rawX + elWidth / 2;
      if (Math.abs(elementCenter - containerCenter) <= SNAP_THRESHOLD) {
        x = Math.round(containerCenter - elWidth / 2);
        guide.centerX = containerCenter;
      }
    }

    // Grid-snap X (only if not center-snapped)
    if (guide.centerX === undefined) {
      const { snapped: snappedX, didSnap: snapX } = snapToGrid(rawX);
      x = snappedX;
      if (snapX) guide.gridX = snappedX;
    }

    // Grid-snap Y
    const { snapped: snappedY, didSnap: snapY } = snapToGrid(rawY);
    y = snappedY;
    if (snapY) guide.gridY = snappedY;

    // Top snap: snap to y=0
    if (Math.abs(rawY) <= SNAP_THRESHOLD) {
      y = 0;
      guide.topSnap = true;
    }

    return { x, y, guide };
  }

  const startGesture = (
    event: React.PointerEvent<HTMLButtonElement>,
    mode: Gesture["mode"]
  ) => {
    if (isLocked) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      mode,
      start: { x: event.clientX, y: event.clientY },
      position,
      size,
    };
    setGesturePreview({ position, size });
    onSelect();
  };

  const updateGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || isLocked) return;
    const scale = Math.max(zoom / 100, 0.1);
    const dx = (event.clientX - gesture.start.x) / scale;
    const dy = (event.clientY - gesture.start.y) / scale;

    if (gesture.mode === "move") {
      const rawX = Math.max(0, Math.round(gesture.position.x + dx));
      const rawY = Math.max(0, Math.round(gesture.position.y + dy));
      const { x, y, guide } = computeSnappedMove(rawX, rawY, gesture.size.width);
      setActiveGuide(guide);
      setGesturePreview({ position: { x, y }, size: gesture.size });
    } else {
      const rawW = Math.max(24, Math.round(gesture.size.width + dx));
      const rawH = Math.max(24, Math.round(gesture.size.height + dy));
      const guide: ActiveGuide = {};

      const { snapped: snappedW, didSnap: snapW } = snapToGrid(rawW);
      const { snapped: snappedH, didSnap: snapH } = snapToGrid(rawH);
      if (snapW) guide.gridX = gesture.position.x + snappedW;
      if (snapH) guide.gridY = gesture.position.y + snappedH;

      setActiveGuide(guide);
      setGesturePreview({
        position: gesture.position,
        size: { width: snappedW, height: snappedH },
      });
    }
  };

  const finishGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || isLocked) return;
    const scale = Math.max(zoom / 100, 0.1);
    const dx = (event.clientX - gesture.start.x) / scale;
    const dy = (event.clientY - gesture.start.y) / scale;
    if (gesture.mode === "move") {
      const rawX = Math.max(0, Math.round(gesture.position.x + dx));
      const rawY = Math.max(0, Math.round(gesture.position.y + dy));
      const { x, y } = computeSnappedMove(rawX, rawY, gesture.size.width);
      onPositionChange(node.id, { x, y });
    } else {
      const rawW = Math.max(24, Math.round(gesture.size.width + dx));
      const rawH = Math.max(24, Math.round(gesture.size.height + dy));
      onSizeChange(node.id, {
        width: snapCoordinate(rawW),
        height: snapCoordinate(rawH),
      });
    }
    gestureRef.current = null;
    setGesturePreview(null);
    setActiveGuide(null);
  };

  const cancelGesture = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setGesturePreview(null);
    setActiveGuide(null);
  };

  const isGroupPeer =
    !selected &&
    Boolean(node.groupId && selectedGroupId && node.groupId === selectedGroupId);

  const isInsideContainer = Boolean(node.parentContainerId);
  const resolvedPositionMode =
    positionMode === "absolute" && !isInsideContainer
      ? "absolute"
      : positionMode === "static"
      ? "static"
      : "relative";

  // Animation configuration: support both node.animation and props.animation*
  const animConfig: ElementAnimationConfig | undefined = (node.animation || props.animation)
    ? ((node.animation || props.animation) as ElementAnimationConfig)
    : props.animationType && props.animationType !== "none"
    ? {
        type: String(props.animationType) as ElementAnimationConfig["type"],
        trigger: props.animationTrigger
          ? (String(props.animationTrigger) as ElementAnimationConfig["trigger"])
          : undefined,
        duration: Number(props.animationDuration) || 0.8,
        delay: Number(props.animationDelay) || 0,
        repeat: props.animationRepeat
          ? (String(props.animationRepeat) as ElementAnimationConfig["repeat"])
          : undefined,
        easing: props.animationEasing
          ? (String(props.animationEasing) as ElementAnimationConfig["easing"])
          : undefined,
        disabled: Boolean(props.animationDisabled),
      }
    : undefined;
  const animClassName = getAnimationClassName(animConfig);
  const animStyle = getAnimationStyle(animConfig);

  // Responsive safe position and sizing to prevent any horizontal overflow
  const safeLeft =
    resolvedPositionMode === "absolute"
      ? containerWidth
        ? Math.min(currentPosition.x, Math.max(0, containerWidth - 40))
        : currentPosition.x
      : undefined;

  const safeWidth =
    props.sizingMode === "fill" ||
    (node.kind === "element" && node.elementType === "container" && !props.width)
      ? "100%"
      : typeof currentSize.width === "number" && containerWidth
      ? Math.min(currentSize.width, containerWidth)
      : currentSize.width;

  return (
    <div
      className={`${resolvedPositionMode === "absolute" ? "absolute" : "relative"} box-border ${
        selected
          ? "z-10 outline outline-2 outline-offset-1 outline-[#E99B22]"
          : isGroupPeer
          ? "z-10 outline outline-1 outline-dashed outline-[#1677ff] rounded-xs"
          : ""
      } ${animClassName}`}
      style={{
        position: resolvedPositionMode,
        left: safeLeft,
        top: resolvedPositionMode === "absolute" ? currentPosition.y : undefined,
        width: safeWidth,
        height:
          node.kind === "element" && node.elementType === "container" && !props.height
            ? "auto"
            : currentSize.height,
        minWidth:
          editable && Number(props.minWidth) > 0
            ? Number(props.minWidth)
            : undefined,
        maxWidth: "100%",
        minHeight:
          Number(props.minHeight) > 0 ? Number(props.minHeight) : undefined,
        maxHeight:
          Number(props.maxHeight) > 0 ? Number(props.maxHeight) : undefined,
        boxSizing: "border-box",
        ...animStyle,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="h-full w-full overflow-hidden">{children}</div>

      {/* Grid-snap vertical guide (red dashed) */}
      {selected && activeGuide?.gridX !== undefined && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-96 bottom-[-384px] z-50 w-px border-l border-dashed border-[#ff4d4f]"
          style={{ left: 0 }}
        />
      )}

      {/* Grid-snap horizontal guide (red dashed) */}
      {selected && activeGuide?.gridY !== undefined && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-96 right-[-384px] z-50 h-px border-t border-dashed border-[#ff4d4f]"
          style={{ top: 0 }}
        />
      )}

      {/* Top-snap guide (orange dashed, at element top = y:0 relative to parent) */}
      {selected && activeGuide?.topSnap && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-96 right-[-384px] z-50 h-px border-t-2 border-dashed border-[#fa8c16]"
          style={{ top: 0 }}
        />
      )}

      {/* Center-snap vertical guide (blue solid) — positioned relative to element,
          offset back by currentPosition.x so it draws at container center */}
      {selected && activeGuide?.centerX !== undefined && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-96 bottom-[-384px] z-50 w-px border-l-2 border-[#1677ff]"
          style={{ left: activeGuide.centerX - currentPosition.x }}
        />
      )}

      {isGroupPeer && (
        <div className="pointer-events-none absolute -top-5 right-0 z-20 flex items-center gap-1 rounded bg-[#1677ff] px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs">
          Group
        </div>
      )}

      {selected && editable && (
        <>
          {/* Floating contextual toolbar bar */}
          <div className="absolute -top-10 left-0 z-30 flex h-8 max-w-[460px] items-center gap-1.5 whitespace-nowrap rounded-md border border-[#EAE5DF] bg-white px-2 shadow-[0_3px_12px_rgba(61,37,22,0.12)]">
            {!isLocked ? (
              <button
                type="button"
                aria-label={`Pindahkan posisi ${node.name}`}
                title="Tahan & geser untuk memindahkan posisi (Drag & Move)"
                className="flex h-6 w-6 shrink-0 touch-none items-center justify-center rounded text-[#FFAD38] hover:bg-[#FFF8EE] active:bg-[#FFAD38] active:text-[#3D2516] transition-colors cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => startGesture(event, "move")}
                onPointerMove={updateGesture}
                onPointerUp={finishGesture}
                onPointerCancel={cancelGesture}
              >
                <DragOutlined className="text-xs" />
              </button>
            ) : (
              <LockOutlined className="text-[#CB3025] text-xs" title="Terkunci" />
            )}
            <span className="max-w-[120px] truncate text-[11px] font-medium text-[#422B1C]" title={node.name}>
              {node.name} {isLocked ? "(Locked)" : ""}
            </span>
            {node.groupId && (
              <span className="rounded bg-[#FFF8EE] border border-[#FFAD38]/30 px-1 py-0.5 text-[9px] font-semibold text-[#FFAD38]">
                Group
              </span>
            )}
            <span className="text-[10px] tabular-nums text-[#99918A] mr-1" title={`Posisi X:${Math.round(currentPosition.x)}, Y:${Math.round(currentPosition.y)} | Ukuran ${Math.round(currentSize.width)}×${Math.round(currentSize.height)}`}>
              {Math.round(currentSize.width)}×{Math.round(currentSize.height)}
            </span>

            {/* Quick Context Actions */}
            <div className="flex items-center gap-1 border-l border-[#EAE5DF] pl-1.5">
              {onCopyStyle && (
                <Tooltip title="Copy Style">
                  <button
                    type="button"
                    aria-label="Copy Style"
                    className="flex h-5 w-5 items-center justify-center rounded text-[#99918A] hover:bg-[#FFF8EE] hover:text-[#FFAD38]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyStyle(node.id);
                    }}
                  >
                    <CopyOutlined className="text-[11px]" />
                  </button>
                </Tooltip>
              )}

              {onPasteStyle && hasCopiedStyle && (
                <Tooltip title="Paste Style">
                  <button
                    type="button"
                    aria-label="Paste Style"
                    className="flex h-5 w-5 items-center justify-center rounded text-[#258447] hover:bg-[#EAF5EE]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPasteStyle(node.id);
                    }}
                  >
                    <SnippetsOutlined className="text-[11px]" />
                  </button>
                </Tooltip>
              )}

              {onDuplicate && !isLocked && (
                <Tooltip title="Duplikasi">
                  <button
                    type="button"
                    aria-label="Duplicate"
                    className="flex h-5 w-5 items-center justify-center rounded text-[#99918A] hover:bg-[#FFF8EE] hover:text-[#FFAD38]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(node.id);
                    }}
                  >
                    <CopyOutlined className="text-[11px]" />
                  </button>
                </Tooltip>
              )}

              {onMoveLayer && (
                <>
                  <Tooltip title="Turunkan Layer (Send Backward)">
                    <button
                      type="button"
                      aria-label="Send Backward"
                      className="flex h-5 w-5 items-center justify-center rounded text-[#99918A] hover:bg-[#FFF8EE] hover:text-[#FFAD38]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(node.id, -1);
                      }}
                    >
                      <ArrowDownOutlined className="text-[10px]" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Naikkan Layer (Bring Forward)">
                    <button
                      type="button"
                      aria-label="Bring Forward"
                      className="flex h-5 w-5 items-center justify-center rounded text-[#99918A] hover:bg-[#FFF8EE] hover:text-[#FFAD38]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(node.id, 1);
                      }}
                    >
                      <ArrowUpOutlined className="text-[10px]" />
                    </button>
                  </Tooltip>
                </>
              )}

              {onToggleLock && (
                <Tooltip title={isLocked ? "Unlock" : "Lock"}>
                  <button
                    type="button"
                    aria-label={isLocked ? "Unlock" : "Lock"}
                    className={`flex h-5 w-5 items-center justify-center rounded ${
                      isLocked ? "text-[#CB3025] hover:bg-[#FFF8F7]" : "text-[#99918A] hover:bg-[#FFF8EE]"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(node.id);
                    }}
                  >
                    {isLocked ? <LockOutlined className="text-[10px]" /> : <UnlockOutlined className="text-[10px]" />}
                  </button>
                </Tooltip>
              )}

              {onDelete && !isLocked && (
                <Tooltip title="Delete">
                  <button
                    type="button"
                    aria-label="Delete"
                    className="flex h-5 w-5 items-center justify-center rounded text-[#CB3025] hover:bg-[#FFF8F7]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node.id);
                    }}
                  >
                    <DeleteOutlined className="text-[10px]" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Resize handle — bottom-right corner */}
          {!isLocked && (
            <button
              type="button"
              aria-label={`Resize ${node.name}`}
              title="Drag to resize"
              className="absolute -bottom-1.5 -right-1.5 z-20 flex h-4 w-4 touch-none cursor-nwse-resize items-center justify-center rounded-sm border border-[#FFAD38] bg-white text-[#FFAD38] shadow-sm"
              onPointerDown={(event) => startGesture(event, "resize")}
              onPointerMove={updateGesture}
              onPointerUp={finishGesture}
              onPointerCancel={cancelGesture}
            >
              <ExpandOutlined className="text-[9px]" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
