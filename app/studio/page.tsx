'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CollageCanvas, { CollageCanvasHandle } from '@/components/CollageCanvas';
import FormatPicker from '@/components/FormatPicker';
import LayoutPicker from '@/components/LayoutPicker';
import LogoManager from '@/components/LogoManager';
import PhotoUploader from '@/components/PhotoUploader';
import PostGenerator from '@/components/PostGenerator';
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
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase/client';

const LOGOS_KEY = 'station-beaute-logos';
const LOGO_SETTINGS_KEY = 'station-beaute-logo-settings';

const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  logoId: null,
  position: 'bottom-right',
  size: 20,
};

export default function StudioPage() {
  const router = useRouter();
  const { profile, loading: subLoading, refresh: refreshSub, updateCounts, isAdmin, genInfo } = useSubscription();

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

  const canvasRef = useRef<CollageCanvasHandle>(null);

  const tier = profile?.subscription_tier ?? 'essentiel';
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
          setUpgradeModal({
            reason: "Ton essai gratuit de 7 jours est terminé. Active ton plan pour continuer.",
            tier: t,
          });
          return;
        }
        if (data.code === 'TRIAL_LIMIT_REACHED') {
          const t = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
          setUpgradeModal({
            reason: `Tu as utilisé tes ${PRICING[t].trialGenerations} générations d'essai. Active ton plan pour continuer.`,
            tier: t,
          });
          return;
        }
        if (data.code === 'LIMIT_REACHED') {
          setUpgradeModal({
            reason: 'Tu as atteint ta limite de 30 générations ce mois-ci. Passe au Pro pour des générations illimitées.',
            tier: 'pro',
          });
          return;
        }
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      setPosts(data as GeneratePostResponse);
      setUsedOffset((prev) => prev + 1);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/');
  };

  const openUpgrade = (reason: string) => setUpgradeModal({ reason, tier: 'pro' });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-black.png" alt="Studio Gen" width={180} height={36} className="h-7 sm:h-9 w-auto" priority />
            </Link>
            <span className="text-xs text-gray-300 hidden sm:inline">par Astrova</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2.5 py-1 rounded-full font-semibold transition-colors">
                Admin
              </Link>
            )}
            <span className="hidden sm:contents">
              {!subLoading && <BillingBadge profile={profile} />}
              {!subLoading && <GenerationCounter genInfo={displayGenInfo} />}
            </span>
            <Link href="/settings" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Paramètres
            </Link>
            <Link href="/billing" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Facturation
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Déco
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-4">
        {/* Trial banner */}
        {!subLoading && displayGenInfo.isTrialing && (
          <div className={`mb-4 flex items-center justify-between gap-4 rounded-2xl px-5 py-3 text-sm ${
            displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum
              ? 'bg-red-50 border border-red-200'
              : displayGenInfo.daysLeftInTrial === 1 || displayGenInfo.used >= trialLimitNum - 1
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-violet-50 border border-violet-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className={displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum ? 'text-red-700 font-medium' : 'text-violet-700'}>
                {displayGenInfo.daysLeftInTrial === 0
                  ? "Ton essai gratuit est terminé. Active ton plan pour continuer."
                  : displayGenInfo.used >= trialLimitNum
                  ? "Limite d'essai atteinte. Active ton plan pour continuer."
                  : `Essai gratuit · ${displayGenInfo.used}/${trialLimitNum} générations · ${displayGenInfo.daysLeftInTrial ?? 7}j restants`}
              </span>
            </div>
            <button
              onClick={() => setUpgradeModal({ reason: displayGenInfo.daysLeftInTrial === 0 ? "Ton essai gratuit de 7 jours est terminé. Active ton plan pour continuer." : `Tu as utilisé tes ${trialLimitNum} générations d'essai. Active ton plan pour continuer.`, tier })}
              className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              Activer mon plan →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-4 items-start">

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
            {!subLoading && (
              <GenerationWarning
                genInfo={displayGenInfo}
                onActivate={() => setUpgradeModal({
                  reason: `Tu as utilisé tes ${trialLimitNum} générations d'essai. Active ton plan pour continuer.`,
                  tier,
                })}
                onUpgrade={() => openUpgrade('Passe au Pro pour des générations illimitées.')}
              />
            )}
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
