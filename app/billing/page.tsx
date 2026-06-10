'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRICING } from '@/lib/config/pricing';
import { TIER_LIMITS } from '@/lib/config/tier-limits';
import type { Profile } from '@/lib/supabase/types';
import AppHeader from '@/components/AppHeader';

export default function BillingPage() {
  return <Suspense><BillingPageInner /></Suspense>;
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => {
      setProfile(d?.profile ?? null);
      setLoading(false);
    });
    if (searchParams.get('success')) setToast('Abonnement activé avec succès !');
    if (searchParams.get('canceled')) setToast('Paiement annulé.');
  }, [searchParams]);

  const tier = profile?.subscription_tier ?? 'essentiel';
  const status = profile?.subscription_status ?? 'trialing';
  const generationsUsed = profile?.generations_used ?? 0;
  const limits = TIER_LIMITS[tier];
  const generationsMax = limits.generationsPerMonth === Infinity ? '∞' : limits.generationsPerMonth;
  const generationsPct = limits.generationsPerMonth === Infinity ? 0
    : Math.min(100, (generationsUsed / limits.generationsPerMonth) * 100);

  const handleCheckout = async (targetTier: 'essentiel' | 'pro') => {
    setActionLoading(targetTier);
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: targetTier }),
    });
    const { url, error } = await res.json();
    if (error) { setToast(error); setActionLoading(''); return; }
    window.location.href = url;
  };

  const handlePortal = async () => {
    setActionLoading('portal');
    const res = await fetch('/api/stripe/create-portal', { method: 'POST' });
    const { url, error } = await res.json();
    if (error) { setToast(error); setActionLoading(''); return; }
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isSubscribed = !!profile?.stripe_customer_id;
  const statusLabel: Record<string, string> = {
    trialing: isSubscribed ? 'Actif' : 'Essai gratuit',
    active: 'Actif',
    past_due: 'Paiement en attente',
    canceled: 'Annulé',
  };
  const statusColor: Record<string, string> = {
    trialing: isSubscribed ? 'text-green-700 bg-green-50 border-green-200' : 'text-blue-700 bg-blue-50 border-blue-200',
    active: 'text-green-700 bg-green-50 border-green-200',
    past_due: 'text-amber-700 bg-amber-50 border-amber-200',
    canceled: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-screen-md mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-sm text-gray-400 mt-1">Gérez votre abonnement à Studio Gen.</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className="bg-gradient-to-r from-fuchsia-950 to-violet-950 text-white text-sm rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg">
            <span>{toast}</span>
            <button onClick={() => setToast('')} className="ml-4 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* Current plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Plan actuel</h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor[status] ?? statusColor.trialing}`}>
              {statusLabel[status] ?? status}
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {tier === 'pro' ? PRICING.pro.name : PRICING.essentiel.name}
            </span>
            <span className="text-sm text-gray-400 mb-1">
              {tier === 'pro' ? `${PRICING.pro.price} $ CA/mois` : `${PRICING.essentiel.price} $ CA/mois`}
            </span>
          </div>

          {/* Generations usage */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Générations ce mois-ci</span>
              <span className="font-semibold tabular-nums text-gray-700">{generationsUsed} / {generationsMax}</span>
            </div>
            {limits.generationsPerMonth !== Infinity && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${generationsPct > 85 ? 'bg-amber-500' : 'bg-violet-600'}`}
                  style={{ width: `${generationsPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Features list */}
          <ul className="space-y-2">
            {PRICING[tier].features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {profile?.stripe_customer_id && status !== 'trialing' && (
            <button
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              {actionLoading === 'portal' ? 'Chargement…' : 'Gérer le paiement (Stripe) →'}
            </button>
          )}
        </div>

        {/* Plan selection */}
        <div className={`grid gap-5 ${status === 'active' || status === 'trialing' ? 'max-w-sm' : 'sm:grid-cols-2'}`}>
          {(['essentiel', 'pro'] as const).filter((t) => !(t === tier && (status === 'active' || status === 'trialing'))).map((t) => {
            const p = PRICING[t];
            const isCurrent = tier === t && status === 'active';
            const isUpgrade = t === 'pro' && tier === 'essentiel';
            const isDowngrade = t === 'essentiel' && tier === 'pro';
            const isPro = t === 'pro';

            return (
              <div
                key={t}
                className={`rounded-2xl p-6 space-y-5 relative overflow-hidden ${
                  isPro
                    ? 'bg-gradient-to-br from-fuchsia-950 to-violet-950 border border-fuchsia-900/40'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {isPro && (
                  <div className="absolute top-4 right-4 bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                    Recommandé
                  </div>
                )}
                <div>
                  <div className={`text-sm font-semibold mb-1 ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>{p.name}</div>
                  <div className={`text-3xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                    {p.price} $<span className={`text-sm font-normal ml-1 ${isPro ? 'text-gray-400' : 'text-gray-400'}`}>CA/mois</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${isPro ? 'text-gray-300' : 'text-gray-600'}`}>
                      <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPro ? 'text-violet-400' : 'text-violet-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrent && handleCheckout(t)}
                  disabled={isCurrent || !!actionLoading}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                    isCurrent
                      ? isPro ? 'bg-white/10 text-white/40 cursor-default' : 'bg-gray-100 text-gray-400 cursor-default'
                      : isPro
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50'
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600'
                  }`}
                >
                  {actionLoading === t
                    ? 'Redirection…'
                    : isCurrent
                    ? 'Plan actuel'
                    : isUpgrade
                    ? 'Passer au Pro →'
                    : isDowngrade
                    ? 'Passer à Essentiel'
                    : `S'abonner (${p.price} $/mois)`}
                </button>
                {isUpgrade && tier === 'essentiel' && status === 'active' && (
                  <p className={`text-[10px] text-center -mt-2 ${isPro ? 'text-gray-500' : 'text-gray-400'}`}>
                    Facturation au prorata pour les jours restants
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
