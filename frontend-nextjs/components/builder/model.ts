export type BuilderObjectKind = "section" | "element" | "widget";

export type ElementType =
  | "text"
  | "image"
  | "video"
  | "shape"
  | "button"
  | "divider"
  | "container";

export type WidgetType = "countdown" | "rsvp" | "music" | "digital_gift";

export interface BuilderObjectBase {
  id: string;
  kind: BuilderObjectKind;
  name: string;
  visible: boolean;
  locked?: boolean;
  groupId?: string;
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
}

export type BuilderDevice = "mobile" | "tablet" | "desktop";
export type BuilderPropertyValue = string | number | boolean | string[];

export const BUILDER_BREAKPOINTS: Record<BuilderDevice, number> = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const BUILDER_FONT_FAMILIES = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
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
          color: "#3A2313",
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
          color: "#9A5A00",
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
    container: {
      name: "Container",
      size: { width: 280, height: 120 },
      props: {
        backgroundColor: "#f7f8fa",
        backgroundType: "solid",
        backgroundImage: "",
        padding: 16,
        margin: 0,
        gap: 0,
        alignment: "stretch",
        justify: "flex-start",
        display: "flex",
        flexDirection: "column",
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
        title: "Kirim Hadiah",
        bankName: "",
        accountNumber: "",
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

export function getResponsivePosition(
  node: BuilderObjectBase,
  device: BuilderDevice
) {
  const override = node.responsive?.[device]?.position;
  return {
    x: override?.x ?? node.position?.x ?? 0,
    y: override?.y ?? node.position?.y ?? 0,
  };
}

export function getResponsiveSize(
  node: BuilderObjectBase,
  device: BuilderDevice
) {
  const override = node.responsive?.[device]?.size;
  return {
    width: override?.width ?? node.size?.width ?? 100,
    height: override?.height ?? node.size?.height ?? 100,
  };
}

export function getResponsiveProps(
  node: BuilderObjectBase,
  device: BuilderDevice
): Record<string, BuilderPropertyValue> {
  return { ...node.props, ...node.responsive?.[device]?.props };
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
