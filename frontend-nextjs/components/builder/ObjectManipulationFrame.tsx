"use client";

import React, { useRef, useState } from "react";
import { DragOutlined, ExpandOutlined, LockOutlined } from "@ant-design/icons";
import {
  BuilderDevice,
  BuilderNode,
  getResponsivePosition,
  getResponsiveProps,
  getResponsiveSize,
} from "./model";

type Point = { x: number; y: number };
type Gesture = {
  pointerId: number;
  mode: "move" | "resize";
  start: Point;
  position: Point;
  size: { width: number; height: number };
};

interface ObjectManipulationFrameProps {
  node: Exclude<BuilderNode, { kind: "section" }>;
  device: BuilderDevice;
  zoom: number;
  selected: boolean;
  editable?: boolean;
  onSelect: () => void;
  onPositionChange: (id: string, position: Point) => void;
  onSizeChange: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  children: React.ReactNode;
}

// Snapping helper: snaps to 8px grid or center guides
function snapCoordinate(val: number, snapThreshold = 6, gridSize = 8): number {
  const remainder = val % gridSize;
  if (remainder < snapThreshold) return val - remainder;
  if (gridSize - remainder < snapThreshold) return val + (gridSize - remainder);
  return val;
}

export function ObjectManipulationFrame({
  node,
  device,
  zoom,
  selected,
  editable = true,
  onSelect,
  onPositionChange,
  onSizeChange,
  children,
}: ObjectManipulationFrameProps) {
  const [gesturePreview, setGesturePreview] = useState<{
    position: Point;
    size: { width: number; height: number };
  } | null>(null);
  const [activeGuide, setActiveGuide] = useState<{ x?: number; y?: number } | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const position = getResponsivePosition(node, device);
  const size = getResponsiveSize(node, device);
  const props = getResponsiveProps(node, device);
  const positionMode = String(props.position || "absolute");
  const currentPosition = gesturePreview?.position ?? position;
  const currentSize = gesturePreview?.size ?? size;
  const isLocked = Boolean(node.locked);

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
      const snappedX = snapCoordinate(rawX);
      const snappedY = snapCoordinate(rawY);
      setActiveGuide({
        x: snappedX !== rawX ? snappedX : undefined,
        y: snappedY !== rawY ? snappedY : undefined,
      });
      setGesturePreview({
        position: { x: snappedX, y: snappedY },
        size: gesture.size,
      });
    } else {
      const rawW = Math.max(24, Math.round(gesture.size.width + dx));
      const rawH = Math.max(24, Math.round(gesture.size.height + dy));
      const snappedW = snapCoordinate(rawW);
      const snappedH = snapCoordinate(rawH);
      setActiveGuide({
        x: snappedW !== rawW ? gesture.position.x + snappedW : undefined,
        y: snappedH !== rawH ? gesture.position.y + snappedH : undefined,
      });
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
      onPositionChange(node.id, {
        x: snapCoordinate(rawX),
        y: snapCoordinate(rawY),
      });
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

  return (
    <div
      className={`absolute box-border ${
        selected
          ? "z-10 outline outline-2 outline-offset-1 outline-[#E99B22]"
          : ""
      }`}
      style={{
        position:
          positionMode === "static" ||
          positionMode === "relative" ||
          positionMode === "sticky" ||
          positionMode === "fixed"
            ? positionMode
            : "absolute",
        left: positionMode === "static" ? undefined : currentPosition.x,
        top: positionMode === "static" ? undefined : currentPosition.y,
        width: currentSize.width,
        height: currentSize.height,
        minWidth:
          editable && Number(props.minWidth) > 0
            ? Number(props.minWidth)
            : undefined,
        maxWidth: editable
          ? Number(props.maxWidth) > 0
            ? Number(props.maxWidth)
            : undefined
          : `max(0px, calc(100% - ${Math.max(0, currentPosition.x)}px))`,
        minHeight:
          Number(props.minHeight) > 0 ? Number(props.minHeight) : undefined,
        maxHeight:
          Number(props.maxHeight) > 0 ? Number(props.maxHeight) : undefined,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="h-full w-full overflow-hidden">{children}</div>

      {/* Alignment / Snapping Guides */}
      {selected && activeGuide?.x !== undefined && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-96 -bottom-96 z-50 w-px border-l border-dashed border-[#ff4d4f]"
          style={{ left: 0 }}
        />
      )}
      {selected && activeGuide?.y !== undefined && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-96 -right-96 z-50 h-px border-t border-dashed border-[#ff4d4f]"
          style={{ top: 0 }}
        />
      )}

      {selected && editable && (
        <>
          <div className="absolute -top-10 left-0 z-30 flex h-8 max-w-[280px] items-center gap-2 whitespace-nowrap rounded-md border border-[#EBD9BE] bg-white px-2 shadow-[0_3px_12px_rgba(58,35,19,0.14)]">
            {!isLocked ? (
              <button
                type="button"
                aria-label={`Move ${node.name}`}
                title="Drag to move"
                className="flex h-6 w-6 shrink-0 touch-none items-center justify-center rounded text-[#9A5A00] hover:bg-[#FFF8EE]"
                onPointerDown={(event) => startGesture(event, "move")}
                onPointerMove={updateGesture}
                onPointerUp={finishGesture}
                onPointerCancel={cancelGesture}
              >
                <DragOutlined />
              </button>
            ) : (
              <LockOutlined className="text-[#ff4d4f] text-xs" title="Terkunci" />
            )}
            <span className="max-w-[150px] truncate text-[11px] font-medium text-[#3A2313]">
              {node.name} {isLocked ? "(Locked)" : ""}
            </span>
            <span className="text-[10px] tabular-nums text-[#765D48]">
              {Math.round(currentSize.width)} × {Math.round(currentSize.height)}
            </span>
          </div>
          {!isLocked && (
            <button
              type="button"
              aria-label={`Resize ${node.name}`}
              title="Drag to resize"
              className="absolute -bottom-1.5 -right-1.5 z-20 flex h-4 w-4 touch-none cursor-nwse-resize items-center justify-center rounded-sm border border-[#d7a148] bg-white text-[#9A5A00] shadow-sm"
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
