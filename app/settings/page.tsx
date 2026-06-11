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

// ── Example input (multi-line posts, max 3) ───────────────────────────────────

const MAX_EXAMPLES = 3;

function ExampleInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const atMax = value.length >= MAX_EXAMPLES;

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !atMax) onChange([...value, trimmed]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {!atMax && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Collez ou tapez une publication existante (Facebook ou Instagram)..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="text-sm font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Ajouter cet exemple ({value.length}/{MAX_EXAMPLES})
          </button>
        </>
      )}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((ex, i) => (
            <div key={i} className="relative bg-gray-50 rounded-xl px-3.5 py-3 pr-9 text-sm text-gray-700">
              <p className="text-xs text-gray-400 font-medium mb-1">Exemple {i + 1}</p>
              <p className="line-clamp-3 whitespace-pre-wrap">{ex}</p>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {atMax && (
            <p className="text-xs text-gray-400">Maximum {MAX_EXAMPLES} exemples atteint.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
  maxItems,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}) {
  const [input, setInput] = useState('');
  const atMax = maxItems !== undefined && value.length >= maxItems;

  const add = () => {
    const trimmed = input.trim().replace(/,$/, '');
    if (trimmed && !value.includes(trimmed) && !atMax) onChange([...value, trimmed]);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    else if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
  };

  return (
    <div className={`min-h-[46px] rounded-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent ${atMax ? 'bg-gray-50' : ''}`}>
      <div className="flex flex-wrap gap-1.5 mb-1">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-violet-400 hover:text-violet-600 leading-none">×</button>
          </span>
        ))}
      </div>
      {!atMax && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={value.length === 0 ? placeholder : 'Ajouter...'}
          className="w-full text-sm outline-none placeholder-gray-300 bg-transparent"
        />
      )}
      {atMax && maxItems && (
        <p className="text-xs text-gray-400">Maximum {maxItems} atteint</p>
      )}
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
  { value: '', label: 'Aucun CTA' },
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
  priority_services: string[];
  transformation_goals: string[];
  brand_examples: string[];
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
  priority_services: [],
  transformation_goals: [],
  brand_examples: [],
  favorite_phrases: [],
  avoid_phrases: [],
  content_preferences: [],
  cta_style: '',
  email: '',
  subscription_tier: 'essentiel',
  subscription_status: 'trialing',
};

// ── Profile completion ────────────────────────────────────────────────────────

const COMPLETION_ITEMS: { label: string; check: (f: Form) => boolean }[] = [
  { label: 'Site web',                    check: (f) => !!f.website.trim() },
  { label: "Description de l'entreprise", check: (f) => !!f.service_description.trim() },
  { label: 'Clientèle cible',             check: (f) => !!f.target_audience.trim() },
  { label: 'Voix de marque',              check: (f) => f.brand_voice.length > 0 },
  { label: 'Services offerts',            check: (f) => f.services.length > 0 },
  { label: 'Services prioritaires',       check: (f) => f.priority_services.length > 0 },
  { label: 'Types de contenu',            check: (f) => f.content_preferences.length > 0 },
  { label: 'Expressions favorites',       check: (f) => f.favorite_phrases.length > 0 },
  { label: 'Mots à éviter',              check: (f) => f.avoid_phrases.length > 0 },
  { label: 'Publications exemples',       check: (f) => f.brand_examples.length > 0 },
];

function computeCompletion(form: Form): number {
  return COMPLETION_ITEMS.filter(item => item.check(form)).length * 10;
}

function getCompletionLabel(pct: number): string {
  if (pct <= 30) return 'Contenu générique';
  if (pct <= 60) return 'Contenu personnalisé';
  if (pct <= 85) return 'Forte correspondance avec votre marque';
  return 'StudioGen écrit presque comme vous';
}

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
  const [analyzeResult, setAnalyzeResult] = useState<{
    business_name?: string | null;
    services?: string[];
    priority_services?: string[];
    target_audience?: string | null;
    brand_voice?: string[];
    city?: string | null;
    province?: string | null;
    transformation_goals?: string[];
    _pages_crawled?: number;
  } | null>(null);

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
            first_name: profileData.first_name ?? '',
            last_name: profileData.last_name ?? '',
            phone: profileData.phone ?? '',
            business_name: profileData.business_name ?? '',
            website: profileData.website ?? '',
            service_description: profileData.service_description ?? '',
            city: profileData.city ?? '',
            province: profileData.province ?? '',
            target_audience: profileData.target_audience ?? '',
            cta_style: profileData.cta_style ?? '',
            brand_voice: profileData.brand_voice ?? [],
            services: profileData.services ?? [],
            priority_services: profileData.priority_services ?? [],
            transformation_goals: profileData.transformation_goals ?? [],
            brand_examples: profileData.brand_examples ?? [],
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
  const completion = computeCompletion(form);
  const missingItems = COMPLETION_ITEMS.filter(item => !item.check(form)).map(item => item.label);

  const setField = (name: keyof Form, value: unknown) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setField(e.target.name as keyof Form, e.target.value);
  };

  const handleAnalyze = async () => {
    setAnalyzeError(null);
    setAnalyzeResult(null);
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
        business_name: data.business_name || prev.business_name,
        service_description: data.business_summary || prev.service_description,
        city: data.city || prev.city,
        province: data.province || prev.province,
        target_audience: data.target_audience || prev.target_audience,
        brand_voice: data.brand_voice?.length ? data.brand_voice : prev.brand_voice,
        services: data.services?.length ? data.services : prev.services,
        priority_services: data.priority_services?.length ? data.priority_services.slice(0, 3) : prev.priority_services,
        transformation_goals: data.transformation_goals?.length ? data.transformation_goals : prev.transformation_goals,
        favorite_phrases: data.favorite_phrases?.length ? data.favorite_phrases : prev.favorite_phrases,
        avoid_phrases: data.avoid_phrases?.length ? data.avoid_phrases : prev.avoid_phrases,
        content_preferences: data.content_preferences?.length ? data.content_preferences : prev.content_preferences,
        cta_style: data.cta_style || prev.cta_style,
      }));
      setAnalyzeResult(data);
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
          priority_services: form.priority_services,
          transformation_goals: form.transformation_goals,
          brand_examples: form.brand_examples,
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
          <p className="mt-1 text-sm text-gray-500">Plus votre profil est complet, plus l'IA crée des publications qui ressemblent à votre clinique.</p>
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

            {/* Profile completion card */}
            <div className="mb-4 bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Profil de marque</span>
                  <p className="text-xs text-gray-400 mt-0.5">{getCompletionLabel(completion)}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums shrink-0 ml-3 ${completion === 100 ? 'text-green-600' : 'text-violet-600'}`}>
                  {completion}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-green-500' : 'bg-violet-600'}`}
                  style={{ width: `${completion}%` }}
                />
              </div>

              {completion < 100 && missingItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Complétez ces éléments pour améliorer vos résultats :</p>
                  <ul className="space-y-1">
                    {missingItems.map(label => (
                      <li key={label} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 flex items-center justify-center" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {completion === 100 && (
                <p className="text-xs text-green-600 font-medium mt-2">
                  ✓ Profil complet — StudioGen a tout ce qu'il faut pour écrire comme votre entreprise.
                </p>
              )}
            </div>

            {/* Value proposition */}
            <div className="mb-6 bg-violet-50 border border-violet-100 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-violet-900">
                Plus votre profil est complet, plus StudioGen écrit comme votre entreprise.
              </p>
              <p className="text-xs text-violet-700 leading-relaxed">
                StudioGen utilise ces informations pour comprendre votre ton, vos services, votre clientèle et votre façon de communiquer.
              </p>
              <ul className="space-y-1.5 pt-0.5">
                {[
                  'Des publications plus personnalisées',
                  'Un ton cohérent avec votre marque',
                  'Moins de modifications après génération',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-xs text-violet-700 font-medium">
                    <span className="text-violet-500 font-bold">✓</span>
                    {benefit}
                  </li>
                ))}
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
                    {analyzeError && <p className="text-xs text-red-500 mt-2">{analyzeError}</p>}
                    {analyzeResult && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2.5">
                          Résultats — {analyzeResult._pages_crawled ?? 1} page{(analyzeResult._pages_crawled ?? 1) > 1 ? 's' : ''} analysée{(analyzeResult._pages_crawled ?? 1) > 1 ? 's' : ''}
                        </p>
                        {[
                          {
                            label: 'Services détectés',
                            ok: (analyzeResult.services?.length ?? 0) > 0,
                            detail: analyzeResult.services?.length ? `${analyzeResult.services.length} service${analyzeResult.services.length > 1 ? 's' : ''}` : null,
                          },
                          {
                            label: 'Clientèle détectée',
                            ok: !!analyzeResult.target_audience,
                            detail: analyzeResult.target_audience ? analyzeResult.target_audience.slice(0, 40) + (analyzeResult.target_audience.length > 40 ? '…' : '') : null,
                          },
                          {
                            label: 'Ton détecté',
                            ok: (analyzeResult.brand_voice?.length ?? 0) > 0,
                            detail: analyzeResult.brand_voice?.slice(0, 2).join(', ') ?? null,
                          },
                          {
                            label: 'Région détectée',
                            ok: !!(analyzeResult.city || analyzeResult.province),
                            detail: [analyzeResult.city, analyzeResult.province].filter(Boolean).join(', ') || null,
                          },
                        ].map(({ label, ok, detail }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-3 shrink-0 ${ok ? 'text-green-600' : 'text-gray-300'}`}>{ok ? '✓' : '–'}</span>
                            <span className={`text-xs ${ok ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                            {detail && <span className="text-xs text-gray-400 ml-auto truncate max-w-[140px]">{detail}</span>}
                          </div>
                        ))}
                        <p className="text-xs text-violet-600 font-medium pt-1.5 border-t border-gray-200">
                          Vérifiez les champs ci-dessous et sauvegardez.
                        </p>
                      </div>
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
                      placeholder="ex. Femmes 28-55 ans, aiment les soins esthétiques et le bien-être"
                      className={inputClass} />
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Voix de marque</label>
                    <p className="text-xs text-gray-400 mb-2">Sélectionnez les tons qui définissent votre communication.</p>
                    <ChipSelect options={BRAND_VOICE_OPTIONS} value={form.brand_voice}
                      onChange={(v) => setField('brand_voice', v)} />
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Services offerts</label>
                    <p className="text-xs text-gray-400 mb-2">Appuyez sur Entrée ou virgule pour ajouter.</p>
                    <TagInput value={form.services} onChange={(v) => setField('services', v)}
                      placeholder="ex. Soin visage, Épilation laser, Traitement au collagène..." />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass + ' mb-0'}>Services prioritaires</label>
                      <span className="text-xs text-gray-400">{form.priority_services.length}/3</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Quels services génèrent le plus de revenus ou représentent le mieux votre entreprise ? Maximum 3.
                    </p>
                    <TagInput value={form.priority_services} onChange={(v) => setField('priority_services', v)}
                      placeholder="ex. Épilation laser, HydraFacial..." maxItems={3} />
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

              {/* ── Transformation et exemples ── */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Transformation et exemples</h2>

                <div>
                  <div className="mb-5">
                    <label className={labelClass}>Objectifs de transformation</label>
                    <p className="text-xs text-gray-400 mb-1.5">
                      Qu'espèrent obtenir vos clientes grâce à vos services ?
                    </p>
                    <p className="text-xs text-gray-300 mb-2 italic">
                      Ex. : Plus de confiance en soi &middot; Peau plus lumineuse &middot; Gain de temps le matin
                    </p>
                    <TagInput value={form.transformation_goals} onChange={(v) => setField('transformation_goals', v)}
                      placeholder="ex. Peau lumineuse, Confiance retrouvée, Résultats durables..." />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className={labelClass + ' mb-0'}>Publications qui vous ressemblent</label>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        ⭐ Améliore fortement la qualité
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Collez 1 à 3 publications que vous aimez déjà ou que vous avez publiées. StudioGen les utilisera comme référence de style, ton et vocabulaire.
                    </p>
                    <ExampleInput value={form.brand_examples} onChange={(v) => setField('brand_examples', v)} />
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
                      placeholder="ex. Peau lumineuse, Résultats naturels, Prenez soin de vous..." />
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
              <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
                )}
                <div className="flex items-end justify-between gap-4">
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                    Votre profil devient le cerveau de votre marque dans StudioGen.<br />
                    <span className="text-gray-300">Chaque publication future utilisera ces informations.</span>
                  </p>
                  <button type="submit" disabled={saving}
                    className="shrink-0 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
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
