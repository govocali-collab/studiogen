export type SubscriptionTier = 'essentiel' | 'pro';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  website: string | null;
  service_description: string | null;
  phone: string | null;
  email_consent: boolean;
  sms_consent: boolean;
  consent_at: string | null;
  city: string | null;
  province: string | null;
  target_audience: string | null;
  brand_voice: string[] | null;
  services: string[] | null;
  favorite_phrases: string[] | null;
  avoid_phrases: string[] | null;
  content_preferences: string[] | null;
  cta_style: string | null;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  billing_period_start: string | null;
  billing_period_end: string | null;
  generations_used: number;
  trial_generations_used: number;
  logo_size: number | null;
  logo_position: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostHistory {
  id: string;
  user_id: string;
  fb_content: string;
  ig_content: string | null;
  content_type: string;
  tone: string;
  length: string;
  details: string | null;
  created_at: string;
}

export interface CalendarPost {
  id: string;
  user_id: string;
  scheduled_date: string; // DATE — 'YYYY-MM-DD'
  platform: 'fb' | 'ig';
  content: string;
  content_type: string;
  image_url: string | null;
  created_at: string;
}

export interface PlannedContent {
  id: string;
  user_id: string;
  title: string;
  content_type: string;
  service_focus: string | null;
  objective: string | null;
  suggested_date: string; // DATE — 'YYYY-MM-DD'
  platform: 'fb' | 'ig' | 'both';
  status: 'planned' | 'created';
  requires_photo: boolean;
  tone: string | null;
  cta: string | null;
  generated_from_brand_brain: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      post_history: {
        Row: PostHistory;
        Insert: Omit<PostHistory, 'id' | 'created_at'>;
        Update: Partial<PostHistory>;
      };
      calendar_posts: {
        Row: CalendarPost;
        Insert: Omit<CalendarPost, 'id' | 'created_at'>;
        Update: Partial<CalendarPost>;
      };
      planned_content: {
        Row: PlannedContent;
        Insert: Omit<PlannedContent, 'id' | 'created_at'>;
        Update: Partial<PlannedContent>;
      };
    };
  };
}
