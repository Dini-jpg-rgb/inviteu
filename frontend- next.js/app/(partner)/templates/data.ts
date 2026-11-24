export interface PartnerTemplateItem {
  id: string;
  name: string;
  fullName: string;
  slug: string;
  themeSlug: string;
  category: string;
  style: string;
  color: string;
  dotColor: string;
  thumbnail: string;
  sections: string;
  description: string;
  tier?: "basic" | "medium" | "pro" | "premium";
  tierBadge?: string;
}

export const PARTNER_TEMPLATES: PartnerTemplateItem[] = [
  {
    id: "javanesse-elegant",
    name: "Javanese Elegant",
    fullName: "Javanese Elegant - Nara & Dimas",
    slug: "javanesse-elegant",
    themeSlug: "javanesse-elegant",
    category: "Wedding",
    style: "Traditional Javanese",
    color: "Hijau dan Emas",
    dotColor: "#243320",
    thumbnail: "/templates/javanesse-elegant/Cover 2 - End.png",
    sections: "Cover, Opening, Tentang Acara, Mempelai, Rangkaian Acara, Peta Lokasi, RSVP, Doa & Ucapan, Tanda Kasih, Penutup",
    description: "Keanggunan tradisi bernuansa Islami Jawa modern dengan palet dark olive green, aksen bintang segi delapan emas, tipografi Amiri & Inter, dan lengkungan kubah masjid yang sakral.",
    tier: "medium",
    tierBadge: "Akun Medium",
  },
  {
    id: "emerald-gold-basic",
    name: "Emerald Gold Basic",
    fullName: "Emerald Gold Basic - Angga & Shenina",
    slug: "emerald-gold-basic",
    themeSlug: "emerald-gold-basic",
    category: "Wedding",
    style: "Art Deco",
    color: "Emerald dan Emas",
    dotColor: "#0f4a38",
    thumbnail: "/templates/emerald-gold-basic/thumbnail.png",
    sections: "Cover, Opening, Mempelai, Save The Date & Acara, Peta Lokasi, RSVP, Doa & Ucapan, Tanda Kasih, Terima Kasih",
    description: "Desain undangan Art Deco bertema Emerald & Gold yang megah dan eksklusif untuk akun paket Basic, menampilkan monogram kaligrafi dan ornamen emas mewah.",
    tier: "basic",
    tierBadge: "Akun Basic",
  },
  {
    id: "elegant-gold",
    name: "Elegant",
    fullName: "Elegant Gold",
    slug: "wedding",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Elegant",
    color: "Emas dan krem",
    dotColor: "#8b7e66",
    thumbnail: "/templates/wedding/couple-main.jpg",
    sections: "Cover, Opening, Couple, Event Details, Gallery, RSVP, Guestbook, Digital Gift, Closing",
    description: "Nuansa alam botanis hijau sage elegan, kaligrafi anggun, bingkai cermin klasik, RSVP digital, dan live countdown.",
    tier: "basic",
    tierBadge: "Akun Basic",
  },
  {
    id: "minimalist-navy",
    name: "Minimalist",
    fullName: "Minimalist Navy",
    slug: "minimalist",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Minimalist",
    color: "Navy dan Emas",
    dotColor: "#2c3e50",
    thumbnail: "/templates/wedding/gallery-2.jpg",
    sections: "Cover, Opening, Couple, Event Details, Gallery, RSVP, Guestbook, Digital Gift, Closing",
    description: "Desain minimalis berkelas dengan palet navy blue malam dan aksen emas tipis yang modern.",
    tier: "basic",
    tierBadge: "Akun Basic",
  },
  {
    id: "floral-terracotta",
    name: "Floral",
    fullName: "Floral Terracotta",
    slug: "floral",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Floral",
    color: "Terracotta dan Rose",
    dotColor: "#d9777f",
    thumbnail: "/templates/wedding/gallery-1.jpg",
    sections: "Cover, Opening, Couple, Event Details, Story, Gallery, RSVP, Digital Gift, Closing",
    description: "Sentuhan bunga mekar bernuansa terracotta hangat dan mawar lembut untuk pernikahan romantis.",
    tier: "pro",
    tierBadge: "Akun Pro",
  },
  {
    id: "modern-greenery",
    name: "Modern",
    fullName: "Modern Greenery",
    slug: "modern",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Modern",
    color: "Hijau dan Emas",
    dotColor: "#2563eb",
    thumbnail: "/templates/wedding/venue.jpg",
    sections: "Cover, Opening, Couple, Event Details, Countdown, Gallery, RSVP, Digital Gift, Closing",
    description: "Kombinasi modern geometri mewah dengan dedaunan botanis segar dan tata letak kontemporer.",
    tier: "pro",
    tierBadge: "Akun Pro",
  },
  {
    id: "traditional-bali",
    name: "Traditional",
    fullName: "Traditional - Bali Tropical Luxury",
    slug: "bali-tropical",
    themeSlug: "bali-tropical",
    category: "Wedding",
    style: "Traditional Bali",
    color: "Emerald dan Emas",
    dotColor: "#d7ab58",
    thumbnail: "/templates/bali-tropical/thumbnail.png",
    sections: "Cover, Opening (Om Swastiastu), Mempelai, Rangkaian Acara, Countdown, Kisah Kami, Galeri, RSVP, Pesan Pribadi (Voice Note), Ucapan & Doa, Kirim Hadiah, Suksma",
    description: "Kemegahan ornamen Pulau Dewata dengan Gapura Bali, penjor artistik, bunga kamboja putih mekar, dan aksen emas suci.",
    tier: "medium",
    tierBadge: "Akun Medium",
  },
  {
    id: "romantic-rose",
    name: "Romantic",
    fullName: "Romantic Rose",
    slug: "romantic",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Romantic",
    color: "Pastel Pink dan Krem",
    dotColor: "#e11d48",
    thumbnail: "/templates/wedding/gallery-3.jpg",
    sections: "Cover, Opening, Couple, Event Details, Kisah Kami, Gallery, RSVP, Digital Gift, Closing",
    description: "Nuansa manis penuh cinta dengan gradasi pastel pink, bingkai bunga romantis, dan doa restu.",
    tier: "medium",
    tierBadge: "Akun Medium",
  },
  {
    id: "rustic-earth",
    name: "Rustic",
    fullName: "Rustic Earth",
    slug: "rustic",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Rustic",
    color: "Earth Tone dan Cokelat",
    dotColor: "#15803d",
    thumbnail: "/templates/wedding/gallery-4.jpg",
    sections: "Cover, Opening, Couple, Event Details, Countdown, Gallery, RSVP, Digital Gift, Closing",
    description: "Kehangatan elemen kayu alami, dedaunan kering rustic, dan pencahayaan hangat temaram.",
    tier: "pro",
    tierBadge: "Akun Pro",
  },
  {
    id: "classic-vintage",
    name: "Classic",
    fullName: "Classic Vintage",
    slug: "classic",
    themeSlug: "wedding",
    category: "Wedding",
    style: "Classic",
    color: "Putih dan Emas",
    dotColor: "#ca8a04",
    thumbnail: "/templates/wedding/couple-main.jpg",
    sections: "Cover, Opening, Couple, Event Details, Story, Gallery, RSVP, Digital Gift, Closing",
    description: "Kemewahan klasik abadi dengan monogram kaligrafi formal, kertas bertekstur, dan ornamen vintage.",
    tier: "pro",
    tierBadge: "Akun Pro",
  },
];

export function getPartnerTemplateBySlug(slug: string): PartnerTemplateItem | undefined {
  return PARTNER_TEMPLATES.find(
    (t) =>
      t.slug === slug ||
      t.id === slug ||
      (slug === "javanesse-elegant" && t.slug === "javanesse-elegant") ||
      (slug === "javanese-elegant" && t.slug === "javanesse-elegant") ||
      (slug === "javanesse" && t.slug === "javanesse-elegant") ||
      (slug === "javanese" && t.slug === "javanesse-elegant") ||
      (slug === "emerald-gold-basic" && t.slug === "emerald-gold-basic") ||
      (slug === "emerald_gold_basic" && t.slug === "emerald-gold-basic") ||
      (slug === "emerald-gold" && t.slug === "emerald-gold-basic") ||
      (slug === "wedding" && t.slug === "wedding") ||
      (slug === "bali" && t.slug === "bali-tropical") ||
      (slug === "traditional" && t.slug === "bali-tropical") ||
      (slug === "elegant" && t.slug === "wedding") ||
      (slug === "elegant-gold" && t.slug === "wedding")
  );
}
