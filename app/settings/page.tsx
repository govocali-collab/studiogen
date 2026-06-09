'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface BusinessProfile {
  first_name: string;
  last_name: string;
  business_name: string;
  website: string;
  service_description: string;
  email: string;
}

const EMPTY: BusinessProfile = {
  first_name: '',
  last_name: '',
  business_name: '',
  website: '',
  service_description: '',
  email: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => (r.ok ? r.json() : null)),
      supabase.auth.getUser(),
    ]).then(([profileData, { data: { user } }]) => {
      const email = user?.email ?? '';
      if (profileData) setForm({ ...EMPTY, ...profileData, email });
      else if (email) setForm((prev) => ({ ...prev, email }));
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage({ type: 'error', text: error.message });
    } else {
      setPwMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/studio">
              <Image src="/logo-black.png" alt="Studio Gen" width={180} height={36} className="h-9 w-auto" priority />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/billing" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Facturation</Link>
            <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres du profil</h1>
          <p className="text-sm text-gray-500 mt-1">Ces informations sont utilisées par l'IA pour personnaliser vos publications à votre image.</p>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Chargement…</div>
        ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations personnelles</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="ex. Marie"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="ex. Tremblay"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Courriel du compte</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  placeholder="votre@courriel.com"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Votre entreprise</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise</label>
                <input
                  type="text"
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  placeholder="ex. Salon Beauté Lumière"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site internet</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="ex. https://monbusiness.com"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description détaillée de vos services
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Décrivez vos services, votre clientèle cible, votre style, vos valeurs. L'IA utilisera cette description pour créer des publications qui vous ressemblent vraiment.
                </p>
                <textarea
                  name="service_description"
                  value={form.service_description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="ex. Nous sommes un salon de coiffure et d'esthétique situé à Sherbrooke. Nous offrons des services de coloration, coupe, soins capillaires, épilation et soins du visage. Notre clientèle est principalement des femmes de 25 à 55 ans. Notre style est chaleureux, professionnel et proche de notre communauté…"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                ← Retour au studio
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordChange} className="mt-6 space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Changer le mot de passe</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwMessage(null); }}
                placeholder="Minimum 8 caractères"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwMessage(null); }}
                placeholder="Répétez le mot de passe"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {pwMessage && (
              <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {pwMessage.text}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving || !newPassword}
                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
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
