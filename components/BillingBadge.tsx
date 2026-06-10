'use client';

import Link from 'next/link';
import { TIER_LIMITS } from '@/lib/config/tier-limits';
import type { Profile } from '@/lib/supabase/types';

interface BillingBadgeProps {
  profile: Profile | null;
}

export default function BillingBadge({ profile }: BillingBadgeProps) {
  if (!profile) return null;

  const tier = profile.subscription_tier;
  const status = profile.subscription_status;
  const used = profile.generations_used;
  const limits = TIER_LIMITS[tier];
  const max = limits.generationsPerMonth;
  const isPro = tier === 'pro';
  const isPastDue = status === 'past_due';
  const isCanceled = status === 'canceled';

  return (
    <Link href="/billing" className="flex items-center gap-2 group">
      {(isPastDue || isCanceled) && (
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
          {isCanceled ? 'Annulé' : 'Paiement requis'}
        </span>
      )}
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
        isPro
          ? 'text-white bg-violet-600 border-violet-600 group-hover:bg-violet-700 group-hover:border-violet-700'
          : 'text-violet-600 bg-violet-50 border-violet-200 group-hover:border-violet-400'
      }`}>
        {isPro ? '⚡ Pro' : 'Essentiel'}
      </span>
    </Link>
  );
}
