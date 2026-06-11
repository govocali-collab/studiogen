'use client';

import { useEffect, useState } from 'react';
import { HomeScreenSteps, MobileOS } from './AddToHomeScreenBanner';

export default function HomeScreenInstructions() {
  const [os, setOs] = useState<MobileOS | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setOs('ios');
    else if (/Android/.test(ua)) setOs('android');
  }, []);

  if (!os) return null;

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

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          {os === 'ios' ? 'Sur iPhone — dans Safari' : 'Sur Android — dans Chrome'}
        </p>
        <HomeScreenSteps os={os} />
      </div>
    </section>
  );
}
