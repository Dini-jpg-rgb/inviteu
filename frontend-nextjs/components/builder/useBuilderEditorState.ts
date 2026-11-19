/**
 * InviteU Page Builder - Editor State Hook (MVP 1)
 *
 * Memisahkan secara ketat antara Editor State (state sementara UI editor)
 * dan Template Data (data dokumen desain yang di-serialize ke JSON).
 *
 * Editor State meliputi:
 * - Seleksi node aktif (selectedId)
 * - Tab inspector aktif (content | style | advanced | theme)
 * - Mode pratinjau perangkat (mobile | tablet | desktop)
 * - Level zoom canvas
 * - State buka/tutup panel & drawer (sidebar, properties, assets, catalog)
 * - Mode preview mandiri (preview modal, guest mode vs canvas mode)
 * - Status autosave / konektivitas
 */

"use client";

import { useCallback, useState } from "react";
import { BuilderDevice } from "./model";
import { AutosaveState } from "./BuilderToolbar";

export interface BuilderEditorState {
  // Seleksi & Navigasi
  selectedId: string | null;
  activeInspectorTab: "content" | "style" | "advanced" | "theme";

  // Responsif & Tampilan Canvas
  device: BuilderDevice;
  zoom: number;

  // Pratinjau
  isPreviewOpen: boolean;
  previewGuestMode: "standard" | "full_guest";

  // Panel & Drawer
  isSidebarCollapsed: boolean;
  isPropertiesCollapsed: boolean;
  isAssetsOpen: boolean;
  isPropertiesOpen: boolean;
  isSectionCatalogOpen: boolean;
  isElementCatalogOpen: boolean;
  elementCatalogTargetSectionId: string | null;
  isExportModalOpen: boolean;

  // Penyimpanan
  autosaveStatus: AutosaveState;
}

export function useBuilderEditorState(initialDevice: BuilderDevice = "mobile") {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    "content" | "style" | "advanced" | "theme"
  >("content");
  const [device, setDevice] = useState<BuilderDevice>(initialDevice);
  const [zoom, setZoom] = useState<number>(80);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGuestMode, setPreviewGuestMode] = useState<
    "standard" | "full_guest"
  >("standard");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSectionCatalogOpen, setIsSectionCatalogOpen] = useState(false);
  const [isElementCatalogOpen, setIsElementCatalogOpen] = useState(false);
  const [
    elementCatalogTargetSectionId,
    setElementCatalogTargetSectionId,
  ] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveState>("saved");

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setIsAssetsOpen(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const toggleProperties = useCallback(() => {
    setIsPropertiesCollapsed((collapsed) => !collapsed);
  }, []);

  const openSectionCatalog = useCallback(() => {
    setIsSectionCatalogOpen(true);
  }, []);

  const closeSectionCatalog = useCallback(() => {
    setIsSectionCatalogOpen(false);
  }, []);

  const openElementCatalog = useCallback((targetSectionId?: string) => {
    setElementCatalogTargetSectionId(targetSectionId ?? null);
    setIsElementCatalogOpen(true);
  }, []);

  const closeElementCatalog = useCallback(() => {
    setIsElementCatalogOpen(false);
    setElementCatalogTargetSectionId(null);
  }, []);

  const openPreview = useCallback(() => {
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  return {
    // State
    selectedId,
    activeInspectorTab,
    device,
    zoom,
    isPreviewOpen,
    previewGuestMode,
    isSidebarCollapsed,
    isPropertiesCollapsed,
    isAssetsOpen,
    isPropertiesOpen,
    isSectionCatalogOpen,
    isElementCatalogOpen,
    elementCatalogTargetSectionId,
    isExportModalOpen,
    autosaveStatus,

    // State Setters
    setSelectedId,
    selectNode,
    setActiveInspectorTab,
    setDevice,
    setZoom,
    setIsPreviewOpen,
    setPreviewGuestMode,
    setIsSidebarCollapsed,
    setIsPropertiesCollapsed,
    setIsAssetsOpen,
    setIsPropertiesOpen,
    setIsSectionCatalogOpen,
    setIsElementCatalogOpen,
    setElementCatalogTargetSectionId,
    setIsExportModalOpen,
    setAutosaveStatus,

    // Actions
    toggleSidebar,
    toggleProperties,
    openSectionCatalog,
    closeSectionCatalog,
    openElementCatalog,
    closeElementCatalog,
    openPreview,
    closePreview,
  };
}
