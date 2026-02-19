/**
 * Database types for MotionForge (Supabase schema)
 * Keep in sync with supabase/migrations/
 */

export type PlanId = "free" | "starter" | "pro" | "team";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: PlanId;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type UsageEventType = "generation" | "render";

export interface UsageEvent {
  id: string;
  user_id: string;
  event_type: UsageEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  code: string;
  duration_in_frames: number;
  fps: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string }; Update: Partial<Profile> };
      subscriptions: { Row: Subscription; Insert: Omit<Subscription, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Subscription> };
      usage_events: { Row: UsageEvent; Insert: Omit<UsageEvent, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<UsageEvent> };
      api_keys: { Row: ApiKey; Insert: Omit<ApiKey, "id" | "created_at"> & { id?: string; created_at?: string }; Update: Partial<ApiKey> };
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Project> };
    };
    Enums: {
      plan_id: PlanId;
    };
  };
}
