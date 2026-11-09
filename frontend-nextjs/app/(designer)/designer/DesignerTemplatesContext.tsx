"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  convertThemeToSections,
  SectionConfig,
} from "@/components/builder/registry";
import { TemplateDataInput } from "@/components/builder/types";
import {
  BuilderDocument,
  BuilderSection,
  createDefaultCoverSection,
  createDefaultPenutupSection,
  createEmptyBuilderDocument,
} from "@/components/builder/model";
import { weddingTheme } from "./templates/themes/wedding";

export interface LocalDesignerTemplate {
  id: number;
  designer_id: number;
  name: string;
  description: string;
  slug: string;
  category_name: string;
  style: string;
  themeCategory: string;
  status: string;
  rejection_note: string | null;
  primaryColor: string;
  secondaryColor: string;
  thumbnail: string;
  builderDocument?: BuilderDocument;
  version: string;
  created_at: string;
  updated_at: string;
  sections: SectionConfig[];
}

interface DesignerTemplatesContextValue {
  templates: LocalDesignerTemplate[];
  getTemplate: (id: string) => LocalDesignerTemplate | undefined;
  saveTemplate: (template: LocalTemplateUpdateInput) => number;
  saveBuilderDraft: (
    id: number,
    document: BuilderDocument,
    metadata: {
      name: string;
      slug: string;
      themeCategory: string;
      primaryColor: string;
      secondaryColor: string;
      description: string;
      category_name: string;
    }
  ) => void;
  createTemplate: (template: NewLocalTemplateInput) => number;
  duplicateTemplate: (id: number) => number | undefined;
  createRevision: (id: number) => number | undefined;
  submitForReview: (id: number) => void;
  deleteTemplate: (id: number) => void;
}

export interface NewLocalTemplateInput {
  name: string;
  description: string;
  category: string;
  style: string;
  primaryColor: string;
  secondaryColor: string;
  thumbnail: string;
}

type LocalTemplateUpdateInput = TemplateDataInput &
  Partial<
    Pick<
      LocalDesignerTemplate,
      | "description"
      | "category_name"
      | "style"
      | "thumbnail"
    >
  >;

const DesignerTemplatesContext =
  createContext<DesignerTemplatesContextValue | null>(null);

export function createDemoTemplateSections(): SectionConfig[] {
  return convertThemeToSections(weddingTheme);
}

function createDemoBuilderDocument(
  templateName: string,
  coupleTitle: string
): BuilderDocument {
  const coverSection = createDefaultCoverSection(templateName);
  coverSection.name = "Cover (Wajib)";
  const coupleChild = coverSection.children.find(
    (c) => c.name === "Nama Mempelai"
  );
  if (coupleChild) {
    coupleChild.props.text = coupleTitle || "MOGRAN & LAURA";
  }

  const eventSectionId = `sec-demo-event-${Date.now()}`;
  const eventSection: BuilderSection = {
    id: eventSectionId,
    kind: "section",
    name: "Event Details (Akad & Resepsi)",
    visible: true,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 420 },
    responsive: {},
    props: {
      backgroundColor: "#ffffff",
      backgroundType: "solid",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignment: "stretch",
      justifyContent: "flex-start",
      gap: 16,
    },
    children: [
      {
        id: `elem-demo-event-title`,
        kind: "element",
        elementType: "text",
        parentSectionId: eventSectionId,
        name: "Judul Acara",
        visible: true,
        position: { x: 20, y: 20 },
        size: { width: 340, height: 40 },
        responsive: {},
        props: {
          text: "Waktu & Tempat Acara",
          fontSize: 22,
          fontWeight: "bold",
          alignment: "center",
          color: "#3A2313",
        },
      },
      {
        id: `elem-demo-event-desc`,
        kind: "element",
        elementType: "text",
        parentSectionId: eventSectionId,
        name: "Rundown Acara",
        visible: true,
        position: { x: 20, y: 70 },
        size: { width: 340, height: 160 },
        responsive: {},
        props: {
          text: "Akad Nikah: 08.00 - 10.00 WIB\nResepsi: 11.00 - 14.00 WIB\n\nGrand Ballroom Hotel Mulia\nJl. Asia Afrika, Senayan, Jakarta",
          fontSize: 14,
          lineHeight: 1.6,
          alignment: "center",
          color: "#765D48",
        },
      },
      {
        id: `elem-demo-event-btn`,
        kind: "element",
        elementType: "button",
        parentSectionId: eventSectionId,
        name: "Tombol Peta",
        visible: true,
        position: { x: 60, y: 250 },
        size: { width: 260, height: 44 },
        responsive: {},
        props: {
          label: "Petunjuk Arah (Google Maps)",
          backgroundColor: "#FCB040",
          color: "#3A2313",
          borderRadius: 8,
        },
      },
    ],
  };

  const penutupSection = createDefaultPenutupSection();
  penutupSection.name = "Penutup (Wajib)";

  return {
    sections: [coverSection, eventSection, penutupSection],
  };
}

function createDemoTemplate(
  id: number,
  name: string,
  slug: string,
  status: string,
  coupleTitle: string,
  rejectionNote: string | null,
  timestamp: string
): LocalDesignerTemplate {
  const sections = createDemoTemplateSections().map((section) =>
    section.type === "cover"
      ? {
          ...section,
          content: { ...section.content, coupleTitle },
        }
      : section
  );

  return {
    id,
    designer_id: 1,
    name,
    description: "Undangan digital dengan gaya botanical yang elegan.",
    slug,
    category_name: "Wedding Luxury / Botanical",
    style: "Botanical",
    themeCategory: "Wedding Luxury / Botanical",
    status,
    rejection_note: rejectionNote,
    primaryColor: "#6f7f5f",
    secondaryColor: "#455633",
    thumbnail: weddingTheme.thumbnail,
    builderDocument: createDemoBuilderDocument(name, coupleTitle),
    version: "1.0",
    created_at: timestamp,
    updated_at: timestamp,
    sections,
  };
}

function createInitialTemplates(): LocalDesignerTemplate[] {
  const timestamp = new Date().toISOString();
  return [
    createDemoTemplate(
      701,
      "Botanical Wedding",
      "botanical-wedding",
      "draft",
      "MOGRAN & LAURA",
      null,
      timestamp
    ),
    createDemoTemplate(
      702,
      "Modern Intimate",
      "modern-intimate",
      "rejected",
      "ARYA & CITRA",
      "Tambahkan detail lokasi acara dan periksa kembali kontras teks.",
      timestamp
    ),
    createDemoTemplate(
      703,
      "Garden Evening",
      "garden-evening",
      "in_review",
      "RAKA & MAYA",
      null,
      timestamp
    ),
  ];
}

export function DesignerTemplatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [templates, setTemplates] = useState<LocalDesignerTemplate[]>(
    createInitialTemplates
  );
  const nextId = useRef(704);

  const getTemplate = useCallback(
    (id: string) =>
      templates.find(
        (template) =>
          String(template.id) === id ||
          template.slug === id ||
          (id === "wedding" && template.slug === "botanical-wedding")
      ),
    [templates]
  );

  const saveTemplate = useCallback((input: LocalTemplateUpdateInput) => {
    const requestedId = input.id ? Number(input.id) : NaN;
    const existing = templates.find((template) => template.id === requestedId);
    const savedId = existing?.id ?? nextId.current++;
    const updatedAt = new Date().toISOString();
    const saved: LocalDesignerTemplate = {
      id: savedId,
      designer_id: existing?.designer_id ?? 1,
      name: input.name,
      description: input.description ?? existing?.description ?? "",
      slug: input.slug,
      category_name:
        input.category_name ?? existing?.category_name ?? "Wedding",
      style: input.style ?? existing?.style ?? input.themeCategory ?? "Classic",
      themeCategory: input.themeCategory ?? existing?.themeCategory ?? input.style ?? "Classic",
      status: "draft",
      rejection_note: null,
      primaryColor: input.primaryColor || existing?.primaryColor || "#6f7f5f",
      secondaryColor:
        input.secondaryColor || existing?.secondaryColor || "#455633",
      thumbnail: input.thumbnail ?? existing?.thumbnail ?? "",
      builderDocument: existing?.builderDocument,
      version: input.version || existing?.version || "1.0",
      created_at: existing?.created_at || updatedAt,
      updated_at: updatedAt,
      sections:
        input.sections !== undefined
          ? input.sections
          : existing?.sections ?? [],
    };

    setTemplates((current) =>
      existing
        ? current.map((template) =>
            template.id === existing.id ? saved : template
          )
        : [...current, saved]
    );

    return savedId;
  }, [templates]);

  const saveBuilderDraft = useCallback(
    (
      id: number,
      document: BuilderDocument,
      metadata: {
        name: string;
        slug: string;
        themeCategory: string;
        primaryColor: string;
        secondaryColor: string;
        description: string;
        category_name: string;
      }
    ) => {
      setTemplates((current) =>
        current.map((template) =>
          template.id === id
            ? {
                ...template,
                name: metadata.name,
                description: metadata.description,
                slug: metadata.slug,
                category_name: metadata.category_name,
                themeCategory: metadata.themeCategory,
                style: metadata.themeCategory,
                primaryColor: metadata.primaryColor,
                secondaryColor: metadata.secondaryColor,
                builderDocument: document,
                updated_at: new Date().toISOString(),
                status:
                  template.status.toLowerCase() === "rejected"
                    ? "draft"
                    : template.status,
                rejection_note:
                  template.status.toLowerCase() === "rejected"
                    ? null
                    : template.rejection_note,
              }
            : template
        )
      );
    },
    []
  );

  const createTemplate = useCallback(
    (input: NewLocalTemplateInput) => {
      const id = nextId.current++;
      const timestamp = new Date().toISOString();
      const slug = `${input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${id}`;

      // Buat otomatis section Cover dan Penutup untuk template baru
      const coverSection: SectionConfig = {
        id: `sec-${id}-cover`,
        type: "cover",
        name: "Cover & Hero",
        sortOrder: 0,
        visible: true,
        settings: {
          alignment: "center",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          textColor: "#3A2313",
          accentColor: input.primaryColor || "#6f7f5f",
        },
        content: {
          title: "The Wedding Of",
          subtitle: "Kami mengundang Anda untuk merayakan hari bahagia kami.",
          coupleTitle: input.name.trim() || "BRIDE & GROOM",
          imageUrl: input.thumbnail || "/templates/wedding/couple-main.jpg",
        },
      };

      const penutupSection: SectionConfig = {
        id: `sec-${id}-penutup`,
        type: "quote_banner",
        name: "Penutup & Ucapan Terima Kasih",
        sortOrder: 1,
        visible: true,
        settings: {
          alignment: "center",
          backgroundColor: input.secondaryColor || "#455633",
          textColor: "#fffcea",
          accentColor: input.primaryColor || "#cfcaa3",
        },
        content: {
          tag: "Terima Kasih",
          message:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
          groom: "MOGRAN",
          bride: "LAURA",
        },
      };

      // Kanvas awal dengan section Cover & Penutup
      const initialBuilderDoc: BuilderDocument = {
        sections: [
          {
            id: `sec-doc-${id}-cover`,
            kind: "section",
            name: "Cover & Hero",
            visible: true,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 480 },
            responsive: {},
            props: {
              backgroundColor: "#ffffff",
              padding: 24,
            },
            children: [
              {
                id: `elem-doc-${id}-title`,
                kind: "element",
                elementType: "text",
                parentSectionId: `sec-doc-${id}-cover`,
                name: "Judul Cover",
                visible: true,
                position: { x: 20, y: 40 },
                size: { width: 320, height: 60 },
                responsive: {},
                props: {
                  text: input.name.trim() || "The Wedding Of",
                  fontSize: 26,
                  fontWeight: "bold",
                  color: input.primaryColor || "#3A2313",
                  alignment: "center",
                },
              },
            ],
          },
          {
            id: `sec-doc-${id}-penutup`,
            kind: "section",
            name: "Penutup & Ucapan Terima Kasih",
            visible: true,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 320 },
            responsive: {},
            props: {
              backgroundColor: input.secondaryColor || "#455633",
              padding: 24,
            },
            children: [
              {
                id: `elem-doc-${id}-closing-text`,
                kind: "element",
                elementType: "text",
                parentSectionId: `sec-doc-${id}-penutup`,
                name: "Teks Penutup",
                visible: true,
                position: { x: 20, y: 30 },
                size: { width: 320, height: 80 },
                responsive: {},
                props: {
                  text: "Terima Kasih atas doa dan restu Anda.",
                  fontSize: 18,
                  color: "#ffffff",
                  alignment: "center",
                },
              },
            ],
          },
        ],
      };

      const template: LocalDesignerTemplate = {
        id,
        designer_id: 1,
        name: input.name.trim(),
        description: input.description.trim(),
        slug,
        category_name: input.category,
        style: input.style,
        themeCategory: input.style,
        status: "draft",
        rejection_note: null,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        thumbnail: input.thumbnail.trim(),
        version: "1.0",
        created_at: timestamp,
        updated_at: timestamp,
        sections: [coverSection, penutupSection],
        builderDocument: initialBuilderDoc,
      };

      setTemplates((current) => [template, ...current]);
      return id;
    },
    []
  );

  const duplicateTemplate = useCallback(
    (id: number) => {
      const source = templates.find((template) => template.id === id);
      if (!source) return undefined;
      const duplicateId = nextId.current++;
      const timestamp = new Date().toISOString();

      // Buat nama baru yang unik (e.g. "Name (Copy)", "Name (Copy 2)")
      const existingNames = templates.map((t) => t.name.toLowerCase());
      const baseCleanName = source.name
        .replace(/\s*\((?:Copy|Salinan)(?:\s+\d+)?\)$/i, "")
        .trim();
      let newName = `${baseCleanName} (Copy)`;
      let copyCounter = 2;
      while (existingNames.includes(newName.toLowerCase())) {
        newName = `${baseCleanName} (Copy ${copyCounter})`;
        copyCounter++;
      }

      const duplicate: LocalDesignerTemplate = {
        ...source,
        id: duplicateId,
        name: newName,
        slug: `${source.slug}-copy-${duplicateId}`,
        status: "draft",
        rejection_note: null,
        version: "1.0",
        created_at: timestamp,
        updated_at: timestamp,
        sections: source.sections.map((section) => ({
          ...section,
          settings: { ...section.settings },
          content: { ...section.content },
        })),
        builderDocument: source.builderDocument
          ? {
              sections: source.builderDocument.sections.map((section) => ({
                ...section,
                id: `sec-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                props: { ...section.props },
                children: section.children.map((child) => ({
                  ...child,
                  id: `${child.kind}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  props: { ...child.props },
                })),
              })),
            }
          : createEmptyBuilderDocument(),
      };
      setTemplates((current) => [duplicate, ...current]);
      return duplicateId;
    },
    [templates]
  );

  const createRevision = useCallback(
    (id: number) => {
      const source = templates.find((template) => template.id === id);
      if (!source) return undefined;
      const revisionId = nextId.current++;
      const timestamp = new Date().toISOString();

      // Buat nama revisi baru yang unik
      const existingNames = templates.map((t) => t.name.toLowerCase());
      const baseCleanName = source.name
        .replace(/\s*\((?:Revisi|Rev)(?:\s+\d+)?\)$/i, "")
        .trim();
      let newName = `${baseCleanName} (Revisi)`;
      let revCounter = 2;
      while (existingNames.includes(newName.toLowerCase())) {
        newName = `${baseCleanName} (Revisi ${revCounter})`;
        revCounter++;
      }

      const revision: LocalDesignerTemplate = {
        ...source,
        id: revisionId,
        name: newName,
        slug: `${source.slug}-rev-${revisionId}`,
        status: "draft",
        rejection_note: source.rejection_note,
        version: "1.1",
        created_at: timestamp,
        updated_at: timestamp,
        sections: source.sections.map((section) => ({
          ...section,
          settings: { ...section.settings },
          content: { ...section.content },
        })),
        builderDocument: source.builderDocument
          ? {
              sections: source.builderDocument.sections.map((section) => ({
                ...section,
                id: `sec-rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                props: { ...section.props },
                children: section.children.map((child) => ({
                  ...child,
                  id: `${child.kind}-rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  props: { ...child.props },
                })),
              })),
            }
          : createEmptyBuilderDocument(),
      };
      setTemplates((current) => [revision, ...current]);
      return revisionId;
    },
    [templates]
  );

  const submitForReview = useCallback((id: number) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id &&
        ["draft", "rejected", "revision"].includes(
          template.status.toLowerCase()
        )
          ? {
              ...template,
              status: "in_review",
              rejection_note: null,
              updated_at: new Date().toISOString(),
            }
          : template
      )
    );
  }, []);

  const deleteTemplate = useCallback((id: number) => {
    setTemplates((current) =>
      current.filter(
        (template) =>
          template.id !== id ||
          ["in_review", "approved", "archived"].includes(
            template.status.toLowerCase()
          )
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      templates,
      getTemplate,
      saveTemplate,
      saveBuilderDraft,
      createTemplate,
      duplicateTemplate,
      createRevision,
      submitForReview,
      deleteTemplate,
    }),
    [
      templates,
      getTemplate,
      saveTemplate,
      saveBuilderDraft,
      createTemplate,
      duplicateTemplate,
      createRevision,
      submitForReview,
      deleteTemplate,
    ]
  );

  return (
    <DesignerTemplatesContext.Provider value={value}>
      {children}
    </DesignerTemplatesContext.Provider>
  );
}

export function useDesignerTemplates(): DesignerTemplatesContextValue {
  const context = useContext(DesignerTemplatesContext);
  if (!context) {
    throw new Error(
      "useDesignerTemplates harus digunakan di dalam DesignerTemplatesProvider."
    );
  }
  return context;
}
