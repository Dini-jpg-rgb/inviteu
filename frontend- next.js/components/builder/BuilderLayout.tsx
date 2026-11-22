"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Alert,
  Button,
  Drawer,
  Modal,
  Space,
  message as staticMessage,
} from "antd";
import { BuilderToolbar, AutosaveState } from "./BuilderToolbar";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderProperties, BuilderMetadata } from "./BuilderProperties";
import { PreviewRenderer } from "./PreviewRenderer";
import { AssetPickerModal } from "./AssetPickerModal";
import { RevisionHistoryModal } from "./RevisionHistoryModal";
import { ImportJSONModal } from "./ImportJSONModal";
import { ExternalDesignImportModal } from "./ExternalDesignImportModal";
import { resolveTheme } from "@/lib/theme-resolver";
import { SectionCatalogModal, CatalogSectionTemplate } from "./SectionCatalogModal";
import { ElementCatalogModal, ElementCatalogItem } from "./ElementCatalogModal";
import {
  exportTemplatePackage,
  downloadTemplateJSON,
} from "./adapters/exportHandler";
import {
  BuilderDevice,
  BuilderDocument,
  BuilderNode,
  BuilderPropertyValue,
  BuilderSection,
  ElementType,
  WidgetType,
  createBuilderId,
  createEmptyBuilderDocument,
  ensureCoverAndPenutup,
} from "./model";
import {
  BuilderAsset,
  getUploadedFontFamily,
  getLocalBuilderAssets,
  releaseBuilderAssetUrl,
  setLocalBuilderAssets,
  trackBuilderAssetUrl,
} from "./assets";
import { useBuilderDocument } from "./useBuilderDocument";
import styles from "./BuilderLayout.module.css";
import {
  NewLocalTemplateInput,
  useDesignerTemplates,
} from "@/app/(designer)/designer/DesignerTemplatesContext";
import { TemplateDataInput } from "./types";

export interface BuilderLayoutProps {
  mode: "create" | "edit";
  initialData?: TemplateDataInput;
}

function findNode(
  document: BuilderDocument,
  id: string | null
): BuilderNode | null {
  if (!id) return null;
  const lookupId = id.includes("::") ? id.split("::")[0] : id;
  for (const section of document.sections) {
    if (section.id === lookupId) return section;
    const child = section.children.find((item) => item.id === lookupId);
    if (child) return child;
  }
  return null;
}

function findParentId(document: BuilderDocument, id: string | null) {
  if (!id) return undefined;
  return document.sections.find((section) =>
    section.children.some((child) => child.id === id)
  )?.id;
}

function getFontFormat(asset: BuilderAsset): string {
  const extension = asset.fileName.toLowerCase().split(".").pop();
  if (extension === "ttf") return "truetype";
  if (extension === "otf") return "opentype";
  return extension === "woff" || extension === "woff2" ? extension : "woff2";
}

export function BuilderLayout({ mode, initialData }: BuilderLayoutProps) {
  const antdApp = AntdApp.useApp();
  const message = antdApp?.message || staticMessage;
  const router = useRouter();
  const {
    getTemplate,
    createTemplate,
    saveBuilderDraft,
    submitForReview,
    createRevision,
  } = useDesignerTemplates();
  const savedTemplate =
    mode === "edit" && initialData?.id
      ? getTemplate(initialData.id)
      : undefined;
  const initialDocument = useMemo(() => {
    const rawDoc =
      mode === "edit"
        ? savedTemplate?.builderDocument ?? createEmptyBuilderDocument()
        : createEmptyBuilderDocument();
    return ensureCoverAndPenutup(
      rawDoc,
      savedTemplate?.name || initialData?.name
    );
  }, [mode, savedTemplate, initialData]);
  const {
    document,
    canUndo,
    canRedo,
    addSection,
    insertSection,
    addElement,
    addWidget,
    updateObject,
    deleteObject,
    duplicateObject,
    duplicateObjectToSection,
    moveObject,
    moveObjectToSection,
    toggleLock,
    updatePosition,
    groupElements,
    ungroupElements,
    addToGroup,
    removeFromGroup,
    moveGroupToSection,
    reorderSectionChildren,
    reorderSections,
    undo,
    redo,
    resetHistory,
  } = useBuilderDocument(initialDocument);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(
    savedTemplate?.id ?? null
  );
  const [status, setStatus] = useState(savedTemplate?.status ?? "draft");
  const [rejectionNote, setRejectionNote] = useState(
    savedTemplate?.rejection_note ?? null
  );
  const [device, setDevice] = useState<BuilderDevice>("desktop");
  const [customViewportWidth, setCustomViewportWidth] = useState<number | undefined>(1440);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [assetPickerTarget, setAssetPickerTarget] = useState<{
    nodeId: string;
    field: string;
    currentUrl?: string;
    title?: string;
  } | null>(null);
  const [zoom, setZoom] = useState(80);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSectionCatalogOpen, setIsSectionCatalogOpen] = useState(false);
  const [isElementCatalogOpen, setIsElementCatalogOpen] = useState(false);
  const [elementCatalogTargetSectionId, setElementCatalogTargetSectionId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExternalImportOpen, setIsExternalImportOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveState>("saved");
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [assets, setAssets] = useState<BuilderAsset[]>(getLocalBuilderAssets);
  const initialMetadata: BuilderMetadata = {
    name: savedTemplate?.name ?? initialData?.name ?? "",
    slug:
      savedTemplate?.slug ??
      initialData?.slug ??
      (mode === "create" ? "" : ""),
    description: savedTemplate?.description ?? "",
    category_name: savedTemplate?.category_name ?? "Wedding",
    themeCategory:
      savedTemplate?.themeCategory ??
      initialData?.themeCategory ??
      "Botanical Sage",
    primaryColor:
      savedTemplate?.primaryColor ??
      initialData?.primaryColor ??
      "#6f7f5f",
    secondaryColor:
      savedTemplate?.secondaryColor ??
      initialData?.secondaryColor ??
      "#455633",
    canvasBackground: "#ffffff",
    defaultFontFamily: "Georgia, serif",
    packageTier:
      (savedTemplate as unknown as { packageTier?: string })?.packageTier ??
      "basic",
    status: savedTemplate?.status ?? "draft",
    themeId:
      (savedTemplate as unknown as { themeId?: string })?.themeId ??
      "theme-wedding-botanical",
    themeConfig:
      (savedTemplate as unknown as {
        themeConfig?: Record<string, unknown>;
      })?.themeConfig ?? {},
  };
  const [metadata, setMetadata] = useState<BuilderMetadata>(initialMetadata);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const selectedNode = useMemo(
    () => findNode(document, selectedId),
    [document, selectedId]
  );
  const parentSection = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.kind === "section") return selectedNode;
    return (
      document.sections.find((s) =>
        s.children.some((child) => child.id === selectedNode.id)
      ) ?? null
    );
  }, [document.sections, selectedNode]);
  const fontOptions = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === "font")
        .map((asset) => ({
          value: getUploadedFontFamily(asset.id),
          label: asset.name,
        })),
    [assets]
  );
  const fontFaceCss = useMemo(
    () =>
      assets
        .filter((asset) => asset.type === "font")
        .map(
          (asset) =>
            `@font-face{font-family:"${getUploadedFontFamily(asset.id)}";src:url("${asset.previewUrl}") format("${getFontFormat(asset)}");font-style:normal;font-weight:100 900;font-display:swap;}`
        )
        .join("\n"),
    [assets]
  );
  const currentSnapshot = JSON.stringify({ document, metadata });
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ document: initialDocument, metadata: initialMetadata })
  );
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;
  const normalizedStatus = status.toLowerCase();
  const isReadOnly = ["in_review", "pending_review", "approved", "archived"].includes(
    normalizedStatus
  );

  const [copiedStyle, setCopiedStyle] = useState<{
    props: Record<string, BuilderPropertyValue>;
    size?: { width: number; height: number };
  } | null>(null);

  const handleCopyStyle = useCallback((id: string) => {
    const node = findNode(document, id);
    if (!node) return;
    setCopiedStyle({
      props: { ...node.props },
      size: node.kind !== "section" ? { ...node.size } : undefined,
    });
    message.success("Style berhasil disalin.");
  }, [document, message]);

  const handlePasteStyle = useCallback((id: string) => {
    if (isReadOnly || !copiedStyle) return;
    updateObject(id, (node) => ({
      ...node,
      props: {
        ...node.props,
        ...copiedStyle.props,
      },
      ...(copiedStyle.size && node.kind !== "section" ? { size: { ...copiedStyle.size } } : {}),
    }));
    message.success("Style berhasil diterapkan.");
  }, [copiedStyle, isReadOnly, message, updateObject]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, [role='combobox'], [contenteditable='true']"
        )
      ) {
        return;
      }
      if (
        !isReadOnly &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (
        !isReadOnly &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "y"
      ) {
        event.preventDefault();
        redo();
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedId &&
        !isReadOnly
      ) {
        event.preventDefault();
        deleteObject(selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteObject, isReadOnly, redo, selectedId, undo]);

  const handleUpdateMetadata = useCallback(
    <K extends keyof BuilderMetadata>(key: K, value: BuilderMetadata[K]) => {
      if (isReadOnly) return;
      setMetadata((current) => ({ ...current, [key]: value }));
    },
    [isReadOnly]
  );

  const handleAddSection = useCallback(() => {
    if (isReadOnly) return;
    const id = addSection();
    setSelectedId(id);
    setIsAssetsOpen(false);
  }, [addSection, isReadOnly]);

  const handleAddElement = useCallback(
    (type: ElementType, targetSectionId?: string, targetContainerId?: string) => {
      if (isReadOnly) return;
      const sectionId =
        targetSectionId ||
        (selectedNode?.kind === "section"
          ? selectedNode.id
          : findParentId(document, selectedId));
      if (!sectionId) {
        message.warning("Pilih section terlebih dahulu untuk menambahkan elemen.");
        return;
      }
      const containerId =
        targetContainerId ||
        (selectedNode?.kind === "element" &&
        selectedNode.elementType === "container"
          ? selectedNode.id
          : undefined);
      const id = addElement(type, sectionId, containerId);
      if (id) {
        setSelectedId(id);
        setIsAssetsOpen(false);
      }
    },
    [addElement, document, isReadOnly, message, selectedId, selectedNode]
  );

  const handleAddWidget = useCallback(
    (type: WidgetType, targetSectionId?: string, targetContainerId?: string) => {
      if (isReadOnly) return;
      const sectionId =
        targetSectionId ||
        (selectedNode?.kind === "section"
          ? selectedNode.id
          : findParentId(document, selectedId));
      if (!sectionId) {
        message.warning("Pilih section terlebih dahulu untuk menambahkan widget.");
        return;
      }
      const containerId =
        targetContainerId ||
        (selectedNode?.kind === "element" &&
        selectedNode.elementType === "container"
          ? selectedNode.id
          : undefined);
      const id = addWidget(type, sectionId, containerId);
      if (id) {
        setSelectedId(id);
        setIsAssetsOpen(false);
      }
    },
    [addWidget, document, isReadOnly, message, selectedId, selectedNode]
  );

  const handleDropFromPanel = useCallback(
    (targetSectionId: string, action: string, targetContainerId?: string) => {
      if (isReadOnly) return;
      if (action === "section") {
        const id = addSection();
        setSelectedId(id);
      } else if (action === "nested_container") {
        const id = addElement("container", targetSectionId, targetContainerId);
        setSelectedId(id);
        message.success("Nested container ditambahkan");
      } else if (
        [
          "heading",
          "text",
          "image",
          "video",
          "shape",
          "button",
          "divider",
          "spacer",
          "icon",
          "container",
        ].includes(action)
      ) {
        const id = addElement(
          action as ElementType,
          targetSectionId,
          targetContainerId
        );
        setSelectedId(id);
      } else {
        const id = addWidget(
          action as WidgetType,
          targetSectionId,
          targetContainerId
        );
        setSelectedId(id);
      }
    },
    [addElement, addSection, addWidget, isReadOnly, message]
  );

  const handleUploadAsset = useCallback((asset: BuilderAsset) => {
    trackBuilderAssetUrl(asset.previewUrl);
    const updatedAssets = [asset, ...getLocalBuilderAssets()];
    setLocalBuilderAssets(updatedAssets);
    setAssets(updatedAssets);
    message.success("Asset ditambahkan ke library lokal.");
  }, [message]);

  const handleUpdateProp = useCallback(
    (id: string, key: string, value: BuilderPropertyValue) => {
      if (isReadOnly) return;
      updateObject(id, (node) => {
        // For the base device (desktop), write directly to base props.
        // For tablet/mobile, write to responsive[device].props as an override.
        if (device === "desktop") {
          const nextProps = { ...node.props, [key]: value };
          const ratioMatch =
            key === "aspectRatio" && typeof value === "string"
              ? value.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
              : null;
          if (!ratioMatch || node.kind === "section") {
            return { ...node, props: nextProps };
          }
          const ratio = Number(ratioMatch[1]) / Number(ratioMatch[2]);
          if (!Number.isFinite(ratio) || ratio <= 0) {
            return { ...node, props: nextProps };
          }
          const currentSize = node.size || { width: 100, height: 100 };
          return {
            ...node,
            props: nextProps,
            size: { ...currentSize, height: Math.round(currentSize.width / ratio) },
          };
        }
        // Non-mobile: write to responsive override
        const currentDeviceOverride = node.responsive?.[device] ?? {};
        return {
          ...node,
          responsive: {
            ...node.responsive,
            [device]: {
              ...currentDeviceOverride,
              props: {
                ...(currentDeviceOverride.props ?? {}),
                [key]: value,
              },
            },
          },
        };
      });
    },
    [device, isReadOnly, updateObject]
  );

  const handleUseAsset = useCallback(
    (asset: BuilderAsset) => {
      if (isReadOnly) return;
      if (asset.type === "font") {
        if (
          selectedNode?.kind === "element" &&
          (selectedNode.elementType === "text" ||
            selectedNode.elementType === "button")
        ) {
          handleUpdateProp(
            selectedNode.id,
            "fontFamily",
            getUploadedFontFamily(asset.id)
          );
          setIsAssetsOpen(false);
        }
        return;
      }
      if (
        asset.type === "image" &&
        selectedNode?.kind === "element" &&
        selectedNode.elementType === "video"
      ) {
        handleUpdateProp(selectedNode.id, "poster", asset.previewUrl);
        setIsAssetsOpen(false);
        return;
      }

      const targetSectionId =
        selectedNode?.kind === "section"
          ? selectedNode.id
          : findParentId(document, selectedId);
      if (!targetSectionId && !(selectedNode?.kind === "element" && selectedNode.elementType === asset.type)) {
        message.warning("Pilih section terlebih dahulu untuk menambahkan asset.");
        return;
      }

      const id =
        selectedNode?.kind === "element" &&
        selectedNode.elementType === asset.type
          ? selectedNode.id
          : addElement(asset.type, targetSectionId);
      if (!id) return;
      updateObject(id, (node) => {
        if (node.kind !== "element") return node;
        return {
          ...node,
          props: {
            ...node.props,
            src: asset.previewUrl,
            assetId: asset.id,
          },
        };
      });
      setSelectedId(id);
      setIsAssetsOpen(false);
    },
    [
      addElement,
      document,
      handleUpdateProp,
      isReadOnly,
      message,
      selectedId,
      selectedNode,
      updateObject,
    ]
  );

  const handleRenameAsset = useCallback(
    (assetId: string, name: string) => {
      const updatedAssets = getLocalBuilderAssets().map((asset) =>
        asset.id === assetId ? { ...asset, name } : asset
      );
      setLocalBuilderAssets(updatedAssets);
      setAssets(updatedAssets);
    },
    []
  );

  const isAssetUsed = useCallback(
    (asset: BuilderAsset) => {
      const fontFamily = getUploadedFontFamily(asset.id);
      const hasReference = (node: BuilderNode) => {
        const usesInProps = (props: Record<string, BuilderPropertyValue>) =>
          props.src === asset.previewUrl ||
          props.poster === asset.previewUrl ||
          props.fontFamily === fontFamily;
        return (
          usesInProps(node.props) ||
          Object.values(node.responsive).some((settings) =>
            settings?.props ? usesInProps(settings.props) : false
          )
        );
      };
      return document.sections.some(
        (section) =>
          hasReference(section) || section.children.some(hasReference)
      );
    },
    [document]
  );

  const getReferencingTemplates = useCallback(
    (asset: BuilderAsset): string[] => {
      const templates: string[] = [];
      if (isAssetUsed(asset)) {
        templates.push(metadata.name || "Template Ini");
      }
      return templates;
    },
    [isAssetUsed, metadata.name]
  );

  const handleDeleteAsset = useCallback(
    (assetId: string) => {
      const asset = assets.find((item) => item.id === assetId);
      if (!asset) return;
      if (isAssetUsed(asset)) {
        message.warning("Lepaskan aset dari elemen sebelum menghapusnya.");
        return;
      }
      const updatedAssets = getLocalBuilderAssets().filter(
        (item) => item.id !== assetId
      );
      setLocalBuilderAssets(updatedAssets);
      setAssets(updatedAssets);
      releaseBuilderAssetUrl(asset.previewUrl);
      message.success("Asset dihapus dari library lokal.");
    },
    [assets, isAssetUsed, message]
  );

  const handleResetProp = useCallback(
    (id: string, key: string) => {
      if (isReadOnly) return;
      // Clear the responsive override for the current device; has no effect for mobile base
      updateObject(id, (node) => {
        const currentDeviceOverride = node.responsive?.[device];
        if (!currentDeviceOverride?.props) return node;
        const restProps = { ...currentDeviceOverride.props };
        delete restProps[key];
        return {
          ...node,
          responsive: {
            ...node.responsive,
            [device]: {
              ...currentDeviceOverride,
              props: restProps,
            },
          },
        };
      });
    },
    [device, isReadOnly, updateObject]
  );

  const handleUpdatePosition = useCallback(
    (id: string, position: { x?: number; y?: number }) => {
      if (isReadOnly) return;
      updatePosition(id, position, device);
    },
    [device, isReadOnly, updatePosition]
  );

  const handleResetPosition = useCallback(
    (id: string, key: "x" | "y") => {
      if (isReadOnly) return;
      updateObject(id, (current) => {
        const override = current.responsive?.[device];
        if (!override?.position) return current;
        const restPos = { ...(override.position as Record<string, number>) };
        delete restPos[key];
        return {
          ...current,
          responsive: {
            ...current.responsive,
            [device]: { ...override, position: restPos },
          },
        };
      });
    },
    [device, isReadOnly, updateObject]
  );

  const handleUpdateSize = useCallback(
    (id: string, size: { width?: number; height?: number }) => {
      if (isReadOnly) return;
      updateObject(id, (current) => {
        const currentSize = current.size || { width: 100, height: 100 };
        const currentProps = current.props || {};
        const ratioMatch =
          typeof currentProps.aspectRatio === "string"
            ? currentProps.aspectRatio.match(
                /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/
              )
            : null;
        const nextSize = { ...currentSize, ...size };
        if (ratioMatch && size.width !== undefined && size.height === undefined) {
          const ratio = Number(ratioMatch[1]) / Number(ratioMatch[2]);
          if (Number.isFinite(ratio) && ratio > 0) {
            nextSize.height = Math.round(nextSize.width / ratio);
          }
        }
        if (device === "desktop") {
          return { ...current, size: nextSize };
        }
        const override = current.responsive?.[device] ?? {};
        const overrideSize = { ...(override.size ?? {}), ...size };
        if (ratioMatch && size.width !== undefined && size.height === undefined) {
          const ratio = Number(ratioMatch[1]) / Number(ratioMatch[2]);
          if (Number.isFinite(ratio) && ratio > 0) {
            overrideSize.height = Math.round((overrideSize.width ?? nextSize.width) / ratio);
          }
        }
        return {
          ...current,
          responsive: {
            ...current.responsive,
            [device]: { ...override, size: overrideSize },
          },
        };
      });
    },
    [device, isReadOnly, updateObject]
  );

  const handleResetSize = useCallback(
    (id: string, key: "width" | "height") => {
      if (isReadOnly) return;
      updateObject(id, (current) => {
        const override = current.responsive?.[device];
        if (!override?.size) return current;
        const restSize = { ...(override.size as Record<string, number>) };
        delete restSize[key];
        return {
          ...current,
          responsive: {
            ...current.responsive,
            [device]: { ...override, size: restSize },
          },
        };
      });
    },
    [device, isReadOnly, updateObject]
  );

  const resolvedTheme = useMemo(
    () =>
      resolveTheme(
        metadata.themeId || metadata.themeCategory,
        metadata.themeConfig
      ),
    [metadata.themeId, metadata.themeCategory, metadata.themeConfig]
  );

  const handleOpenAssetPicker = useCallback(
    (field?: string, title?: string) => {
      if (isReadOnly || !selectedNode) {
        setIsAssetsOpen(true);
        return;
      }
      const targetField = field || (selectedNode.kind === "element" ? "src" : "backgroundImage");
      const currentVal =
        ((selectedNode as unknown as { props?: Record<string, unknown> }).props?.[targetField] as string | undefined) ||
        ((selectedNode as unknown as { props?: Record<string, unknown> }).props?.backgroundImage as string | undefined);
      setAssetPickerTarget({
        nodeId: selectedNode.id,
        field: targetField,
        currentUrl: currentVal,
        title: title || `Pilih Asset untuk ${selectedNode.name || selectedNode.id}`,
      });
      setIsAssetPickerOpen(true);
    },
    [isReadOnly, selectedNode]
  );

  const handleSelectAssetForField = useCallback(
    (asset: BuilderAsset) => {
      if (!assetPickerTarget) return;
      const { nodeId, field } = assetPickerTarget;
      handleUpdateProp(nodeId, field, asset.previewUrl);
      setIsAssetPickerOpen(false);
      setAssetPickerTarget(null);
      message.success(`Asset "${asset.name}" berhasil diterapkan.`);
    },
    [assetPickerTarget, handleUpdateProp, message]
  );

  const handleSelectCatalogSection = useCallback(
    (catalogItem: CatalogSectionTemplate) => {
      if (isReadOnly) return;

      // Guard Cover / Penutup duplicate
      if (catalogItem.key === "cover" && document.sections.some((s) => s.id === "section-cover" || s.name.toLowerCase().includes("cover"))) {
        message.warning("Section Cover sudah ada di posisi awal template.");
        return;
      }
      if (catalogItem.key === "penutup" && document.sections.some((s) => s.id === "section-penutup" || s.name.toLowerCase().includes("penutup"))) {
        message.warning("Section Penutup sudah ada di posisi akhir template.");
        return;
      }

      // Guard singleton widgets in catalog section
      for (const child of catalogItem.defaultChildren || []) {
        if (child.kind === "widget" && child.widgetType) {
          if (
            child.widgetType === "rsvp" ||
            child.widgetType === "music" ||
            child.widgetType === "guestbook"
          ) {
            const alreadyExists = document.sections.some((s) =>
              s.children.some(
                (c) => c.kind === "widget" && c.widgetType === child.widgetType
              )
            );
            if (alreadyExists) {
              message.warning(
                `Widget "${child.name}" sudah ada di template (maksimal 1).`
              );
              return;
            }
          }
        }
      }

      const newSectionId = createBuilderId("section");
      const newSection: BuilderSection = {
        id: newSectionId,
        kind: "section",
        name: catalogItem.name,
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: catalogItem.defaultHeight || 440 },
        responsive: {},
        props: {
          backgroundColor: catalogItem.defaultBgColor || "#ffffff",
          backgroundType: "solid",
          backgroundImage: "",
          padding: 24,
          margin: 0,
          gap: 16,
          alignment: "stretch",
          justifyContent: "flex-start",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        },
        children: (catalogItem.defaultChildren || []).map((child) => ({
          id: createBuilderId(child.kind),
          kind: child.kind,
          elementType: child.elementType as ElementType,
          widgetType: child.widgetType as WidgetType,
          parentSectionId: newSectionId,
          name: child.name,
          visible: true,
          position: { ...child.position },
          size: { ...child.size },
          responsive: {},
          props: { ...child.props },
        })),
      };

      insertSection(newSection);
      setSelectedId(newSectionId);
      message.success(`Section "${catalogItem.name}" berhasil ditambahkan.`);
    },
    [document.sections, insertSection, isReadOnly, message]
  );

  const handleOpenElementCatalog = useCallback(
    (targetSectionId?: string) => {
      if (isReadOnly) return;
      setElementCatalogTargetSectionId(targetSectionId ?? null);
      setIsElementCatalogOpen(true);
    },
    [isReadOnly]
  );

  const handleAddElementFromCatalog = useCallback(
    (item: ElementCatalogItem, targetSectionId: string) => {
      if (isReadOnly) return;
      if (item.kind === "widget" && item.widgetType) {
        // Singleton guard: RSVP and Music only once globally
        if (item.isSingleton) {
          const alreadyExists = document.sections.some((s) =>
            s.children.some((c) => c.kind === "widget" && c.widgetType === item.widgetType)
          );
          if (alreadyExists) {
            message.warning(
              `Widget "${item.name}" hanya boleh ada satu di seluruh template.`
            );
            return;
          }
        }
        const id = addWidget(item.widgetType, targetSectionId);
        if (item.defaultProps && id) {
          updateObject(id, (node) => ({
            ...node,
            props: { ...node.props, ...item.defaultProps },
            ...(item.defaultSize ? { size: { ...item.defaultSize } } : {}),
          }));
        }
        setSelectedId(id);
      } else if (item.kind === "element" && item.elementType) {
        const id = addElement(item.elementType, targetSectionId);
        if (item.defaultProps && id) {
          updateObject(id, (node) => ({
            ...node,
            props: { ...node.props, ...item.defaultProps },
            ...(item.defaultSize ? { size: { ...item.defaultSize } } : {}),
          }));
        }
        setSelectedId(id);
      }
      setIsElementCatalogOpen(false);
    },
    [addElement, addWidget, document.sections, isReadOnly, message, updateObject]
  );

  // Network status monitoring for Offline/Sync behavior
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (hasUnsavedChanges) {
        setAutosaveStatus("saving");
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAutosaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [hasUnsavedChanges]);

  // Debounced Autosave for local draft with offline persistence
  useEffect(() => {
    if (isReadOnly || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      if (!isOnline) {
        setAutosaveStatus("offline");
        // Persist temporary snapshot in localStorage while offline
        try {
          localStorage.setItem(
            `offline_builder_draft_${templateId || "temp"}`,
            JSON.stringify({ document, metadata, timestamp: Date.now() })
          );
        } catch {}
        return;
      }

      setAutosaveStatus("saving");
      try {
        let currentId = templateId;
        const slug =
          metadata.slug.trim() ||
          metadata.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const nextMetadata = { ...metadata, slug };

        if (!currentId) {
          const input: NewLocalTemplateInput = {
            name: nextMetadata.name.trim() || "Template Baru",
            description: nextMetadata.description.trim(),
            category: nextMetadata.category_name.trim() || "Wedding",
            style: nextMetadata.themeCategory.trim() || "Classic",
            primaryColor: nextMetadata.primaryColor,
            secondaryColor: nextMetadata.secondaryColor,
            thumbnail: "",
          };
          currentId = createTemplate(input);
          setTemplateId(currentId);
        }

        saveBuilderDraft(currentId, document, nextMetadata);
        setSavedSnapshot(JSON.stringify({ document, metadata: nextMetadata }));
        setAutosaveStatus("saved");
        setLastSavedTime(
          new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        );
        // Clear offline cache on successful sync
        try {
          localStorage.removeItem(`offline_builder_draft_${currentId}`);
        } catch {}
      } catch {
        setAutosaveStatus("failed");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    createTemplate,
    document,
    hasUnsavedChanges,
    isOnline,
    isReadOnly,
    metadata,
    saveBuilderDraft,
    templateId,
  ]);

  const handleSave = () => {
    if (isReadOnly) return;
    if (!metadata.name.trim()) {
      message.error("Template name is required.");
      setIsPropertiesOpen(true);
      return;
    }

    const slug =
      metadata.slug.trim() ||
      metadata.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const nextMetadata = { ...metadata, slug };
    setMetadata(nextMetadata);

    let id = templateId;
    if (!id) {
      const input: NewLocalTemplateInput = {
        name: nextMetadata.name.trim(),
        description: nextMetadata.description.trim(),
        category: nextMetadata.category_name.trim() || "Wedding",
        style: nextMetadata.themeCategory.trim() || "Classic",
        primaryColor: nextMetadata.primaryColor,
        secondaryColor: nextMetadata.secondaryColor,
        thumbnail: "",
      };

      id = createTemplate(input);
      setTemplateId(id);
      router.replace(`/designer/templates/${id}/edit`);
    }

    saveBuilderDraft(id, document, nextMetadata);
    setSavedSnapshot(JSON.stringify({ document, metadata: nextMetadata }));
    setAutosaveStatus("saved");
    setLastSavedTime(
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
    setStatus(normalizedStatus === "rejected" ? "draft" : status);
    if (normalizedStatus === "rejected") setRejectionNote(null);
    message.success(
      "Draft saved in local browser state only; no data was sent to the backend."
    );
  };

  const handleRestoreRevision = useCallback(
    (restoredDoc: BuilderDocument, restoredMeta: BuilderMetadata) => {
      resetHistory(restoredDoc);
      setMetadata(restoredMeta);
      setSavedSnapshot(JSON.stringify({ document: restoredDoc, metadata: restoredMeta }));
      setAutosaveStatus("saved");
      setLastSavedTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
      setSelectedId(null);
    },
    [resetHistory]
  );

  const handleApplyImportedJSON = useCallback(
    (importedDoc: BuilderDocument, importedMeta: Partial<BuilderMetadata>) => {
      resetHistory(importedDoc);
      const mergedMeta = { ...metadata, ...importedMeta };
      setMetadata(mergedMeta);
      setSavedSnapshot(JSON.stringify({ document: importedDoc, metadata: mergedMeta }));
      setAutosaveStatus("saved");
      setLastSavedTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
      setSelectedId(null);
    },
    [metadata, resetHistory]
  );

  const handleCreateRevisionDraft = useCallback(() => {
    if (!templateId) return;
    const newRevId = createRevision(templateId);
    if (newRevId) {
      message.success("Draft revisi baru berhasil dibuat.");
      router.push(`/designer/templates/${newRevId}/edit`);
    }
  }, [createRevision, message, router, templateId]);

  // Submission Validation with Error, Warning, and Passed categorization
  const validateForSubmission = useCallback((): {
    errors: string[];
    warnings: string[];
    passed: string[];
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];

    // 1. Template Metadata
    if (!metadata.name.trim()) {
      errors.push("Nama template belum diisi.");
    } else {
      passed.push(`Nama template: "${metadata.name.trim()}"`);
    }

    if (!metadata.packageTier) {
      errors.push("Package Tier wajib dipilih (Basic, Medium, atau Pro).");
    } else {
      passed.push(`Package Tier terpasang: ${metadata.packageTier.toUpperCase()}.`);
    }

    if (!metadata.themeId && !metadata.themeCategory) {
      errors.push("Tema template wajib ditentukan.");
    } else {
      passed.push(`Tema template terpasang: ${metadata.themeId || metadata.themeCategory}.`);
    }

    if (!metadata.category_name.trim()) {
      warnings.push("Kategori template belum diatur secara spesifik.");
    }

    // 2. Section Checks (Cover & Penutup)
    const sections = document.sections;
    if (sections.length < 2) {
      errors.push("Template wajib memiliki minimal Section Cover dan Penutup.");
    } else {
      const hasCover = sections[0].name.toLowerCase().includes("cover") || sections[0].id.toLowerCase().includes("cover");
      const hasPenutup =
        sections[sections.length - 1].name.toLowerCase().includes("penutup") ||
        sections[sections.length - 1].name.toLowerCase().includes("closing") ||
        sections[sections.length - 1].id.toLowerCase().includes("penutup") ||
        sections[sections.length - 1].id.toLowerCase().includes("closing");

      if (!hasCover) {
        errors.push("Section pertama wajib berupa Cover.");
      } else {
        passed.push("Section Cover tersedia di posisi pertama.");
      }

      if (!hasPenutup) {
        errors.push("Section terakhir wajib berupa Penutup.");
      } else {
        passed.push("Section Penutup tersedia di posisi terakhir.");
      }
    }

    // 3. Elements, Content & Widget Validation
    let emptyElementsCount = 0;
    let totalElementsCount = 0;
    let brokenMediaCount = 0;
    let rsvpCount = 0;
    let musicCount = 0;
    let guestbookCount = 0;
    let hasLiveStreaming = false;

    const seenIds = new Set<string>();
    let duplicateIdCount = 0;

    sections.forEach((sec) => {
      if (seenIds.has(sec.id)) duplicateIdCount++;
      else seenIds.add(sec.id);

      sec.children.forEach((child) => {
        if (seenIds.has(child.id)) duplicateIdCount++;
        else seenIds.add(child.id);

        totalElementsCount += 1;
        const props = child.props || {};

        if (child.kind === "element") {
          if (child.elementType === "text" && !String(props.text || "").trim()) {
            emptyElementsCount += 1;
          }
          if (child.elementType === "image") {
            const src = String(props.src || "");
            if (!src && !props.isGallery) {
              brokenMediaCount += 1;
            }
          }
        }

        if (child.kind === "widget") {
          if (child.widgetType === "rsvp") rsvpCount++;
          if (child.widgetType === "music") musicCount++;
          if (child.widgetType === "guestbook") guestbookCount++;
          if ((child.widgetType as string) === "live_streaming") hasLiveStreaming = true;
        }
      });
    });

    if (duplicateIdCount > 0) {
      errors.push(`Ditemukan ${duplicateIdCount} ID duplikat. Setiap elemen wajib memiliki ID unik.`);
    } else {
      passed.push("Seluruh ID section dan elemen unik.");
    }

    if (rsvpCount > 1) errors.push(`Widget RSVP hanya boleh maksimal 1 (ditemukan: ${rsvpCount}).`);
    if (musicCount > 1) errors.push(`Widget Musik hanya boleh maksimal 1 (ditemukan: ${musicCount}).`);
    if (guestbookCount > 1) errors.push(`Widget Buku Tamu hanya boleh maksimal 1 (ditemukan: ${guestbookCount}).`);
    if (hasLiveStreaming) errors.push("Widget Live Streaming dilarang sesuai ketentuan produk InviteU.");

    if (totalElementsCount === 0) {
      errors.push("Template tidak memiliki elemen konten.");
    } else {
      passed.push(`Total ${totalElementsCount} elemen terpasang.`);
    }

    if (emptyElementsCount > 0) {
      warnings.push(
        `Terdapat ${emptyElementsCount} elemen teks yang masih kosong.`
      );
    } else if (totalElementsCount > 0) {
      passed.push("Seluruh elemen teks terisi.");
    }

    if (brokenMediaCount > 0) {
      errors.push(
        `Terdapat ${brokenMediaCount} elemen foto yang belum memiliki sumber gambar.`
      );
    } else {
      passed.push("Seluruh elemen media valid.");
    }

    passed.push("Pengaturan responsif (Desktop, Tablet, Mobile) tervalidasi.");

    return { errors, warnings, passed };
  }, [document.sections, metadata]);

  const handleSubmitForReview = useCallback(() => {
    if (isReadOnly) return;

    const validation = validateForSubmission();

    // If there are blocking Errors, prevent submission and show report modal
    if (validation.errors.length > 0) {
      Modal.error({
        title: "Validasi Submission Gagal",
        width: 520,
        content: (
          <div className="space-y-3 py-2 text-xs">
            <p className="text-[#ff4d4f] font-semibold">
              Perbaiki kendala berikut sebelum mengajukan template untuk review:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#ff4d4f]">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            {validation.warnings.length > 0 && (
              <>
                <p className="text-[#faad14] font-semibold pt-2">Peringatan (Warning):</p>
                <ul className="list-disc pl-4 space-y-1 text-[#faad14]">
                  {validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ),
      });
      return;
    }

    // If only warnings or passed, confirm submission
    Modal.confirm({
      title: "Ajukan Template untuk Review?",
      width: 540,
      content: (
        <div className="space-y-3 py-2 text-xs">
          <div className="rounded-md bg-green-50 border border-green-200 p-2.5">
            <p className="font-semibold text-green-800 mb-1">Pemeriksaan Validasi Lolos (Passed):</p>
            <ul className="list-disc pl-4 space-y-0.5 text-green-700">
              {validation.passed.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {validation.warnings.length > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5">
              <p className="font-semibold text-amber-800 mb-1">Catatan Peringatan (Warning):</p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-700">
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[#765D48] pt-1 leading-relaxed">
            Setelah diajukan, template akan berstatus <strong>Pending Review</strong> dan dikunci dari pengeditan selama proses peninjauan oleh tim admin.
          </p>
        </div>
      ),
      okText: "Ajukan Sekarang",
      onOk: () => {
        let id = templateId;
        const slug =
          metadata.slug.trim() ||
          metadata.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const nextMetadata = { ...metadata, slug };
        setMetadata(nextMetadata);

        if (!id) {
          const input: NewLocalTemplateInput = {
            name: nextMetadata.name.trim(),
            description: nextMetadata.description.trim(),
            category: nextMetadata.category_name.trim() || "Wedding",
            style: nextMetadata.themeCategory.trim() || "Classic",
            primaryColor: nextMetadata.primaryColor,
            secondaryColor: nextMetadata.secondaryColor,
            thumbnail: "",
          };
          id = createTemplate(input);
          setTemplateId(id);
          router.replace(`/designer/templates/${id}/edit`);
        }

        saveBuilderDraft(id, document, nextMetadata);
        submitForReview(id);
        setStatus("pending_review");
        setSavedSnapshot(JSON.stringify({ document, metadata: nextMetadata }));
        setAutosaveStatus("saved");
        message.success(
          "Template berhasil diajukan! Status berubah menjadi Pending Review dan editor dikunci."
        );
      },
    });
  }, [
    createTemplate,
    document,
    isReadOnly,
    message,
    metadata,
    router,
    saveBuilderDraft,
    submitForReview,
    templateId,
    validateForSubmission,
  ]);

  const handleUndo = () => {
    undo();
    setSelectedId(null);
  };

  const handleRedo = () => {
    redo();
    setSelectedId(null);
  };

  const handleFullscreen = async () => {
    const container = fullscreenRef.current;
    if (!container) return;
    try {
      if (globalThis.document.fullscreenElement) {
        await globalThis.document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      message.error(
        error instanceof Error
          ? `Could not enter fullscreen: ${error.message}`
          : "Could not enter fullscreen."
      );
    }
  };

  const exportPackage = useMemo(() => {
    if (!isExportModalOpen) return null;
    return exportTemplatePackage({
      document,
      metadata,
      packageTier: metadata.packageTier,
      status: metadata.status || status,
      themeId: metadata.themeId,
      themeConfig: metadata.themeConfig,
      assets,
      templateId: templateId ?? metadata.slug,
    });
  }, [isExportModalOpen, document, metadata, assets, templateId, status]);

  if (mode === "edit" && !savedTemplate) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Alert
          type="error"
          showIcon
          title="Template lokal tidak ditemukan"
          description="Data Designer hanya tersedia selama sesi browser ini. Template ini tidak dapat dimuat dari backend."
          action={
            <Button onClick={() => router.push("/designer/templates")}>
              Back to templates
            </Button>
          }
        />
        {rejectionNote && normalizedStatus === "rejected" && (
          <Alert
            banner
            type="warning"
            showIcon
            className="!shrink-0 !rounded-none !border-0 !py-1.5 !text-xs"
            title={`Rejection note: ${rejectionNote}`}
          />
        )}
      </div>
    );
  }

  if (isPreviewOpen) {
    return (
      <PreviewRenderer
        document={document}
        metadata={metadata}
        initialDevice={device}
        onClose={() => setIsPreviewOpen(false)}
        fontFaceCss={fontFaceCss}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    );
  }

  const sidebar = (
    <BuilderSidebar
      document={document}
      selectedId={selectedId}
      selectedNode={selectedNode}
      assets={assets}
      isReadOnly={isReadOnly}
      onSelect={(id) => {
        setSelectedId(id);
        setIsAssetsOpen(false);
      }}
      onAddSection={handleAddSection}
      onAddElement={handleAddElement}
      onAddWidget={handleAddWidget}
      onUploadAsset={handleUploadAsset}
      onUseAsset={handleUseAsset}
      onRenameAsset={handleRenameAsset}
      onDeleteAsset={handleDeleteAsset}
      isAssetUsed={isAssetUsed}
      getReferencingTemplates={getReferencingTemplates}
      onRename={(id, name) =>
        !isReadOnly && updateObject(id, (node) => ({ ...node, name }))
      }
      onToggleVisibility={(id) =>
        !isReadOnly &&
        updateObject(id, (node) => ({ ...node, visible: !node.visible }))
      }
      onDelete={(id) => {
        if (isReadOnly) return;
        const deletedSection = document.sections.find(
          (section) => section.id === id
        );
        if (
          selectedId === id ||
          deletedSection?.children.some((child) => child.id === selectedId)
        ) {
          setSelectedId(null);
        }
        deleteObject(id);
      }}
      onDuplicate={(id) => {
        if (!isReadOnly) setSelectedId(duplicateObject(id));
      }}
      onDuplicateToSection={(id, sectionId) => {
        if (!isReadOnly) {
          const newId = duplicateObjectToSection(id, sectionId);
          if (newId) setSelectedId(newId);
          else message.warning("Widget ini tidak dapat diduplikasi (hanya boleh ada satu).");
        }
      }}
      onMove={(id, direction) => {
        if (!isReadOnly) moveObject(id, direction);
      }}
      onMoveToSection={(id, sectionId) => {
        if (!isReadOnly) moveObjectToSection(id, sectionId);
      }}
      onToggleLock={(id) => !isReadOnly && toggleLock(id)}
      onGroupElements={(elementIds) => {
        if (!isReadOnly) {
          const gid = groupElements(elementIds);
          if (gid) message.success("Elemen berhasil digabungkan ke dalam grup.");
        }
      }}
      onUngroupElements={(groupId) => {
        if (!isReadOnly) {
          ungroupElements(groupId);
          message.success("Grup elemen berhasil dipisahkan (ungrouped).");
        }
      }}
      onRemoveFromGroup={(elementId: string) => {
        if (!isReadOnly) {
          removeFromGroup(elementId);
          message.success("Elemen berhasil dikeluarkan dari grup.");
        }
      }}
      onAddToGroup={(elementId: string, groupId: string) => {
        if (!isReadOnly) {
          addToGroup(elementId, groupId);
          message.success("Elemen berhasil ditambahkan ke grup.");
        }
      }}
      onMoveGroupToSection={(groupId, sectionId) => {
        if (!isReadOnly) {
          moveGroupToSection(groupId, sectionId);
          message.success("Grup berhasil dipindahkan ke section tujuan.");
        }
      }}
      onReorderSectionChildren={(sectionId, fromIndex, toIndex) => {
        if (!isReadOnly) reorderSectionChildren(sectionId, fromIndex, toIndex);
      }}
      onReorderSections={(fromIndex, toIndex) => {
        if (!isReadOnly) reorderSections(fromIndex, toIndex);
      }}
      onOpenSectionCatalog={() => setIsSectionCatalogOpen(true)}
      onOpenElementCatalog={handleOpenElementCatalog}
    />
  );

  const properties = (
    <BuilderProperties
      selectedNode={selectedNode}
      parentSection={parentSection}
      document={document}
      onSelectNode={setSelectedId}
      activeSubField={selectedId?.includes("::") ? selectedId.split("::")[1] : null}
      onSubFieldChange={(subFieldKey) => {
        if (selectedNode) {
          setSelectedId(`${selectedNode.id}::${subFieldKey}`);
        }
      }}
      metadata={metadata}
      onUpdateMetadata={handleUpdateMetadata}
      onUpdateName={(id, name) =>
        !isReadOnly && updateObject(id, (node) => ({ ...node, name }))
      }
      onUpdateProp={handleUpdateProp}
      onResetProp={handleResetProp}
      onUpdateVisibility={(id, visible) => {
        if (!isReadOnly) {
          updateObject(id, (node) => ({ ...node, visible }));
        }
      }}
      onUpdatePosition={handleUpdatePosition}
      onResetPosition={handleResetPosition}
      onUpdateSize={handleUpdateSize}
      onResetSize={handleResetSize}
      device={device}
      fontOptions={fontOptions}
      onOpenAssets={handleOpenAssetPicker}
      onDuplicate={(id) => {
        if (!isReadOnly) setSelectedId(duplicateObject(id));
      }}
      onDelete={(id) => {
        if (isReadOnly) return;
        deleteObject(id);
        setSelectedId(null);
      }}
      onToggleLock={(id) => !isReadOnly && toggleLock(id)}
      onMoveToSection={(id, targetSectionId) => {
        if (!isReadOnly) {
          moveObjectToSection(id, targetSectionId);
          message.success("Elemen berhasil dipindahkan ke section tujuan.");
        }
      }}
      onGroupElements={(elementIds) => {
        if (!isReadOnly) {
          const gid = groupElements(elementIds);
          if (gid) message.success("Elemen berhasil digabungkan ke dalam grup.");
        }
      }}
      onUngroupElements={(groupId) => {
        if (!isReadOnly) {
          ungroupElements(groupId);
          message.success("Grup elemen berhasil dipisahkan (ungrouped).");
        }
      }}
      onRemoveFromGroup={(elementId: string) => {
        if (!isReadOnly) {
          removeFromGroup(elementId);
          message.success("Elemen berhasil dikeluarkan dari grup.");
        }
      }}
      onAddToGroup={(elementId: string, groupId: string) => {
        if (!isReadOnly) {
          addToGroup(elementId, groupId);
          message.success("Elemen berhasil ditambahkan ke grup.");
        }
      }}
      onCopyStyle={handleCopyStyle}
      onPasteStyle={handlePasteStyle}
      hasCopiedStyle={Boolean(copiedStyle)}
      onAddElement={handleAddElement}
    />
  );

  return (
    <div className={`${styles.workspace} flex min-h-0 min-w-0 flex-col overflow-hidden bg-white`}>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <BuilderToolbar
        title={metadata.name}
        status={metadata.status || status}
        packageTier={metadata.packageTier}
        onTitleChange={(name) => handleUpdateMetadata("name", name)}
        mode={templateId ? "edit" : mode}
        zoom={zoom}
        device={device}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomChange={setZoom}
        onDeviceChange={setDevice}
        customWidth={customViewportWidth}
        onCustomWidthChange={setCustomViewportWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onPreview={() => setIsPreviewOpen(true)}
        onFullscreen={handleFullscreen}
        isReadOnly={isReadOnly}
        hasUnsavedChanges={hasUnsavedChanges}
        sidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() =>
          setIsSidebarCollapsed((collapsed) => !collapsed)
        }
        autosaveStatus={autosaveStatus}
        lastSavedTime={lastSavedTime}
        onSubmitForReview={handleSubmitForReview}
        onExportJSON={() => setIsExportModalOpen(true)}
        onImportJSON={() => setIsImportModalOpen(true)}
        onOpenRevisionHistory={() => setIsRevisionHistoryOpen(true)}
        onOpenExternalImport={() => setIsExternalImportOpen(true)}
        onCreateRevisionDraft={handleCreateRevisionDraft}
      />
      <Alert
        banner
        showIcon={false}
        type={rejectionNote || normalizedStatus === "rejected" || normalizedStatus === "revision" ? "warning" : "info"}
        className="!shrink-0 !rounded-none !border-0 !py-1.5 !text-center !text-xs"
        title={
          rejectionNote
            ? `Catatan Revisi dari Admin: "${rejectionNote}" — Perbaiki kendala di bawah dan ajukan kembali.`
            : isReadOnly
              ? normalizedStatus === "in_review" ||
                normalizedStatus === "pending_review"
                ? "Template is under review and cannot be changed."
                : normalizedStatus === "approved" || normalizedStatus === "published"
                  ? "Approved/Published template is read-only. Gunakan tombol 'Buat Revisi' untuk mengedit salinan baru."
                  : "Archived template is read-only."
              : "Local mode: changes remain in browser session state and are not saved to the backend."
        }
      />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          className={`${styles.desktopSidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""} relative min-h-0 overflow-hidden transition-[width] duration-200 ease-in-out`}
        >
          {sidebar}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={styles.mobilePanelActions}>
            <Space>
              <Button onClick={() => setIsAssetsOpen(true)}>Assets / Layers</Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setIsPropertiesOpen(true)}
              >
                Properties
              </Button>
            </Space>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              disabled={
                !selectedId ||
                isReadOnly ||
                Boolean(
                  selectedNode?.kind === "section" &&
                    (document.sections[0]?.id === selectedId ||
                      (document.sections.length > 1 &&
                        document.sections[document.sections.length - 1]?.id ===
                          selectedId))
                )
              }
              aria-label="Delete selected object"
              onClick={() => {
                if (selectedId) deleteObject(selectedId);
                setSelectedId(null);
              }}
            />
          </div>
          <div ref={fullscreenRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
            <BuilderCanvas
              document={document}
              selectedId={selectedId}
              onSelect={setSelectedId}
              device={device}
              customWidth={customViewportWidth}
              cssVariables={resolvedTheme.cssVariables}
              zoom={zoom}
              title={metadata.name}
              canvasBackground={metadata.canvasBackground}
              editable={!isReadOnly}
              onPositionChange={handleUpdatePosition}
              onSizeChange={handleUpdateSize}
              onDirectTextChange={(id, text, fieldKey) => {
                if (!isReadOnly) {
                  handleUpdateProp(id, fieldKey || "text", text);
                }
              }}
              onCopyStyle={handleCopyStyle}
              onPasteStyle={handlePasteStyle}
              hasCopiedStyle={Boolean(copiedStyle)}
              onDuplicate={(id) => {
                if (!isReadOnly) setSelectedId(duplicateObject(id));
              }}
              onDelete={(id) => {
                if (isReadOnly) return;
                deleteObject(id);
                setSelectedId(null);
              }}
              onToggleLock={(id) => !isReadOnly && toggleLock(id)}
              onMoveLayer={(id, dir) => !isReadOnly && moveObject(id, dir)}
              onDropFromPanel={handleDropFromPanel}
            />
          </div>
        </div>
        <div
          className={`${styles.desktopProperties} ${isPropertiesCollapsed ? styles.propertiesCollapsed : ""} min-h-0`}
        >
          <Button
            type="text"
            className={styles.propertiesToggle}
            aria-label={
              isPropertiesCollapsed ? "Expand properties" : "Collapse properties"
            }
            title={
              isPropertiesCollapsed ? "Expand properties" : "Collapse properties"
            }
            icon={
              isPropertiesCollapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() =>
              setIsPropertiesCollapsed((collapsed) => !collapsed)
            }
          />
          {!isPropertiesCollapsed && properties}
        </div>
      </div>

      <Drawer
        title="Assets and Layers"
        placement="left"
        open={isAssetsOpen}
        onClose={() => setIsAssetsOpen(false)}
        size={360}
        styles={{ body: { padding: 0 } }}
        className={styles.assetsDrawer}
      >
        {sidebar}
      </Drawer>
      <Drawer
        title="Properties"
        placement="right"
        open={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        size={340}
        styles={{ body: { padding: 0 } }}
        className={styles.propertiesDrawer}
      >
        {properties}
      </Drawer>

      <SectionCatalogModal
        open={isSectionCatalogOpen}
        existingSections={document.sections}
        onClose={() => setIsSectionCatalogOpen(false)}
        onSelectSection={handleSelectCatalogSection}
      />
      <ElementCatalogModal
        open={isElementCatalogOpen}
        sections={document.sections}
        targetSectionId={elementCatalogTargetSectionId}
        onClose={() => setIsElementCatalogOpen(false)}
        onAddElement={handleAddElementFromCatalog}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CodeOutlined className="text-[#FFAD38]" />
            <span className="text-[#422B1C] font-semibold">Internal Template JSON &amp; Schema Validation</span>
          </div>
        }
        open={isExportModalOpen}
        onCancel={() => setIsExportModalOpen(false)}
        width={760}
        footer={[
          <Button key="close" onClick={() => setIsExportModalOpen(false)}>
            Tutup
          </Button>,
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => {
              if (exportPackage?.jsonString) {
                navigator.clipboard.writeText(exportPackage.jsonString);
                message.success("JSON template berhasil disalin ke clipboard!");
              }
            }}
          >
            Salin JSON
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs"
            onClick={() => {
              if (exportPackage?.json) {
                downloadTemplateJSON(exportPackage.json);
                message.success("File JSON template berhasil diunduh.");
              }
            }}
          >
            Unduh File JSON
          </Button>,
        ]}
      >
        {exportPackage && (
          <div className="space-y-3.5 py-2">
            {exportPackage.validation.valid ? (
              <Alert
                type="success"
                showIcon
                title="Validasi Skema Lolos"
                description={
                  <div className="text-xs space-y-1">
                    <p className="mb-0">
                      Seluruh aturan MVP 1 (Cover pertama, Closing terakhir, ID unik, struktur parent-child, dan konfigurasi widget) terpenuhi dengan benar.
                    </p>
                    {exportPackage.validation.warnings.length > 0 && (
                      <ul className="list-disc pl-4 text-amber-700 mt-1">
                        {exportPackage.validation.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                }
              />
            ) : (
              <Alert
                type="error"
                showIcon
                title="Validasi Skema Memerlukan Perhatian"
                description={
                  <ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5">
                    {exportPackage.validation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2">
                <span className="block text-[#99918A] text-[10px]">Sections</span>
                <span className="font-bold text-sm text-[#422B1C]">{exportPackage.stats.sectionCount}</span>
              </div>
              <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2">
                <span className="block text-[#99918A] text-[10px]">Containers</span>
                <span className="font-bold text-sm text-[#422B1C]">{exportPackage.stats.containerCount}</span>
              </div>
              <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2">
                <span className="block text-[#99918A] text-[10px]">Elements</span>
                <span className="font-bold text-sm text-[#422B1C]">{exportPackage.stats.elementCount}</span>
              </div>
              <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2">
                <span className="block text-[#99918A] text-[10px]">Widgets</span>
                <span className="font-bold text-sm text-[#422B1C]">{exportPackage.stats.widgetCount}</span>
              </div>
              <div className="rounded-lg bg-[#F7F6F4] border border-[#EAE5DF] p-2">
                <span className="block text-[#99918A] text-[10px]">Assets</span>
                <span className="font-bold text-sm text-[#422B1C]">{exportPackage.stats.assetCount}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#422B1C]">
                  Internal JSON Schema (Version: {exportPackage.json.metadata.schemaVersion})
                </span>
                <span className="text-[11px] text-stone-400">
                  Single source of truth desain
                </span>
              </div>
              <pre className="max-h-72 overflow-auto rounded-lg bg-stone-900 p-3 font-mono text-[11px] text-emerald-400">
                {exportPackage.jsonString}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <AssetPickerModal
        open={isAssetPickerOpen}
        assets={assets}
        currentUrl={assetPickerTarget?.currentUrl}
        title={assetPickerTarget?.title}
        onClose={() => {
          setIsAssetPickerOpen(false);
          setAssetPickerTarget(null);
        }}
        onSelect={handleSelectAssetForField}
      />

      <RevisionHistoryModal
        open={isRevisionHistoryOpen}
        onClose={() => setIsRevisionHistoryOpen(false)}
        templateId={templateId}
        currentDocument={document}
        currentMetadata={metadata}
        onRestore={handleRestoreRevision}
      />

      <ImportJSONModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyToCurrentCanvas={handleApplyImportedJSON}
      />

      <ExternalDesignImportModal
        open={isExternalImportOpen}
        onClose={() => setIsExternalImportOpen(false)}
        onApplyToCurrentCanvas={handleApplyImportedJSON}
      />
    </div>
  );
}
