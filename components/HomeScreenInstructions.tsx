'use client';

import { useEffect, useState } from 'react';
import { HomeScreenSteps, MobileOS } from './AddToHomeScreenBanner';

export default function HomeScreenInstructions() {
  // Auto-detect device OS, default to 'ios' on desktop so the section is always visible
  const [tab, setTab] = useState<MobileOS>('ios');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) setTab('android');
    // iOS stays as default; desktop users can switch manually
  }, []);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Application mobile</h2>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        Ajoutez StudioGen à votre écran d&apos;accueil pour un accès instantané, sans passer par le navigateur.
      </p>

      {/* iOS / Android toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('ios')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'ios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          iPhone
        </button>
        <button
          type="button"
          onClick={() => setTab('android')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'android' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Android
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          {tab === 'ios' ? 'Dans Safari' : 'Dans Chrome'}
        </p>
        <HomeScreenSteps os={tab} />
      </div>
    </section>
  );
}
