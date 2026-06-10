'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import CollageCanvas, { CollageCanvasHandle } from '@/components/CollageCanvas';
import FormatPicker from '@/components/FormatPicker';
import LayoutPicker from '@/components/LayoutPicker';
import PhotoUploader from '@/components/PhotoUploader';
import BillingBadge from '@/components/BillingBadge';
import UpgradeModal from '@/components/UpgradeModal';
import GenerationCounter from '@/components/GenerationCounter';
import GenerationWarning from '@/components/GenerationWarning';
import { PRICING } from '@/lib/config/pricing';
import { FORMATS, getLayout, suggestLayout } from '@/lib/layouts';
import {
  FormatType,
  GeneratePostRequest,
  GeneratePostResponse,
  LayoutType,
  Logo,
  LogoSettings,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

const LogoManager = dynamic(() => import('@/components/LogoManager'), { ssr: false });
const PostGenerator = dynamic(() => import('@/components/PostGenerator'), { ssr: false });

const LOGOS_KEY = 'station-beaute-logos';
const LOGO_SETTINGS_KEY = 'station-beaute-logo-settings';

const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  logoId: null,
  position: 'bottom-right',
  size: 20,
};

interface Props {
  profile: Profile | null;
  isAdmin: boolean;
}

function computeGenInfo(profile: Profile | null) {
  const tier = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
  const status = profile?.subscription_status ?? 'trialing';
  const isTrialing = status === 'trialing';

  const used = isTrialing
    ? (profile?.trial_generations_used ?? 0)
    : (profile?.generations_used ?? 0);

  const limit: number | null = isTrialing
    ? PRICING[tier].trialGenerations
    : tier === 'pro' ? null : 30;

  const daysLeftInTrial = isTrialing && profile?.created_at
    ? Math.max(0, Math.ceil(
        (new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now()) /
        (24 * 60 * 60 * 1000),
      ))
    : null;

  return { used, limit, isTrialing, daysLeftInTrial, tier };
}

export default function StudioClient({ profile: initialProfile, isAdmin }: Props) {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [photos, setPhotos] = useState<string[]>([]);
  const [format, setFormat] = useState<FormatType>('1:1');
  const [layoutType, setLayoutType] = useState<LayoutType>('full');
  const [logos, setLogos] = useState<Logo[]>([]);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(DEFAULT_LOGO_SETTINGS);
  const [posts, setPosts] = useState<GeneratePostResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ reason: string; tier: 'essentiel' | 'pro' } | null>(null);
  const [usedOffset, setUsedOffset] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canvasRef = useRef<CollageCanvasHandle>(null);

  const genInfo = computeGenInfo(profile);
  const tier = genInfo.tier;
  const displayGenInfo = { ...genInfo, used: genInfo.used + usedOffset };
  const trialLimitNum = displayGenInfo.limit ?? 0;

  useEffect(() => {
    try {
      const storedLogos = localStorage.getItem(LOGOS_KEY);
      if (storedLogos) setLogos(JSON.parse(storedLogos));
      const storedSettings = localStorage.getItem(LOGO_SETTINGS_KEY);
      if (storedSettings) setLogoSettings(JSON.parse(storedSettings));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LOGOS_KEY, JSON.stringify(logos));
  }, [logos, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LOGO_SETTINGS_KEY, JSON.stringify(logoSettings));
  }, [logoSettings, hydrated]);

  useEffect(() => {
    setLayoutType(suggestLayout(photos.length));
  }, [photos.length]);

  const { width: canvasWidth, height: canvasHeight } = FORMATS[format];
  const layout = getLayout(layoutType, canvasWidth, canvasHeight);
  const suggested = suggestLayout(photos.length);

  const handleGenerate = useCallback(async (req: GeneratePostRequest) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'TRIAL_EXPIRED') {
          const t = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
          setUpgradeModal({ reason: "Ton essai gratuit de 7 jours est terminé. Active ton plan pour continuer.", tier: t });
          return;
        }
        if (data.code === 'TRIAL_LIMIT_REACHED') {
          const t = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
          setUpgradeModal({ reason: `Tu as utilisé tes ${PRICING[t].trialGenerations} générations d'essai. Active ton plan pour continuer.`, tier: t });
          return;
        }
        if (data.code === 'LIMIT_REACHED') {
          setUpgradeModal({ reason: 'Tu as atteint ta limite de 30 générations ce mois-ci. Passe au Pro pour des générations illimitées.', tier: 'pro' });
          return;
        }
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      setPosts(data as GeneratePostResponse);
      setUsedOffset((prev) => prev + 1);
    } finally {
      setIsGenerating(false);
    }
  }, [profile?.subscription_tier]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/');
  };

  const openUpgrade = (reason: string) => setUpgradeModal({ reason, tier: 'pro' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-black.png" alt="Studio Gen" width={180} height={36} className="h-9 w-auto max-w-[160px] sm:max-w-none" priority />
            </Link>
            <span className="text-xs text-gray-300 hidden sm:inline">par Astrova</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2.5 py-1 rounded-full font-semibold transition-colors">
                Admin
              </Link>
            )}
            {/* Desktop nav */}
            <span className="hidden sm:contents">
              <BillingBadge profile={profile} />
              <GenerationCounter genInfo={displayGenInfo} />
            </span>
            <Link href="/settings" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Paramètres</Link>
            <Link href="/billing" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Facturation</Link>
            <button onClick={handleSignOut} className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Déconnexion</button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-20 py-2">
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
              <BillingBadge profile={profile} />
              <GenerationCounter genInfo={displayGenInfo} />
            </div>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Paramètres
            </Link>
            <Link href="/billing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 21Z" />
              </svg>
              Facturation
            </Link>
            <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <main className="w-full max-w-screen-xl mx-auto px-4 py-4 overflow-x-hidden">
        {/* Trial banner */}
        {displayGenInfo.isTrialing && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
            displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum
              ? 'bg-red-50 border border-red-200'
              : displayGenInfo.daysLeftInTrial === 1 || displayGenInfo.used >= trialLimitNum - 1
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-violet-50 border border-violet-200'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className={`truncate ${displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum ? 'text-red-700 font-medium' : 'text-violet-700'}`}>
                  {displayGenInfo.daysLeftInTrial === 0
                    ? "Essai terminé. Active ton plan."
                    : displayGenInfo.used >= trialLimitNum
                    ? "Limite atteinte. Active ton plan."
                    : `Essai gratuit · ${displayGenInfo.used}/${trialLimitNum} génér. · ${displayGenInfo.daysLeftInTrial ?? 7}j`}
                </span>
              </div>
              <button
                onClick={() => setUpgradeModal({ reason: displayGenInfo.daysLeftInTrial === 0 ? "Ton essai gratuit de 7 jours est terminé. Active ton plan pour continuer." : `Tu as utilisé tes ${trialLimitNum} générations d'essai. Active ton plan pour continuer.`, tier })}
                className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
              >
                Activer →
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4 lg:grid lg:grid-cols-[260px_1fr_340px] lg:gap-4 lg:space-y-0 lg:items-start">

          <div className="space-y-4">
            <Card>
              <FormatPicker format={format} onFormatChange={setFormat} />
            </Card>
            <Card>
              <LayoutPicker
                photoCount={photos.length}
                layout={layoutType}
                suggestedLayout={suggested}
                onLayoutChange={setLayoutType}
                tier={tier}
                onUpgradeClick={() => openUpgrade('Les mises en page avancées sont réservées au plan Pro.')}
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Aperçu</h2>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-400 tabular-nums">
                    {canvasWidth} × {canvasHeight} px
                  </span>
                  <button
                    onClick={() => canvasRef.current?.download()}
                    disabled={photos.length === 0}
                    className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger JPG
                  </button>
                </div>
              </div>

              <CollageCanvas
                ref={canvasRef}
                photos={photos}
                layout={layout}
                logos={logos}
                logoSettings={logoSettings}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                format={format}
              />

              {photos.length > 0 && (
                <p className="text-center text-[11px] text-gray-400 mt-2.5">
                  {photos.length} photo{photos.length > 1 ? 's' : ''} · {layout.name} · {FORMATS[format].label}
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <LogoManager
                logos={logos}
                onLogosChange={setLogos}
                logoSettings={logoSettings}
                onLogoSettingsChange={setLogoSettings}
                tier={tier}
                onUpgradeClick={() => openUpgrade('Les logos illimités sont réservés au plan Pro. Le plan Essentiel permet 1 logo.')}
              />
            </Card>
            <GenerationWarning
              genInfo={displayGenInfo}
              onActivate={() => setUpgradeModal({
                reason: `Tu as utilisé tes ${trialLimitNum} générations d'essai. Active ton plan pour continuer.`,
                tier,
              })}
              onUpgrade={() => openUpgrade('Passe au Pro pour des générations illimitées.')}
            />
            <Card>
              <PostGenerator
                isGenerating={isGenerating}
                posts={posts}
                onGenerate={handleGenerate}
                onPostsChange={setPosts}
                tier={tier}
                onUpgradeClick={() => openUpgrade('La génération simultanée Facebook + Instagram est réservée au plan Pro.')}
              />
            </Card>
          </div>

        </div>
      </main>

      {upgradeModal && (
        <UpgradeModal
          reason={upgradeModal.reason}
          checkoutTier={upgradeModal.tier}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      {children}
    </div>
  );
}
