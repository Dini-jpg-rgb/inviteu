"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DesktopOutlined,
  EyeOutlined,
  FormOutlined,
  FullscreenOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MobileOutlined,
  RedoOutlined,
  SaveOutlined,
  SendOutlined,
  SyncOutlined,
  TabletOutlined,
  UndoOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Space, Tag, Tooltip, Typography } from "antd";
import { BuilderDevice } from "./model";
import { formatPackageTierLabel, formatTemplateStatusLabel } from "@/lib/template-json";
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
  packageTier?: string;
  onTitleChange: (title: string) => void;
  mode: "create" | "edit";
  zoom: number;
  device: BuilderDevice;
  canUndo: boolean;
  canRedo: boolean;
  onZoomChange: (zoom: number) => void;
  onDeviceChange: (device: BuilderDevice) => void;
  customWidth?: number;
  onCustomWidthChange?: (width?: number) => void;
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
  lastSavedTime?: string;
  onSubmitForReview?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: () => void;
  onOpenRevisionHistory?: () => void;
  onOpenExternalImport?: () => void;
  onCreateRevisionDraft?: () => void;
}

export function BuilderToolbar({
  title,
  status,
  packageTier,
  onTitleChange,
  mode,
  zoom,
  device,
  canUndo,
  canRedo,
  onZoomChange,
  onDeviceChange,
  customWidth: _customWidth,
  onCustomWidthChange,
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
  lastSavedTime,
  onSubmitForReview,
  onExportJSON,
  onImportJSON,
  onOpenRevisionHistory,
  onOpenExternalImport,
  onCreateRevisionDraft,
}: BuilderToolbarProps) {
  const normalizedStatus = status.toLowerCase();
  const statusStyle =
    normalizedStatus === "draft"
      ? { backgroundColor: "#3D2516", borderColor: "#3D2516", color: "#FFF8EE" }
      : ["published", "publish", "approved", "active", "aktif"].includes(
          normalizedStatus
        )
        ? { backgroundColor: "#EAF5EE", borderColor: "#BBE3CA", color: "#258447" }
        : ["expired", "kedaluwarsa", "in_review", "pending_review"].includes(
            normalizedStatus
          )
          ? { backgroundColor: "#FFF8EE", borderColor: "#FFAD38", color: "#422B1C" }
          : ["archived", "diarsipkan"].includes(normalizedStatus)
            ? {
                backgroundColor: "transparent",
                borderColor: "#EAE5DF",
                color: "#99918A",
              }
            : ["rejected", "revisi", "revision"].includes(normalizedStatus)
              ? {
                  backgroundColor: "#FFF8F7",
                  borderColor: "#F8C8C4",
                  color: "#CB3025",
                }
              : {
                  backgroundColor: "#FFF8EE",
                  borderColor: "#EAE5DF",
                  color: "#422B1C",
                };

  return (
    <header
      className={`${styles.toolbar} z-10 flex shrink-0 items-center justify-between border-b border-[#EAE5DF] bg-white`}
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
              {formatTemplateStatusLabel(status)}
            </Tag>
            {packageTier && (
              <Tooltip title="Kompatibilitas Tier Produk InviteU">
                <Tag color="cyan" className="!mr-0 hidden md:inline-flex !font-medium">
                  {formatPackageTierLabel(packageTier)}
                </Tag>
              </Tooltip>
            )}

            {/* Autosave status indicator with local storage explanation */}
            <Tooltip title="Perubahan disimpan otomatis ke sesi browser lokal. Belum tersinkronisasi ke server backend.">
              {autosaveStatus === "saving" ? (
                <Tag color="gold" className="!mr-0 !text-[11px]">
                  <SyncOutlined spin className="mr-1" />
                  Saving...
                </Tag>
              ) : autosaveStatus === "offline" ? (
                <Tag color="orange" className="!mr-0 !text-[11px]">
                  Offline (Menunggu jaringan)
                </Tag>
              ) : autosaveStatus === "failed" ? (
                <Tag color="error" className="!mr-0 !text-[11px]">
                  Save failed
                </Tag>
              ) : autosaveStatus === "saved" && !hasUnsavedChanges ? (
                <Tag color="green" className="!mr-0 !text-[11px]">
                  <CheckCircleOutlined className="mr-1" />
                  Tersimpan {lastSavedTime ? `(${lastSavedTime})` : ""}
                </Tag>
              ) : (
                <Tag color="gold" className="!mr-0 !text-[11px]">
                  Perubahan belum disimpan
                </Tag>
              )}
            </Tooltip>
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

        {/* Device preview switcher: Exactly 3 device preview options (Desktop, Tablet, Mobile) */}
        <Tooltip title="Device Preview: Satu desain utama untuk semua perangkat (Desktop baseline)">
          <Select
            aria-label="Inspeksi perangkat"
            value={device}
            onChange={(val) => {
              if (val === "desktop") {
                onDeviceChange("desktop");
                onCustomWidthChange?.(1440);
              } else if (val === "tablet") {
                onDeviceChange("tablet");
                onCustomWidthChange?.(768);
              } else if (val === "mobile") {
                onDeviceChange("mobile");
                onCustomWidthChange?.(390);
              }
            }}
            className="!w-[130px] sm:!w-[155px]"
            options={[
              {
                value: "desktop",
                label: (
                  <Space size={6}>
                    <DesktopOutlined />
                    Desktop
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
                value: "mobile",
                label: (
                  <Space size={6}>
                    <MobileOutlined />
                    Mobile
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

        {/* Revision History Button */}
        {onOpenRevisionHistory && (
          <Tooltip title="Riwayat Snapshot & Revisi Desain">
            <Button
              icon={<HistoryOutlined />}
              onClick={onOpenRevisionHistory}
              className="inline-flex"
            >
              <span className="hidden lg:inline">Revisi</span>
            </Button>
          </Tooltip>
        )}

        {/* Import JSON Button */}
        {onImportJSON && (
          <Tooltip title="Impor Template JSON internal">
            <Button
              icon={<UploadOutlined />}
              onClick={onImportJSON}
              className="inline-flex"
            >
              <span className="hidden lg:inline">Impor</span>
            </Button>
          </Tooltip>
        )}

        {/* External Design Import Foundation Button */}
        {onOpenExternalImport && (
          <Tooltip title="Arsitektur Import Desain Eksternal (Figma / Elementor)">
            <Button
              icon={<BranchesOutlined />}
              onClick={onOpenExternalImport}
              className="inline-flex hidden xl:inline-flex"
            >
              <span>Figma/Elementor</span>
            </Button>
          </Tooltip>
        )}

        {/* Export JSON Button */}
        {onExportJSON && (
          <Tooltip title="Ekspor atau lihat Template JSON internal">
            <Button
              icon={<CodeOutlined />}
              onClick={onExportJSON}
              className="inline-flex !border-[#EAE5DF] !text-[#422B1C] hover:!border-[#FFAD38]"
            >
              <span className="hidden sm:inline">JSON</span>
            </Button>
          </Tooltip>
        )}

        {/* Create Revision Draft for Published templates */}
        {onCreateRevisionDraft && isReadOnly && ["published", "approved"].includes(normalizedStatus) && (
          <Button
            type="primary"
            icon={<FormOutlined />}
            onClick={onCreateRevisionDraft}
            className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs"
          >
            <span className="hidden sm:inline">Buat Revisi (Revision Draft)</span>
            <span className="sm:hidden">Revisi</span>
          </Button>
        )}

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
            className="shadow-xs !bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] hover:!bg-[#F5A623] !font-semibold"
          >
            <span className="hidden sm:inline">Submit for Review</span>
            <span className="sm:hidden">Submit</span>
          </Button>
        )}
      </Space>
    </header>
  );
}
