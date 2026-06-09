'use client';

import { useEffect, useState } from 'react';
import type { GenerationInfo } from '@/hooks/useSubscription';

const SNOOZE_KEY = 'gen-snooze';

interface GenerationWarningProps {
  genInfo: GenerationInfo;
  onActivate: () => void;
  onUpgrade: () => void;
}

export default function GenerationWarning({ genInfo, onActivate, onUpgrade }: GenerationWarningProps) {
  const [snoozed, setSnoozed] = useState(true); // start hidden until client check

  useEffect(() => {
    const until = parseInt(localStorage.getItem(SNOOZE_KEY) ?? '0');
    setSnoozed(until > Date.now());
  }, []);

  const { used, limit, isTrialing } = genInfo;

  if (limit === null) return null; // Pro unlimited

  const usedPct = limit > 0 ? used / limit : 0;
  if (usedPct < 0.6) return null; // only show after 60% used
  if (snoozed) return null;

  const remaining = Math.max(0, limit - used);
  const isRed = usedPct >= 0.9;

  const message = remaining === 0
    ? isTrialing ? "Limite d'essai atteinte" : 'Limite mensuelle atteinte'
    : `Plus que ${remaining} génération${remaining > 1 ? 's' : ''} ${isTrialing ? "d'essai" : 'ce mois-ci'}`;

  return (
    <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 ${
      isRed
        ? 'bg-red-50 border border-red-200'
        : 'bg-amber-50 border border-amber-200'
    }`}>
      <span className={`text-xs ${isRed ? 'text-red-700 font-medium' : 'text-amber-700'}`}>
        {message}
      </span>
      <button
        onClick={isTrialing ? onActivate : onUpgrade}
        className={`text-[10px] font-semibold whitespace-nowrap px-2.5 py-1 rounded-lg transition-colors flex-shrink-0 ${
          isRed
            ? 'bg-red-100 hover:bg-red-200 text-red-800'
            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
        }`}
      >
        {isTrialing ? 'Activer mon abonnement →' : 'Passer au Pro →'}
      </button>
    </div>
  );
}
