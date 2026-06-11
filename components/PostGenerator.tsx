'use client';

import { useEffect, useRef, useState } from 'react';
import { ContentType, GeneratePostRequest, GeneratePostResponse, TextLength, Tone } from '@/lib/types';

interface PostGeneratorProps {
  isGenerating: boolean;
  posts: GeneratePostResponse | null;
  onGenerate: (req: GeneratePostRequest) => Promise<void>;
  onPostsChange: (posts: GeneratePostResponse) => void;
  tier?: 'essentiel' | 'pro';
  onUpgradeClick?: () => void;
  brandVoice?: string[] | null;
  onSchedule?: (platform: 'fb' | 'ig', content: string, contentType: string) => void;
}

const BRAND_VOICE_LABELS: Record<string, string> = {
  chaleureux: 'Chaleureux',
  professionnel: 'Professionnel',
  luxueux: 'Luxueux',
  moderne: 'Moderne',
  éducatif: 'Éducatif',
  inspirant: 'Inspirant',
  familial: 'Familial',
  haut_de_gamme: 'Haut de gamme',
};

const BRAND_VOICE_TO_TONE: Record<string, Tone> = {
  chaleureux: 'chaleureux',
  familial: 'chaleureux',
  inspirant: 'chaleureux',
  professionnel: 'professionnel',
  luxueux: 'professionnel',
  haut_de_gamme: 'professionnel',
  moderne: 'professionnel',
  éducatif: 'professionnel',
};

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'formation',         label: 'Formation' },
  { id: 'résultats clients', label: 'Résultats' },
  { id: 'produit',           label: 'Produit' },
  { id: 'engagement',        label: 'Engagement' },
  { id: 'éducatif',          label: 'Éducatif' },
  { id: 'promo',             label: 'Promo' },
];

const TONES: { id: Tone; label: string }[] = [
  { id: 'chaleureux',    label: '🌸 Chaleureux' },
  { id: 'énergique',     label: '⚡ Énergique' },
  { id: 'professionnel', label: '💎 Pro' },
];

const LENGTHS: { id: TextLength; label: string; sub: string }[] = [
  { id: 'court', label: 'Court', sub: '~75 mots' },
  { id: 'moyen', label: 'Moyen', sub: '~180 mots' },
  { id: 'long',  label: 'Long',  sub: '~350 mots' },
];

function FbIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IgIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`text-xs px-2 py-1 rounded-lg border transition-colors font-medium ${
        copied
          ? 'border-violet-600 bg-violet-600 text-white'
          : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
      }`}
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Modifier"
      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors font-medium flex items-center gap-1"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      Modifier
    </button>
  );
}

interface EditModalProps {
  field: 'fb' | 'ig';
  text: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

function EditModal({ field, text, onClose, onSave }: EditModalProps) {
  const [value, setValue] = useState(text);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    const len = value.length;
    taRef.current?.setSelectionRange(len, len);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave(value);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [value, onClose, onSave]);

  const isFb = field === 'fb';
  const platform = isFb ? 'Facebook' : 'Instagram';
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 bg-violet-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isFb ? 'border-blue-100 bg-blue-50/50' : 'border-pink-100 bg-pink-50/50'} rounded-t-2xl`}>
          <div className="flex items-center gap-2">
            {isFb ? <FbIcon /> : <IgIcon />}
            <span className={`text-sm font-semibold ${isFb ? 'text-blue-700' : 'text-pink-700'}`}>
              Modifier le post {platform}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-[320px] text-sm text-gray-800 leading-relaxed font-sans resize-none focus:outline-none placeholder-gray-300 block"
            placeholder="Le texte du post…"
            rows={18}
            spellCheck
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums">{wordCount} mots</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 tabular-nums">{charCount.toLocaleString('fr-CA')} caractères</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-300 hidden sm:block">Ctrl+↵ sauvegarder</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(value)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 active:scale-[0.98] transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostGenerator({ isGenerating, posts, onGenerate, onPostsChange, tier = 'essentiel', onUpgradeClick, brandVoice, onSchedule }: PostGeneratorProps) {
  const [contentType, setContentType] = useState<ContentType>('résultats clients');
  const [tone, setTone] = useState<Tone>('chaleureux');
  const [length, setLength] = useState<TextLength>('moyen');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [editModal, setEditModal] = useState<{ field: 'fb' | 'ig'; text: string } | null>(null);

  // Pre-fill from URL params (set by "Créer maintenant" in the calendar planner)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ct = params.get('ct') as ContentType | null;
    const d = params.get('details');
    if (ct && CONTENT_TYPES.some(c => c.id === ct)) setContentType(ct);
    if (d) setDetails(d);
  }, []);

  const activeBrandVoice = brandVoice?.length ? brandVoice : null;
  const effectiveTone: Tone = activeBrandVoice
    ? (activeBrandVoice.map((v) => BRAND_VOICE_TO_TONE[v]).find(Boolean) ?? 'chaleureux')
    : tone;

  const handleGenerate = async () => {
    setError(null);
    try {
      await onGenerate({ contentType, tone: effectiveTone, details, length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    }
  };

  const openEdit = (field: 'fb' | 'ig') => {
    if (!posts) return;
    setEditModal({ field, text: posts[field] });
  };

  const saveEdit = (text: string) => {
    if (!editModal || !posts) return;
    onPostsChange({ ...posts, [editModal.field]: text });
    setEditModal(null);
  };

  const copyAll = async () => {
    if (!posts) return;
    await navigator.clipboard.writeText(`📘 FACEBOOK\n\n${posts.fb}\n\n---\n\n📸 INSTAGRAM\n\n${posts.ig}`);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h2 className="section-title">Générer les publications</h2>

      {/* Content type */}
      <div>
        <p className="section-title mb-2">Type de contenu</p>
        <div className="grid grid-cols-3 gap-1.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setContentType(ct.id)}
              className={`chip text-center ${contentType === ct.id ? 'chip-active' : ''}`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <p className="section-title mb-2">Ton</p>
        <div className={`flex gap-1.5 ${activeBrandVoice ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`flex-1 chip text-center ${!activeBrandVoice && tone === t.id ? 'chip-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeBrandVoice && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            Ton défini dans{' '}
            <a href="/settings?tab=ia" className="text-violet-500 hover:text-violet-700 underline underline-offset-2">
              Paramètres IA
            </a>
          </p>
        )}
      </div>

      {/* Length */}
      <div>
        <p className="section-title mb-2">Longueur</p>
        <div className="flex gap-1.5">
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLength(l.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all ${
                length === l.id
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <span className="text-xs font-semibold">{l.label}</span>
              <span className={`text-[10px] ${length === l.id ? 'text-gray-300' : 'text-gray-400'}`}>{l.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div>
        <p className="section-title mb-2">Détails / contexte</p>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ex. : Nouveau soin visage au collagène, promotion sur épilation laser à 89 $…"
          rows={3}
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-300"
        />
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98] transition-all shadow-sm shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Génération en cours…
          </span>
        ) : (
          posts ? '↺ Regénérer les publications' : '✦ Générer les publications'
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Generated posts */}
      {posts && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="section-title">Publications générées</span>
            <button
              onClick={copyAll}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors font-medium ${
                allCopied
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {allCopied ? '✓ Tout copié' : 'Tout copier'}
            </button>
          </div>

          {/* Facebook */}
          <div className="rounded-xl border border-blue-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-1.5">
                <FbIcon />
                <span className="text-xs font-semibold text-blue-700">Facebook</span>
              </div>
              <div className="flex items-center gap-1.5">
                <EditButton onClick={() => openEdit('fb')} />
                <CopyButton text={posts.fb} />
                {onSchedule && (
                  <button
                    type="button"
                    onClick={() => onSchedule('fb', posts.fb, contentType)}
                    title="Planifier au calendrier"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <pre
              className="text-xs text-gray-700 px-3 py-3 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto cursor-pointer hover:bg-blue-50/40 transition-colors"
              title="Cliquer pour modifier"
              onClick={() => openEdit('fb')}
            >
              {posts.fb}
            </pre>
          </div>

          {/* Instagram */}
          {tier === 'pro' ? (
            <div className="rounded-xl border border-pink-100 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-pink-50 border-b border-pink-100">
                <div className="flex items-center gap-1.5">
                  <IgIcon />
                  <span className="text-xs font-semibold text-pink-700">Instagram</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <EditButton onClick={() => openEdit('ig')} />
                  <CopyButton text={posts.ig} />
                  {onSchedule && (
                    <button
                      type="button"
                      onClick={() => onSchedule('ig', posts.ig, contentType)}
                      title="Planifier au calendrier"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-pink-400 hover:bg-pink-100 hover:text-pink-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <pre
                className="text-xs text-gray-700 px-3 py-3 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto cursor-pointer hover:bg-pink-50/40 transition-colors"
                title="Cliquer pour modifier"
                onClick={() => openEdit('ig')}
              >
                {posts.ig}
              </pre>
            </div>
          ) : (
            <button
              onClick={onUpgradeClick}
              className="w-full rounded-xl border border-dashed border-pink-200 bg-pink-50/50 p-3 flex items-center gap-3 hover:border-pink-400 transition-colors group"
            >
              <IgIcon />
              <div className="text-left">
                <p className="text-xs font-semibold text-pink-700">Instagram — Plan Pro</p>
                <p className="text-[10px] text-pink-400 group-hover:text-pink-600 transition-colors">
                  Générez FB + IG simultanément avec le plan Pro →
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <EditModal
          field={editModal.field}
          text={editModal.text}
          onClose={() => setEditModal(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}
