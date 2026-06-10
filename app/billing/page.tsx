'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { PRICING } from '@/lib/config/pricing';
import { TIER_LIMITS } from '@/lib/config/tier-limits';
import type { Profile } from '@/lib/supabase/types';
import AppHeader from '@/components/AppHeader';
import { createClient } from '@/lib/supabase/client';

export default function BillingPage() {
  return <Suspense><BillingPageInner /></Suspense>;
}

interface Invoice {
  id: string;
  number: string | null;
  date: number;
  amount: number;
  currency: string;
  pdf: string | null;
  url: string | null;
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<'abonnement' | 'recus'>(
    searchParams.get('tab') === 'recus' ? 'recus' : 'abonnement'
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => {
      setProfile(d?.profile ?? null);
      setLoading(false);
    });
    fetch('/api/stripe/invoices').then((r) => r.json()).then((d) => {
      setInvoices(d?.invoices ?? []);
    });
    if (searchParams.get('success')) setToast('Abonnement activé avec succès !');
    if (searchParams.get('canceled')) setToast('Paiement annulé.');
  }, [searchParams]);

  const tier = profile?.subscription_tier ?? 'essentiel';
  const status = profile?.subscription_status ?? 'trialing';
  const effectiveTier = status === 'trialing' ? 'pro' : tier;
  const isTrialing = status === 'trialing';
  const generationsUsed = isTrialing
    ? (profile?.trial_generations_used ?? 0)
    : (profile?.generations_used ?? 0);
  const limits = TIER_LIMITS[effectiveTier];
  const trialMax = 7;
  const generationsMax = isTrialing ? trialMax : (limits.generationsPerMonth === Infinity ? '∞' : limits.generationsPerMonth);
  const generationsPct = isTrialing
    ? Math.min(100, (generationsUsed / trialMax) * 100)
    : limits.generationsPerMonth === Infinity ? 0
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

  const handleCancel = async () => {
    setCancelLoading(true);
    const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
    const { error } = await res.json();
    if (error) { setToast(error); setCancelLoading(false); setCancelConfirm(false); return; }
    setCancelled(true);
    setCancelConfirm(false);
    setTimeout(async () => {
      await createClient().auth.signOut();
      router.push('/');
    }, 8000);
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

  if (cancelled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Merci d'avoir essayé StudioGen</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Votre abonnement a été annulé. Nous espérons vous revoir bientôt.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Vous pouvez vous reconnecter en tout temps pour consulter ou télécharger vos reçus.
            </p>
          </div>
          <p className="text-xs text-gray-400">Déconnexion dans quelques secondes...</p>
          <button
            onClick={async () => {
              await createClient().auth.signOut();
              router.push('/');
            }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Se déconnecter maintenant
          </button>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
          <p className="text-sm text-gray-400 mt-1">Gérez votre abonnement StudioGen.</p>
        </div>

        {/* Tabs */}
        <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['abonnement', 'recus'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'abonnement' ? 'Abonnement' : 'Reçus'}
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="bg-gradient-to-r from-fuchsia-950 to-violet-950 text-white text-sm rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg">
            <span>{toast}</span>
            <button onClick={() => setToast('')} className="ml-4 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Abonnement tab ── */}
        {tab === 'abonnement' && (
          <div className="space-y-8">
            {/* Status + usage */}
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${statusColor[status] ?? statusColor.trialing}`}>
                  {statusLabel[status] ?? status}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {PRICING[effectiveTier].name}
                </span>
                {isTrialing && (
                  <span className="text-xs text-gray-400">· essai 7 jours</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Générations ce mois-ci</span>
                  <span className="font-semibold tabular-nums text-gray-700">{generationsUsed} / {generationsMax}</span>
                </div>
                {limits.generationsPerMonth !== Infinity && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${generationsPct > 85 ? 'bg-amber-500' : 'bg-violet-600'}`}
                      style={{ width: `${generationsPct}%` }}
                    />
                  </div>
                )}
              </div>
              {profile?.stripe_customer_id && status !== 'trialing' && (
                <button
                  onClick={handlePortal}
                  disabled={actionLoading === 'portal'}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors whitespace-nowrap"
                >
                  {actionLoading === 'portal' ? 'Chargement…' : 'Gérer le paiement →'}
                </button>
              )}
            </div>

            {/* Plan selection */}
            <div className="grid gap-5 sm:grid-cols-2">
              {(['essentiel', 'pro'] as const).map((t) => {
                const p = PRICING[t];
                const isCurrent = effectiveTier === t && (status === 'active' || status === 'trialing');
                const isUpgrade = t === 'pro' && tier === 'essentiel';
                const isDowngrade = t === 'essentiel' && tier === 'pro';
                const isPro = t === 'pro';

                return (
                  <div
                    key={t}
                    className={`rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden ${
                      isPro
                        ? 'bg-gradient-to-br from-fuchsia-950 to-violet-950 border border-fuchsia-900/40'
                        : 'bg-white border-2 border-gray-200'
                    }`}
                  >
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
                      className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                        isCurrent
                          ? isPro ? 'bg-white/10 text-white/40 cursor-default' : 'bg-gray-100 text-gray-400 cursor-default'
                          : isPro
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50'
                          : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600'
                      }`}
                    >
                      {actionLoading === t
                        ? 'Redirection…'
                        : isCurrent && isTrialing
                        ? 'Essai en cours'
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
                        Abonnement au prorata pour les jours restants
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-center text-gray-400">
              La facturation apparaîtra sous le nom <span className="font-medium text-gray-500">Astrova</span> sur votre relevé bancaire et vos reçus.
            </p>

            {/* Cancel subscription */}
            {isSubscribed && status !== 'canceled' && (
              <div className="pt-2">
                {!cancelConfirm ? (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setCancelConfirm(true)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                    >
                      Annuler mon abonnement
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-red-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Confirmer l'annulation</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Votre abonnement sera annulé immédiatement. Vous serez déconnecté et pourrez vous reconnecter pour télécharger vos reçus.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setCancelConfirm(false)}
                        disabled={cancelLoading}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      >
                        Garder mon abonnement
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors"
                      >
                        {cancelLoading ? 'Annulation...' : 'Oui, annuler'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Reçus tab ── */}
        {tab === 'recus' && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm text-gray-400">Aucun reçu disponible pour l'instant.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="divide-y divide-gray-100">
                  {invoices.map((inv) => {
                    const date = new Date(inv.date * 1000).toLocaleDateString('fr-CA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    });
                    const amount = (inv.amount / 100).toLocaleString('fr-CA', {
                      style: 'currency', currency: inv.currency.toUpperCase(),
                    });
                    return (
                      <div key={inv.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{date}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{inv.number ?? inv.id}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">{amount}</span>
                          {inv.pdf && (
                            <a
                              href={inv.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              Télécharger PDF
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
