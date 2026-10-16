import rawJsonData from "./template.json";

export interface TemplateTheme {
  id: string;
  name: string;
  slug: string;
  themeCategory: string;
  status: "Pending Review" | "Published" | "Rejected";
  version: string;
  createdAt: string;
  thumbnail: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    cardBg: string;
    text: string;
    accent: string;
  };
  typography: {
    serif: string;
    script: string;
  };
  content: {
    monogram: {
      groomInitial: string;
      brideInitial: string;
      ampersand: string;
    };
    couple: {
      groom: string;
      bride: string;
    };
    invitationNote: {
      badge: string;
      familyName: string;
      message: string;
    };
    banner: {
      tag: string;
      message: string;
      coupleTitle: string;
    };
    heroImage: string;
    venue: {
      badge: string;
      placeName: string;
      address: string;
      mapLinkText: string;
      mapUrl: string;
      image: string;
    };
    saveTheDate: {
      badge: string;
      monthText: string;
      dateNumber: string;
      yearText: string;
      isoDate: string;
    };
    dresscode: {
      title: string;
      subtitle: string;
      palettes: { name: string; hex: string }[];
    };
    gallery: {
      title: string;
      images: string[];
    };
    rsvp: {
      title: string;
      subtitle: string;
      fields: {
        nameLabel: string;
        presenceOptions: string[];
        guestCountLabel: string;
        notesLabel: string;
        submitText: string;
      };
    };
    closing: {
      title: string;
      message: string;
      countdownTitle: string;
      coupleNames: string;
      tagline: string;
    };
  };
  rawFigmaJson: unknown;
}

export const weddingTheme: TemplateTheme = {
  id: "template-wedding",
  slug: "wedding",
  name: "Wedding - Mogran & Laura (Botanical Sage Green)",
  themeCategory: "Wedding Luxury / Botanical",
  status: "Pending Review",
  version: "1.0",
  createdAt: "12 Okt 2026",
  thumbnail: "/templates/wedding/couple-main.jpg",
  colorPalette: {
    primary: "#6f7f5f",     // Sage green (RGB 111, 127, 95)
    secondary: "#455633",   // Deep forest green (RGB 69, 86, 51)
    background: "#fcfbfa",  // Soft ivory / warm linen
    cardBg: "#f6f5ef",      // Subtle off-white cream
    text: "#24380f",        // Deep olive dark text
    accent: "#848858",      // Khaki green button / input border
  },
  typography: {
    serif: "'Playfair Display', 'Libre Caslon Display', Georgia, serif",
    script: "'Alex Brush', 'Great Vibes', cursive",
  },
  content: {
    monogram: {
      groomInitial: "M",
      brideInitial: "L",
      ampersand: "&",
    },
    couple: {
      groom: "MOGRAN",
      bride: "LAURA",
    },
    invitationNote: {
      badge: "A Special Invitation",
      familyName: "Caine",
      message: "We would be delighted to have you with us as we celebrate the beginning of our forever.",
    },
    banner: {
      tag: "Two Hearts, One Journey",
      message: "With joyful hearts, we invite you to witness and celebrate the beginning of our new chapter together.",
      coupleTitle: "MOGRAN & LAURA",
    },
    heroImage: "/templates/wedding/couple-main.jpg",
    venue: {
      badge: "Where We Celebrate",
      placeName: "Sangeh",
      address: "Jl. Contoh No. 123, Denpasar, Bali\nWe look forward to welcoming you there.",
      mapLinkText: "[View on maps]",
      mapUrl: "https://maps.google.com",
      image: "/templates/wedding/venue.jpg",
    },
    saveTheDate: {
      badge: "Save the date",
      monthText: "Desember",
      dateNumber: "28",
      yearText: "2026",
      isoDate: "2026-12-28T09:00:00",
    },
    dresscode: {
      title: "Dresscode",
      subtitle: "Earth / Botanical Green Palette",
      palettes: [
        { name: "Sage Green", hex: "#9ba88d" },
        { name: "Slate Mist", hex: "#829b9e" },
        { name: "Warm Olive", hex: "#8c846d" },
        { name: "Deep Herb", hex: "#6c735a" },
        { name: "Champagne Cream", hex: "#c4c1a4" },
      ],
    },
    gallery: {
      title: "Gallery",
      images: [
        "/templates/wedding/gallery-1.jpg",
        "/templates/wedding/gallery-2.jpg",
        "/templates/wedding/gallery-3.jpg",
        "/templates/wedding/gallery-4.jpg",
      ],
    },
    rsvp: {
      title: "Will You Join Us?",
      subtitle: "Your presence would mean so much to us. Kindly confirm your attendance before",
      fields: {
        nameLabel: "Nama",
        presenceOptions: ["Hadir", "Tidak Hadir"],
        guestCountLabel: "Berapa orang yang hadir?",
        notesLabel: "Notes",
        submitText: "Kirim",
      },
    },
    closing: {
      title: "Until We Meet",
      message: "Thank you for being part of our journey and for sharing in this beautiful moment with us.\nWith love,",
      countdownTitle: "Countdown to Event",
      coupleNames: "Morgan & Laura",
      tagline: "Forever begins here.",
    },
  },
  rawFigmaJson: rawJsonData,
};

// Alias export for backward compatibility
export const mogranLauraTheme = weddingTheme;

