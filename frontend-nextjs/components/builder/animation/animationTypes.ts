/**
 * Animation System Types for InviteU Page Builder
 */

export type AnimationCategory =
  | "opening"
  | "decorative"
  | "scroll"
  | "character"
  | "functional";

export type AnimationTrigger =
  | "on_load"
  | "on_scroll"
  | "on_click"
  | "continuous";

export type AnimationDirection = "up" | "down" | "left" | "right" | "none";
export type AnimationIntensity = "subtle" | "normal" | "high";
export type AnimationRepeat = "once" | "infinite";

export type OpeningAnimationType =
  | "none"
  | "animated_envelope"
  | "envelope_wax_seal"
  | "fade_in"
  | "slide_in";

export type DecorativeAnimationType =
  | "none"
  | "falling_petals"
  | "falling_leaves"
  | "sparkles"
  | "floating_light"
  | "flying_butterflies"
  | "flying_birds"
  | "swinging_ornament";

export type ScrollAnimationType =
  | "none"
  | "fade_in"
  | "fade_out"
  | "slide_up"
  | "slide_down"
  | "slide_left"
  | "slide_right"
  | "slide_out"
  | "zoom_in"
  | "zoom_out"
  | "flip"
  | "rotate"
  | "parallax";

export type CharacterAnimationType =
  | "none"
  | "wedding_character_3d"
  | "motion_graphic"
  | "animated_illustration";

export type FunctionalAnimationType =
  | "none"
  | "pulse"
  | "bounce"
  | "shake"
  | "subtle_hover"
  | "countdown_tick"
  | "music_vinyl_spin";

export type AnyAnimationType =
  | OpeningAnimationType
  | DecorativeAnimationType
  | ScrollAnimationType
  | CharacterAnimationType
  | FunctionalAnimationType;

export interface ElementAnimationConfig {
  type: ScrollAnimationType | FunctionalAnimationType | CharacterAnimationType | "none";
  trigger?: AnimationTrigger;
  duration?: number; // in seconds (e.g. 0.8)
  delay?: number; // in seconds (e.g. 0.2)
  direction?: AnimationDirection;
  intensity?: AnimationIntensity;
  repeat?: AnimationRepeat;
  easing?: "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out";
  disabled?: boolean;
}

export interface PageAnimationSettings {
  opening?: {
    type: OpeningAnimationType;
    envelopeTitle?: string;
    guestName?: string;
    sealColor?: string;
  };
  decorative?: {
    type: DecorativeAnimationType;
    density?: "light" | "medium" | "heavy";
    speed?: "slow" | "normal" | "fast";
  };
}

export interface AnimationOptionItem {
  value: string;
  label: string;
  description: string;
  category: AnimationCategory;
  defaultTrigger: AnimationTrigger;
  defaultDuration: number;
}

export const OPENING_ANIMATION_OPTIONS: AnimationOptionItem[] = [
  {
    value: "animated_envelope",
    label: "Animated Envelope",
    description: "Amplop undangan interaktif yang terbuka saat diklik.",
    category: "opening",
    defaultTrigger: "on_click",
    defaultDuration: 1.2,
  },
  {
    value: "envelope_wax_seal",
    label: "Envelope with Wax Seal",
    description: "Amplop elegan dengan segel lilin tradisional yang dapat dipecah.",
    category: "opening",
    defaultTrigger: "on_click",
    defaultDuration: 1.4,
  },
  {
    value: "fade_in",
    label: "Fade In",
    description: "Transisi lembut memudar saat halaman pertama kali dibuka.",
    category: "opening",
    defaultTrigger: "on_load",
    defaultDuration: 1.0,
  },
  {
    value: "slide_in",
    label: "Slide In",
    description: "Halaman meluncur mulus ke atas saat undangan dibuka.",
    category: "opening",
    defaultTrigger: "on_load",
    defaultDuration: 0.8,
  },
];

export const DECORATIVE_ANIMATION_OPTIONS: AnimationOptionItem[] = [
  {
    value: "falling_petals",
    label: "Falling Flower Petals",
    description: "Hujan kelopak bunga mawar/sakura berguguran di latar belakang.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 6.0,
  },
  {
    value: "falling_leaves",
    label: "Falling Leaves",
    description: "Daun-daun musim gugur/botanikal melayang tertiup angin.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 7.0,
  },
  {
    value: "sparkles",
    label: "Sparkles",
    description: "Kilauan cahaya bintang berkilip halus di sekeliling undangan.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 3.5,
  },
  {
    value: "floating_light",
    label: "Floating Light",
    description: "Partikel cahaya hangat melayang pelan memberi nuansa magis.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 5.0,
  },
  {
    value: "flying_butterflies",
    label: "Flying Butterflies",
    description: "Kupu-kupu anggun mengepakkan sayap melintasi layar.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 8.0,
  },
  {
    value: "flying_birds",
    label: "Flying Birds",
    description: "Siluet merpati putih terbang melintasi langit undangan.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 9.0,
  },
  {
    value: "swinging_ornament",
    label: "Swinging Ornament",
    description: "Lampu gantung atau bunga hias berayun lembut ditiup angin.",
    category: "decorative",
    defaultTrigger: "continuous",
    defaultDuration: 4.0,
  },
];

export const SCROLL_ANIMATION_OPTIONS: AnimationOptionItem[] = [
  {
    value: "fade_in",
    label: "Fade In",
    description: "Elemen memudar masuk saat digulir ke dalam layar.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "slide_up",
    label: "Slide In Up",
    description: "Elemen meluncur naik dari bawah ke posisinya.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "slide_down",
    label: "Slide In Down",
    description: "Elemen meluncur turun dari atas ke posisinya.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "slide_left",
    label: "Slide In Left",
    description: "Elemen meluncur dari arah kiri ke kanan.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "slide_right",
    label: "Slide In Right",
    description: "Elemen meluncur dari arah kanan ke kiri.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "zoom_in",
    label: "Zoom In",
    description: "Elemen membesar perlahan dari skala kecil ke normal.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.7,
  },
  {
    value: "zoom_out",
    label: "Zoom Out",
    description: "Elemen mengecil anggun dari skala besar ke proporsi pas.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.7,
  },
  {
    value: "flip",
    label: "Flip 3D",
    description: "Elemen membalik 3D vertikal/horizontal.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.9,
  },
  {
    value: "rotate",
    label: "Rotate In",
    description: "Elemen berputar masuk perlahan saat tampak di layar.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "fade_out",
    label: "Fade Out",
    description: "Elemen memudar keluar secara lembut.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "slide_out",
    label: "Slide Out",
    description: "Elemen meluncur keluar dari tampilan.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 0.8,
  },
  {
    value: "parallax",
    label: "Parallax Float",
    description: "Elemen bergerak sedikit lebih lambat dari kecepatan gulir.",
    category: "scroll",
    defaultTrigger: "on_scroll",
    defaultDuration: 1.2,
  },
];

export const FUNCTIONAL_ANIMATION_OPTIONS: AnimationOptionItem[] = [
  {
    value: "pulse",
    label: "Pulse",
    description: "Denyut ritmis menarik perhatian (cocok untuk tombol RSVP & CTA).",
    category: "functional",
    defaultTrigger: "continuous",
    defaultDuration: 1.8,
  },
  {
    value: "bounce",
    label: "Bounce",
    description: "Memantul halus ke atas dan bawah (bagus untuk tombol navigasi/amplop).",
    category: "functional",
    defaultTrigger: "continuous",
    defaultDuration: 2.0,
  },
  {
    value: "shake",
    label: "Shake (Getar)",
    description: "Elemen bergetar horizontal memberikan efek penekanan.",
    category: "functional",
    defaultTrigger: "continuous",
    defaultDuration: 1.0,
  },
  {
    value: "subtle_hover",
    label: "Subtle Hover & Glow",
    description: "Efek melayang lembut dan kilau saat kursor diarahkan ke tombol.",
    category: "functional",
    defaultTrigger: "on_load",
    defaultDuration: 0.3,
  },
  {
    value: "countdown_tick",
    label: "Countdown Number Flip",
    description: "Animasi perpindahan angka pada penghitung mundur.",
    category: "functional",
    defaultTrigger: "continuous",
    defaultDuration: 1.0,
  },
  {
    value: "music_vinyl_spin",
    label: "Vinyl Disc Spin",
    description: "Piringan hitam berputar berirama saat musik dimainkan.",
    category: "functional",
    defaultTrigger: "continuous",
    defaultDuration: 4.0,
  },
];

export const CHARACTER_ANIMATION_OPTIONS: AnimationOptionItem[] = [
  {
    value: "wedding_character_3d",
    label: "3D Wedding Character",
    description: "Karakter mempelai pria & wanita animasi lembut memberi salam.",
    category: "character",
    defaultTrigger: "continuous",
    defaultDuration: 3.0,
  },
  {
    value: "motion_graphic",
    label: "Motion Graphic Monogram",
    description: "Inisial nama pasangan bergaya motion graphic garis emas.",
    category: "character",
    defaultTrigger: "on_load",
    defaultDuration: 2.5,
  },
  {
    value: "animated_illustration",
    label: "Animated Illustration",
    description: "Ilustrasi venue atau bunga bergerak hidup.",
    category: "character",
    defaultTrigger: "continuous",
    defaultDuration: 4.0,
  },
];
