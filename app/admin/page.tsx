'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  subscription_tier: 'essentiel' | 'pro';
  subscription_status: string;
  generations_used: number;
  trial_generations_used: number;
  stripe_customer_id: string | null;
}

interface MonthRevenue {
  monthKey: string;
  monthLabel: string;
  shortLabel: string;
  revenue: number;
  count: number;
  isCurrent: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  discountLabel: string;
  duration: string;
  durationLabel: string;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  couponId: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'users' | 'promo' | 'stats'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [magicLink, setMagicLink] = useState<{ email: string; link: string } | null>(null);
  const [loadingLink, setLoadingLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Revenue state
  const [revenueMonths, setRevenueMonths] = useState<MonthRevenue[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0);
  const [tooltipData, setTooltipData] = useState<{ x: number; label: string; revenue: number; count: number } | null>(null);

  // Promo codes state
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesError, setCodesError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '', percentOff: '', duration: 'once', durationMonths: '', maxRedemptions: '', expiresAt: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [togglingId, setTogglingId] = useState('');

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(d => {
        setRevenueMonths(d.months ?? []);
        setCurrentRevenue(d.currentRevenue ?? 0);
        setLastMonthRevenue(d.lastMonthRevenue ?? 0);
        setRevenueLoading(false);
      })
      .catch(() => setRevenueLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => {
        if (r.status === 403) throw new Error('Accès refusé — vous n\'êtes pas administrateur.');
        if (!r.ok) throw new Error('Erreur serveur');
        return r.json();
      })
      .then(d => { setUsers(d.users ?? []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const loadCodes = () => {
    setCodesLoading(true);
    setCodesError('');
    fetch('/api/admin/promo-codes')
      .then(r => r.json())
      .then(d => { setCodes(d.codes ?? []); setCodesLoading(false); })
      .catch(() => { setCodesError('Erreur lors du chargement'); setCodesLoading(false); });
  };

  useEffect(() => { if (tab === 'promo') loadCodes(); }, [tab]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const body: Record<string, unknown> = {
        code: createForm.code.trim().toUpperCase(),
        percentOff: Number(createForm.percentOff),
        duration: createForm.duration,
      };
      if (createForm.duration === 'repeating') body.durationMonths = Number(createForm.durationMonths);
      if (createForm.maxRedemptions) body.maxRedemptions = Number(createForm.maxRedemptions);
      if (createForm.expiresAt) body.expiresAt = createForm.expiresAt;

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur');
      setShowCreateForm(false);
      setCreateForm({ code: '', percentOff: '', duration: 'once', durationMonths: '', maxRedemptions: '', expiresAt: '' });
      loadCodes();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const toggleCode = async (id: string, active: boolean) => {
    setTogglingId(id);
    try {
      await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, active } : c));
    } finally {
      setTogglingId('');
    }
  };

  const generateMagicLink = async (email: string) => {
    setLoadingLink(email);
    try {
      const res = await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.link) setMagicLink({ email, link: data.link });
    } finally {
      setLoadingLink('');
    }
  };

  const copyLink = () => {
    if (!magicLink) return;
    navigator.clipboard.writeText(magicLink.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || u.subscription_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeUsers    = users.filter(u => u.subscription_status === 'active');
  const trialingUsers  = users.filter(u => u.subscription_status === 'trialing');
  const canceledUsers  = users.filter(u => u.subscription_status === 'canceled');
  const proUsers       = users.filter(u => u.subscription_tier === 'pro' && u.subscription_status === 'active');
  const essentielUsers = users.filter(u => u.subscription_tier === 'essentiel' && u.subscription_status === 'active');
  const mrr            = proUsers.length * 127 + essentielUsers.length * 57;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm text-gray-400">Chargement…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-200 p-6 text-center max-w-sm">
        <div className="text-2xl mb-2">🔒</div>
        <div className="text-sm font-semibold text-red-600">{error}</div>
        <button onClick={() => router.push('/auth/login')} className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline">
          Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-black.png" alt="StudioGen" width={120} height={32} className="h-7 w-auto" />
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
          <button
            onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); router.push('/'); }}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-8">
        {/* Title + tabs */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-400 mt-0.5">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab('users')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Utilisateurs
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Stats
            </button>
            <button
              onClick={() => setTab('promo')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'promo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Codes promo
            </button>
          </div>
        </div>

        {tab === 'promo' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Codes promo</h2>
                <p className="text-xs text-gray-400 mt-0.5">Gérés via Stripe — les réductions apparaissent sur les reçus.</p>
              </div>
              <button
                onClick={() => setShowCreateForm(v => !v)}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                + Nouveau code
              </button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <form onSubmit={handleCreateCode} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Créer un code promo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="LAUNCH20"
                      value={createForm.code}
                      onChange={e => setCreateForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Réduction (%) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      placeholder="20"
                      value={createForm.percentOff}
                      onChange={e => setCreateForm(f => ({ ...f, percentOff: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Durée *</label>
                    <select
                      value={createForm.duration}
                      onChange={e => setCreateForm(f => ({ ...f, duration: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="once">Une fois</option>
                      <option value="repeating">Récurrent (X mois)</option>
                      <option value="forever">Pour toujours</option>
                    </select>
                  </div>
                  {createForm.duration === 'repeating' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de mois *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="3"
                        value={createForm.durationMonths}
                        onChange={e => setCreateForm(f => ({ ...f, durationMonths: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max utilisations</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Illimité"
                      value={createForm.maxRedemptions}
                      onChange={e => setCreateForm(f => ({ ...f, maxRedemptions: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date d&apos;expiration</label>
                    <input
                      type="date"
                      value={createForm.expiresAt}
                      onChange={e => setCreateForm(f => ({ ...f, expiresAt: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
                {createError && <p className="text-xs text-red-500">{createError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Création…' : 'Créer le code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setCreateError(''); }}
                    className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* Codes table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {codesLoading ? (
                <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>
              ) : codesError ? (
                <div className="py-12 text-center text-sm text-red-500">{codesError}</div>
              ) : codes.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">Aucun code promo — créez-en un ci-dessus.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium">
                        <th className="px-5 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-left">Réduction</th>
                        <th className="px-4 py-3 text-left">Durée</th>
                        <th className="px-4 py-3 text-left">Utilisations</th>
                        <th className="px-4 py-3 text-left">Expiration</th>
                        <th className="px-4 py-3 text-left">Statut</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {codes.map(c => (
                        <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${!c.active ? 'opacity-50' : ''}`}>
                          <td className="px-5 py-3 font-mono font-bold text-gray-800 tracking-wider">{c.code}</td>
                          <td className="px-4 py-3 font-semibold text-violet-700">{c.discountLabel}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{c.durationLabel}</td>
                          <td className="px-4 py-3 text-gray-500 tabular-nums">
                            {c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-CA') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {c.active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => toggleCode(c.id, !c.active)}
                              disabled={togglingId === c.id}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${c.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                            >
                              {togglingId === c.id ? '…' : c.active ? 'Désactiver' : 'Réactiver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats tab */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total" value={users.length} />
              <StatCard label="Actifs" value={activeUsers.length} color="green" />
              <StatCard label="Essai gratuit" value={trialingUsers.length} color="blue" />
              <StatCard label="Annulés" value={canceledUsers.length} color="red" />
              <StatCard label="MRR estimé" value={`${mrr} $`} color="purple" subtitle="CAD / mois" />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Répartition des plans actifs</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Essentiel</span><span>{essentielUsers.length}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: activeUsers.length ? `${(essentielUsers.length / activeUsers.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Pro</span><span>{proUsers.length}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: activeUsers.length ? `${(proUsers.length / activeUsers.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Revenus estimés actifs</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">{mrr}</span>
                  <span className="text-sm text-gray-400 pb-1">$ CA/mois</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{essentielUsers.length} × 57 $ + {proUsers.length} × 127 $</div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Revenu mensuel (Stripe)</div>
                  {revenueLoading ? (
                    <div className="text-2xl font-bold text-gray-200 animate-pulse">—</div>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-gray-900">{currentRevenue.toLocaleString('fr-CA')} $</span>
                      <span className="text-sm text-gray-400">ce mois-ci</span>
                      {lastMonthRevenue > 0 && currentRevenue !== lastMonthRevenue && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentRevenue >= lastMonthRevenue ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>
                          {currentRevenue >= lastMonthRevenue ? '↑' : '↓'} {Math.abs(currentRevenue - lastMonthRevenue).toLocaleString('fr-CA')} $ vs mois dernier
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!revenueLoading && revenueMonths.length > 0 && (
                <div className="relative">
                  <RevenueChart data={revenueMonths} tooltip={tooltipData} onTooltip={setTooltipData} />
                </div>
              )}
              {!revenueLoading && revenueMonths.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-1.5 text-left font-medium text-gray-400">Mois</th>
                        <th className="py-1.5 text-right font-medium text-gray-400">Revenus</th>
                        <th className="py-1.5 text-right font-medium text-gray-400">Factures</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...revenueMonths].reverse().map(m => (
                        <tr key={m.monthKey} className={m.isCurrent ? 'font-semibold' : ''}>
                          <td className="py-1.5 text-gray-700">
                            {m.monthLabel}
                            {m.isCurrent && <span className="ml-1.5 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">En cours</span>}
                          </td>
                          <td className="py-1.5 text-right text-gray-800 tabular-nums">{m.revenue.toLocaleString('fr-CA')} $</td>
                          <td className="py-1.5 text-right text-gray-400 tabular-nums">{m.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'users' && <>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Utilisateurs</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs rounded-xl border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-600"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="trialing">Essai</option>
                <option value="canceled">Annulés</option>
                <option value="past_due">Paiement dû</option>
              </select>
              <input
                type="text"
                placeholder="Rechercher…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm rounded-xl border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 w-52"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium">
                  <th className="px-5 py-3 text-left">Prénom</th>
                  <th className="px-5 py-3 text-left">Nom</th>
                  <th className="px-5 py-3 text-left">Courriel</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Générations</th>
                  <th className="px-4 py-3 text-left">Inscrit</th>
                  <th className="px-4 py-3 text-left">Dernière connexion</th>
                  <th className="px-4 py-3 text-right">Accès</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-800">
                      {u.first_name ? <span className="font-medium">{u.first_name}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-800">
                      {u.last_name ? <span className="font-medium">{u.last_name}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3"><TierBadge tier={u.subscription_tier} status={u.subscription_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.subscription_status} /></td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {u.subscription_status === 'trialing'
                        ? `${u.trial_generations_used ?? 0} / 7`
                        : u.subscription_tier === 'pro'
                          ? `${u.generations_used ?? 0} / 150`
                          : `${u.generations_used ?? 0} / 50`}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-CA') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('fr-CA') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => generateMagicLink(u.email)}
                        disabled={loadingLink === u.email}
                        className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {loadingLink === u.email ? '…' : '⚡ Magic link'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        </>}
      </div>

      {/* Magic link modal */}
      {magicLink && (
        <div className="fixed inset-0 bg-violet-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚡</span>
              <h3 className="text-base font-bold text-gray-900">Magic link généré</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Accès au compte de <strong>{magicLink.email}</strong>.{' '}
              <span className="text-orange-500 font-medium">Valide une seule fois.</span>
            </p>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono break-all mb-4 border border-gray-200 leading-relaxed">
              {magicLink.link}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white hover:from-fuchsia-700 hover:to-violet-700 transition-all"
              >
                {copied ? '✓ Copié !' : 'Copier le lien'}
              </button>
              <button
                onClick={() => window.open(magicLink.link, '_blank')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Ouvrir →
              </button>
              <button
                onClick={() => { setMagicLink(null); setCopied(false); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueChart({
  data,
  tooltip,
  onTooltip,
}: {
  data: MonthRevenue[];
  tooltip: { x: number; label: string; revenue: number; count: number } | null;
  onTooltip: (t: { x: number; label: string; revenue: number; count: number } | null) => void;
}) {
  const CHART_H  = 140;
  const BAR_W    = 28;
  const GAP      = 10;
  const PAD_L    = 52;
  const PAD_B    = 28;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const totalW = PAD_L + data.length * (BAR_W + GAP);
  const gridValues = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${totalW} ${CHART_H + PAD_B}`}
        className="w-full overflow-visible"
        onMouseLeave={() => onTooltip(null)}
      >
        {/* Grid lines */}
        {gridValues.map(pct => {
          const y = CHART_H - pct * CHART_H;
          return (
            <g key={pct}>
              <line x1={PAD_L} y1={y} x2={totalW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.round(pct * max).toLocaleString('fr-CA')} $
              </text>
            </g>
          );
        })}
        <line x1={PAD_L} y1={0} x2={PAD_L} y2={CHART_H} stroke="#f3f4f6" strokeWidth={1} />

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max((d.revenue / max) * CHART_H, d.revenue > 0 ? 3 : 0);
          const x = PAD_L + i * (BAR_W + GAP);
          const y = CHART_H - barH;
          return (
            <g key={d.monthKey}>
              <rect
                x={x} y={y} width={BAR_W} height={barH} rx={4}
                fill={d.isCurrent ? '#7c3aed' : '#ddd6fe'}
                className="cursor-pointer transition-all"
                onMouseEnter={() => onTooltip({ x: x + BAR_W / 2, label: d.monthLabel, revenue: d.revenue, count: d.count })}
              />
              {d.isCurrent && d.revenue > 0 && (
                <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill="#7c3aed">
                  {d.revenue.toLocaleString('fr-CA')} $
                </text>
              )}
              <text x={x + BAR_W / 2} y={CHART_H + 16} textAnchor="middle" fontSize={9} fill={d.isCurrent ? '#7c3aed' : '#6b7280'} fontWeight={d.isCurrent ? '700' : '400'}>
                {d.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute top-0 pointer-events-none z-10 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: `calc(${PAD_L}px + ${tooltip.x - PAD_L}px)` }}
        >
          <div className="font-semibold">{tooltip.label}</div>
          <div className="text-gray-300">{tooltip.revenue.toLocaleString('fr-CA')} $ · {tooltip.count} facture{tooltip.count !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'gray', subtitle }: {
  label: string; value: string | number; color?: string; subtitle?: string;
}) {
  const colors: Record<string, string> = {
    gray: 'text-gray-900', green: 'text-green-600', blue: 'text-blue-600',
    purple: 'text-purple-600', red: 'text-red-500',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="text-xs text-gray-400 mb-2 font-medium">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function TierBadge({ tier, status }: { tier: string; status: string }) {
  const isPro = tier === 'pro' || status === 'trialing';
  return isPro
    ? <span className="text-xs font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-2 py-0.5 rounded-full">Pro</span>
    : <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Essentiel</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: 'Actif',       cls: 'bg-green-50 text-green-700' },
    trialing: { label: 'Essai',       cls: 'bg-blue-50 text-blue-600' },
    canceled: { label: 'Annulé',      cls: 'bg-red-50 text-red-500' },
    past_due: { label: 'Paiement dû', cls: 'bg-orange-50 text-orange-600' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-400' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}
