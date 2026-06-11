'use client';

import { useState } from 'react';
import { PRICING } from '@/lib/config/pricing';

interface UpgradeModalProps {
  reason: string;
  onClose: () => void;
  checkoutTier?: 'essentiel' | 'pro';
}

export default function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<'essentiel' | 'pro' | null>(null);

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
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Choisissez votre forfait</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{reason}</p>
            </div>
          </div>

          {/* Plans */}
          <div className="space-y-3">
            {/* Essentiel */}
            <button
              onClick={() => handleCheckout('essentiel')}
              disabled={loading !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-violet-300 bg-white transition-all disabled:opacity-60 active:scale-[0.98] text-left"
            >
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-0.5">{PRICING.essentiel.name}</div>
                <div className="text-sm font-bold text-gray-900">{PRICING.essentiel.price} $ CA / mois</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{PRICING.essentiel.description}</div>
              </div>
              <span className="text-sm font-semibold text-violet-600 ml-4 shrink-0">
                {loading === 'essentiel' ? 'Redirection…' : 'Choisir →'}
              </span>
            </button>

            {/* Pro — recommandé */}
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading !== null}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-violet-700 bg-gradient-to-r from-fuchsia-950 to-violet-950 transition-all disabled:opacity-60 active:scale-[0.98] text-left"
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-violet-400">{PRICING.pro.name}</span>
                  <span className="bg-violet-600 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold">Recommandé</span>
                </div>
                <div className="text-sm font-bold text-white">{PRICING.pro.price} $ CA / mois</div>
                <div className="text-[11px] text-violet-300 mt-0.5">{PRICING.pro.description}</div>
              </div>
              <span className="text-sm font-semibold text-violet-300 ml-4 shrink-0">
                {loading === 'pro' ? 'Redirection…' : 'Choisir →'}
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Fermer
          </button>

          <p className="text-[10px] text-center text-gray-400">
            La facturation apparaîtra sous le nom <span className="font-medium">Astrova</span> sur votre relevé bancaire.
          </p>
        </div>
      </div>
    </div>
  );
}
