"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DesktopOutlined,
  EyeOutlined,
  FullscreenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MobileOutlined,
  RedoOutlined,
  SaveOutlined,
  SendOutlined,
  SyncOutlined,
  TabletOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Space, Tag, Tooltip, Typography } from "antd";
import { BuilderDevice } from "./model";
import styles from "./BuilderToolbar.module.css";

const { Text } = Typography;

export type AutosaveState =
  | "saved"
  | "saving"
  | "unsaved"
  | "offline"
  | "failed";

interface BuilderToolbarProps {
  title: string;
  status: string;
  onTitleChange: (title: string) => void;
  mode: "create" | "edit";
  zoom: number;
  device: BuilderDevice;
  canUndo: boolean;
  canRedo: boolean;
  onZoomChange: (zoom: number) => void;
  onDeviceChange: (device: BuilderDevice) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onFullscreen: () => void;
  isReadOnly: boolean;
  hasUnsavedChanges: boolean;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  autosaveStatus?: AutosaveState;
  onSubmitForReview?: () => void;
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (["in_review", "pending_review"].includes(normalized)) return "In Review";
  if (
    ["published", "publish", "approved", "active", "aktif"].includes(normalized)
  )
    return "Aktif";
  if (["expired", "kedaluwarsa"].includes(normalized)) return "Kedaluwarsa";
  if (["archived", "diarsipkan"].includes(normalized)) return "Diarsipkan";
  if (["rejected", "revisi", "revision"].includes(normalized)) return "Perlu Revisi";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function BuilderToolbar({
  title,
  status,
  onTitleChange,
  mode,
  zoom,
  device,
  canUndo,
  canRedo,
  onZoomChange,
  onDeviceChange,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onFullscreen,
  isReadOnly,
  hasUnsavedChanges,
  sidebarCollapsed,
  onToggleSidebar,
  autosaveStatus = "saved",
  onSubmitForReview,
}: BuilderToolbarProps) {
  const normalizedStatus = status.toLowerCase();
  const statusStyle =
    normalizedStatus === "draft"
      ? { backgroundColor: "#3A2313", borderColor: "#3A2313", color: "#FDEBD3" }
      : ["published", "publish", "approved", "active", "aktif"].includes(
          normalizedStatus
        )
        ? { backgroundColor: "#173B2B", borderColor: "#173B2B", color: "#A7E0B8" }
        : ["expired", "kedaluwarsa", "in_review", "pending_review"].includes(
            normalizedStatus
          )
          ? { backgroundColor: "#5C3500", borderColor: "#5C3500", color: "#FCB040" }
          : ["archived", "diarsipkan"].includes(normalizedStatus)
            ? {
                backgroundColor: "transparent",
                borderColor: "#EBD9BE",
                color: "#9A5A00",
              }
            : ["rejected", "revisi", "revision"].includes(normalizedStatus)
              ? {
                  backgroundColor: "#7A2925",
                  borderColor: "#7A2925",
                  color: "#FFD4CE",
                }
              : {
                  backgroundColor: "#FFF8EE",
                  borderColor: "#EBD9BE",
                  color: "#3A2313",
                };

  return (
    <header
      className={`${styles.toolbar} z-10 flex shrink-0 items-center justify-between border-b border-[#EBD9BE] bg-white`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Tooltip
          title={sidebarCollapsed ? "Buka panel samping" : "Tutup panel samping"}
        >
          <Button
            className={styles.sidebarToggle}
            aria-label={
              sidebarCollapsed ? "Buka panel samping" : "Tutup panel samping"
            }
            icon={
              sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            }
            onClick={onToggleSidebar}
          />
        </Tooltip>
        <Link href="/designer/templates">
          <Button
            aria-label="Kembali ke Template Management"
            icon={<ArrowLeftOutlined />}
          />
        </Link>
        <div className={styles.documentDetails}>
          <div className="flex min-w-0 items-center gap-2">
            <Input
              aria-label="Nama template"
              value={title}
              placeholder={mode === "create" ? "Nama template baru" : "Nama template"}
              maxLength={80}
              disabled={isReadOnly}
              onChange={(event) => onTitleChange(event.target.value)}
              className={styles.titleInput}
            />
            <Tag style={statusStyle} className="!mr-0 hidden sm:inline-flex">
              {statusLabel(status)}
            </Tag>

            {/* Autosave status indicator */}
            {autosaveStatus === "saving" ? (
              <Tag color="gold" className="!mr-0 !text-[11px]">
                <SyncOutlined spin className="mr-1" />
                Saving...
              </Tag>
            ) : autosaveStatus === "offline" ? (
              <Tag color="orange" className="!mr-0 !text-[11px]">
                Offline (Waiting to sync)
              </Tag>
            ) : autosaveStatus === "failed" ? (
              <Tag color="error" className="!mr-0 !text-[11px]">
                Save failed
              </Tag>
            ) : autosaveStatus === "saved" && !hasUnsavedChanges ? (
              <Tag color="green" className="!mr-0 !text-[11px]">
                <CheckCircleOutlined className="mr-1" />
                All changes saved
              </Tag>
            ) : (
              <Tag color="gold" className="!mr-0 !text-[11px]">
                Perubahan belum disimpan
              </Tag>
            )}
          </div>
        </div>
      </div>

      <Space size={6} wrap className={styles.actions}>
        {/* Undo / Redo */}
        <Tooltip title="Undo (Ctrl+Z)">
          <Button
            aria-label="Undo"
            icon={<UndoOutlined />}
            disabled={!canUndo || isReadOnly}
            onClick={onUndo}
          />
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <Button
            aria-label="Redo"
            icon={<RedoOutlined />}
            disabled={!canRedo || isReadOnly}
            onClick={onRedo}
          />
        </Tooltip>

        {/* Device preview switcher with single responsive design explanation */}
        <Tooltip title="Inspeksi Viewport: Satu desain responsif untuk semua layar">
          <Select
            aria-label="Inspeksi perangkat"
            value={device}
            onChange={onDeviceChange}
            className="!w-[118px] sm:!w-[140px]"
            options={[
              {
                value: "mobile",
                label: (
                  <Space size={6}>
                    <MobileOutlined />
                    Mobile
                  </Space>
                ),
              },
              {
                value: "tablet",
                label: (
                  <Space size={6}>
                    <TabletOutlined />
                    Tablet
                  </Space>
                ),
              },
              {
                value: "desktop",
                label: (
                  <Space size={6}>
                    <DesktopOutlined />
                    Desktop
                  </Space>
                ),
              },
            ]}
          />
        </Tooltip>

        {/* Zoom Controls */}
        <Tooltip title="Perkecil kanvas">
          <Button
            aria-label="Zoom out"
            icon={<ZoomOutOutlined />}
            onClick={() => onZoomChange(Math.max(40, zoom - 10))}
          />
        </Tooltip>
        <Text className="hidden min-w-10 text-center text-xs tabular-nums sm:block">
          {zoom}%
        </Text>
        <Tooltip title="Perbesar kanvas">
          <Button
            aria-label="Zoom in"
            icon={<ZoomInOutlined />}
            onClick={() => onZoomChange(Math.min(120, zoom + 10))}
          />
        </Tooltip>

        {/* Fullscreen */}
        <Tooltip title="Layar penuh">
          <Button
            className="hidden md:inline-flex"
            aria-label="Layar penuh"
            icon={<FullscreenOutlined />}
            onClick={onFullscreen}
          />
        </Tooltip>

        {/* Preview Button */}
        <Button icon={<EyeOutlined />} onClick={onPreview} className="inline-flex">
          <span className="hidden sm:inline">Preview</span>
        </Button>

        {/* Save Draft Button */}
        <Button
          icon={<SaveOutlined />}
          onClick={onSave}
          disabled={isReadOnly}
          className="!px-2 sm:!px-3"
        >
          <span className="hidden sm:inline">Save Draft</span>
          <span className="sm:hidden">Save</span>
        </Button>

        {/* Submit for Review Button */}
        {onSubmitForReview && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={onSubmitForReview}
            disabled={isReadOnly}
            className="shadow-xs !bg-[#FCB040] !text-[#3A2313] hover:!bg-[#E99B22]"
          >
            <span className="hidden sm:inline">Submit for Review</span>
            <span className="sm:hidden">Submit</span>
          </Button>
        )}
      </Space>
    </header>
  );
}
