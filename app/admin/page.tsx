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
  stripe_customer_id: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [magicLink, setMagicLink] = useState<{ email: string; link: string } | null>(null);
  const [loadingLink, setLoadingLink] = useState('');
  const [copied, setCopied] = useState(false);

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
            <Image src="/logo-black.png" alt="Studio Gen" width={120} height={32} className="h-7 w-auto" />
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
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={users.length} />
          <StatCard label="Actifs" value={activeUsers.length} color="green" />
          <StatCard label="Essai gratuit" value={trialingUsers.length} color="blue" />
          <StatCard label="Annulés" value={canceledUsers.length} color="red" />
          <StatCard label="MRR" value={`${mrr} $`} color="purple" subtitle="CAD / mois" />
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
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{ width: activeUsers.length ? `${(essentielUsers.length / activeUsers.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pro</span><span>{proUsers.length}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full"
                    style={{ width: activeUsers.length ? `${(proUsers.length / activeUsers.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Revenus actifs</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">{mrr}</span>
              <span className="text-sm text-gray-400 pb-1">$ CA/mois</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {essentielUsers.length} × 57 $ + {proUsers.length} × 127 $
            </div>
          </div>
        </div>

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
                    <td className="px-4 py-3"><TierBadge tier={u.subscription_tier} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.subscription_status} /></td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {u.generations_used ?? 0}{u.subscription_tier === 'essentiel' ? ' / 30' : ''}
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

function TierBadge({ tier }: { tier: string }) {
  return tier === 'pro'
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
