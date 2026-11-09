"use client";

import React, { useRef, useState } from "react";
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
import { BuilderDocument, BuilderNode } from "./model";

const { Text } = Typography;

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
  onMoveGroupToSection?: (groupId: string, sectionId: string) => void;
  onReorderSectionChildren?: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  onOpenSectionCatalog?: () => void;
  onOpenElementCatalog?: (targetSectionId?: string) => void;
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
  onMoveGroupToSection,
  onReorderSectionChildren,
  onReorderSections,
  onOpenSectionCatalog,
  onOpenElementCatalog,
}: LayersPanelProps) {
  const [draggedNodeInfo, setDraggedNodeInfo] = useState<{
    id: string;
    isSection: boolean;
    sectionId?: string;
    index: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const ignoreNextBlurRef = useRef(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set()
  );

  const sectionCount = document.sections.length;
  const objectCount = document.sections.reduce(
    (count, section) => count + 1 + section.children.length,
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

  const renderLayer = (
    node: BuilderNode,
    depth: number,
    index: number,
    siblingCount: number
  ) => {
    const isSection = node.kind === "section";
    const isCover = isSection && index === 0;
    const isPenutup = isSection && index === sectionCount - 1 && sectionCount > 1;
    const isLockedSection = isCover || isPenutup;

    const movableTargets = isSection
      ? []
      : document.sections.filter(
          (section) => section.id !== node.parentSectionId
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
              : onGroupElements
              ? [
                  {
                    key: "group",
                    label: "Group dengan Elemen Lain",
                    onClick: () => onGroupElements([node.id]),
                  },
                ]
              : []),
            ...(node.groupId && onMoveGroupToSection && movableTargets.length
              ? [
                  {
                    key: "move-group-to-section",
                    label: "Pindahkan Grup ke Section",
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

    // Constrained reordering:
    // Cover (index 0) cannot move.
    // Penutup (index length-1) cannot move.
    // Intermediate sections can move up only if index > 1 (cannot swap with Cover).
    // Intermediate sections can move down only if index < length - 2 (cannot swap with Penutup).
    const canMoveUp = isSection
      ? !isLockedSection && index > 1
      : index > 0;
    const canMoveDown = isSection
      ? !isLockedSection && index < sectionCount - 2
      : index < siblingCount - 1;

    return (
      <div
        key={node.id}
        draggable={!isLockedSection}
        onDragStart={(e) => {
          e.stopPropagation();
          setDraggedNodeInfo({
            id: node.id,
            isSection,
            sectionId: isSection ? undefined : node.parentSectionId,
            index,
          });
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!draggedNodeInfo || draggedNodeInfo.id === node.id) return;

          if (isSection && draggedNodeInfo.isSection && onReorderSections) {
            onReorderSections(draggedNodeInfo.index, index);
          } else if (
            !isSection &&
            !draggedNodeInfo.isSection &&
            draggedNodeInfo.sectionId === node.parentSectionId &&
            onReorderSectionChildren
          ) {
            onReorderSectionChildren(node.parentSectionId, draggedNodeInfo.index, index);
          } else if (!isSection && !draggedNodeInfo.isSection && onMoveToSection) {
            onMoveToSection(draggedNodeInfo.id, node.parentSectionId);
          }
          setDraggedNodeInfo(null);
        }}
      >
        <div
          className={`group flex min-h-10 items-center gap-1 rounded-md border px-2 transition-colors ${
            selectedId === node.id
              ? "border-[#FCB040] bg-[#FDEBD3]"
              : "border-transparent hover:border-[#EBD9BE] hover:bg-[#FFF8EE]"
          } ${node.visible ? "" : "opacity-50"}`}
          style={{ marginLeft: depth * 14 }}
          onClick={() => onSelect(node.id)}
        >
          {isSection ? (
            <Button
              type="text"
              size="small"
              aria-label={
                collapsedSections.has(node.id)
                  ? "Buka section"
                  : "Tutup section"
              }
              icon={
                collapsedSections.has(node.id) ? (
                  <RightOutlined />
                ) : (
                  <DownOutlined />
                )
              }
              onClick={(event) => {
                event.stopPropagation();
                setCollapsedSections((current) => {
                  const next = new Set(current);
                  if (next.has(node.id)) next.delete(node.id);
                  else next.add(node.id);
                  return next;
                });
              }}
            />
          ) : (
            <span className="w-5 shrink-0" />
          )}

          {isLockedSection ? (
            <LockOutlined className="shrink-0 text-xs text-[#9A5A00]" />
          ) : (
            <HolderOutlined className="shrink-0 text-[#9A5A00]" />
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
              className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[#3A2313]"
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
            <Tag color="cyan" className="!mr-0 !px-1 !text-[9px]">
              Group
            </Tag>
          )}
          {!isSection && (
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

        {/* Render child layers inside this section */}
        {isSection &&
          !collapsedSections.has(node.id) &&
          node.children.map((child, childIndex) =>
            renderLayer(child, depth + 1, childIndex, node.children.length)
          )}

        {/* Move up / down controls for selected item */}
        {selectedId === node.id && (canMoveUp || canMoveDown) && (
          <div className="flex gap-2 py-1" style={{ marginLeft: depth * 14 + 16 }}>
            {canMoveUp && (
              <Button
                type="link"
                size="small"
                className="!px-0 !text-xs !text-[#9A5A00]"
                onClick={() => onMove(node.id, -1)}
              >
                ↑ Geser Ke Atas
              </Button>
            )}
            {canMoveDown && (
              <Button
                type="link"
                size="small"
                className="!px-0 !text-xs !text-[#9A5A00]"
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
      <div className="flex shrink-0 items-center justify-between border-b border-[#EBD9BE] p-3 bg-[#FFF8EE]/60">
        <div>
          <Text strong className="text-sm text-[#3A2313]">
            Sections & Layers
          </Text>
          <Text type="secondary" className="block text-[11px]">
            {sectionCount} section · {objectCount} objek
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
              className="!text-xs shadow-xs !border-[#EBD9BE] !text-[#765D48] hover:!border-[#FCB040]"
            >
              + Elemen
            </Button>
          )}
          {onOpenSectionCatalog && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onOpenSectionCatalog}
              className="!text-xs shadow-xs"
            >
              + Section
            </Button>
          )}
        </Space>
      </div>

      {/* Main Layers Tree List */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
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
                  className="!text-xs !border-[#EBD9BE] !text-[#765D48] hover:!border-[#FCB040] hover:!text-[#3A2313]"
                >
                  Tambah Section dari Katalog Admin
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#d9dce3] p-5 text-center">
            <Text type="secondary" className="text-xs">
              Memuat struktur section template...
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
