'use client';
import { useEffect, useState } from 'react';

interface Suggestion {
  emoji: string;
  headline: string;
  action: string;
  ct: string;
  tone: string;
  details: string;
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const params = new URLSearchParams({
    ct: suggestion.ct,
    tone: suggestion.tone,
    details: suggestion.details,
  });

  return (
    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5 shrink-0">{suggestion.emoji}</span>
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-semibold text-violet-900 leading-snug">{suggestion.headline}</p>
          <p className="text-xs text-violet-700 leading-relaxed">{suggestion.action}</p>
        </div>
      </div>
      <a
        href={`/studio?${params.toString()}`}
        className="flex items-center gap-1.5 w-full justify-center text-xs font-semibold bg-white border border-violet-300 hover:bg-violet-600 hover:text-white hover:border-violet-600 text-violet-700 px-3 py-2 rounded-lg transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
        Créer ce contenu
      </a>
    </div>
  );
}

export default function StrategicSuggestions({ isPro, onUpgrade }: { isPro: boolean; onUpgrade: () => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (bust = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = bust ? `/api/suggestions?t=${Date.now()}` : '/api/suggestions';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erreur ${res.status}`);
      }
      const data = await res.json();
      setSuggestions(data as Suggestion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPro) fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  // ── Locked state for Essentiel ────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700">🔒 Suggestions stratégiques automatiques</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            StudioGen analyse ton ADN de marque et te suggère automatiquement quoi publier chaque semaine.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            ✨ Pro
          </span>
        </div>
        <button
          onClick={onUpgrade}
          className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          Passer au Pro →
        </button>
      </div>
    );
  }

  // ── Pro: suggestions card ─────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Suggestions IA</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              ✨ Pro
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Des idées personnalisées générées automatiquement selon ton entreprise.
          </p>
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={loading}
          title="Actualiser les suggestions"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner /> : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      {loading && !suggestions ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
          <Spinner />
          <span>Analyse de ton ADN de marque en cours…</span>
        </div>
      ) : error ? (
        <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
