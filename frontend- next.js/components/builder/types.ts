import { SectionConfig, SectionSettings } from "./registry";

export * from "./registry/types";

export type WidgetId = string;

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  story: string;
}

export interface SectionProperties extends SectionSettings {
  // Content / Text
  title?: string;
  subtitle?: string;
  description?: string;
  coupleTitle?: string;
  badge?: string;
  note?: string;

  // Event Details
  placeName?: string;
  address?: string;
  dateText?: string;
  timeText?: string;
  mapUrl?: string;

  // Countdown
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;

  // Love Story
  milestones?: MilestoneItem[];

  // Music
  songTitle?: string;
  artistName?: string;
  audioUrl?: string;
  autoplay?: boolean;

  // RSVP
  submitButtonText?: string;

  // Digital Gift
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  giftNote?: string;

  // Video Greeting (Add-on)
  videoUrl?: string;
  videoTitle?: string;

  // Media
  imageUrl?: string;
  galleryImages?: string[];

  [key: string]: unknown;
}

export type BuilderSection = SectionConfig;

export interface TemplateDataInput {
  id?: string;
  name: string;
  slug: string;
  themeCategory?: string;
  status?: string;
  version?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sections?: SectionConfig[];
}
