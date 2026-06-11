'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type MobileOS = 'ios' | 'android';

function detectOS(): MobileOS | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

// ── Shared steps component ────────────────────────────────────────────────────
export function HomeScreenSteps({ os }: { os: MobileOS }) {
  const steps =
    os === 'ios'
      ? [
          <>Dans Safari, appuyer sur <strong className="text-gray-900">...</strong> (3 points) en bas à droite</>,
          <>Appuyer sur <strong className="text-gray-900">Partage</strong></>,
          <>En bas, appuyer sur <strong className="text-gray-900">&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</strong></>,
        ]
      : [
          <>Ouvrir StudioGen dans <strong className="text-gray-900">Chrome</strong></>,
          <>Appuyer sur le menu <strong className="text-gray-900">⋮</strong> (3 points) en haut à droite</>,
          <>Appuyer sur <strong className="text-gray-900">&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</strong></>,
          <>Appuyer sur <strong className="text-gray-900">&quot;Installer&quot;</strong></>,
        ];

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

// ── Dismissible banner (bottom sheet) ─────────────────────────────────────────
export default function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);
  const [os, setOs] = useState<MobileOS | null>(null);

  useEffect(() => {
    const detectedOs = detectOS();
    if (!detectedOs) return;
    if (isStandalone()) return;
    if (localStorage.getItem('pwa_never_ask') === 'true') return;
    if (sessionStorage.getItem('pwa_shown') === 'true') return;

    // Only show to authenticated users
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setOs(detectedOs);
      sessionStorage.setItem('pwa_shown', 'true');
      setTimeout(() => setVisible(true), 1200);
    });
  }, []);

  const dismiss = () => setVisible(false);

  const neverAsk = () => {
    localStorage.setItem('pwa_never_ask', 'true');
    setVisible(false);
  };

  if (!os) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[200] transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-violet-50 border-t border-violet-200 shadow-2xl rounded-t-2xl px-5 pt-5 pb-7 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-violet-900">Ajouter à l&apos;écran d&apos;accueil</p>
              <p className="text-xs text-violet-500 mt-0.5">Accès direct comme une vraie app — gratuit</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400 hover:bg-violet-100 flex-shrink-0 ml-2 mt-0.5"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white/70 rounded-xl p-4">
          <p className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-3">
            {os === 'ios' ? 'Sur iPhone — dans Safari' : 'Sur Android — dans Chrome'}
          </p>
          <HomeScreenSteps os={os} />
        </div>

        <div className="mt-4 pt-3 border-t border-violet-200 flex items-center justify-between">
          <button
            onClick={neverAsk}
            className="text-xs text-violet-400 hover:text-violet-600 transition-colors"
          >
            Ne plus afficher
          </button>
          <button
            onClick={dismiss}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
