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
    };
  };
}
