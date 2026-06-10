'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRICING } from '@/lib/config/pricing';

interface UpgradeModalProps {
  reason: string;
  onClose: () => void;
  checkoutTier?: 'essentiel' | 'pro';
}

export default function UpgradeModal({ reason, onClose, checkoutTier = 'pro' }: UpgradeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'essentiel' | 'pro' | null>(null);

  const isTrialEnd = checkoutTier === 'pro' && reason.includes('essai');

  const handleCheckout = async (tier: 'essentiel' | 'pro') => {
    setLoading(tier);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(null);
    } catch {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-violet-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isTrialEnd ? "Votre essai est terminé" : 'Fonctionnalité Pro'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{reason}</p>
            </div>
          </div>

          {isTrialEnd ? (
            /* Show both plans side by side for trial end */
            <div className="space-y-3">
              {(['essentiel', 'pro'] as const).map((t) => {
                const p = PRICING[t];
                const isPro = t === 'pro';
                return (
                  <button
                    key={t}
                    onClick={() => handleCheckout(t)}
                    disabled={loading !== null}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all disabled:opacity-60 active:scale-[0.98] ${
                      isPro
                        ? 'bg-gradient-to-r from-fuchsia-950 to-violet-950 border-violet-800 text-white'
                        : 'bg-white border-gray-200 hover:border-violet-300 text-gray-800'
                    }`}
                  >
                    <div className="text-left">
                      <div className={`text-xs font-semibold mb-0.5 ${isPro ? 'text-violet-400' : 'text-gray-500'}`}>
                        {p.name} {isPro && <span className="ml-1 bg-violet-600 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase">Recommandé</span>}
                      </div>
                      <div className={`text-sm font-bold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                        {p.price} $ CA / mois
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${isPro ? 'text-violet-300' : 'text-violet-600'}`}>
                      {loading === t ? 'Redirection…' : 'Choisir →'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Single plan for feature gates */
            <div className="bg-gradient-to-br from-fuchsia-950 to-violet-950 rounded-2xl p-4 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">{PRICING[checkoutTier].price} $</span>
                <span className="text-gray-400 text-sm">CA / mois</span>
              </div>
              <ul className="space-y-1.5">
                {PRICING[checkoutTier].features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isTrialEnd && (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleCheckout(checkoutTier)}
                disabled={loading !== null}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-200 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Redirection…' : 'Passer au Pro →'}
              </button>
            </div>
          )}

          {isTrialEnd && (
            <button
              onClick={onClose}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
