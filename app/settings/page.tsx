'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

interface Form {
  first_name: string;
  last_name: string;
  business_name: string;
  website: string;
  service_description: string;
  email: string;
  subscription_tier: string;
  subscription_status: string;
}

const EMPTY: Form = {
  first_name: '',
  last_name: '',
  business_name: '',
  website: '',
  service_description: '',
  email: '',
  subscription_tier: 'essentiel',
  subscription_status: 'trialing',
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => (r.ok ? r.json() : null)),
      createClient().auth.getSession(),
    ]).then(([profileData, { data: { session } }]) => {
      const email = session?.user?.email ?? '';
      if (profileData) setForm({ ...EMPTY, ...profileData, email });
      else if (email) setForm((prev) => ({ ...prev, email }));
    }).finally(() => setLoading(false));
  }, []);

  const effectiveTier = form.subscription_status === 'trialing' ? 'pro' : form.subscription_tier;
  const canScrape = effectiveTier === 'pro';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
    setScrapeSuccess(false);
  };

  const handleScrape = async () => {
    setScrapeError(null);
    setScrapeSuccess(false);
    const url = form.website.trim();
    if (!url) { setScrapeError("Entrez d'abord votre site internet."); return; }
    setScraping(true);
    try {
      const res = await fetch('/api/scrape-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la génération');
      setForm((prev) => ({ ...prev, service_description: data.description }));
      setScrapeSuccess(true);
      setSaved(false);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          business_name: form.business_name,
          website: form.website,
          service_description: form.service_description,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    setPwSaving(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage({ type: 'error', text: error.message });
    } else {
      setPwMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du profil</h1>
          <p className="text-sm text-gray-500 mt-1">Ces informations sont utilisées par l'IA pour personnaliser vos publications à votre image.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              </div>
              <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-36 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations personnelles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="ex. Marie"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                  <input type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="ex. Tremblay"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Courriel du compte</label>
                <input type="email" value={form.email} disabled
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Votre entreprise</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise</label>
                <input type="text" name="business_name" value={form.business_name} onChange={handleChange} placeholder="ex. Salon Beauté Lumière"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site internet</label>
                <div className="flex gap-2">
                  <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="ex. https://monbusiness.com"
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                  {canScrape && (
                    <button type="button" onClick={handleScrape} disabled={scraping || !form.website.trim()}
                      className="shrink-0 flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed text-violet-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border border-violet-200">
                      {scraping ? (
                        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Analyse…</span></>
                      ) : (
                        <><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg><span>Générer</span></>
                      )}
                    </button>
                  )}
                </div>
                {scrapeError && <p className="text-xs text-red-500 mt-1.5">{scrapeError}</p>}
                {scrapeSuccess && <p className="text-xs text-violet-600 mt-1.5">Description générée. Vérifiez et sauvegardez.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description détaillée de vos services</label>
                <p className="text-xs text-gray-400 mb-2">Décrivez vos services, votre clientèle cible, votre style, vos valeurs. L'IA utilisera cette description pour créer des publications qui vous ressemblent vraiment.</p>
                <textarea name="service_description" value={form.service_description} onChange={handleChange} rows={6}
                  placeholder="ex. Nous sommes un salon de coiffure et d'esthétique situé à Sherbrooke…"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center justify-between">
              <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Retour au studio</Link>
              <button type="submit" disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordChange} className="mt-6 space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Changer le mot de passe</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwMessage(null); }} placeholder="Minimum 8 caractères"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPwMessage(null); }} placeholder="Répétez le mot de passe"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            {pwMessage && (
              <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{pwMessage.text}</p>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={pwSaving || !newPassword}
                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                {pwSaving ? 'Mise à jour…' : 'Mettre à jour'}
              </button>
            </div>
          </form>
          </>
        )}
      </main>
    </div>
  );
}
