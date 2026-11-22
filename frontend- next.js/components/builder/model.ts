import type {
  ElementAnimationConfig,
  PageAnimationSettings,
} from "./animation/animationTypes";

export type BuilderObjectKind = "section" | "element" | "widget";

export type ElementType =
  | "heading"
  | "text"
  | "image"
  | "video"
  | "shape"
  | "button"
  | "divider"
  | "spacer"
  | "icon"
  | "container";

export type WidgetType =
  | "cover"
  | "event_details"
  | "gallery"
  | "story"
  | "love_story"
  | "countdown"
  | "music"
  | "rsvp"
  | "guestbook"
  | "digital_gift"
  | "video_greeting"
  | "maps";

export interface BuilderObjectBase {
  id: string;
  kind: BuilderObjectKind;
  name: string;
  visible: boolean;
  locked?: boolean;
  groupId?: string;
  parentContainerId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  responsive: Partial<
    Record<
      BuilderDevice,
      {
        position?: { x?: number; y?: number };
        size?: { width?: number; height?: number };
        props?: Record<string, BuilderPropertyValue>;
      }
    >
  >;
  props: Record<string, BuilderPropertyValue>;
  animation?: ElementAnimationConfig;
}

export interface BuilderElement extends BuilderObjectBase {
  kind: "element";
  elementType: ElementType;
  parentSectionId: string;
}

export interface BuilderWidget extends BuilderObjectBase {
  kind: "widget";
  widgetType: WidgetType;
  parentSectionId: string;
}

export type BuilderSectionChild = BuilderElement | BuilderWidget;

export interface BuilderSection extends BuilderObjectBase {
  kind: "section";
  children: BuilderSectionChild[];
}

export type BuilderNode = BuilderSection | BuilderElement | BuilderWidget;

export interface BuilderDocument {
  sections: BuilderSection[];
  pageAnimation?: PageAnimationSettings;
}

export type BuilderDevice = "mobile" | "tablet" | "desktop";
export type BuilderPropertyValue =
  | string
  | number
  | boolean
  | string[]
  | ElementAnimationConfig
  | PageAnimationSettings
  | Record<string, unknown>;

export const BUILDER_BREAKPOINTS: Record<BuilderDevice, number> = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const BUILDER_VIEWPORT_WIDTHS: Record<BuilderDevice, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
};

export const BUILDER_TEST_VIEWPORTS = [
  { id: "desktop-large", label: "Desktop (1440 px)", width: 1440, device: "desktop" as BuilderDevice },
  { id: "desktop-compact", label: "Desktop Compact (1120 px)", width: 1120, device: "desktop" as BuilderDevice },
  { id: "tablet", label: "Tablet (768 px)", width: 768, device: "tablet" as BuilderDevice },
  { id: "mobile-standard", label: "Mobile (390 px)", width: 390, device: "mobile" as BuilderDevice },
  { id: "mobile-small", label: "Mobile Small (320 px)", width: 320, device: "mobile" as BuilderDevice },
];

export const BUILDER_FONT_FAMILIES = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Playfair Display, serif", label: "Playfair Display" },
  { value: "Cinzel, serif", label: "Cinzel" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
  { value: "Cormorant Garamond, serif", label: "Cormorant Garamond" },
  { value: "DM Sans, sans-serif", label: "DM Sans" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
] as const;

let nextBuilderId = 0;

export function createDefaultCoverSection(templateName = "The Wedding Of"): BuilderSection {
  const sectionId = createBuilderId("section-cover");
  return {
    id: sectionId,
    kind: "section",
    name: "Cover (Wajib)",
    visible: true,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 500 },
    responsive: {},
    props: {
      backgroundColor: "#ffffff",
      backgroundType: "solid",
      backgroundImage: "",
      padding: 32,
      margin: 0,
      gap: 16,
      alignment: "center",
      justifyContent: "center",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },
    children: [
      {
        id: createBuilderId("element"),
        kind: "element",
        elementType: "text",
        parentSectionId: sectionId,
        name: "Judul Undangan",
        visible: true,
        position: { x: 20, y: 30 },
        size: { width: 340, height: 50 },
        responsive: {},
        props: {
          text: templateName.trim() || "The Wedding Of",
          fontSize: 26,
          fontWeight: 700,
          color: "#422B1C",
          alignment: "center",
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: createBuilderId("element"),
        kind: "element",
        elementType: "text",
        parentSectionId: sectionId,
        name: "Nama Mempelai",
        visible: true,
        position: { x: 20, y: 95 },
        size: { width: 340, height: 48 },
        responsive: {},
        props: {
          text: "MOGRAN & LAURA",
          fontSize: 22,
          fontWeight: 600,
          color: "#FFAD38",
          alignment: "center",
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: createBuilderId("element"),
        kind: "element",
        elementType: "text",
        parentSectionId: sectionId,
        name: "Pesan Sambutan",
        visible: true,
        position: { x: 20, y: 155 },
        size: { width: 340, height: 60 },
        responsive: {},
        props: {
          text: "Kami mengundang Anda untuk merayakan momen istimewa pernikahan kami.",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#765D48",
          alignment: "center",
        },
      },
    ],
  };
}

export function createDefaultPenutupSection(): BuilderSection {
  const sectionId = createBuilderId("section-penutup");
  return {
    id: sectionId,
    kind: "section",
    name: "Penutup (Wajib)",
    visible: true,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 340 },
    responsive: {},
    props: {
      backgroundColor: "#455633",
      backgroundType: "solid",
      backgroundImage: "",
      padding: 32,
      margin: 0,
      gap: 16,
      alignment: "center",
      justifyContent: "center",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },
    children: [
      {
        id: createBuilderId("element"),
        kind: "element",
        elementType: "text",
        parentSectionId: sectionId,
        name: "Teks Penutup",
        visible: true,
        position: { x: 20, y: 30 },
        size: { width: 340, height: 46 },
        responsive: {},
        props: {
          text: "Terima Kasih",
          fontSize: 24,
          fontWeight: 700,
          color: "#fffcea",
          alignment: "center",
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: createBuilderId("element"),
        kind: "element",
        elementType: "text",
        parentSectionId: sectionId,
        name: "Pesan Doa & Restu",
        visible: true,
        position: { x: 20, y: 90 },
        size: { width: 340, height: 80 },
        responsive: {},
        props: {
          text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#e8ede0",
          alignment: "center",
        },
      },
    ],
  };
}

export function ensureCoverAndPenutup(
  doc: BuilderDocument,
  templateName?: string
): BuilderDocument {
  const sections = [...doc.sections];

  // If completely empty, generate Cover and Penutup
  if (sections.length === 0) {
    return {
      sections: [
        createDefaultCoverSection(templateName),
        createDefaultPenutupSection(),
      ],
    };
  }

  // Check if first section is Cover
  const first = sections[0];
  const isFirstCover =
    first.name.toLowerCase().includes("cover") ||
    first.id.toLowerCase().includes("cover");

  if (!isFirstCover) {
    const existingCoverIndex = sections.findIndex(
      (s) =>
        s.name.toLowerCase().includes("cover") ||
        s.id.toLowerCase().includes("cover")
    );
    if (existingCoverIndex > 0) {
      const [foundCover] = sections.splice(existingCoverIndex, 1);
      sections.unshift(foundCover);
    } else {
      sections.unshift(createDefaultCoverSection(templateName));
    }
  }

  // Ensure first section name has Cover
  if (!sections[0].name.toLowerCase().includes("cover")) {
    sections[0] = { ...sections[0], name: "Cover (Wajib)" };
  }

  // Check if last section is Penutup
  const last = sections[sections.length - 1];
  const isLastPenutup =
    sections.length > 1 &&
    (last.name.toLowerCase().includes("penutup") ||
      last.id.toLowerCase().includes("penutup") ||
      last.name.toLowerCase().includes("closing"));

  if (!isLastPenutup) {
    const existingPenutupIndex = sections.findIndex(
      (s, idx) =>
        idx > 0 &&
        (s.name.toLowerCase().includes("penutup") ||
          s.id.toLowerCase().includes("penutup") ||
          s.name.toLowerCase().includes("closing"))
    );
    if (existingPenutupIndex > 0 && existingPenutupIndex !== sections.length - 1) {
      const [foundPenutup] = sections.splice(existingPenutupIndex, 1);
      sections.push(foundPenutup);
    } else if (existingPenutupIndex === -1) {
      sections.push(createDefaultPenutupSection());
    }
  }

  // Ensure last section name has Penutup
  const finalLastIdx = sections.length - 1;
  if (
    finalLastIdx > 0 &&
    !sections[finalLastIdx].name.toLowerCase().includes("penutup") &&
    !sections[finalLastIdx].name.toLowerCase().includes("closing")
  ) {
    sections[finalLastIdx] = {
      ...sections[finalLastIdx],
      name: "Penutup (Wajib)",
    };
  }

  return { sections };
}

export function createEmptyBuilderDocument(): BuilderDocument {
  return {
    sections: [
      createDefaultCoverSection(),
      createDefaultPenutupSection(),
    ],
  };
}

export function createBuilderSection(index: number): BuilderSection {
  const id = createBuilderId("section");
  return {
    id,
    kind: "section",
    name: `Section ${index + 1}`,
    visible: true,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 480 },
    responsive: {},
    props: {
      backgroundColor: "#ffffff",
      backgroundType: "solid",
      backgroundImage: "",
      padding: 24,
      margin: 0,
      gap: 16,
      alignment: "stretch",
      justify: "flex-start",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minWidth: 0,
      maxWidth: 0,
      maxHeight: 0,
      borderWidth: 0,
      borderColor: "#d9dce3",
      borderStyle: "solid",
      borderRadius: 0,
      boxShadow: "none",
      opacity: 100,
      overlayColor: "#000000",
      overlayOpacity: 0,
    },
    children: [],
  };
}

export function createBuilderElement(
  type: ElementType,
  index: number,
  parentSectionId = ""
): BuilderElement {
  const definitions: Record<
    ElementType,
    {
      name: string;
      size: { width: number; height: number };
      props: Record<string, string | number | boolean>;
    }
  > = {
    heading: {
      name: "Heading",
      size: { width: 320, height: 52 },
      props: {
        position: "relative",
        text: "Judul Heading",
        tag: "h2",
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: 0,
        color: "#20242c",
        alignment: "center",
        textDecoration: "none",
        textTransform: "none",
        backgroundColor: "transparent",
        backgroundType: "solid",
        backgroundImage: "",
        padding: 0,
        margin: 0,
        borderWidth: 0,
        borderColor: "#d9dce3",
        borderStyle: "solid",
        borderRadius: 0,
        boxShadow: "none",
        opacity: 100,
      },
    },
    text: {
      name: "Text",
      size: { width: 300, height: 48 },
      props: {
        position: "relative",
        text: "Teks baru",
        fontSize: 24,
        fontFamily: "Arial, sans-serif",
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: 0,
        color: "#20242c",
        alignment: "center",
        textDecoration: "none",
        textTransform: "none",
        backgroundColor: "transparent",
        backgroundType: "solid",
        backgroundImage: "",
        padding: 0,
        margin: 0,
        borderWidth: 0,
        borderColor: "#d9dce3",
        borderStyle: "solid",
        borderRadius: 0,
        boxShadow: "none",
        opacity: 100,
      },
    },
    image: {
      name: "Image",
      size: { width: 220, height: 140 },
      props: {
        src: "",
        alt: "Gambar undangan",
        objectFit: "cover",
        objectPosition: "center",
        aspectRatio: "auto",
        position: "relative",
        backgroundColor: "transparent",
        backgroundImage: "",
        padding: 0,
        margin: 0,
        borderWidth: 0,
        borderColor: "#d9dce3",
        borderStyle: "solid",
        borderRadius: 0,
        boxShadow: "none",
        opacity: 100,
        overlayColor: "#000000",
        overlayOpacity: 0,
      },
    },
    video: {
      name: "Video",
      size: { width: 280, height: 160 },
      props: {
        src: "",
        title: "Video undangan",
        poster: "",
        aspectRatio: "auto",
        autoplay: false,
        muted: true,
        loop: false,
        controls: true,
        position: "relative",
        backgroundColor: "transparent",
        backgroundType: "solid",
        padding: 0,
        margin: 0,
        borderWidth: 0,
        borderColor: "#d9dce3",
        borderStyle: "solid",
        borderRadius: 0,
        boxShadow: "none",
        opacity: 100,
      },
    },
    shape: {
      name: "Shape",
      size: { width: 120, height: 80 },
      props: {
        position: "relative",
        shape: "rectangle",
        backgroundColor: "#e9eaf0",
        backgroundType: "solid",
        borderRadius: 8,
        padding: 0,
        margin: 0,
        borderWidth: 0,
        borderColor: "#d9dce3",
        borderStyle: "solid",
        boxShadow: "none",
        opacity: 100,
      },
    },
    button: {
      name: "Button",
      size: { width: 160, height: 44 },
      props: {
        position: "relative",
        label: "Tombol",
        url: "",
        backgroundColor: "#4f46e5",
        backgroundType: "solid",
        color: "#ffffff",
        fontSize: 16,
        fontFamily: "Arial, sans-serif",
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: 0,
        alignment: "center",
        textDecoration: "none",
        textTransform: "none",
        padding: 8,
        margin: 0,
        borderWidth: 0,
        borderColor: "#4f46e5",
        borderStyle: "solid",
        borderRadius: 6,
        boxShadow: "none",
        opacity: 100,
      },
    },
    divider: {
      name: "Divider",
      size: { width: 300, height: 8 },
      props: {
        position: "relative",
        color: "#d9dce3",
        thickness: 1,
        width: 80,
        padding: 0,
        margin: 0,
        borderRadius: 0,
        opacity: 100,
      },
    },
    spacer: {
      name: "Spacer",
      size: { width: 100, height: 32 },
      props: {
        position: "relative",
        height: 32,
        padding: 0,
        margin: 0,
        opacity: 100,
      },
    },
    icon: {
      name: "Icon",
      size: { width: 48, height: 48 },
      props: {
        position: "relative",
        iconName: "heart",
        iconSize: 32,
        color: "#4f46e5",
        alignment: "center",
        backgroundColor: "transparent",
        padding: 8,
        margin: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#4f46e5",
        borderStyle: "solid",
        boxShadow: "none",
        opacity: 100,
      },
    },
    container: {
      name: "Container",
      size: { width: 340, height: 160 },
      props: {
        display: "flex",
        flexDirection: "column",
        flexWrap: "nowrap",
        alignment: "stretch",
        justifyContent: "flex-start",
        gap: 12,
        padding: 16,
        margin: 0,
        backgroundColor: "transparent",
        backgroundType: "solid",
        backgroundImage: "",
        borderWidth: 1,
        borderColor: "#EAE5DF",
        borderStyle: "dashed",
        borderRadius: 8,
        boxShadow: "none",
        opacity: 100,
        autoStackMobile: true,
        sizingMode: "fill",
      },
    },
  };
  const definition = definitions[type];
  return {
    id: createBuilderId(type),
    kind: "element",
    elementType: type,
    name: `${definition.name} ${index + 1}`,
    visible: true,
    parentSectionId,
    position: { x: 0, y: 0 },
    size: { ...definition.size },
    responsive: {},
    props: { ...definition.props },
  };
}

export function createBuilderWidget(
  type: WidgetType,
  index: number,
  parentSectionId = ""
): BuilderWidget {
  const definitions: Record<
    WidgetType,
    {
      name: string;
      size: { width: number; height: number };
      props: Record<string, string | number | boolean>;
    }
  > = {
    cover: {
      name: "Cover & Hero",
      size: { width: 340, height: 280 },
      props: {
        position: "relative",
        title: "Two Hearts, One Journey",
        subtitle: "With joyful hearts, we invite you to celebrate our new chapter.",
        coupleTitle: "MOGRAN & LAURA",
        dateText: "Senin, 28 Desember 2026",
        imageUrl: "/templates/wedding/couple-main.jpg",
        alignment: "center",
      },
    },
    story: {
      name: "Story / Timeline",
      size: { width: 340, height: 260 },
      props: {
        position: "relative",
        title: "Our Love Story",
        subtitle: "Perjalanan cinta kami hingga menuju pelaminan",
        milestones: JSON.stringify([
          { id: "1", year: "2021", title: "Pertama Bertemu", story: "Berawal dari perkenalan santai di sebuah kedai kopi di Denpasar." },
          { id: "2", year: "2023", title: "Memulai Komitmen", story: "Melangkah bersama melewati suka dan duka kehidupan." },
          { id: "3", year: "2026", title: "Menuju Pelaminan", story: "Mengikat janji suci di hadapan keluarga tercinta." },
        ]),
      },
    },
    love_story: {
      name: "Love Story",
      size: { width: 340, height: 260 },
      props: {
        position: "relative",
        title: "Our Love Story",
        subtitle: "Perjalanan cinta kami hingga menuju pelaminan",
        milestones: JSON.stringify([
          { id: "1", year: "2021", title: "Pertama Bertemu", story: "Berawal dari perkenalan santai di sebuah kedai kopi di Denpasar." },
          { id: "2", year: "2023", title: "Memulai Komitmen", story: "Melangkah bersama melewati suka dan duka kehidupan." },
          { id: "3", year: "2026", title: "Menuju Pelaminan", story: "Mengikat janji suci di hadapan keluarga tercinta." },
        ]),
      },
    },
    countdown: {
      name: "Countdown",
      size: { width: 280, height: 100 },
      props: { position: "relative", title: "Countdown", eventDate: "" },
    },
    rsvp: {
      name: "RSVP",
      size: { width: 280, height: 150 },
      props: {
        position: "relative",
        title: "Konfirmasi Kehadiran",
        buttonLabel: "Kirim RSVP",
      },
    },
    music: {
      name: "Music Player",
      size: { width: 280, height: 100 },
      props: { position: "relative", title: "Musik Latar", audioUrl: "" },
    },
    digital_gift: {
      name: "Digital Gift",
      size: { width: 280, height: 120 },
      props: {
        position: "relative",
        title: "Tanda Kasih (Digital Gift)",
        subtitle: "Bagi keluarga dan sahabat yang ingin memberikan tanda kasih:",
        bankName: "BCA",
        accountNumber: "1234 5678 90",
        accountHolder: "Mogran & Laura",
        showCopyButton: true,
      },
    },
    event_details: {
      name: "Event Details",
      size: { width: 340, height: 220 },
      props: {
        position: "relative",
        title: "Waktu & Tempat Acara",
        badge: "Akad & Resepsi",
        dateText: "Senin, 28 Desember 2026",
        timeText: "Akad: 08.00 WIB · Resepsi: 11.00 WIB",
        placeName: "Grand Ballroom Hotel Mulia",
        address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
        mapUrl: "https://maps.google.com",
      },
    },
    gallery: {
      name: "Gallery",
      size: { width: 340, height: 260 },
      props: {
        position: "relative",
        title: "Galeri Foto Bahagia",
        galleryLayout: "grid-2",
        columns: 2,
        imageCount: 4,
        aspectRatio: "1/1",
        borderRadius: 8,
      },
    },
    guestbook: {
      name: "Guestbook",
      size: { width: 340, height: 240 },
      props: {
        position: "relative",
        title: "Buku Tamu & Ucapan",
        subtitle: "Tuliskan doa restu dan ucapan bahagia Anda untuk kami",
        buttonLabel: "Kirim Ucapan",
        showCount: true,
      },
    },
    maps: {
      name: "Location / Maps",
      size: { width: 340, height: 200 },
      props: {
        position: "relative",
        title: "Peta Lokasi Acara",
        placeName: "Grand Ballroom Hotel Mulia",
        address: "Jl. Asia Afrika, Senayan, Jakarta Pusat",
        mapUrl: "https://maps.google.com",
        buttonLabel: "Buka Petunjuk Arah (Google Maps)",
        showMapEmbed: true,
      },
    },
    video_greeting: {
      name: "Video Greeting",
      size: { width: 340, height: 220 },
      props: {
        position: "relative",
        title: "Video Momen Bahagia",
        badge: "Add-on",
        src: "",
        poster: "/templates/wedding/venue.jpg",
        aspectRatio: "16/9",
        controls: true,
        autoplay: false,
      },
    },
  };
  const definition = definitions[type];
  return {
    id: createBuilderId(type),
    kind: "widget",
    widgetType: type,
    name: `${definition.name} ${index + 1}`,
    visible: true,
    parentSectionId,
    position: { x: 0, y: 0 },
    size: { ...definition.size },
    responsive: {},
    props: { ...definition.props },
  };
}

export interface GlobalDesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    surface: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    baseFontSize: number;
  };
}

export const DEFAULT_GLOBAL_DESIGN_SYSTEM: GlobalDesignSystem = {
  colors: {
    primary: "#FFAD38",
    secondary: "#3D2516",
    accent: "#FFAD38",
    text: "#422B1C",
    background: "#F7F6F4",
    surface: "#FFFFFF",
  },
  typography: {
    fontFamily: "Georgia, serif",
    headingFontFamily: "Cinzel, serif",
    baseFontSize: 14,
  },
};

export function getSectionRootChildren(section: BuilderSection): BuilderSectionChild[] {
  return section.children.filter((child) => !child.parentContainerId);
}

export function getContainerChildren(
  section: BuilderSection,
  containerId: string
): BuilderSectionChild[] {
  return section.children.filter((child) => child.parentContainerId === containerId);
}

export function getAllContainers(section: BuilderSection): BuilderElement[] {
  return section.children.filter(
    (child): child is BuilderElement =>
      child.kind === "element" && child.elementType === "container"
  );
}

export function getResponsivePosition(
  node: BuilderObjectBase,
  device: BuilderDevice
) {
  const override = node.responsive?.[device]?.position;
  if (override?.x !== undefined || override?.y !== undefined) {
    return {
      x: override?.x ?? node.position?.x ?? 0,
      y: override?.y ?? node.position?.y ?? 0,
    };
  }

  // Automatic responsive adjustments when Desktop base inherits to smaller screens
  if (device === "mobile") {
    // Inherit tablet override position if present, otherwise desktop base
    const tabletPos = node.responsive?.tablet?.position;
    const baseX = tabletPos?.x ?? node.position?.x ?? 0;
    const baseY = tabletPos?.y ?? node.position?.y ?? 0;
    // Clamping: if element is placed far to the right, clamp to mobile bounds (<= 320)
    const clampedX = baseX > 320 ? Math.min(baseX, 20) : baseX;
    return { x: clampedX, y: baseY };
  }

  if (device === "tablet") {
    const baseX = node.position?.x ?? 0;
    const baseY = node.position?.y ?? 0;
    const clampedX = baseX > 700 ? Math.min(baseX, 40) : baseX;
    return { x: clampedX, y: baseY };
  }

  return {
    x: node.position?.x ?? 0,
    y: node.position?.y ?? 0,
  };
}

export function getResponsiveSize(
  node: BuilderObjectBase,
  device: BuilderDevice
) {
  const override = node.responsive?.[device]?.size;
  if (override?.width !== undefined || override?.height !== undefined) {
    return {
      width: override?.width ?? node.size?.width ?? 100,
      height: override?.height ?? node.size?.height ?? 100,
    };
  }

  const baseWidth = node.size?.width ?? 100;
  const baseHeight = node.size?.height ?? 100;

  // For sections, width is in % (e.g. 100%)
  if (node.kind === "section") {
    return { width: baseWidth, height: baseHeight };
  }

  // Automatic responsive adjustments for elements & widgets
  if (device === "mobile") {
    // Inherit tablet size override if defined, otherwise base desktop
    const tabletSize = node.responsive?.tablet?.size;
    const inheritedWidth = tabletSize?.width ?? baseWidth;
    const inheritedHeight = tabletSize?.height ?? baseHeight;
    // Mobile viewport is ~390px. If width exceeds 350px, adapt smoothly
    const autoMobileWidth = inheritedWidth > 350 ? 350 : inheritedWidth;
    return {
      width: autoMobileWidth,
      height: inheritedHeight,
    };
  }

  if (device === "tablet") {
    const autoTabletWidth = baseWidth > 720 ? 720 : baseWidth;
    return {
      width: autoTabletWidth,
      height: baseHeight,
    };
  }

  return {
    width: baseWidth,
    height: baseHeight,
  };
}

export function getResponsiveProps(
  node: BuilderObjectBase,
  device: BuilderDevice
): Record<string, BuilderPropertyValue> {
  const baseProps = { ...node.props };
  const deviceOverrides = node.responsive?.[device]?.props ?? {};

  // If editing/viewing on Desktop (base), returns base merged with any explicit desktop overrides
  if (device === "desktop") {
    return { ...baseProps, ...deviceOverrides };
  }

  // Automatic Responsive Adjustments for Tablet (inherits Desktop base)
  if (device === "tablet") {
    const autoProps: Record<string, BuilderPropertyValue> = { ...baseProps };

    // Auto-scale typography if font size is large and not manually overridden
    if (!deviceOverrides.fontSize && typeof baseProps.fontSize === "number" && baseProps.fontSize > 20) {
      autoProps.fontSize = Math.max(16, Math.round(baseProps.fontSize * 0.88));
    }
    // Auto-scale padding
    if (!deviceOverrides.padding && typeof baseProps.padding === "number" && baseProps.padding > 24) {
      autoProps.padding = Math.max(14, Math.round(baseProps.padding * 0.85));
    }
    // Auto-scale gap
    if (!deviceOverrides.gap && typeof baseProps.gap === "number" && baseProps.gap > 16) {
      autoProps.gap = Math.max(12, Math.round(baseProps.gap * 0.85));
    }
    // Auto-scale columns
    if (!deviceOverrides.columns && typeof baseProps.columns === "number" && baseProps.columns > 3) {
      autoProps.columns = 3;
    }

    return { ...autoProps, ...deviceOverrides };
  }

  // Automatic Responsive Adjustments for Mobile (inherits Tablet overrides or Desktop base)
  if (device === "mobile") {
    const tabletOverrides = node.responsive?.tablet?.props ?? {};
    const inheritedProps: Record<string, BuilderPropertyValue> = { ...baseProps, ...tabletOverrides };
    const autoProps: Record<string, BuilderPropertyValue> = { ...inheritedProps };

    // 1. Auto typography scaling: clamp larger titles down to fit mobile screens
    if (!deviceOverrides.fontSize && typeof inheritedProps.fontSize === "number" && inheritedProps.fontSize > 16) {
      autoProps.fontSize = Math.max(13, Math.round(inheritedProps.fontSize * 0.72));
    }

    // 2. Auto spacing scaling: avoid excess padding causing overflow on narrow screens
    if (!deviceOverrides.padding && typeof inheritedProps.padding === "number" && inheritedProps.padding > 16) {
      autoProps.padding = Math.max(8, Math.round(inheritedProps.padding * 0.55));
    }
    if (!deviceOverrides.margin && typeof inheritedProps.margin === "number" && inheritedProps.margin > 16) {
      autoProps.margin = Math.max(4, Math.round(inheritedProps.margin * 0.55));
    }
    if (!deviceOverrides.gap && typeof inheritedProps.gap === "number" && inheritedProps.gap > 12) {
      autoProps.gap = Math.max(8, Math.round(inheritedProps.gap * 0.6));
    }

    // 3. Auto layout wrapping & stacking:
    // Multi-column row containers automatically stack into single-column on mobile
    if (
      !deviceOverrides.flexDirection &&
      inheritedProps.flexDirection === "row" &&
      inheritedProps.autoStackMobile !== false
    ) {
      autoProps.flexDirection = "column";
    }

    // 4. Auto gallery columns adjustment (prevent squishing on mobile)
    if (!deviceOverrides.columns && typeof inheritedProps.columns === "number" && inheritedProps.columns > 2) {
      autoProps.columns = 2;
    }
    if (!deviceOverrides.galleryLayout && (inheritedProps.galleryLayout === "grid-3" || inheritedProps.galleryLayout === "grid-4")) {
      autoProps.galleryLayout = "grid-2";
    }

    return { ...autoProps, ...deviceOverrides };
  }

  return { ...baseProps, ...deviceOverrides };
}

export function getResponsiveOverride(
  node: BuilderObjectBase,
  device: BuilderDevice,
  key: string
): boolean {
  return Object.prototype.hasOwnProperty.call(
    node.responsive?.[device]?.props ?? {},
    key
  );
}

export function createBuilderId(prefix: string): string {
  nextBuilderId += 1;
  return `${prefix}-${Date.now()}-${nextBuilderId}`;
}
