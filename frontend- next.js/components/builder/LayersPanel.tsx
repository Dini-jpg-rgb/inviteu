"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  LockOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Input,
  MenuProps,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { BuilderDocument, BuilderNode, BuilderSectionChild } from "./model";

const { Text } = Typography;

// Palette for group color badges — cycles by groupId hash
const GROUP_COLORS = [
  "#1677ff", // blue
  "#7c3aed", // violet
  "#059669", // green
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
];

function getGroupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

interface WidgetSubElementDef {
  key: string;
  name: string;
  tag: string;
}

const WIDGET_SUB_ELEMENTS: Record<string, WidgetSubElementDef[]> = {
  event_details: [
    { key: "title", name: "Heading Acara", tag: "Title" },
    { key: "badge", name: "Badge / Label Acara", tag: "Badge" },
    { key: "dateText", name: "Kolom Tanggal", tag: "Date" },
    { key: "timeText", name: "Kolom Waktu", tag: "Time" },
    { key: "placeName", name: "Kolom Lokasi Gedung", tag: "Venue" },
    { key: "address", name: "Alamat Lengkap", tag: "Address" },
    { key: "mapButton", name: "Tombol Google Maps", tag: "Button" },
  ],
  digital_gift: [
    { key: "title", name: "Judul Tanda Kasih", tag: "Title" },
    { key: "subtitle", name: "Sub-judul / Pesan", tag: "Text" },
    { key: "bankName", name: "Nama Bank / E-Wallet", tag: "Badge" },
    { key: "accountNumber", name: "Nomor Rekening", tag: "Number" },
    { key: "accountHolder", name: "Nama Pemilik Rekening", tag: "Text" },
    { key: "copyButton", name: "Tombol Salin Rekening", tag: "Button" },
  ],
  story: [
    { key: "badge", name: "Badge Love Story", tag: "Badge" },
    { key: "title", name: "Judul Story", tag: "Title" },
    { key: "subtitle", name: "Sub-judul Story", tag: "Text" },
    { key: "timeline", name: "Daftar Milestone", tag: "List" },
  ],
  love_story: [
    { key: "badge", name: "Badge Love Story", tag: "Badge" },
    { key: "title", name: "Judul Story", tag: "Title" },
    { key: "subtitle", name: "Sub-judul Story", tag: "Text" },
    { key: "timeline", name: "Daftar Milestone", tag: "List" },
  ],
  countdown: [
    { key: "title", name: "Judul Countdown", tag: "Title" },
    { key: "timer_boxes", name: "Kotak Waktu (Hari/Jam/Menit/Detik)", tag: "Timer" },
  ],
};

interface LayersPanelProps {
  document: BuilderDocument;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDuplicateToSection?: (id: string, targetSectionId: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToSection: (id: string, sectionId: string) => void;
  onGroupElements?: (elementIds: string[]) => void;
  onUngroupElements?: (groupId: string) => void;
  onRemoveFromGroup?: (elementId: string) => void;
  onAddToGroup?: (elementId: string, groupId: string) => void;
  onMoveGroupToSection?: (groupId: string, sectionId: string) => void;
  onReorderSectionChildren?: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  onMoveToContainer?: (elementId: string, containerId?: string) => void;
  onOpenSectionCatalog?: () => void;
  onOpenElementCatalog?: (targetSectionId?: string) => void;
}

interface DragInfo {
  id: string;
  isSection: boolean;
  sectionId?: string;
  index: number;
}

export function LayersPanel({
  document,
  selectedId,
  onSelect,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onDuplicateToSection,
  onMove,
  onMoveToSection,
  onGroupElements,
  onUngroupElements,
  onRemoveFromGroup,
  onAddToGroup,
  onMoveGroupToSection,
  onReorderSectionChildren,
  onReorderSections,
  onMoveToContainer,
  onOpenSectionCatalog,
  onOpenElementCatalog,
}: LayersPanelProps) {
  const [draggedNodeInfo, setDraggedNodeInfo] = useState<DragInfo | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const ignoreNextBlurRef = useRef(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedContainers, setCollapsedContainers] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(
    () => new Set()
  );
  // Track drag-enter counter per element to avoid flickering on child elements
  const dragEnterCounterRef = useRef<Map<string, number>>(new Map());

  // Auto-scroll and auto-expand to selected node
  useEffect(() => {
    if (!selectedId) return;

    // Smooth scroll and expand parent nodes
    const timer = setTimeout(() => {
      const actualId = selectedId.includes("::") ? selectedId.split("::")[0] : selectedId;

      // Expand parent section if collapsed
      const parentSec = document.sections.find(
        (s) => s.id === actualId || s.children.some((c) => c.id === actualId)
      );
      if (parentSec) {
        setCollapsedSections((prev) => {
          if (!prev.has(parentSec.id)) return prev;
          const next = new Set(prev);
          next.delete(parentSec.id);
          return next;
        });
      }

      // Expand parent container if collapsed
      const selectedChild = parentSec?.children.find((c) => c.id === actualId);
      if (selectedChild?.parentContainerId) {
        setCollapsedContainers((prev) => {
          if (!prev.has(selectedChild.parentContainerId!)) return prev;
          const next = new Set(prev);
          next.delete(selectedChild.parentContainerId!);
          return next;
        });
      }

      // Expand widget if sub-element is selected
      if (selectedId.includes("::")) {
        const widgetId = selectedId.split("::")[0];
        setCollapsedWidgets((prev) => {
          if (!prev.has(widgetId)) return prev;
          const next = new Set(prev);
          next.delete(widgetId);
          return next;
        });
      }

      const el = listRef.current?.querySelector(`[data-layer-id="${selectedId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedId, document.sections]);

  const sectionCount = document.sections.length;
  const totalElements = document.sections.reduce(
    (count, section) => count + section.children.length,
    0
  );

  const beginRename = (node: BuilderNode) => {
    setRenamingId(node.id);
    setRenamingValue(node.name);
  };

  const finishRename = (id: string) => {
    if (renamingValue.trim()) onRename(id, renamingValue.trim());
    setRenamingId(null);
  };

  const handleDragStart = (info: DragInfo) => {
    setDraggedNodeInfo(info);
    dragEnterCounterRef.current.clear();
  };

  const handleDragEnter = (id: string) => {
    const count = (dragEnterCounterRef.current.get(id) ?? 0) + 1;
    dragEnterCounterRef.current.set(id, count);
    if (count === 1) setDragOverId(id);
  };

  const handleDragLeave = (id: string) => {
    const count = Math.max(0, (dragEnterCounterRef.current.get(id) ?? 1) - 1);
    dragEnterCounterRef.current.set(id, count);
    if (count === 0) setDragOverId((prev) => (prev === id ? null : prev));
  };

  const handleDrop = (
    targetId: string,
    targetIsSection: boolean,
    targetSectionId: string,
    targetIndex: number
  ) => {
    setDragOverId(null);
    dragEnterCounterRef.current.clear();

    if (!draggedNodeInfo || draggedNodeInfo.id === targetId) return;

    if (targetIsSection && draggedNodeInfo.isSection && onReorderSections) {
      if (
        draggedNodeInfo.index <= 0 ||
        draggedNodeInfo.index >= sectionCount - 1 ||
        targetIndex <= 0 ||
        targetIndex >= sectionCount - 1
      ) {
        setDraggedNodeInfo(null);
        return;
      }
      onReorderSections(draggedNodeInfo.index, targetIndex);
    } else if (
      !targetIsSection &&
      !draggedNodeInfo.isSection &&
      draggedNodeInfo.sectionId === targetSectionId &&
      onReorderSectionChildren
    ) {
      onReorderSectionChildren(targetSectionId, draggedNodeInfo.index, targetIndex);
    } else if (!targetIsSection && !draggedNodeInfo.isSection) {
      // Cross-section: move to target section
      onMoveToSection(draggedNodeInfo.id, targetSectionId);
    } else if (targetIsSection && !draggedNodeInfo.isSection) {
      // Drop child onto section header → move to that section
      onMoveToSection(draggedNodeInfo.id, targetId);
    }

    setDraggedNodeInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedNodeInfo(null);
    setDragOverId(null);
    dragEnterCounterRef.current.clear();
  };

  const renderLayer = (
    node: BuilderNode,
    depth: number,
    index: number,
    siblingCount: number,
    allSectionChildren?: BuilderSectionChild[]
  ) => {
    // If search is active, filter out nodes that don't match or have matching descendants
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      const selfMatches = node.name.toLowerCase().includes(trimmedQuery);
      const childMatches =
        node.kind === "section"
          ? node.children.some(
              (c) =>
                c.name.toLowerCase().includes(trimmedQuery) ||
                (c.kind === "element" &&
                  c.elementType === "container" &&
                  node.children.some(
                    (nested) =>
                      nested.parentContainerId === c.id &&
                      nested.name.toLowerCase().includes(trimmedQuery)
                  ))
            )
          : node.kind === "element" && node.elementType === "container"
          ? (allSectionChildren || []).some(
              (nested) =>
                nested.parentContainerId === node.id &&
                nested.name.toLowerCase().includes(trimmedQuery)
            )
          : false;

      if (!selfMatches && !childMatches) {
        return null;
      }
    }

    const isSection = node.kind === "section";
    const isContainer =
      !isSection &&
      node.kind === "element" &&
      node.elementType === "container";
    const isWidget = !isSection && node.kind === "widget";
    const isCover = isSection && index === 0;
    const isPenutup = isSection && index === sectionCount - 1 && sectionCount > 1;
    const isLockedSection = isCover || isPenutup;
    const isDragOver = dragOverId === node.id;

    const movableTargets = isSection
      ? []
      : document.sections.filter(
          (section) => section.id !== node.parentSectionId
        );

    // Determine group color for child elements
    const groupColor =
      !isSection && node.groupId ? getGroupColor(node.groupId) : undefined;

    const currentSection = !isSection
      ? document.sections.find((s) => s.id === (node as BuilderSectionChild).parentSectionId)
      : undefined;
    const siblingElements = currentSection
      ? currentSection.children.filter((c) => c.id !== node.id)
      : [];
    const availableContainers = currentSection
      ? currentSection.children.filter(
          (c) =>
            c.kind === "element" &&
            c.elementType === "container" &&
            c.id !== node.id &&
            c.parentContainerId !== node.id
        )
      : [];
    const ungroupedSiblings = siblingElements.filter((c) => !c.groupId);
    const existingGroupIds = Array.from(
      new Set(
        siblingElements
          .map((c) => c.groupId)
          .filter((g): g is string => Boolean(g && g !== node.groupId))
      )
    );

    // Context menu items
    const menuItems: MenuProps["items"] = [
      ...(isSection && onOpenElementCatalog
        ? [
            {
              key: "add-element",
              icon: <PlusOutlined />,
              label: "Tambah Elemen ke Section Ini",
              onClick: () => onOpenElementCatalog(node.id),
            },
            { type: "divider" as const },
          ]
        : []),
      ...(isContainer && onOpenElementCatalog
        ? [
            {
              key: "add-element-to-container",
              icon: <PlusOutlined />,
              label: "Tambah Elemen ke Container",
              onClick: () => onOpenElementCatalog(currentSection?.id),
            },
            { type: "divider" as const },
          ]
        : []),
      {
        key: "rename",
        label: "Rename",
        onClick: () => beginRename(node),
      },
      ...(!isLockedSection
        ? [
            {
              key: "duplicate",
              icon: <CopyOutlined />,
              label: "Duplicate",
              onClick: () => onDuplicate(node.id),
            },
          ]
        : []),
      ...(!isSection && onMoveToContainer && (availableContainers.length > 0 || (node as BuilderSectionChild).parentContainerId)
        ? [
            {
              key: "move-to-container",
              label: "Pindahkan Container",
              children: [
                ...((node as BuilderSectionChild).parentContainerId
                  ? [
                      {
                        key: "exit-container",
                        label: "↑ Keluar ke Section (Root)",
                        onClick: () => onMoveToContainer(node.id, undefined),
                      },
                    ]
                  : []),
                ...availableContainers.map((c) => ({
                  key: `move-to-cont-${c.id}`,
                  label: `→ ${c.name}`,
                  onClick: () => onMoveToContainer(node.id, c.id),
                })),
              ],
            },
          ]
        : []),
      ...(movableTargets.length
        ? [
            {
              key: "move-to-section",
              label: "Pindahkan ke Section",
              children: movableTargets.map((section) => ({
                key: `move-to-${section.id}`,
                label: section.name,
                onClick: () => onMoveToSection(node.id, section.id),
              })),
            },
            ...(onDuplicateToSection
              ? [
                  {
                    key: "duplicate-to-section",
                    icon: <CopyOutlined />,
                    label: "Duplikasi ke Section Lain",
                    children: movableTargets.map((section) => ({
                      key: `duplicate-to-${section.id}`,
                      label: section.name,
                      onClick: () => onDuplicateToSection(node.id, section.id),
                    })),
                  },
                ]
              : []),
          ]
        : []),
      ...(!isSection
        ? [
            ...(node.groupId && onUngroupElements
              ? [
                  {
                    key: "ungroup",
                    label: "Ungroup Elemen",
                    onClick: () => onUngroupElements(node.groupId!),
                  },
                ]
              : []),
            ...(node.groupId && onRemoveFromGroup
              ? [
                  {
                    key: "remove-from-group",
                    label: "Keluarkan dari Grup",
                    onClick: () => onRemoveFromGroup(node.id),
                  },
                ]
              : []),
            ...(!node.groupId && onGroupElements && ungroupedSiblings.length
              ? [
                  {
                    key: "group-with",
                    label: "Group dengan Elemen...",
                    children: ungroupedSiblings.map((sibling) => ({
                      key: `group-with-${sibling.id}`,
                      label: sibling.name,
                      onClick: () => onGroupElements([node.id, sibling.id]),
                    })),
                  },
                ]
              : []),
            ...(!node.groupId && onAddToGroup && existingGroupIds.length
              ? [
                  {
                    key: "add-to-group",
                    label: "Gabungkan ke Grup...",
                    children: existingGroupIds.map((gid) => ({
                      key: `add-to-group-${gid}`,
                      label: `Grup (${siblingElements.filter((s) => s.groupId === gid).length} elemen)`,
                      onClick: () => onAddToGroup(node.id, gid),
                    })),
                  },
                ]
              : []),
            ...(node.groupId && onMoveGroupToSection && movableTargets.length
              ? [
                  {
                    key: "move-group-to-section",
                    label: "Pindahkan Seluruh Grup ke Section",
                    children: movableTargets.map((section) => ({
                      key: `move-group-${section.id}`,
                      label: section.name,
                      onClick: () =>
                        onMoveGroupToSection(node.groupId!, section.id),
                    })),
                  },
                ]
              : []),
            ...(onToggleLock
              ? [
                  {
                    key: "toggle-lock",
                    icon: <LockOutlined />,
                    label: node.locked ? "Buka Kunci (Unlock)" : "Kunci (Lock)",
                    onClick: () => onToggleLock(node.id),
                  },
                ]
              : []),
          ]
        : []),
      ...(!isLockedSection
        ? [
            { type: "divider" as const },
            {
              key: "delete",
              icon: <DeleteOutlined />,
              danger: true,
              label: "Delete",
              onClick: () => onDelete(node.id),
            },
          ]
        : []),
    ];

    // Constrained reordering logic
    const canMoveUp = isSection
      ? !isLockedSection && index > 1
      : index > 0;
    const canMoveDown = isSection
      ? !isLockedSection && index < sectionCount - 2
      : index < siblingCount - 1;

    const sectionId = isSection
      ? node.id
      : ((node as BuilderSectionChild).parentSectionId as string);

    return (
      <div
        key={node.id}
        draggable={!isLockedSection}
        onDragStart={(e) => {
          e.stopPropagation();
          handleDragStart({
            id: node.id,
            isSection,
            sectionId: isSection ? undefined : sectionId,
            index,
          });
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={(e) => {
          e.stopPropagation();
          handleDragEnter(node.id);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          handleDragLeave(node.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDrop(node.id, isSection, sectionId, index);
        }}
        onDragEnd={handleDragEnd}
      >
        {/* Drop indicator line above */}
        {isDragOver && draggedNodeInfo && draggedNodeInfo.id !== node.id && (
          <div
            aria-hidden
            className="pointer-events-none h-0.5 rounded-full bg-[#1677ff] mx-2 my-0.5"
          />
        )}

        <div
          data-layer-id={node.id}
          className={`group flex min-h-10 items-center gap-1 rounded-md border px-2 transition-colors ${
            selectedId === node.id || (isWidget && selectedId?.startsWith(node.id + "::"))
              ? "border-[#FFAD38] bg-[#FFF8EE]"
              : isDragOver && draggedNodeInfo?.id !== node.id
              ? "border-[#1677ff] bg-[#e6f4ff]"
              : "border-transparent hover:border-[#EAE5DF] hover:bg-[#FFF8EE]"
          } ${node.visible ? "" : "opacity-50"}`}
          style={{
            marginLeft: depth * 14,
            ...(groupColor
              ? { borderLeftColor: groupColor, borderLeftWidth: 2, borderLeftStyle: "solid" }
              : {}),
          }}
          onClick={() => onSelect(node.id)}
        >
          {isSection || isContainer || (isWidget && (WIDGET_SUB_ELEMENTS[(node as any).widgetType]?.length ?? 0) > 0) ? (
            <Button
              type="text"
              size="small"
              aria-label={
                (isSection
                  ? collapsedSections.has(node.id)
                  : isContainer
                  ? collapsedContainers.has(node.id)
                  : collapsedWidgets.has(node.id))
                  ? "Buka"
                  : "Tutup"
              }
              icon={
                (isSection
                  ? collapsedSections.has(node.id)
                  : isContainer
                  ? collapsedContainers.has(node.id)
                  : collapsedWidgets.has(node.id)) ? (
                  <RightOutlined />
                ) : (
                  <DownOutlined />
                )
              }
              onClick={(event) => {
                event.stopPropagation();
                if (isSection) {
                  setCollapsedSections((current) => {
                    const next = new Set(current);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                } else if (isContainer) {
                  setCollapsedContainers((current) => {
                    const next = new Set(current);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                } else {
                  setCollapsedWidgets((current) => {
                    const next = new Set(current);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
                }
              }}
            />
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {isLockedSection ? (
            <LockOutlined className="shrink-0 text-xs text-[#FFAD38]" />
          ) : (
            <HolderOutlined className="shrink-0 text-[#FFAD38]" />
          )}

          {renamingId === node.id ? (
            <Input
              size="small"
              autoFocus
              value={renamingValue}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setRenamingValue(event.target.value)}
              onPressEnter={(event) => event.currentTarget.blur()}
              onBlur={() => {
                if (ignoreNextBlurRef.current) {
                  ignoreNextBlurRef.current = false;
                  setRenamingId(null);
                } else {
                  finishRename(node.id);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  ignoreNextBlurRef.current = true;
                  event.currentTarget.blur();
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[#422B1C]"
              onDoubleClick={(event) => {
                event.stopPropagation();
                beginRename(node);
              }}
              title="Double click untuk rename"
            >
              {node.name}
            </button>
          )}

          {/* Section Badges */}
          {isCover && (
            <Tag color="gold" className="!mr-0 !px-1.5 !text-[9px]">
              Cover (Wajib)
            </Tag>
          )}
          {isPenutup && (
            <Tag color="gold" className="!mr-0 !px-1.5 !text-[9px]">
              Penutup (Wajib)
            </Tag>
          )}
          {isSection && !isLockedSection && (
            <Tag className="!mr-0 !px-1 !text-[9px]">Section</Tag>
          )}
          {!isSection && node.groupId && (
            <Tag
              className="!mr-0 !px-1 !text-[9px]"
              style={{ color: groupColor, borderColor: groupColor, background: `${groupColor}18` }}
            >
              Group
            </Tag>
          )}
          {!isSection && isContainer && (
            <Tag color="cyan" className="!mr-0 !px-1 !text-[9px]">
              Container
            </Tag>
          )}
          {!isSection && !isContainer && (
            <Tag className="!mr-0 !px-1 !text-[9px]">
              {node.kind === "widget" ? "Widget" : "Element"}
            </Tag>
          )}

          <Space
            size={0}
            className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          >
            {!isSection && onToggleLock && (
              <Tooltip title={node.locked ? "Buka Kunci" : "Kunci"}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    node.locked ? (
                      <LockOutlined className="text-[#ff4d4f]" />
                    ) : (
                      <LockOutlined className="opacity-40" />
                    )
                  }
                  aria-label={node.locked ? "Buka kunci objek" : "Kunci objek"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLock(node.id);
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title={node.visible ? "Sembunyikan" : "Tampilkan"}>
              <Button
                type="text"
                size="small"
                icon={
                  node.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
                aria-label={node.visible ? "Sembunyikan objek" : "Tampilkan objek"}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility(node.id);
                }}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                aria-label={`Aksi untuk ${node.name}`}
                onClick={(event) => event.stopPropagation()}
              />
            </Dropdown>
          </Space>
        </div>

        {/* Render child layers inside this section (root elements & containers) */}
        {isSection &&
          !collapsedSections.has(node.id) &&
          node.children
            .filter(
              (c) =>
                !c.parentContainerId ||
                !node.children.some((p) => p.id === c.parentContainerId)
            )
            .map((child, childIndex, arr) =>
              renderLayer(
                child,
                depth + 1,
                childIndex,
                arr.length,
                node.children
              )
            )}

        {/* Render child elements nested inside this container */}
        {isContainer &&
          !collapsedContainers.has(node.id) &&
          (allSectionChildren || [])
            .filter((c) => c.parentContainerId === node.id)
            .map((child, childIndex, arr) =>
              renderLayer(
                child,
                depth + 1,
                childIndex,
                arr.length,
                allSectionChildren
              )
            )}

        {/* Render nested sub-elements inside this widget */}
        {isWidget &&
          !collapsedWidgets.has(node.id) &&
          (WIDGET_SUB_ELEMENTS[(node as any).widgetType] || []).map((subDef) => {
            const subId = `${node.id}::${subDef.key}`;
            const isSubSelected = selectedId === subId;

            return (
              <div
                key={subId}
                data-layer-id={subId}
                className={`group flex min-h-8 items-center gap-1.5 rounded-md border px-2 py-0.5 transition-colors cursor-pointer ${
                  isSubSelected
                    ? "border-[#FFAD38] bg-[#FFF8EE]"
                    : "border-transparent hover:border-[#EAE5DF] hover:bg-[#FFF8EE]/60"
                }`}
                style={{
                  marginLeft: (depth + 1) * 14,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(subId);
                }}
              >
                <span className="w-4 shrink-0 text-center text-[10px] text-[#99918A]">└</span>
                <span className="min-w-0 flex-1 truncate text-xs text-[#422B1C] font-normal">
                  {subDef.name}
                </span>
                <Tag color="orange" className="!mr-0 !px-1 !text-[9px] !leading-tight">
                  {subDef.tag}
                </Tag>
              </div>
            );
          })}

        {/* Move up / down controls for selected item */}
        {selectedId === node.id && (canMoveUp || canMoveDown) && (
          <div className="flex gap-2 py-1" style={{ marginLeft: depth * 14 + 16 }}>
            {canMoveUp && (
              <Button
                type="link"
                size="small"
                className="!px-0 !text-xs !text-[#FFAD38] hover:!text-[#D48816]"
                onClick={() => onMove(node.id, -1)}
              >
                ↑ Geser Ke Atas
              </Button>
            )}
            {canMoveDown && (
              <Button
                type="link"
                size="small"
                className="!px-0 !text-xs !text-[#FFAD38] hover:!text-[#D48816]"
                onClick={() => onMove(node.id, 1)}
              >
                ↓ Geser Ke Bawah
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header with Unified Section & Layer Controls */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-[#EAE5DF] p-3 bg-[#FFF8EE]">
        <div className="flex items-center justify-between">
          <div>
            <Text strong className="text-sm text-[#422B1C]">
              Navigator &amp; Layers
            </Text>
            <Text type="secondary" className="block text-[11px] text-[#99918A]">
              {sectionCount} Section · {totalElements} Elemen
            </Text>
          </div>

          <Space size={6}>
            {onOpenElementCatalog && (
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() =>
                  onOpenElementCatalog(
                    selectedId && document.sections.some((s) => s.id === selectedId)
                      ? selectedId
                      : undefined
                  )
                }
                className="!text-xs shadow-xs !border-[#EAE5DF] !text-[#422B1C] hover:!border-[#FFAD38]"
              >
                Elemen
              </Button>
            )}
            {onOpenSectionCatalog && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={onOpenSectionCatalog}
                className="!text-xs shadow-xs !bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold"
              >
                Section
              </Button>
            )}
          </Space>
        </div>

        {/* Search input for filtering layers */}
        <Input
          prefix={<SearchOutlined className="text-[#FFAD38]" />}
          placeholder="Cari layer / elemen..."
          size="small"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Layers Tree List */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
        {document.sections.length ? (
          <div className="space-y-1">
            {document.sections.map((section, index) =>
              renderLayer(section, 0, index, document.sections.length)
            )}
            {onOpenSectionCatalog && (
              <div className="pt-2">
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={onOpenSectionCatalog}
                  className="!text-xs !border-[#EAE5DF] !text-[#422B1C] hover:!border-[#FFAD38] hover:!text-[#422B1C]"
                >
                  Tambah Section dari Katalog Admin
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#EAE5DF] p-5 text-center">
            <Text type="secondary" className="text-xs text-[#99918A]">
              Memuat struktur section template...
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
