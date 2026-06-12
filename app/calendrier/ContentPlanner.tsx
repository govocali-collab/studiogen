'use client';
import { useState } from 'react';

interface PlanDraft {
  title: string;
  content_type: string;
  service_focus: string | null;
  objective: string | null;
  suggested_date: string;
  platform: 'fb' | 'ig' | 'both';
  requires_photo: boolean;
}

interface ContentPlannerProps {
  calYear: number;
  calMonth: number;
  onPlanSaved: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'formation':         { bg: 'bg-purple-100',  text: 'text-purple-700'  },
  'résultats clients': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'produit':           { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  'engagement':        { bg: 'bg-orange-100',  text: 'text-orange-700'  },
  'éducatif':          { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  'promo':             { bg: 'bg-rose-100',    text: 'text-rose-700'    },
};
const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700' };

function typeColor(ct: string) { return TYPE_COLORS[ct] ?? DEFAULT_COLOR; }

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MOIS_FR_LOWER = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const JOURS_SHORT = ['dim','lun','mar','mer','jeu','ven','sam'];

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

export default function ContentPlanner({ calYear, calMonth, onPlanSaved }: ContentPlannerProps) {
  const [genMode, setGenMode] = useState<'week' | 'month' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanDraft[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const generate = async (mode: 'week' | 'month') => {
    setGenMode(mode);
    setGenerating(true);
    setError(null);

    let startDate: string;
    if (mode === 'month') {
      startDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    } else {
      // Next Monday (or today if it's Monday)
      const today = new Date();
      const dow = today.getDay(); // 0=Sun, 1=Mon, ...
      const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysUntilMonday);
      startDate = monday.toISOString().slice(0, 10);
    }

    try {
      const res = await fetch('/api/plan-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, startDate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Erreur lors de la génération');
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPlan(data as PlanDraft[]);
    } catch {
      setError('Erreur de connexion');
    }

    setGenerating(false);
  };

  const savePlan = async () => {
    if (!plan) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/planned-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: plan }),
      });

      if (res.ok) {
        setPlan(null);
        setGenMode(null);
        onPlanSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as { error?: string }).error ?? `Erreur ${res.status}`);
      }
    } catch {
      setSaveError('Erreur de connexion');
    }

    setSaving(false);
  };

  const dismiss = () => { setPlan(null); setGenMode(null); setSaveError(null); };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => generate('week')}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors"
        >
          {generating && genMode === 'week'
            ? <Spinner className="w-3 h-3" />
            : <span aria-hidden="true">✨</span>
          }
          Planifier ma semaine
        </button>

        <button
          onClick={() => generate('month')}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-violet-300 hover:border-violet-500 text-violet-600 hover:text-violet-700 disabled:opacity-60 px-4 py-2 rounded-xl transition-colors"
        >
          {generating && genMode === 'month'
            ? <Spinner className="w-3 h-3" />
            : <span aria-hidden="true">✨</span>
          }
          Planifier mon mois
        </button>

        {error && (
          <span className="text-xs text-red-600 font-medium">{error}</span>
        )}

        <a
          href="/studio"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-violet-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Studio
        </a>
      </div>

      {/* Plan review modal */}
      {plan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Plan généré ✨</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.length} publications —{' '}
                  {genMode === 'month'
                    ? `${MOIS_FR_LOWER[calMonth]} ${calYear}`
                    : 'cette semaine'}
                </p>
              </div>
              <button
                onClick={dismiss}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Idea list */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {plan.map((item, i) => {
                const c = typeColor(item.content_type);
                const d = parseLocalDate(item.suggested_date);
                const isFb = item.platform === 'fb' || item.platform === 'both';
                const isIg = item.platform === 'ig' || item.platform === 'both';

                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start gap-3">
                    {/* Date block */}
                    <div className="flex-shrink-0 bg-violet-100 text-violet-700 rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
                      <div className="text-[9px] font-bold uppercase leading-none tracking-wide">
                        {JOURS_SHORT[d.getDay()]}
                      </div>
                      <div className="text-lg font-black leading-none mt-0.5">{d.getDate()}</div>
                      <div className="text-[9px] leading-none text-violet-500">
                        {MOIS_FR[d.getMonth()].slice(0, 4).toLowerCase()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${c.bg} ${c.text}`}>
                          {item.content_type}
                        </span>
                        {isFb && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">FB</span>
                        )}
                        {isIg && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">IG</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{item.title}</p>
                      {item.service_focus && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.service_focus}</p>
                      )}
                    </div>

                    {/* Photo indicator */}
                    <div
                      className="flex-shrink-0 text-base leading-none pt-1"
                      title={item.requires_photo ? 'Photo requise' : 'Prêt à générer'}
                    >
                      {item.requires_photo ? '📷' : '🟢'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
              {saveError && (
                <p className="text-xs text-red-600 font-medium text-center">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={savePlan}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Spinner className="w-3.5 h-3.5" />}
                  {saving ? 'Enregistrement…' : 'Enregistrer le plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
