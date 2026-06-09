'use client';

import { useEffect, useState } from 'react';
import type { Profile } from '@/lib/supabase/types';
import { PRICING } from '@/lib/config/pricing';

export interface GenerationInfo {
  used: number;
  limit: number | null;
  isTrialing: boolean;
  daysLeftInTrial: number | null;
  tier: 'essentiel' | 'pro';
}

export interface SubscriptionState {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
  updateCounts: (generations_used: number, trial_generations_used: number) => void;
  isAdmin: boolean;
  genInfo: GenerationInfo;
}

function computeGenInfo(profile: Profile | null): GenerationInfo {
  const tier = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
  const status = profile?.subscription_status ?? 'trialing';
  const isTrialing = status === 'trialing';

  const used = isTrialing
    ? (profile?.trial_generations_used ?? 0)
    : (profile?.generations_used ?? 0);

  const limit: number | null = isTrialing
    ? PRICING[tier].trialGenerations
    : tier === 'pro' ? null : 30;

  const daysLeftInTrial = isTrialing && profile?.created_at
    ? Math.max(0, Math.ceil(
        (new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now()) /
        (24 * 60 * 60 * 1000),
      ))
    : null;

  return { used, limit, isTrialing, daysLeftInTrial, tier };
}

export function useSubscription(): SubscriptionState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setProfile(d?.profile ?? null);
        setIsAdmin(d?.is_admin ?? false);
      })
      .finally(() => setLoading(false));
  }, [tick]);

  const updateCounts = (generations_used: number, trial_generations_used: number) => {
    setProfile((prev) => prev ? { ...prev, generations_used, trial_generations_used } : prev);
  };

  return {
    profile,
    loading,
    refresh: () => setTick((t) => t + 1),
    updateCounts,
    isAdmin,
    genInfo: computeGenInfo(profile),
  };
}
