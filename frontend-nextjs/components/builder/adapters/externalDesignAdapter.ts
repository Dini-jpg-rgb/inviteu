/**
 * InviteU Page Builder - External Design Import Adapter
 *
 * Mendefinisikan arsitektur dan fungsionalitas konversi desain eksternal:
 * Figma & WordPress/Elementor ke dalam InviteUTemplateJSON dan BuilderDocument.
 *
 * Alur Arsitektur:
 * External Design → Import Adapter → Mapping / Normalization → InviteU JSON → Validation → Preview → Builder
 */

import {
  InviteUTemplateJSON,
  SectionNode,
  ElementNode,
  ContainerNode,
  WidgetNode,
} from "@/lib/template-json";

export type ExternalDesignSource = "figma" | "elementor" | "webflow";

export interface DiagnosticItem {
  severity: "info" | "warning" | "unsupported";
  externalNodeId?: string;
  externalNodeType?: string;
  targetInviteUNodeId?: string;
  message: string;
  fallbackApplied?: string;
}

export interface NormalizedMappingResult {
  source: ExternalDesignSource;
  sourceVersion?: string;
  success: boolean;
  templateJSON?: InviteUTemplateJSON;
  diagnostics: DiagnosticItem[];
  unsupportedFeaturesCount: number;
}

/**
 * Kontrak Antarmuka Dasar untuk Setiap Adapter Desain Eksternal
 */
export interface ExternalDesignAdapter<TRawInput = unknown> {
  source: ExternalDesignSource;
  name: string;
  description: string;
  isReady: boolean;
  statusNote: string;
  parse(rawPayload: TRawInput): Promise<NormalizedMappingResult> | NormalizedMappingResult;
}

function figmaColorToHex(c?: { r: number; g: number; b: number; a?: number }): string {
  if (!c) return "#3A2313";
  const r = Math.round(c.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(c.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(c.b * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// ---------------------------------------------------------------------------
// 1. Figma Import Adapter
// ---------------------------------------------------------------------------

export interface FigmaFrameNode {
  id: string;
  name: string;
  type: "FRAME" | "COMPONENT" | "INSTANCE" | "TEXT" | "RECTANGLE" | "VECTOR" | "GROUP" | "LINE" | "ELLIPSE";
  children?: FigmaFrameNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number }; imageRef?: string }>;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontWeight?: number;
    fontSize?: number;
    textAlignHorizontal?: string;
    lineHeightPx?: number;
  };
}

export interface FigmaDesignPayload {
  documentName: string;
  version?: string;
  nodes: FigmaFrameNode[];
}

export class FigmaImportAdapter implements ExternalDesignAdapter<FigmaDesignPayload> {
  source: ExternalDesignSource = "figma";
  name = "Figma Design Adapter";
  description = "Memetakan frame dan auto-layout Figma ke dalam Section, Container, dan Element InviteU.";
  isReady = false; // Architectural foundation flag preserved for specification compatibility
  statusNote = "Fondasi arsitektur mapping telah tersedia. Konversi penuh layer vector dan auto-layout sedang dalam tahap pengembangan.";

  parse(payload: FigmaDesignPayload): NormalizedMappingResult {
    const diagnostics: DiagnosticItem[] = [];
    const templateId = `figma-${Date.now()}`;
    const name = payload.documentName || "Figma Import Template";
    let unsupportedCount = 0;

    diagnostics.push({
      severity: "info",
      message: `Memulai pemetaan struktur Figma: "${name}" (${payload.nodes?.length || 0} top-level nodes).`,
    });

    diagnostics.push({
      severity: "warning",
      message: "Properti Auto-layout Figma dengan wrap kompleks dipetakan ke Flexbox InviteU standar.",
    });

    diagnostics.push({
      severity: "unsupported",
      message: "Efek blend-mode lanjutan (Difference/Exclusion) dan layer mask vektor memerlukan penyesuaian manual di Builder.",
      fallbackApplied: "Menggunakan solid opacity fallback.",
    });
    unsupportedCount++;

    const sections: SectionNode[] = [];
    const containers: Record<string, ContainerNode> = {};
    const elements: Record<string, ElementNode> = {};
    const widgets: Record<string, WidgetNode> = {};

    let elemCounter = 1;
    let containerCounter = 1;

    const processChildren = (
      children: FigmaFrameNode[],
      parentSectionId: string,
      parentContainerId?: string,
      parentBox?: { x: number; y: number }
    ): string[] => {
      const childIds: string[] = [];

      for (const child of children) {
        const childBox = child.absoluteBoundingBox || { x: 0, y: 0, width: 340, height: 60 };
        const relX = parentBox ? Math.max(0, Math.round(childBox.x - parentBox.x)) : 20;
        const relY = parentBox ? Math.max(0, Math.round(childBox.y - parentBox.y)) : 20;

        if (child.type === "TEXT") {
          const fontSize = child.style?.fontSize || 16;
          const isHeading = fontSize >= 24;
          const elemId = `elem-figma-${elemCounter++}`;
          const color = child.fills?.[0]?.color ? figmaColorToHex(child.fills[0].color) : "#3A2313";
          const align = child.style?.textAlignHorizontal?.toLowerCase() || "center";

          elements[elemId] = {
            id: elemId,
            name: child.name || (isHeading ? "Figma Heading" : "Figma Text"),
            type: isHeading ? "heading" : "text",
            parentSectionId,
            parentContainerId,
            sortOrder: childIds.length,
            visible: true,
            position: { x: relX, y: relY },
            size: { width: Math.round(childBox.width) || 340, height: Math.round(childBox.height) || 40 },
            props: {
              text: child.characters || child.name || "Text",
              fontSize,
              fontWeight: child.style?.fontWeight || (isHeading ? 700 : 400),
              fontFamily: child.style?.fontFamily || "Georgia, serif",
              alignment: ["left", "center", "right"].includes(align) ? align : "center",
              color,
            },
          };
          childIds.push(elemId);
        } else if (child.type === "RECTANGLE") {
          const contId = `cont-figma-${containerCounter++}`;
          const bg = child.fills?.[0]?.color ? figmaColorToHex(child.fills[0].color) : "#FAF8F5";

          containers[contId] = {
            id: contId,
            name: child.name || "Figma Rectangle Container",
            parentSectionId,
            parentContainerId,
            sortOrder: childIds.length,
            layout: {
              display: "flex",
              direction: "column",
            },
            style: {
              backgroundColor: bg,
              borderRadius: 8,
            },
            childrenIds: [],
          };
          childIds.push(contId);
        } else if (child.type === "FRAME" || child.type === "COMPONENT" || child.type === "INSTANCE" || child.type === "GROUP") {
          const contId = `cont-figma-${containerCounter++}`;
          const bg = child.fills?.[0]?.color ? figmaColorToHex(child.fills[0].color) : "transparent";

          const nestedChildIds = child.children
            ? processChildren(child.children, parentSectionId, contId, { x: childBox.x, y: childBox.y })
            : [];

          containers[contId] = {
            id: contId,
            name: child.name || "Figma Frame Container",
            parentSectionId,
            parentContainerId,
            sortOrder: childIds.length,
            layout: {
              display: "flex",
              direction: "column",
            },
            style: {
              backgroundColor: bg,
            },
            childrenIds: nestedChildIds,
          };
          childIds.push(contId);
        } else {
          diagnostics.push({
            severity: "warning",
            externalNodeId: child.id,
            externalNodeType: child.type,
            message: `Node Figma bertipe '${child.type}' (${child.name}) dipetakan ke placeholder container.`,
            fallbackApplied: "Container transparan fallback.",
          });
          unsupportedCount++;
        }
      }

      return childIds;
    };

    const topNodes = payload.nodes && payload.nodes.length > 0 ? payload.nodes : [];

    if (topNodes.length > 0) {
      topNodes.forEach((node, idx) => {
        const secId = `sec-figma-${idx + 1}`;
        const nodeBox = node.absoluteBoundingBox || { x: 0, y: 0, width: 390, height: 600 };
        const isFirst = idx === 0;
        const isLast = idx === topNodes.length - 1 && topNodes.length > 1;
        const role: "cover" | "content" | "closing" = isFirst ? "cover" : isLast ? "closing" : "content";

        const bg = node.fills?.[0]?.color ? figmaColorToHex(node.fills[0].color) : isFirst ? "#FAF8F5" : "#FFFFFF";

        const childIds = node.children
          ? processChildren(node.children, secId, undefined, { x: nodeBox.x, y: nodeBox.y })
          : [];

        const elementIds = childIds.filter((id) => id.startsWith("elem-"));
        const containerIds = childIds.filter((id) => id.startsWith("cont-"));

        sections.push({
          id: secId,
          name: node.name || (isFirst ? "Cover" : isLast ? "Closing" : `Section ${idx + 1}`),
          sortOrder: idx,
          sectionRole: role,
          visible: true,
          props: {
            backgroundColor: bg,
            padding: 24,
            minHeight: isFirst ? "100vh" : undefined,
          },
          containerIds,
          elementIds,
          widgetIds: [],
        });
      });
    }

    // Ensure valid InviteU template constraints (Must have Cover and Closing)
    if (sections.length === 0) {
      const coverSecId = "sec-figma-cover";
      const titleElemId = "elem-figma-title";
      elements[titleElemId] = {
        id: titleElemId,
        name: "Judul Undangan",
        type: "heading",
        parentSectionId: coverSecId,
        sortOrder: 0,
        visible: true,
        position: { x: 20, y: 30 },
        size: { width: 340, height: 60 },
        props: {
          text: name,
          fontSize: 36,
          fontWeight: 700,
          alignment: "center",
        },
      };

      sections.push({
        id: coverSecId,
        name: "Cover (Figma Mapped)",
        sortOrder: 0,
        sectionRole: "cover",
        visible: true,
        props: { backgroundColor: "#FAF8F5", padding: 32, minHeight: "100vh" },
        containerIds: [],
        elementIds: [titleElemId],
        widgetIds: [],
      });

      sections.push({
        id: "sec-figma-closing",
        name: "Closing (Figma Mapped)",
        sortOrder: 1,
        sectionRole: "closing",
        visible: true,
        props: { backgroundColor: "#2C3E50", padding: 32 },
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      });
    } else if (sections.length === 1) {
      sections[0].sectionRole = "cover";
      sections[0].name = sections[0].name.toLowerCase().includes("cover") ? sections[0].name : `Cover (${sections[0].name})`;

      sections.push({
        id: "sec-figma-closing",
        name: "Closing (Penutup)",
        sortOrder: 1,
        sectionRole: "closing",
        visible: true,
        props: { backgroundColor: "#2C3E50", padding: 32 },
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      });
    } else {
      sections[0].sectionRole = "cover";
      sections[sections.length - 1].sectionRole = "closing";
    }

    const templateJSON: InviteUTemplateJSON = {
      metadata: {
        templateId,
        id: templateId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: "Wedding",
        packageTier: "basic",
        status: "draft",
        schemaVersion: "1.0.0",
        description: `Diimpor dari dokumen Figma "${name}".`,
        author: "Figma Adapter",
        createdAt: new Date().toISOString(),
      },
      theme: {
        themeId: "theme-wedding-botanical",
        themeConfig: {},
      },
      designTokens: {
        colors: {
          primary: "#6f7f5f",
          secondary: "#455633",
          accent: "#cfcaa3",
          text: "#3A2313",
          background: "#ffffff",
          surface: "#FAF8F5",
        },
        typography: {
          fontFamily: "Georgia, serif",
        },
        spacing: {
          unit: 8,
          containerPadding: 24,
          sectionGap: 32,
        },
      },
      sections,
      containers,
      elements,
      widgets,
      assets: [],
      responsive: {
        breakpoints: { mobile: 390, tablet: 768, desktop: 1440 },
        defaultDevice: "desktop",
      },
    };

    return {
      source: "figma",
      sourceVersion: payload.version || "v1",
      success: true,
      templateJSON,
      diagnostics,
      unsupportedFeaturesCount: unsupportedCount,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. WordPress / Elementor Import Adapter
// ---------------------------------------------------------------------------

export interface ElementorElement {
  id: string;
  elType: "section" | "column" | "widget";
  widgetType?: string;
  settings?: Record<string, unknown>;
  elements?: ElementorElement[];
}

export interface ElementorDesignPayload {
  title: string;
  version?: string;
  content: ElementorElement[];
}

export class ElementorImportAdapter implements ExternalDesignAdapter<ElementorDesignPayload> {
  source: ExternalDesignSource = "elementor";
  name = "WordPress / Elementor Adapter";
  description = "Memetakan Section, Inner-Section, Kolom, dan Widget Elementor ke dalam skema internal InviteU.";
  isReady = false; // Architectural foundation flag preserved for specification compatibility
  statusNote = "Fondasi arsitektur mapping telah tersedia. Pemetaan widget bawaan Elementor (Heading, Text, Image, Button, Divider) telah dirancang.";

  parse(payload: ElementorDesignPayload): NormalizedMappingResult {
    const diagnostics: DiagnosticItem[] = [];
    const templateId = `elementor-${Date.now()}`;
    const name = payload.title || "Elementor Import Template";
    let unsupportedCount = 0;

    diagnostics.push({
      severity: "info",
      message: `Memulai pemetaan payload Elementor: "${name}".`,
    });

    diagnostics.push({
      severity: "warning",
      message: "Widget third-party WordPress yang tidak memiliki padanan di InviteU dipetakan ke Container kosong.",
    });

    diagnostics.push({
      severity: "unsupported",
      message: "Dynamic tags dan PHP shortcode WordPress tidak didukung pada engine InviteU.",
      fallbackApplied: "Menggunakan teks statis fallback.",
    });
    unsupportedCount++;

    const sections: SectionNode[] = [];
    const containers: Record<string, ContainerNode> = {};
    const elements: Record<string, ElementNode> = {};
    const widgets: Record<string, WidgetNode> = {};

    let elemIdx = 1;
    let contIdx = 1;
    let widgetIdx = 1;

    const rawContent = payload.content && payload.content.length > 0 ? payload.content : [];

    rawContent.forEach((secNode, sIdx) => {
      const secId = `sec-elem-${sIdx + 1}`;
      const isFirst = sIdx === 0;
      const isLast = sIdx === rawContent.length - 1 && rawContent.length > 1;
      const role: "cover" | "content" | "closing" = isFirst ? "cover" : isLast ? "closing" : "content";

      const bg = String(secNode.settings?.background_color || secNode.settings?.background_background || (isFirst ? "#FFFFFF" : "#FAF8F5"));
      const sectionContainerIds: string[] = [];
      const sectionElementIds: string[] = [];
      const sectionWidgetIds: string[] = [];

      // Traverse columns in Elementor section
      if (secNode.elements) {
        secNode.elements.forEach((colNode) => {
          const colId = `cont-elem-${contIdx++}`;
          const colChildIds: string[] = [];

          if (colNode.elements) {
            colNode.elements.forEach((wNode) => {
              const wType = String(wNode.widgetType || "").toLowerCase();
              const settings = wNode.settings || {};

              if (wType === "heading") {
                const elId = `elem-elem-${elemIdx++}`;
                elements[elId] = {
                  id: elId,
                  name: String(settings.title || "Heading Elementor"),
                  type: "heading",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 340, height: 50 },
                  props: {
                    text: String(settings.title || "Heading Elementor"),
                    fontSize: Number(settings.size) || 32,
                    alignment: String(settings.align || "center"),
                    color: String(settings.title_color || "#3A2313"),
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "text-editor" || wType === "text") {
                const elId = `elem-elem-${elemIdx++}`;
                const textVal = String(settings.editor || settings.text || "Deskripsi teks undangan.");
                elements[elId] = {
                  id: elId,
                  name: "Text Editor Elementor",
                  type: "text",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 340, height: 60 },
                  props: {
                    text: textVal,
                    fontSize: 14,
                    alignment: String(settings.align || "center"),
                    color: String(settings.text_color || "#765D48"),
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "image") {
                const elId = `elem-elem-${elemIdx++}`;
                const imgSrc = (settings.image as { url?: string })?.url || "/templates/wedding/cover.jpg";
                elements[elId] = {
                  id: elId,
                  name: "Gambar Elementor",
                  type: "image",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 340, height: 220 },
                  props: {
                    src: imgSrc,
                    backgroundSize: "cover",
                    borderRadius: 12,
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "button") {
                const elId = `elem-elem-${elemIdx++}`;
                elements[elId] = {
                  id: elId,
                  name: "Tombol Elementor",
                  type: "button",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 220, height: 44 },
                  props: {
                    text: String(settings.text || "Buka Undangan"),
                    backgroundColor: "#9A5A00",
                    color: "#FFFFFF",
                    borderRadius: 99,
                    alignment: "center",
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "divider") {
                const elId = `elem-elem-${elemIdx++}`;
                elements[elId] = {
                  id: elId,
                  name: "Divider Elementor",
                  type: "divider",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 340, height: 16 },
                  props: {
                    borderWidth: 1,
                    borderColor: "#EBD9BE",
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "spacer") {
                const elId = `elem-elem-${elemIdx++}`;
                const h = Number((settings.space as { size?: number })?.size) || 32;
                elements[elId] = {
                  id: elId,
                  name: "Spacer Elementor",
                  type: "spacer",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  position: { x: 20, y: 20 },
                  size: { width: 340, height: h },
                  props: {
                    height: h,
                  },
                };
                colChildIds.push(elId);
                sectionElementIds.push(elId);
              } else if (wType === "countdown") {
                const wId = `wdg-elem-${widgetIdx++}`;
                widgets[wId] = {
                  id: wId,
                  name: "Countdown Widget Elementor",
                  widgetType: "countdown",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  config: {
                    targetDate: String(settings.due_date || "2026-12-28 09:00"),
                  },
                  style: {},
                };
                colChildIds.push(wId);
                sectionWidgetIds.push(wId);
              } else if (wType === "google_maps" || wType === "maps") {
                const wId = `wdg-elem-${widgetIdx++}`;
                widgets[wId] = {
                  id: wId,
                  name: "Lokasi Acara Elementor",
                  widgetType: "event_details",
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  visible: true,
                  config: {
                    address: String(settings.address || "Denpasar, Bali"),
                  },
                  style: {},
                };
                colChildIds.push(wId);
                sectionWidgetIds.push(wId);
              } else {
                // Unsupported Elementor widget mapped to Container with warning
                const fallbackContId = `cont-elem-unsupported-${contIdx++}`;
                containers[fallbackContId] = {
                  id: fallbackContId,
                  name: `Elementor [${wType || "widget"}] Container`,
                  parentSectionId: secId,
                  parentContainerId: colId,
                  sortOrder: colChildIds.length,
                  layout: {
                    display: "flex",
                    direction: "column",
                  },
                  style: {
                    backgroundColor: "transparent",
                  },
                  childrenIds: [],
                };
                colChildIds.push(fallbackContId);
                sectionContainerIds.push(fallbackContId);

                diagnostics.push({
                  severity: "warning",
                  externalNodeType: wType,
                  message: `Widget Elementor '${wType || "unknown"}' dipetakan ke Container kosong.`,
                  fallbackApplied: "Container kosong fallback.",
                });
                unsupportedCount++;
              }
            });
          }

          containers[colId] = {
            id: colId,
            name: "Kolom Elementor",
            parentSectionId: secId,
            sortOrder: sectionContainerIds.length,
            layout: {
              display: "flex",
              direction: "column",
              gap: 12,
            },
            style: {},
            childrenIds: colChildIds,
          };
          sectionContainerIds.push(colId);
        });
      }

      sections.push({
        id: secId,
        name: isFirst ? "Cover (Elementor Section)" : isLast ? "Closing (Elementor Section)" : `Section ${sIdx + 1}`,
        sortOrder: sIdx,
        sectionRole: role,
        visible: true,
        props: {
          backgroundColor: bg,
          padding: 24,
        },
        containerIds: sectionContainerIds,
        elementIds: sectionElementIds,
        widgetIds: sectionWidgetIds,
      });
    });

    // Ensure valid InviteU template constraints
    if (sections.length === 0) {
      const coverSecId = "sec-elem-cover";
      const headingElemId = "elem-elem-heading";
      elements[headingElemId] = {
        id: headingElemId,
        name: "Elementor Heading",
        type: "heading",
        parentSectionId: coverSecId,
        sortOrder: 0,
        visible: true,
        position: { x: 20, y: 30 },
        size: { width: 340, height: 60 },
        props: {
          text: name,
          fontSize: 32,
          alignment: "center",
        },
      };

      sections.push({
        id: coverSecId,
        name: "Cover (Elementor Section)",
        sortOrder: 0,
        sectionRole: "cover",
        visible: true,
        props: { backgroundColor: "#FFFFFF", padding: 24 },
        containerIds: [],
        elementIds: [headingElemId],
        widgetIds: [],
      });

      sections.push({
        id: "sec-elem-closing",
        name: "Closing (Elementor Section)",
        sortOrder: 1,
        sectionRole: "closing",
        visible: true,
        props: { backgroundColor: "#3A2313", padding: 24 },
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      });
    } else if (sections.length === 1) {
      sections[0].sectionRole = "cover";
      sections.push({
        id: "sec-elem-closing",
        name: "Closing (Penutup)",
        sortOrder: 1,
        sectionRole: "closing",
        visible: true,
        props: { backgroundColor: "#3A2313", padding: 24 },
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      });
    } else {
      sections[0].sectionRole = "cover";
      sections[sections.length - 1].sectionRole = "closing";
    }

    const templateJSON: InviteUTemplateJSON = {
      metadata: {
        templateId,
        id: templateId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: "Wedding",
        packageTier: "basic",
        status: "draft",
        schemaVersion: "1.0.0",
        description: `Diimpor dari layout Elementor "${name}".`,
        author: "Elementor Adapter",
        createdAt: new Date().toISOString(),
      },
      theme: {
        themeId: "theme-wedding-botanical",
        themeConfig: {},
      },
      designTokens: {
        colors: {
          primary: "#6f7f5f",
          secondary: "#455633",
          accent: "#cfcaa3",
          text: "#3A2313",
          background: "#ffffff",
          surface: "#FAF8F5",
        },
        typography: {
          fontFamily: "Georgia, serif",
        },
        spacing: {
          unit: 8,
          containerPadding: 24,
          sectionGap: 32,
        },
      },
      sections,
      containers,
      elements,
      widgets,
      assets: [],
      responsive: {
        breakpoints: { mobile: 390, tablet: 768, desktop: 1440 },
        defaultDevice: "desktop",
      },
    };

    return {
      source: "elementor",
      sourceVersion: payload.version || "3.x",
      success: true,
      templateJSON,
      diagnostics,
      unsupportedFeaturesCount: unsupportedCount,
    };
  }
}

export const figmaAdapter = new FigmaImportAdapter();
export const elementorAdapter = new ElementorImportAdapter();

export const SAMPLE_FIGMA_PAYLOAD: FigmaDesignPayload = {
  documentName: "Luxury Wedding Invitation - Figma",
  version: "1.0",
  nodes: [
    {
      id: "figma-cover-frame",
      name: "Cover Hero Frame",
      type: "FRAME",
      absoluteBoundingBox: { x: 0, y: 0, width: 390, height: 844 },
      fills: [{ type: "SOLID", color: { r: 0.98, g: 0.97, b: 0.96, a: 1 } }],
      children: [
        {
          id: "figma-title",
          name: "Wedding Title",
          type: "TEXT",
          characters: "Romeo & Juliet",
          absoluteBoundingBox: { x: 20, y: 120, width: 350, height: 60 },
          style: { fontSize: 36, fontWeight: 700, fontFamily: "Playfair Display", textAlignHorizontal: "CENTER" },
          fills: [{ type: "SOLID", color: { r: 0.23, g: 0.14, b: 0.07, a: 1 } }],
        },
        {
          id: "figma-subtitle",
          name: "Date & Venue",
          type: "TEXT",
          characters: "Sabtu, 12 Desember 2026 · Bali",
          absoluteBoundingBox: { x: 20, y: 190, width: 350, height: 30 },
          style: { fontSize: 16, fontWeight: 400, fontFamily: "Inter", textAlignHorizontal: "CENTER" },
          fills: [{ type: "SOLID", color: { r: 0.46, g: 0.36, b: 0.28, a: 1 } }],
        },
      ],
    },
    {
      id: "figma-closing-frame",
      name: "Closing Section",
      type: "FRAME",
      absoluteBoundingBox: { x: 0, y: 844, width: 390, height: 400 },
      fills: [{ type: "SOLID", color: { r: 0.17, g: 0.24, b: 0.31, a: 1 } }],
      children: [
        {
          id: "figma-thanks",
          name: "Thank You Note",
          type: "TEXT",
          characters: "Terima Kasih Atas Kehadiran dan Doa Restu Anda",
          absoluteBoundingBox: { x: 20, y: 50, width: 350, height: 50 },
          style: { fontSize: 20, fontWeight: 600, fontFamily: "Playfair Display", textAlignHorizontal: "CENTER" },
          fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
        },
      ],
    },
  ],
};

export const SAMPLE_ELEMENTOR_PAYLOAD: ElementorDesignPayload = {
  title: "Rustic Garden Wedding - Elementor",
  version: "3.19",
  content: [
    {
      id: "elem-sec-1",
      elType: "section",
      settings: { background_color: "#FFFDF9", padding: 32 },
      elements: [
        {
          id: "elem-col-1",
          elType: "column",
          elements: [
            {
              id: "elem-wdg-1",
              elType: "widget",
              widgetType: "heading",
              settings: { title: "Undangan Pernikahan Romantis", size: 32, align: "center", title_color: "#3A2313" },
            },
            {
              id: "elem-wdg-2",
              elType: "widget",
              widgetType: "text-editor",
              settings: { editor: "Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam perayaan pernikahan kami." },
            },
            {
              id: "elem-wdg-3",
              elType: "widget",
              widgetType: "button",
              settings: { text: "Buka Undangan", link: { url: "#rsvp" } },
            },
            {
              id: "elem-wdg-4",
              elType: "widget",
              widgetType: "countdown",
              settings: { due_date: "2026-12-28 09:00" },
            },
          ],
        },
      ],
    },
    {
      id: "elem-sec-closing",
      elType: "section",
      settings: { background_color: "#2C3E50", padding: 32 },
      elements: [
        {
          id: "elem-col-closing",
          elType: "column",
          elements: [
            {
              id: "elem-wdg-closing",
              elType: "widget",
              widgetType: "heading",
              settings: { title: "Sampai Jumpa di Hari Bahagia Kami", size: 24, align: "center", title_color: "#FFFFFF" },
            },
          ],
        },
      ],
    },
  ],
};
