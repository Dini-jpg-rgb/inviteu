"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Alert,
  Button,
  Drawer,
  Modal,
  Select,
  Space,
  Tag,
} from "antd";
import { BuilderToolbar, AutosaveState } from "./BuilderToolbar";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderProperties, BuilderMetadata } from "./BuilderProperties";
import { SectionCatalogModal, CatalogSectionTemplate } from "./SectionCatalogModal";
import { ElementCatalogModal, ElementCatalogItem } from "./ElementCatalogModal";
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
  getResponsivePosition,
  getResponsiveProps,
  getResponsiveSize,
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
  for (const section of document.sections) {
    if (section.id === id) return section;
    const child = section.children.find((item) => item.id === id);
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
  const { message } = AntdApp.useApp();
  const router = useRouter();
  const {
    getTemplate,
    createTemplate,
    saveBuilderDraft,
    submitForReview,
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
    toggleVisibility,
    groupElements,
    ungroupElements,
    moveGroupToSection,
    reorderSectionChildren,
    reorderSections,
    undo,
    redo,
  } = useBuilderDocument(initialDocument);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(
    savedTemplate?.id ?? null
  );
  const [status, setStatus] = useState(savedTemplate?.status ?? "draft");
  const [rejectionNote, setRejectionNote] = useState(
    savedTemplate?.rejection_note ?? null
  );
  const [device, setDevice] = useState<BuilderDevice>("mobile");
  const [zoom, setZoom] = useState(80);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGuestMode, setPreviewGuestMode] = useState<"standard" | "full_guest">("standard");
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSectionCatalogOpen, setIsSectionCatalogOpen] = useState(false);
  const [isElementCatalogOpen, setIsElementCatalogOpen] = useState(false);
  const [elementCatalogTargetSectionId, setElementCatalogTargetSectionId] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveState>("saved");
  const [isOnline, setIsOnline] = useState(true);
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
      "Classic",
    primaryColor:
      savedTemplate?.primaryColor ??
      initialData?.primaryColor ??
      "#6f7f5f",
    secondaryColor:
      savedTemplate?.secondaryColor ??
      initialData?.secondaryColor ??
      "#455633",
  };
  const [metadata, setMetadata] = useState<BuilderMetadata>(initialMetadata);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const selectedNode = useMemo(
    () => findNode(document, selectedId),
    [document, selectedId]
  );
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
    (type: ElementType) => {
      if (isReadOnly) return;
      const sectionId =
        selectedNode?.kind === "section"
          ? selectedNode.id
          : findParentId(document, selectedId);
      const id = addElement(type, sectionId);
      setSelectedId(id);
      setIsAssetsOpen(false);
    },
    [addElement, document, isReadOnly, selectedId, selectedNode]
  );

  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      if (isReadOnly) return;
      const sectionId =
        selectedNode?.kind === "section"
          ? selectedNode.id
          : findParentId(document, selectedId);
      const id = addWidget(type, sectionId);
      setSelectedId(id);
      setIsAssetsOpen(false);
    },
    [addWidget, document, isReadOnly, selectedId, selectedNode]
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
        const nextProps = {
          ...node.props,
          [key]: value,
        };
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
          size: {
            ...currentSize,
            height: Math.round(currentSize.width / ratio),
          },
        };
      });
    },
    [isReadOnly, updateObject]
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

      const id =
        selectedNode?.kind === "element" &&
        selectedNode.elementType === asset.type
          ? selectedNode.id
          : addElement(
              asset.type,
              selectedNode?.kind === "section"
                ? selectedNode.id
                : findParentId(document, selectedId)
            );
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
    (_id: string, _key: string) => {},
    []
  );

  const handleUpdatePosition = useCallback(
    (id: string, position: { x?: number; y?: number }) => {
      if (isReadOnly) return;
      updateObject(id, (current) => ({
        ...current,
        position: {
          ...current.position,
          ...position,
        },
      }));
    },
    [isReadOnly, updateObject]
  );

  const handleResetPosition = useCallback(
    (_id: string, _key: "x" | "y") => {},
    []
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
        const responsiveSize = { ...currentSize, ...size };
        if (ratioMatch && size.width !== undefined && size.height === undefined) {
          const ratio = Number(ratioMatch[1]) / Number(ratioMatch[2]);
          if (Number.isFinite(ratio) && ratio > 0) {
            responsiveSize.height = Math.round(responsiveSize.width / ratio);
          }
        }
        return {
          ...current,
          size: responsiveSize,
        };
      });
    },
    [isReadOnly, updateObject]
  );

  const handleResetSize = useCallback(
    (_id: string, _key: "width" | "height") => {},
    []
  );

  const handleSelectCatalogSection = useCallback(
    (catalogItem: CatalogSectionTemplate) => {
      if (isReadOnly) return;
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
    [insertSection, isReadOnly, message]
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
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [hasUnsavedChanges]);

  // Debounced Autosave for local draft with offline persistence
  useEffect(() => {
    if (isReadOnly || !hasUnsavedChanges) return;

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

    setAutosaveStatus("unsaved");
    const timer = setTimeout(() => {
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
    setStatus(normalizedStatus === "rejected" ? "draft" : status);
    if (normalizedStatus === "rejected") setRejectionNote(null);
    message.success(
      "Draft saved in local browser state only; no data was sent to the backend."
    );
  };

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

    if (!metadata.category_name.trim()) {
      warnings.push("Kategori template belum diatur secara spesifik.");
    }

    // 2. Section Checks (Cover & Penutup)
    const sections = document.sections;
    if (sections.length < 2) {
      errors.push("Template wajib memiliki minimal Section Cover dan Penutup.");
    } else {
      const hasCover = sections[0].name.toLowerCase().includes("cover");
      const hasPenutup = sections[sections.length - 1].name
        .toLowerCase()
        .includes("penutup");

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

    // 3. Elements and Content Validation
    let emptyElementsCount = 0;
    let totalElementsCount = 0;
    let brokenMediaCount = 0;

    sections.forEach((sec) => {
      sec.children.forEach((child) => {
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
      });
    });

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
      <div className={`${styles.preview} fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white`}>
        {fontFaceCss && <style>{fontFaceCss}</style>}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] bg-white px-3 py-2 sm:px-5">
          <Space size={8}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setIsPreviewOpen(false)}
            >
              Kembali ke Editor
            </Button>
            <Select
              value={previewGuestMode}
              onChange={setPreviewGuestMode}
              className="!w-[170px]"
              options={[
                { value: "standard", label: "Canvas Preview" },
                { value: "full_guest", label: "Full Guest View" },
              ]}
            />
            <Tag color={hasUnsavedChanges ? "gold" : "green"}>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved locally"}
            </Tag>
          </Space>
          <Space size={8}>
            <Select
              aria-label="Preview device"
              value={device}
              onChange={setDevice}
              className="!w-[128px] sm:!w-[150px]"
              options={[
                { value: "mobile", label: "Mobile" },
                { value: "tablet", label: "Tablet" },
                { value: "desktop", label: "Desktop" },
              ]}
            />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={isReadOnly}
            >
              Save Draft
            </Button>
          </Space>
        </header>

        {previewGuestMode === "full_guest" ? (
          <div className="flex-1 overflow-y-auto bg-stone-100 p-4">
            <div
              className="mx-auto overflow-hidden bg-white shadow-2xl transition-all duration-300 rounded-xl"
              style={{
                width: device === "mobile" ? 390 : device === "tablet" ? 768 : 1080,
                minHeight: "100%",
              }}
            >
              <div className="p-2 border-b border-stone-200 bg-stone-50 text-center text-xs text-stone-500 font-medium">
                Simulasi Undangan Tamu · {device.toUpperCase()}
              </div>
              <BuilderCanvas
                document={document}
                selectedId={null}
                onSelect={() => {}}
                device={device}
                zoom={100}
                title={metadata.name}
                interactive={true}
                editable={false}
                presentationOnly
                fitToViewport={false}
                previewMode
                onPositionChange={() => {}}
                onSizeChange={() => {}}
              />
            </div>
          </div>
        ) : (
          <BuilderCanvas
            document={document}
            selectedId={null}
            onSelect={() => {}}
            device={device}
            zoom={100}
            title={metadata.name}
            interactive={false}
            editable={false}
            presentationOnly
            fitToViewport
            previewMode
            onPositionChange={() => {}}
            onSizeChange={() => {}}
          />
        )}
      </div>
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
      onOpenAssets={() => setIsAssetsOpen(true)}
      onDuplicate={(id) => {
        if (!isReadOnly) setSelectedId(duplicateObject(id));
      }}
      onDelete={(id) => {
        if (isReadOnly) return;
        deleteObject(id);
        setSelectedId(null);
      }}
      onToggleLock={(id) => !isReadOnly && toggleLock(id)}
    />
  );

  return (
    <div className={`${styles.workspace} flex min-h-0 min-w-0 flex-col overflow-hidden bg-white`}>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      <BuilderToolbar
        title={metadata.name}
        status={status}
        onTitleChange={(name) => handleUpdateMetadata("name", name)}
        mode={templateId ? "edit" : mode}
        zoom={zoom}
        device={device}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomChange={setZoom}
        onDeviceChange={setDevice}
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
        onSubmitForReview={handleSubmitForReview}
      />
      <Alert
        banner
        showIcon={false}
        type={normalizedStatus === "rejected" ? "warning" : "info"}
        className="!shrink-0 !rounded-none !border-0 !py-1.5 !text-center !text-xs"
        title={
          isReadOnly
            ? normalizedStatus === "in_review" ||
              normalizedStatus === "pending_review"
              ? "Template is under review and cannot be changed."
              : normalizedStatus === "approved"
                ? "Approved template is read-only in this local Builder."
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
              zoom={zoom}
              title={metadata.name}
              editable={!isReadOnly}
              onPositionChange={handleUpdatePosition}
              onSizeChange={handleUpdateSize}
              onDirectTextChange={(id, text) => {
                if (!isReadOnly) {
                  handleUpdateProp(id, "text", text);
                }
              }}
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
    </div>
  );
}
