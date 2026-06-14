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
import { TIER_LIMITS } from '@/lib/config/tier-limits';
import { FORMATS, getLayout, suggestLayout } from '@/lib/layouts';
import {
  FormatType,
  GeneratePostRequest,
  GeneratePostResponse,
  LayoutType,
  Logo,
  LogoSettings,
  TextOverlay,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

const LogoManager = dynamic(() => import('@/components/LogoManager'), { ssr: false });
const PostGenerator = dynamic(() => import('@/components/PostGenerator'), { ssr: false });

const logosKey        = (uid: string) => `sg-logos-${uid}`;
const logoSettingsKey = (uid: string) => `sg-logo-settings-${uid}`;
const bannerKey       = (uid: string) => `sg-ia-banner-${uid}`;

const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  logoId: null,
  position: 'bottom-right',
  size: 10,
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
    : TIER_LIMITS[tier].generationsPerMonth;

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
  const [iabannerDismissed, setIaBannerDismissed] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [scheduleModal, setScheduleModal] = useState<{ platform: 'fb' | 'ig'; content: string; contentType: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const canvasRef = useRef<CollageCanvasHandle>(null);
  const logoSettingsSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevLogosRef = useRef<Logo[]>([]);
  const uploadingIds = useRef<Set<string>>(new Set());

  const genInfo = computeGenInfo(profile);
  const tier = genInfo.tier;
  // During trial: full Pro access for all features
  const effectiveTier: 'essentiel' | 'pro' = genInfo.isTrialing ? 'pro' : tier;
  const displayGenInfo = { ...genInfo, used: genInfo.used + usedOffset };
  const trialLimitNum = displayGenInfo.limit ?? 0;

  // Helpers
  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  useEffect(() => {
    const init = async () => {
      const uid = initialProfile?.id ?? '';
      if (localStorage.getItem(bannerKey(uid)) === '1') setIaBannerDismissed(true);

      // Fetch logos + profile in parallel
      const [logosRes, profileRes] = await Promise.allSettled([
        fetch('/api/logos'),
        fetch('/api/profile'),
      ]);

      // Apply profile data immediately
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        profileRes.value.json().then((data) => {
          if (data) setProfile((prev) => prev ? { ...prev, ...data } : prev);
        });
      }

      try {
        if (logosRes.status === 'fulfilled' && logosRes.value.ok) {
          const serverLogos: { id: string; name: string; public_url: string; remembered_size: number | null; remembered_position: string | null }[] = await logosRes.value.json();
          if (serverLogos.length > 0) {
            const loaded = (await Promise.all(serverLogos.map(async (sl) => {
              try {
                const blob = await fetch(sl.public_url).then((r) => r.blob());
                const dataUrl = await blobToDataUrl(blob);
                return {
                  id: crypto.randomUUID(),
                  db_id: sl.id,
                  name: sl.name,
                  dataUrl,
                  rememberedSize: sl.remembered_size ?? 10,
                  rememberedPosition: (sl.remembered_position ?? 'bottom-right') as Logo['rememberedPosition'],
                } satisfies Logo;
              } catch { return null; }
            }))).filter(Boolean) as Logo[];

            setLogos(loaded);
            prevLogosRef.current = loaded;

            // Restore previously selected logo using saved db_id
            const storedSettings = localStorage.getItem(logoSettingsKey(uid));
            const parsed = storedSettings ? JSON.parse(storedSettings) : {};
            const savedDbId: string | undefined = parsed.selectedDbId;
            const target = savedDbId ? loaded.find((l) => l.db_id === savedDbId) : loaded[0];
            if (target) {
              setLogoSettings({
                logoId: target.id,
                size: target.rememberedSize ?? 10,
                position: target.rememberedPosition ?? 'bottom-right',
              });
            }

            setHydrated(true);
            return;
          }
        }
      } catch { /* fall through to localStorage */ }

      // Fallback: localStorage (first use or no server logos yet)
      try {
        const storedLogos = localStorage.getItem(logosKey(uid));
        const parsedLogos: Logo[] = storedLogos ? JSON.parse(storedLogos) : [];
        if (parsedLogos.length) {
          setLogos(parsedLogos);
          prevLogosRef.current = parsedLogos;
        }
        const storedSettings = localStorage.getItem(logoSettingsKey(uid));
        const parsed: LogoSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_LOGO_SETTINGS;
        const selectedLogo = parsedLogos.find((l) => l.id === parsed.logoId);
        setLogoSettings({
          ...parsed,
          size: selectedLogo?.rememberedSize ?? parsed.size,
          position: selectedLogo?.rememberedPosition ?? parsed.position,
        });
      } catch { /* ignore */ }

      setHydrated(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Save to localStorage as cache
    localStorage.setItem(logosKey(initialProfile?.id ?? ''), JSON.stringify(logos));

    const prev = prevLogosRef.current;

    // Upload new logos (no db_id yet)
    for (const logo of logos) {
      if (!logo.db_id && !uploadingIds.current.has(logo.id)) {
        uploadingIds.current.add(logo.id);
        const blob = dataUrlToBlob(logo.dataUrl);
        const form = new FormData();
        form.append('image', blob, `${logo.name}.${blob.type === 'image/png' ? 'png' : 'jpg'}`);
        form.append('name', logo.name);
        fetch('/api/logos', { method: 'POST', body: form })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.id) {
              setLogos((cur) => cur.map((l) => l.id === logo.id ? { ...l, db_id: data.id } : l));
            }
            uploadingIds.current.delete(logo.id);
          })
          .catch(() => { uploadingIds.current.delete(logo.id); });
      }
    }

    // Re-upload logos whose dataUrl changed (e.g. after removeBg)
    for (const logo of logos) {
      if (logo.db_id) {
        const prevLogo = prev.find((p) => p.id === logo.id);
        if (prevLogo && prevLogo.dataUrl !== logo.dataUrl && !uploadingIds.current.has(logo.id)) {
          uploadingIds.current.add(logo.id);
          const blob = dataUrlToBlob(logo.dataUrl);
          const form = new FormData();
          form.append('image', blob, 'logo.png');
          fetch(`/api/logos/${logo.db_id}`, { method: 'PATCH', body: form })
            .finally(() => { uploadingIds.current.delete(logo.id); });
        }
      }
    }

    // Delete removed logos from server
    for (const prevLogo of prev) {
      if (prevLogo.db_id && !logos.find((l) => l.id === prevLogo.id)) {
        fetch(`/api/logos/${prevLogo.db_id}`, { method: 'DELETE' });
      }
    }

    prevLogosRef.current = logos;
  }, [logos, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Save settings + selected db_id to localStorage
    const selectedLogo = logos.find((l) => l.id === logoSettings.logoId);
    localStorage.setItem(logoSettingsKey(initialProfile?.id ?? ''), JSON.stringify({
      ...logoSettings,
      selectedDbId: selectedLogo?.db_id,
    }));
    // Remember size + position on the logo object
    if (logoSettings.logoId) {
      setLogos((prev) => prev.map((l) =>
        l.id === logoSettings.logoId
          ? { ...l, rememberedSize: logoSettings.size, rememberedPosition: logoSettings.position }
          : l
      ));
    }
    // Debounce-save to server
    clearTimeout(logoSettingsSaveTimer.current);
    logoSettingsSaveTimer.current = setTimeout(() => {
      if (selectedLogo?.db_id) {
        fetch(`/api/logos/${selectedLogo.db_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remembered_size: logoSettings.size, remembered_position: logoSettings.position }),
        });
      }
    }, 800);
  }, [logoSettings, hydrated]);

  useEffect(() => {
    setLayoutType(suggestLayout(photos.length));
  }, [photos.length]);

  // When the selected logo changes, restore its remembered size + position
  const prevLogoId = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (logoSettings.logoId === prevLogoId.current) return;
    prevLogoId.current = logoSettings.logoId;
    if (!logoSettings.logoId) return;
    const selected = logos.find((l) => l.id === logoSettings.logoId);
    if (selected && (selected.rememberedSize != null || selected.rememberedPosition != null)) {
      setLogoSettings((prev) => ({
        ...prev,
        ...(selected.rememberedSize != null ? { size: selected.rememberedSize } : {}),
        ...(selected.rememberedPosition != null ? { position: selected.rememberedPosition } : {}),
      }));
    }
  }, [logoSettings.logoId, hydrated, logos]);

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
          setUpgradeModal({ reason: "Ton essai gratuit de 7 jours est terminé. Choisis ton abonnement pour continuer.", tier: 'pro' });
          return;
        }
        if (data.code === 'TRIAL_LIMIT_REACHED') {
          setUpgradeModal({ reason: `Tu as utilisé tes ${PRICING.pro.trialGenerations} générations d'essai. Choisis ton abonnement pour continuer.`, tier: 'pro' });
          return;
        }
        if (data.code === 'LIMIT_REACHED') {
          const t = (profile?.subscription_tier ?? 'essentiel') as 'essentiel' | 'pro';
          const reason = t === 'essentiel'
            ? `Tu as atteint ta limite de 20 publications ce mois-ci. Passe au plan Pro pour 150 publications par mois.`
            : `Tu as atteint ta limite de 150 publications ce mois-ci.`;
          setUpgradeModal({ reason, tier: 'pro' });
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

  const addTextOverlay = () => {
    const id = crypto.randomUUID();
    setTextOverlays(prev => [...prev, {
      id,
      text: 'Ton texte',
      x: 0.5,
      y: 0.4,
      fontSize: 72,
      fontFamily: 'Helvetica Neue',
      color: '#FFFFFF',
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
    }]);
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/');
  };

  const openUpgrade = (reason: string) => setUpgradeModal({ reason, tier: 'pro' });

  const [existingPosts, setExistingPosts] = useState<{ scheduled_date: string; platform: string }[]>([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const openSchedule = async (platform: 'fb' | 'ig', content: string, contentType: string) => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setScheduleDate('');
    setScheduleSaved(false);
    setScheduleError('');
    setScheduleModal({ platform, content, contentType });
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) setExistingPosts(await res.json());
    } catch { /* ignore */ }
  };

  const [scheduleError, setScheduleError] = useState('');

  const confirmSchedule = async () => {
    if (!scheduleModal || !scheduleDate) return;
    setScheduleSaving(true);
    setScheduleError('');
    try {
      const blob = await canvasRef.current?.exportBlob() ?? null;
      const form = new FormData();
      form.append('scheduled_date', scheduleDate);
      form.append('platform', scheduleModal.platform);
      form.append('content', scheduleModal.content);
      form.append('content_type', scheduleModal.contentType);
      if (blob) form.append('image', blob, 'post.jpg');
      const res = await fetch('/api/calendar', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScheduleError(data.error ?? `Erreur ${res.status}`);
        return;
      }
      setScheduleSaved(true);
      setTimeout(() => setScheduleModal(null), 1200);
    } catch (e) {
      setScheduleError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo-black.png" alt="StudioGen" width={180} height={36} className="h-9 w-auto max-w-[160px] sm:max-w-none" priority />
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
            <Link href="/studio" className="hidden sm:inline text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">Studio</Link>

            <Link href="/settings" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Paramètres</Link>
            <Link href="/billing" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Abonnement</Link>
            <Link href="/contact" className="hidden sm:inline text-xs text-gray-400 hover:text-gray-700 transition-colors">Aide</Link>
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
            <Link href="/studio" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Studio
            </Link>

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
              Abonnement
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              Aide
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
        {/* IA profile nudge banner */}
        {hydrated && !iabannerDismissed && !profile?.service_description && !profile?.brand_voice?.length && (
          <div className="mb-4 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-violet-900">Des publications à ton image</p>
                <p className="text-xs text-violet-700 mt-0.5">
                  Complétez ton profil et l'IA rédige dans ton ton, avec tes services.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/settings?tab=ia"
                className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Compléter mon profil →
              </Link>
              <button
                onClick={() => {
                  setIaBannerDismissed(true);
                  try { localStorage.setItem(bannerKey(initialProfile?.id ?? ''), '1'); } catch { /* ignore */ }
                }}
                className="text-violet-400 hover:text-violet-600 transition-colors p-1"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {displayGenInfo.isTrialing && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
            displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum
              ? 'bg-red-50 border border-red-200'
              : displayGenInfo.daysLeftInTrial === 1 || displayGenInfo.used >= trialLimitNum - 1
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className={`truncate ${displayGenInfo.daysLeftInTrial === 0 || displayGenInfo.used >= trialLimitNum ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}`}>
                  {displayGenInfo.daysLeftInTrial === 0
                    ? "Essai terminé. Active ton plan."
                    : displayGenInfo.used >= trialLimitNum
                    ? "Limite atteinte. Active ton plan."
                    : `Essai gratuit · ${displayGenInfo.used}/${trialLimitNum} publications · ${displayGenInfo.daysLeftInTrial ?? 7} jours`}
                </span>
              </div>
              <a
                href="/billing"
                className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
              >
                Activer →
              </a>
            </div>
          </div>
        )}


        {/* Badge (gauche) + Calendrier (droite, aligné avec la boite logo) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <BillingBadge profile={profile} />
          <Link href="/calendrier" className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-violet-200 transition-colors shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendrier
          </Link>
        </div>

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
                tier={effectiveTier}
                onUpgradeClick={() => openUpgrade('Les mises en page avancées sont réservées au plan Pro.')}
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <PhotoUploader photos={photos} onPhotosChange={setPhotos} maxPhotos={TIER_LIMITS[effectiveTier].maxPhotos} />
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h2 className="section-title">Aperçu</h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-xs text-gray-400 tabular-nums hidden sm:inline">
                    {canvasWidth} × {canvasHeight} px
                  </span>
                  <button
                    onClick={addTextOverlay}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-2 rounded-xl transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Texte
                  </button>
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
                textOverlays={textOverlays}
                onTextOverlaysChange={setTextOverlays}
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
                tier={effectiveTier}
                onUpgradeClick={() => openUpgrade('Les logos illimités et la suppression d\'arrière-plan sont réservés au plan Pro.')}
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
                tier={effectiveTier}
                onUpgradeClick={() => openUpgrade('La génération simultanée Facebook + Instagram est réservée au plan Pro.')}
                brandVoice={profile?.brand_voice}
                onSchedule={effectiveTier === 'pro' ? openSchedule : undefined}
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

      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setScheduleModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md space-y-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Planifier la publication</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scheduleModal.platform === 'fb' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {scheduleModal.platform === 'fb' ? 'Facebook' : 'Instagram'}
                </span>
              </div>
              <button onClick={() => setScheduleModal(null)} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Inline calendar */}
            <div className="px-5">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-xs font-bold text-gray-800">
                  {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Di','Lu','Ma','Me','Je','Ve','Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px">
                {(() => {
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const today = new Date(); today.setHours(0,0,0,0);
                  const cells: (number | null)[] = [];
                  for (let i = 0; i < firstDay; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                  return cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="h-9" />;
                    const iso = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const cellDate = new Date(calYear, calMonth, day); cellDate.setHours(0,0,0,0);
                    const isPast = cellDate < today;
                    const isToday = cellDate.getTime() === today.getTime();
                    const isSelected = scheduleDate === iso;
                    const postsOnDay = existingPosts.filter(p => p.scheduled_date === iso);
                    const hasFb = postsOnDay.some(p => p.platform === 'fb');
                    const hasIg = postsOnDay.some(p => p.platform === 'ig');

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        onClick={() => setScheduleDate(iso)}
                        className={`h-9 flex flex-col items-center justify-center rounded-lg transition-colors relative
                          ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-violet-50'}
                          ${isSelected ? 'bg-violet-600 text-white hover:bg-violet-700' : isToday ? 'ring-1 ring-violet-400' : ''}
                        `}
                      >
                        <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-white' : isToday ? 'text-violet-600' : 'text-gray-700'}`}>
                          {day}
                        </span>
                        {postsOnDay.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {hasFb && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-blue-500'}`} />}
                            {hasIg && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-red-200' : 'bg-red-500'}`} />}
                          </div>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Facebook
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Instagram
                </div>
                {scheduleDate && (
                  <span className="ml-auto text-[10px] font-semibold text-violet-600">
                    {new Date(scheduleDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-3">
              <p className="text-[11px] text-gray-400">L'image actuelle du collage sera jointe automatiquement.</p>

              {scheduleError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{scheduleError}</p>
              )}

              <button
                onClick={confirmSchedule}
                disabled={!scheduleDate || scheduleSaving || scheduleSaved}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  scheduleSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50'
                }`}
              >
                {scheduleSaved ? '✓ Planifié !' : scheduleSaving ? 'Sauvegarde…' : scheduleDate ? `Planifier le ${new Date(scheduleDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}` : 'Choisir une date'}
              </button>
            </div>
          </div>
        </div>
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
