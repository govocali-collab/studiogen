'use client';

import Link from 'next/link';
import type { GenerationInfo } from '@/hooks/useSubscription';

interface GenerationCounterProps {
  genInfo: GenerationInfo;
}

export default function GenerationCounter({ genInfo }: GenerationCounterProps) {
  const { used, limit, isTrialing, daysLeftInTrial } = genInfo;

  if (limit === null) {
    return (
      <span className="text-xs font-semibold text-green-600 hidden sm:inline select-none">
        Illimité ✓
      </span>
    );
  }

  const remaining = limit - used;
  const remainingPct = limit > 0 ? remaining / limit : 0;
  const colorClass =
    remainingPct > 0.5 ? 'text-green-600' :
    remainingPct > 0.3 ? 'text-amber-600' :
    'text-red-600';

  const daysStr = daysLeftInTrial !== null
    ? ` · ${daysLeftInTrial}j restant${daysLeftInTrial !== 1 ? 's' : ''}`
    : '';

  const label = isTrialing
    ? `${used} / ${limit} essai${daysStr}`
    : `${used} / ${limit} ce mois`;

  return (
    <Link
      href="/billing"
      className={`text-xs font-semibold hidden sm:inline ${colorClass} hover:opacity-75 transition-opacity`}
    >
      {label}
    </Link>
  );
}
