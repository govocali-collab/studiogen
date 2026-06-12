'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { PRICING } from '@/lib/config/pricing';
import { TIER_LIMITS } from '@/lib/config/tier-limits';
import type { Profile } from '@/lib/supabase/types';
import AppHeader from '@/components/AppHeader';

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
  const [cancelStep, setCancelStep] = useState<'none' | 'save' | 'confirm'>('none');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [upgradeConfirm, setUpgradeConfirm] = useState<{ tier: 'essentiel' | 'pro'; amountDue: number; currency: string } | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    const isActivated = !!(searchParams.get('success') || searchParams.get('activated'));

    const fetchProfile = () =>
      fetch('/api/me', { cache: 'no-store' }).then(r => r.json());

    const pollProfile = async (attempt: number) => {
      const d = await fetchProfile();
      const p = d?.profile ?? null;
      setProfile(p);
      setLoading(false);
      setSyncing(false);
      if (isActivated && (p === null || p?.subscription_status === 'trialing') && attempt < 8) {
        setSyncing(true);
        setTimeout(() => pollProfile(attempt + 1), 1500);
      } else if (isActivated && (p === null || p?.subscription_status === 'trialing') && attempt >= 8) {
        // Still trialing after all attempts — force a clean reload to bypass any stale cache
        window.location.href = '/billing?activated=1&reload=1';
      }
    };

    setSyncing(isActivated);
    pollProfile(1);

    fetch('/api/stripe/invoices').then(r => r.json()).then(d => {
      setInvoices(d?.invoices ?? []);
    });
    if (isActivated) setToast('Abonnement activé avec succès !');
    if (searchParams.get('canceled')) setToast('Paiement annulé.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const trialDaysRemaining = profile?.created_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000))
    : 7;
  const isTrialExpired = status === 'trialing' && trialDaysRemaining <= 0;
  const generationsMax = isTrialing ? trialMax : (limits.generationsPerMonth === Infinity ? '∞' : limits.generationsPerMonth);
  const generationsPct = isTrialing
    ? Math.min(100, (generationsUsed / trialMax) * 100)
    : limits.generationsPerMonth === Infinity ? 0
    : Math.min(100, (generationsUsed / limits.generationsPerMonth) * 100);

  const handleCheckout = async (targetTier: 'essentiel' | 'pro') => {
    const isUpgrade = targetTier === 'pro' && tier === 'essentiel' && status === 'active';

    if (isUpgrade) {
      // Preview proration amount before charging
      setActionLoading(targetTier);
      const res = await fetch('/api/stripe/preview-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();
      setActionLoading('');
      if (data.error) { setToast(data.error); return; }
      setUpgradeConfirm({ tier: targetTier, amountDue: data.amountDue, currency: data.currency });
      return;
    }

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

  const handleUpgradeConfirm = async () => {
    if (!upgradeConfirm) return;
    setUpgradeLoading(true);
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: upgradeConfirm.tier }),
    });
    const { url, error } = await res.json();
    setUpgradeLoading(false);
    if (error) { setToast(error); setUpgradeConfirm(null); return; }
    setUpgradeConfirm(null);
    window.location.href = url;
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
    const { error } = await res.json();
    setCancelLoading(false);
    if (error) { setToast(error); setCancelStep('none'); return; }
    setCancelStep('none');
    // Reload profile to reflect canceled status
    const d = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
    setProfile(d?.profile ?? null);
  };

  const handleDowngrade = async () => {
    setDowngradeLoading(true);
    const res = await fetch('/api/stripe/downgrade', { method: 'POST' });
    const { error } = await res.json();
    setDowngradeLoading(false);
    if (error) { setToast(error); return; }
    setCancelStep('none');
    setToast('Votre abonnement a été changé pour le plan Essentiel.');
    const d = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json());
    setProfile(d?.profile ?? null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isSubscribed = status === 'active';
  const statusLabel: Record<string, string> = {
    trialing: 'StudioGen Pro – essai gratuit 7 jours',
    active: 'Actif',
    past_due: 'Paiement en attente',
    canceled: 'Annulé',
  };
  const statusColor: Record<string, string> = {
    trialing: 'text-green-700 bg-green-50 border-green-200',
    active: 'text-green-700 bg-green-50 border-green-200',
    past_due: 'text-amber-700 bg-amber-50 border-amber-200',
    canceled: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* Upgrade confirmation modal */}
      {upgradeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Confirmer la mise à niveau</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Vous serez chargé immédiatement{' '}
                  <span className="font-bold text-gray-800">
                    {(upgradeConfirm.amountDue / 100).toLocaleString('fr-CA', { style: 'currency', currency: upgradeConfirm.currency.toUpperCase() })}
                  </span>{' '}
                  pour les jours restants du mois actuel (pro-rata Essentiel → Pro).
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUpgradeConfirm(null)}
                disabled={upgradeLoading}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpgradeConfirm}
                disabled={upgradeLoading}
                className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors"
              >
                {upgradeLoading ? 'Traitement…' : 'Confirmer et payer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-screen-md mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez votre plan et suivez vos publications ce mois-ci.</p>
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
            <button onClick={() => { setToast(''); router.replace('/billing'); }} className="ml-4 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Abonnement tab ── */}
        {tab === 'abonnement' && (
          <div className="space-y-8">
            {/* Trial expired banner */}
            {isTrialExpired && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Votre période d&apos;essai est terminée</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Vos 7 jours d&apos;essai gratuit sont écoulés. Choisissez un plan ci-dessous pour continuer à utiliser StudioGen.
                  </p>
                </div>
              </div>
            )}

            {/* Canceled banner */}
            {status === 'canceled' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-800">Votre abonnement est annulé</p>
                  <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                    Vos outils sont désactivés. Choisissez un plan ci-dessous pour réactiver votre accès.
                  </p>
                </div>
              </div>
            )}
            {/* Status + usage — hidden for expired trial */}
            {!isTrialExpired && <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${statusColor[status] ?? statusColor.trialing}`}>
                  {statusLabel[status] ?? status}
                </span>
                {!isTrialing && (
                  <span className="text-sm font-bold text-gray-800">{`Plan ${PRICING[tier].name}`}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{isTrialing ? `Publications pour les ${trialDaysRemaining} prochain${trialDaysRemaining > 1 ? 's' : ''} jour${trialDaysRemaining > 1 ? 's' : ''}` : 'Publications ce mois-ci'}</span>
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
              {syncing && (
                <span className="text-xs text-gray-400 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-3 h-3 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin inline-block" />
                  Synchronisation…
                </span>
              )}
            </div>}

            {/* Plan selection */}
            <div className="grid gap-5 sm:grid-cols-2">
              {(['essentiel', 'pro'] as const).map((t) => {
                const p = PRICING[t];
                const isPro = t === 'pro';
                const isActive = status === 'active';

                // Plan currently paid for
                const isPaidPlan = t === tier && isActive;
                // User is on Pro and looking at Essentiel (no downgrade via checkout)
                const isLowerThanCurrent = t === 'essentiel' && tier === 'pro' && isActive;
                // User is on Essentiel and can upgrade
                const isUpgrade = isPro && tier === 'essentiel' && isActive;
                // During trial: both plans are purchasable
                const canBuy = !isPaidPlan && !isLowerThanCurrent;

                // Badge: show "Essai" on Pro during trial, "Actif" on paid plan
                const showTrialBadge = isPro && isTrialing;
                const showActiveBadge = isPaidPlan || showTrialBadge;

                let btnLabel = `S'abonner · ${p.price} $/mois`;
                if (actionLoading === t) btnLabel = 'Redirection…';
                else if (isPaidPlan) btnLabel = 'Plan actuel';
                else if (isLowerThanCurrent) btnLabel = 'Inclus dans votre Pro';
                else if (isUpgrade) btnLabel = 'Passer au Pro →';

                return (
                  <div
                    key={t}
                    className={`rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden ${
                      isPro
                        ? 'bg-gradient-to-br from-fuchsia-950 to-violet-950 border border-fuchsia-900/40'
                        : 'bg-white border-2 border-gray-200'
                    } ${showActiveBadge ? (isPro ? 'ring-2 ring-violet-400/60' : 'ring-2 ring-violet-400') : ''}`}
                  >
                    {/* Active / trial badge */}
                    {showActiveBadge && (
                      <div className={`absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPro
                          ? 'bg-violet-500/30 text-violet-200'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {showTrialBadge ? 'Essai' : 'Actif'}
                      </div>
                    )}

                    <div>
                      <div className={`text-sm font-semibold ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>{p.name}</div>
                      <div className={`text-xs mb-2 ${isPro ? 'text-fuchsia-300' : 'text-violet-500'}`}>{p.description}</div>
                      <div className={`text-3xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                        {p.price} $<span className="text-sm font-normal ml-1 text-gray-400">CA/mois</span>
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
                      onClick={() => canBuy && handleCheckout(t)}
                      disabled={!canBuy || !!actionLoading}
                      className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                        !canBuy
                          ? isPro
                            ? 'bg-white/10 text-white/40 cursor-default'
                            : 'bg-gray-100 text-gray-400 cursor-default'
                          : isPro
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50'
                          : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600'
                      }`}
                    >
                      {btnLabel}
                    </button>
                    {isUpgrade && (
                      <p className="text-[10px] text-center -mt-2 text-gray-500">
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

            {/* Manage payment method */}
            {profile?.stripe_customer_id && status !== 'trialing' && (
              <div className="flex justify-center">
                <button
                  onClick={handlePortal}
                  disabled={actionLoading === 'portal'}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
                >
                  {actionLoading === 'portal' ? 'Chargement…' : 'Gérer le mode de paiement →'}
                </button>
              </div>
            )}

            {/* Cancel subscription */}
            {status === 'active' && (
              <div className="pt-2">
                {cancelStep === 'none' && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setCancelStep(tier === 'pro' ? 'save' : 'confirm')}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                    >
                      Annuler mon abonnement
                    </button>
                  </div>
                )}

                {/* Step 1 (Pro only): offer downgrade to Essentiel */}
                {cancelStep === 'save' && (
                  <div className="bg-white border border-violet-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Avant d&apos;annuler — passez à Essentiel</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Plutôt que d&apos;annuler, vous pouvez passer au plan <span className="font-semibold text-gray-700">Essentiel à {PRICING.essentiel.price} $/mois</span>.
                          Vous recevrez un crédit pro-rata pour les jours restants de votre abonnement Pro,
                          et votre plan sera renouvelé à {PRICING.essentiel.price} $/mois dès le prochain cycle.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <button
                        onClick={() => setCancelStep('confirm')}
                        disabled={downgradeLoading}
                        className="text-sm font-medium text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl transition-colors order-last sm:order-first"
                      >
                        Non, annuler quand même
                      </button>
                      <button
                        onClick={() => setCancelStep('none')}
                        disabled={downgradeLoading}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors"
                      >
                        Garder le Pro
                      </button>
                      <button
                        onClick={handleDowngrade}
                        disabled={downgradeLoading}
                        className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-5 py-2 rounded-xl transition-colors"
                      >
                        {downgradeLoading ? 'Traitement…' : `Passer à Essentiel · ${PRICING.essentiel.price} $/mois`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: final cancel confirmation */}
                {cancelStep === 'confirm' && (
                  <div className="bg-white border border-red-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Confirmer l&apos;annulation</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Votre abonnement sera annulé immédiatement. Vous serez déconnecté et pourrez vous reconnecter pour télécharger vos reçus.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setCancelStep('none')}
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
