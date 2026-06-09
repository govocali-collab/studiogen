'use client';

import { useState } from 'react';
import { PRICING } from '@/lib/config/pricing';

interface UpgradeModalProps {
  reason: string;
  onClose: () => void;
  checkoutTier?: 'essentiel' | 'pro';
}

export default function UpgradeModal({ reason, onClose, checkoutTier = 'pro' }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const isTrial = checkoutTier === 'essentiel';
  const plan = PRICING[checkoutTier];

  const handleSnooze = () => {
    localStorage.setItem('gen-snooze', String(Date.now() + 24 * 60 * 60 * 1000));
    onClose();
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: checkoutTier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        console.error('Checkout error:', data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-violet-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Top gradient bar */}
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
                {isTrial ? "Limite d'essai atteinte" : 'Fonctionnalité Pro'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{reason}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-950 to-violet-950 rounded-2xl p-4 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{plan.price} $</span>
              <span className="text-gray-400 text-sm">CA / mois</span>
              {isTrial && (
                <span className="ml-auto text-[10px] font-semibold bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {plan.name}
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                  <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-200 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Redirection…' : isTrial ? 'Activer mon abonnement →' : 'Passer au Pro →'}
              </button>
            </div>
            <button
              onClick={handleSnooze}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Me rappeler le mois prochain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
