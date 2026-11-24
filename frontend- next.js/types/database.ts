/**
 * InviteU Database & Entity Types
 * Sesuai dengan PRD v3.0 (B2B Partner-Based Platform) dan ERD Backend
 */

export type Role = "admin" | "partner" | "designer" | "event_owner" | "guest" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: "active" | "inactive" | "suspended";
  created_at?: string;
  updated_at?: string;
}

export interface Partner {
  id: string;
  user_id: string;
  nama_bisnis: string;
  phone?: string;
  address?: string;
  logo?: string;
  status: "active" | "inactive";
  active_package_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type PackageTier = "basic" | "pro" | "premium";

export interface Package {
  id: string;
  name: string;
  tier: PackageTier;
  max_invitation: number;
  gallery_limit: number;
  widget_rules: string[]; // List of allowed widget IDs
  price: number;
  description?: string;
  status: "active" | "inactive";
}

export interface PackagePurchase {
  id: string;
  partner_id: string;
  package_id: string;
  order_number: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  paid_at?: string;
  created_at: string;
}

export interface QuotaUsage {
  partner_id: string;
  published_count: number;
  total_quota: number;
  remaining_quota: number;
}

export type InvitationStatus = "draft" | "published" | "expired";

export interface Invitation {
  id: string;
  partner_id: string;
  template_version_id: string;
  title: string;
  slug: string;
  status: InvitationStatus;
  published_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
  event?: Event;
  guest_count?: number;
  rsvp_count?: number;
}

export interface Event {
  id: string;
  invitation_id: string;
  event_date: string;
  event_time: string;
  location: string;
  locked: boolean; // Terkunci otomatis setelah invitation published
  created_at?: string;
  updated_at?: string;
}

export interface EventOwnerAccess {
  id: string;
  invitation_id: string;
  token?: string;
  otp?: string;
  status: "active" | "expired" | "revoked";
  expired_at?: string;
  created_at?: string;
}

export interface Guest {
  id: string;
  invitation_id: string;
  name: string;
  phone?: string;
  pax?: number;
  unique_code?: string;
  created_at?: string;
}

export interface RSVP {
  id: string;
  guest_id: string;
  invitation_id: string;
  status_hadir: "hadir" | "tidak_hadir" | "ragu_ragu";
  jumlah_tamu: number;
  pesan_ucapan?: string;
  submitted_at: string;
}

export interface Template {
  id: string;
  designer_id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  preview_url?: string;
  status: "draft" | "pending_review" | "published" | "rejected";
  created_at?: string;
  updated_at?: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  konten_layout_widget_styling: Record<string, unknown>;
  status: "draft" | "pending_review" | "published" | "rejected";
  approved_by?: string;
  approved_at?: string;
}
