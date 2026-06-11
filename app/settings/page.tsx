'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

// ── Chip multi-select ─────────────────────────────────────────────────────────

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value.includes(opt.value)
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim().replace(/,$/, '');
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    else if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
  };

  return (
    <div className="min-h-[46px] rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-violet-400 hover:text-violet-600 leading-none">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : 'Ajouter...'}
        className="w-full text-sm outline-none placeholder-gray-300 bg-transparent"
      />
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_VOICE_OPTIONS = [
  { value: 'chaleureux', label: 'Chaleureux' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'luxueux', label: 'Luxueux' },
  { value: 'moderne', label: 'Moderne' },
  { value: 'éducatif', label: 'Éducatif' },
  { value: 'inspirant', label: 'Inspirant' },
  { value: 'familial', label: 'Familial' },
  { value: 'haut_de_gamme', label: 'Haut de gamme' },
];

const CONTENT_PREFS_OPTIONS = [
  { value: 'résultats', label: 'Résultats' },
  { value: 'avant_apres', label: 'Avant / Après' },
  { value: 'éducatif', label: 'Éducatif' },
  { value: 'promo', label: 'Promotions' },
  { value: 'produits', label: 'Produits' },
  { value: 'témoignages', label: 'Témoignages' },
  { value: 'formations', label: 'Formations' },
  { value: 'astuces', label: 'Astuces' },
];

const CTA_OPTIONS = [
  { value: 'réservez maintenant', label: 'Réservez maintenant' },
  { value: 'contactez-nous', label: 'Contactez-nous' },
  { value: 'écrivez-nous', label: 'Écrivez-nous' },
  { value: 'demandez une consultation', label: 'Demandez une consultation' },
  { value: 'appelez-nous', label: 'Appelez-nous' },
];

const PROVINCES = [
  'Québec', 'Ontario', 'Alberta', 'Colombie-Britannique',
  'Manitoba', 'Saskatchewan', 'Nouvelle-Écosse', 'Nouveau-Brunswick',
  'Terre-Neuve-et-Labrador', 'Île-du-Prince-Édouard',
];

// ── Form state ────────────────────────────────────────────────────────────────

interface Form {
  first_name: string;
  last_name: string;
  business_name: string;
  website: string;
  service_description: string;
  phone: string;
  city: string;
  province: string;
  target_audience: string;
  brand_voice: string[];
  services: string[];
  favorite_phrases: string[];
  avoid_phrases: string[];
  content_preferences: string[];
  cta_style: string;
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
  phone: '',
  city: '',
  province: '',
  target_audience: '',
  brand_voice: [],
  services: [],
  favorite_phrases: [],
  avoid_phrases: [],
  content_preferences: [],
  cta_style: '',
  email: '',
  subscription_tier: 'essentiel',
  subscription_status: 'trialing',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return <Suspense><SettingsPageInner /></Suspense>;
}

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<'profil' | 'ia'>(
    searchParams.get('tab') === 'ia' ? 'ia' : 'profil'
  );

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => (r.ok ? r.json() : null)),
      createClient().auth.getSession(),
    ])
      .then(([profileData, { data: { session } }]) => {
        const email = session?.user?.email ?? '';
        if (profileData) {
          setForm({
            ...EMPTY,
            ...profileData,
            email,
            brand_voice: profileData.brand_voice ?? [],
            services: profileData.services ?? [],
            favorite_phrases: profileData.favorite_phrases ?? [],
            avoid_phrases: profileData.avoid_phrases ?? [],
            content_preferences: profileData.content_preferences ?? [],
          });
        } else if (email) {
          setForm((prev) => ({ ...prev, email }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const effectiveTier = form.subscription_status === 'trialing' ? 'pro' : form.subscription_tier;
  const isPro = effectiveTier === 'pro';

  const setField = (name: keyof Form, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setField(e.target.name as keyof Form, e.target.value);
  };

  const handleAnalyze = async () => {
    setAnalyzeError(null);
    setAnalyzeSuccess(false);
    const url = form.website.trim();
    if (!url) { setAnalyzeError("Entrez d'abord votre site internet."); return; }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/scrape-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'analyse");
      setForm((prev) => ({
        ...prev,
        service_description: data.business_summary || prev.service_description,
        city: data.city || prev.city,
        province: data.province || prev.province,
        target_audience: data.target_audience || prev.target_audience,
        brand_voice: data.brand_voice?.length ? data.brand_voice : prev.brand_voice,
        services: data.services?.length ? data.services : prev.services,
        favorite_phrases: data.favorite_phrases?.length ? data.favorite_phrases : prev.favorite_phrases,
        avoid_phrases: data.avoid_phrases?.length ? data.avoid_phrases : prev.avoid_phrases,
        content_preferences: data.content_preferences?.length ? data.content_preferences : prev.content_preferences,
        cta_style: data.cta_style || prev.cta_style,
      }));
      setAnalyzeSuccess(true);
      setSaved(false);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setAnalyzing(false);
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
          phone: form.phone,
          city: form.city,
          province: form.province,
          target_audience: form.target_audience,
          brand_voice: form.brand_voice,
          services: form.services,
          favorite_phrases: form.favorite_phrases,
          avoid_phrases: form.avoid_phrases,
          content_preferences: form.content_preferences,
          cta_style: form.cta_style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setSaved(true);
      router.refresh();
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

  const inputClass = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            type="button"
            onClick={() => setTab('profil')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'profil' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profil
          </button>
          <button
            type="button"
            onClick={() => setTab('ia')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'ia' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            IA
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : tab === 'profil' ? (
          <>
            {/* ── Onglet Profil ── */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informations personnelles</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Prénom</label>
                    <input type="text" name="first_name" value={form.first_name} onChange={handleChange}
                      placeholder="ex. Marie" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nom</label>
                    <input type="text" name="last_name" value={form.last_name} onChange={handleChange}
                      placeholder="ex. Tremblay" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Cellulaire <span className="font-normal text-gray-400">(optionnel)</span></label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="ex. 819 555-0123" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Courriel du compte</label>
                  <input type="email" value="" disabled placeholder="votre@courriel.com"
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                    {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                  </button>
                </div>
              </section>
            </form>

            {/* ── Mot de passe ── */}
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Changer le mot de passe</h2>
              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <input type="password" value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPwMessage(null); }}
                  placeholder="Minimum 8 caractères" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Confirmer le mot de passe</label>
                <input type="password" value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPwMessage(null); }}
                  placeholder="Répétez le mot de passe" className={inputClass} />
              </div>
              {pwMessage && (
                <p className={`text-sm ${pwMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {pwMessage.text}
                </p>
              )}
              <div className="flex justify-end">
                <button type="submit" disabled={pwSaving || !newPassword}
                  className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  {pwSaving ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>

            <div className="mt-6 flex justify-center">
              <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                ← Retour au studio
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* ── Onglet IA ── */}

            {/* Guide */}
            <div className="mb-6 bg-violet-50 border border-violet-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-sm font-semibold text-violet-800">Comment obtenir de meilleures publications</span>
              </div>
              <ul className="space-y-2 text-xs text-violet-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold shrink-0">1.</span>
                  <span><strong>Description de l'entreprise</strong> — Rédigez 3 à 5 phrases comme si vous vous présentiez à un nouveau client. Mentionnez ce que vous faites, où vous êtes, et ce qui vous distingue.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold shrink-0">2.</span>
                  <span><strong>Clientèle cible</strong> — Décrivez votre client idéal : âge, style de vie, valeurs. Ex. : <em>Femmes 30-50 ans qui valorisent le naturel et le bien-être.</em></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold shrink-0">3.</span>
                  <span><strong>Voix de marque</strong> — Choisissez les tons qui correspondent à votre façon de parler à vos clients. L'IA ajustera son écriture en conséquence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold shrink-0">4.</span>
                  <span><strong>Expressions favorites / à éviter</strong> — Ajoutez les mots que vous utilisez souvent et ceux que vous ne voulez jamais voir dans vos publications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold shrink-0">5.</span>
                  <span><strong>Analyser mon site</strong> — Si vous avez un site internet, ce bouton remplit automatiquement la plupart des champs. Vérifiez et ajustez ensuite.</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Votre marque ── */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Votre marque</h2>

                <div>
                  <div className="mb-5">
                    <label className={labelClass}>Nom de l'entreprise</label>
                    <input type="text" name="business_name" value={form.business_name} onChange={handleChange}
                      placeholder="ex. Clinique Esthétique Lumière" className={inputClass} />
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Site internet</label>
                    <div className="flex gap-2">
                      <input type="url" name="website" value={form.website} onChange={handleChange}
                        placeholder="https://monentreprise.com"
                        className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={analyzing || !form.website.trim()}
                        className="shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        {analyzing ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Analyse...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            <span>Analyser mon site</span>
                          </>
                        )}
                      </button>
                    </div>
                    {analyzeError && <p className="text-xs text-red-500 mt-1.5">{analyzeError}</p>}
                    {analyzeSuccess && (
                      <p className="text-xs text-violet-600 mt-1.5 font-medium">
                        Profil extrait avec succès. Vérifiez les champs ci-dessous et sauvegardez.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className={labelClass}>Ville</label>
                      <input type="text" name="city" value={form.city} onChange={handleChange}
                        placeholder="ex. Sherbrooke" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <div className="relative">
                        <select name="province" value={form.province} onChange={handleChange}
                          className={inputClass + ' bg-white appearance-none pr-10'}>
                          <option value="">Sélectionner...</option>
                          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Description de l'entreprise</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Décrivez vos services, valeurs et ce qui vous rend unique. L'IA l'utilisera dans chaque publication.
                    </p>
                    <textarea name="service_description" value={form.service_description} onChange={handleChange}
                      rows={5} placeholder="ex. Nous sommes une clinique esthétique et médico-esthétique située à Sherbrooke..."
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Clientèle cible</label>
                    <input type="text" name="target_audience" value={form.target_audience} onChange={handleChange}
                      placeholder="ex. Femmes 25-55 ans, professionnelles, aiment le soin de soi"
                      className={inputClass} />
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Voix de marque</label>
                    <p className="text-xs text-gray-400 mb-2">Sélectionnez les tons qui définissent votre communication.</p>
                    <ChipSelect options={BRAND_VOICE_OPTIONS} value={form.brand_voice}
                      onChange={(v) => setField('brand_voice', v)} />
                  </div>

                  <div>
                    <label className={labelClass}>Services offerts</label>
                    <p className="text-xs text-gray-400 mb-2">Appuyez sur Entrée ou virgule pour ajouter.</p>
                    <TagInput value={form.services} onChange={(v) => setField('services', v)}
                      placeholder="ex. Coloration, Coupe, Balayage..." />
                  </div>
                </div>
              </section>

              {/* ── Style de contenu ── */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Style de contenu</h2>

                <div>
                  <div className="mb-5">
                    <label className={labelClass}>Types de contenu préférés</label>
                    <p className="text-xs text-gray-400 mb-2">L'IA privilégiera ces formats dans vos publications.</p>
                    <ChipSelect options={CONTENT_PREFS_OPTIONS} value={form.content_preferences}
                      onChange={(v) => setField('content_preferences', v)} />
                  </div>

                  <div>
                    <label className={labelClass}>Style d'appel à l'action</label>
                    <p className="text-xs text-gray-400 mb-3">Chaque publication se terminera avec ce CTA.</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {CTA_OPTIONS.map((opt) => (
                        <label key={opt.value}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                            form.cta_style === opt.value
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <input type="radio" name="cta_style" value={opt.value}
                            checked={form.cta_style === opt.value}
                            onChange={handleChange}
                            className="accent-violet-600" />
                          <span className={`text-sm font-medium ${form.cta_style === opt.value ? 'text-violet-700' : 'text-gray-700'}`}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Vocabulaire ── */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vocabulaire</h2>

                <div>
                  <div className="mb-5">
                    <label className={labelClass}>Expressions favorites</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Mots ou formulations que vous aimez. L'IA les intégrera naturellement.
                    </p>
                    <TagInput value={form.favorite_phrases} onChange={(v) => setField('favorite_phrases', v)}
                      placeholder="ex. Prenez soin de vous, Sublimez votre beauté..." />
                  </div>

                  <div>
                    <label className={labelClass}>Mots à éviter</label>
                    <p className="text-xs text-gray-400 mb-2">
                      Expressions ou mots que l'IA ne doit jamais utiliser.
                    </p>
                    <TagInput value={form.avoid_phrases} onChange={(v) => setField('avoid_phrases', v)}
                      placeholder="ex. Pas cher, Discount, Cheap..." />
                  </div>
                </div>
              </section>

              {/* ── Actions ── */}
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={saving}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                    {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                  </button>
                </div>
              </section>
            </form>

            <div className="mt-6 flex justify-center">
              <Link href="/studio" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                ← Retour au studio
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
