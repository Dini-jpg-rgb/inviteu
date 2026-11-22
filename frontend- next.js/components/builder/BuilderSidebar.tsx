"use client";

import React from "react";
import {
  AppstoreOutlined,
  CloudUploadOutlined,
  ContainerOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import { Tabs, Tooltip } from "antd";
import type { TabsProps } from "antd";
import { AssetPanel } from "./AssetPanel";
import { LayersPanel } from "./LayersPanel";
import {
  BuilderDocument,
  BuilderNode,
  ElementType,
  WidgetType,
} from "./model";
import { BuilderAsset } from "./assets";
import styles from "./BuilderSidebar.module.css";

interface BuilderSidebarProps {
  document: BuilderDocument;
  selectedId: string | null;
  selectedNode: BuilderNode | null;
  assets: BuilderAsset[];
  isReadOnly: boolean;
  onSelect: (id: string) => void;
  onAddSection: () => void;
  onAddElement: (type: ElementType, sectionId?: string, parentContainerId?: string) => void;
  onAddWidget: (type: WidgetType, sectionId?: string, parentContainerId?: string) => void;
  onUploadAsset: (asset: BuilderAsset) => void;
  onUseAsset: (asset: BuilderAsset) => void;
  onRenameAsset: (assetId: string, name: string) => void;
  onDeleteAsset: (assetId: string) => void;
  isAssetUsed: (asset: BuilderAsset) => boolean;
  getReferencingTemplates?: (asset: BuilderAsset) => string[];
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToSection: (id: string, sectionId: string) => void;
  onDuplicateToSection?: (id: string, sectionId: string) => void;
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

export function BuilderSidebar(props: BuilderSidebarProps) {
  const assetPanelProps = {
    onAddSection: props.onAddSection,
    onAddElement: props.onAddElement,
    onAddWidget: props.onAddWidget,
    assets: props.assets,
    selectedNode: props.selectedNode,
    isReadOnly: props.isReadOnly,
    onUploadAsset: props.onUploadAsset,
    onUseAsset: props.onUseAsset,
    onRenameAsset: props.onRenameAsset,
    onDeleteAsset: props.onDeleteAsset,
    isAssetUsed: props.isAssetUsed,
    getReferencingTemplates: props.getReferencingTemplates,
  };

  const items: TabsProps["items"] = [
    {
      key: "elements",
      label: (
        <Tooltip title="Elemen Desain (Teks, Media, Tombol, Container)" placement="right">
          <span>
            <AppstoreOutlined />
            Elements
          </span>
        </Tooltip>
      ),
      children: <AssetPanel {...assetPanelProps} mode="elements" />,
    },
    {
      key: "widgets",
      label: (
        <Tooltip title="Widget InviteU (Cover, Event, RSVP, Gallery, Story, dll)" placement="right">
          <span>
            <ContainerOutlined />
            Widgets
          </span>
        </Tooltip>
      ),
      children: <AssetPanel {...assetPanelProps} mode="widgets" />,
    },
    {
      key: "sections_layers",
      label: (
        <Tooltip title="Navigator & Hierarki Layer Section" placement="right">
          <span>
            <OrderedListOutlined />
            Navigator
          </span>
        </Tooltip>
      ),
      children: (
        <LayersPanel
          document={props.document}
          selectedId={props.selectedId}
          onSelect={props.onSelect}
          onRename={props.onRename}
          onToggleVisibility={props.onToggleVisibility}
          onToggleLock={props.onToggleLock}
          onDelete={props.onDelete}
          onDuplicate={props.onDuplicate}
          onDuplicateToSection={props.onDuplicateToSection}
          onMove={props.onMove}
          onMoveToSection={props.onMoveToSection}
          onGroupElements={props.onGroupElements}
          onUngroupElements={props.onUngroupElements}
          onRemoveFromGroup={props.onRemoveFromGroup}
          onAddToGroup={props.onAddToGroup}
          onMoveGroupToSection={props.onMoveGroupToSection}
          onReorderSectionChildren={props.onReorderSectionChildren}
          onReorderSections={props.onReorderSections}
          onMoveToContainer={props.onMoveToContainer}
          onOpenSectionCatalog={props.onOpenSectionCatalog}
          onOpenElementCatalog={props.onOpenElementCatalog}
        />
      ),
    },
    {
      key: "uploads",
      label: (
        <Tooltip title="Pustaka media & font yang diunggah" placement="right">
          <span>
            <CloudUploadOutlined />
            Assets
          </span>
        </Tooltip>
      ),
      children: <AssetPanel {...assetPanelProps} mode="uploads" />,
    },
  ];

  return (
    <aside
      className={`${styles.sidebar} flex h-full min-h-0 min-w-0 w-full shrink-0 flex-col overflow-hidden bg-white`}
    >
      <Tabs
        defaultActiveKey="sections_layers" /* defaultActiveKey="elements" */
        className={styles.tabs}
        items={items}
      />
    </aside>
  );
}
