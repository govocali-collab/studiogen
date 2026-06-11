'use client';

import { useRef, useState } from 'react';
import { Logo, LogoPosition, LogoSettings } from '@/lib/types';

// ── Background removal (canvas-based, no API) ─────────────────────────────────
// Flood-fills from border pixels to detect the background colour, then fades
// matched pixels to transparent with soft anti-aliased edges.
function removeBg(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W = img.width, H = img.height;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, W, H);
      const d = imageData.data;

      // Average border pixels to estimate background colour
      let sr = 0, sg = 0, sb = 0, n = 0;
      const sample = (i: number) => { sr += d[i]; sg += d[i+1]; sb += d[i+2]; n++; };
      for (let x = 0; x < W; x++) { sample(x*4); sample(((H-1)*W+x)*4); }
      for (let y = 1; y < H-1; y++) { sample((y*W)*4); sample((y*W+W-1)*4); }
      const bgR = sr/n, bgG = sg/n, bgB = sb/n;

      const TOL = 40; // per-channel tolerance
      const visited = new Uint8Array(W * H);
      const queue: number[] = [];

      const enqueue = (idx: number) => {
        if (idx < 0 || idx >= W*H || visited[idx]) return;
        const i = idx * 4;
        if (Math.abs(d[i]-bgR) + Math.abs(d[i+1]-bgG) + Math.abs(d[i+2]-bgB) <= TOL * 3) {
          visited[idx] = 1;
          queue.push(idx);
        }
      };

      // Seed from all four border edges
      for (let x = 0; x < W; x++) { enqueue(x); enqueue((H-1)*W+x); }
      for (let y = 1; y < H-1; y++) { enqueue(y*W); enqueue(y*W+W-1); }

      // BFS flood-fill
      while (queue.length) {
        const idx = queue.pop()!;
        const x = idx % W, y = Math.floor(idx / W);
        if (x > 0)   enqueue(idx-1);
        if (x < W-1) enqueue(idx+1);
        if (y > 0)   enqueue(idx-W);
        if (y < H-1) enqueue(idx+W);
      }

      // Apply alpha: fully matched → transparent; near edge → soft fade
      for (let i = 0; i < W*H; i++) {
        if (!visited[i]) continue;
        const p = i * 4;
        const diff = Math.abs(d[p]-bgR) + Math.abs(d[p+1]-bgG) + Math.abs(d[p+2]-bgB);
        d[p+3] = Math.min(d[p+3], Math.round((diff / (TOL * 3)) * 255));
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface LogoManagerProps {
  logos: Logo[];
  onLogosChange: (logos: Logo[]) => void;
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;
  tier?: 'essentiel' | 'pro';
  onUpgradeClick?: () => void;
}

const POSITIONS: { id: LogoPosition; label: string; icon: string }[] = [
  { id: 'top-left',     label: 'H. gauche', icon: '↖' },
  { id: 'top-right',    label: 'H. droite', icon: '↗' },
  { id: 'center',       label: 'Centre',    icon: '⊙' },
  { id: 'bottom-left',  label: 'B. gauche', icon: '↙' },
  { id: 'bottom-right', label: 'B. droite', icon: '↘' },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LogoManager({
  logos, onLogosChange, logoSettings, onLogoSettingsChange,
  tier = 'essentiel', onUpgradeClick,
}: LogoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const maxLogos = tier === 'pro' ? Infinity : 1;
  const atLimit = logos.length >= maxLogos;

  const handleRemoveBg = async (e: React.MouseEvent, logo: Logo) => {
    e.stopPropagation();
    if (tier !== 'pro') { onUpgradeClick?.(); return; }
    setProcessingId(logo.id);
    try {
      const newDataUrl = await removeBg(logo.dataUrl);
      onLogosChange(logos.map(l => l.id === logo.id ? { ...l, dataUrl: newDataUrl } : l));
    } catch {
      // silently ignore — logo stays as-is
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (atLimit) { onUpgradeClick?.(); return; }
    const dataUrl = await fileToDataUrl(file);
    const newLogo: Logo = { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), dataUrl };
    const updated = [...logos, newLogo];
    onLogosChange(updated);
    onLogoSettingsChange({ ...logoSettings, logoId: newLogo.id });
  };

  const removeLogo = (id: string) => {
    onLogosChange(logos.filter((l) => l.id !== id));
    if (logoSettings.logoId === id) onLogoSettingsChange({ ...logoSettings, logoId: null });
  };

  const renameLogo = (id: string, name: string) =>
    onLogosChange(logos.map((l) => (l.id === id ? { ...l, name } : l)));

  const selectLogo = (id: string | null) =>
    onLogoSettingsChange({ ...logoSettings, logoId: id });

  const active = (id: string | null) => logoSettings.logoId === id;

  const activeIndex = logos.findIndex((l) => l.id === logoSettings.logoId);
  const canCycle = logos.length > 1;

  const cycleLogo = (dir: 1 | -1) => {
    if (!canCycle) return;
    const base = activeIndex < 0 ? 0 : activeIndex;
    const next = (base + dir + logos.length) % logos.length;
    selectLogo(logos[next].id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Logo</h2>
        <div className="flex items-center gap-2">
          {canCycle && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => cycleLogo(-1)}
                title="Logo précédent"
                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-[10px] text-gray-400 tabular-nums">
                {activeIndex < 0 ? '—' : `${activeIndex + 1}/${logos.length}`}
              </span>
              <button
                onClick={() => cycleLogo(1)}
                title="Logo suivant"
                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={() => atLimit ? onUpgradeClick?.() : inputRef.current?.click()}
            title={atLimit ? `Maximum ${maxLogos} logo pour le plan Essentiel` : 'Ajouter un logo'}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors"
          >
            {atLimit
              ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            }
            {atLimit ? 'Pro requis' : 'Ajouter'}
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      <div className="space-y-1">
        {/* No logo */}
        <button
          onClick={() => selectLogo(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
            active(null)
              ? 'border-violet-600 bg-violet-50 text-violet-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
          }`}
        >
          <span className="text-sm w-6 text-center">∅</span>
          <span className="text-sm font-medium">Sans logo</span>
          {active(null) && <CheckIcon />}
        </button>

        {logos.map((logo) => (
          <div
            key={logo.id}
            onClick={() => selectLogo(logo.id)}
            className={`rounded-lg border transition-colors cursor-pointer ${
              active(logo.id)
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            {/* Row 1 : thumbnail · name · check · delete */}
            <div className="flex items-center gap-2.5 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.dataUrl} alt={logo.name} className="w-7 h-7 object-contain rounded flex-shrink-0" />
              <input
                type="text"
                value={logo.name}
                onChange={(e) => renameLogo(logo.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none text-gray-700 font-medium"
              />
              {active(logo.id) && <CheckIcon />}
              <button
                onClick={(e) => { e.stopPropagation(); removeLogo(logo.id); }}
                className="w-5 h-5 text-gray-400 hover:text-gray-700 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Row 2 : remove background button */}
            <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => handleRemoveBg(e, logo)}
                disabled={processingId === logo.id}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                  tier === 'pro'
                    ? 'border-violet-200 text-violet-600 hover:bg-violet-100 bg-white'
                    : 'border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 bg-white'
                }`}
              >
                {processingId === logo.id ? (
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                ) : tier === 'pro' ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm7.364-9.243a3 3 0 10-4.243 4.243" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
                {processingId === logo.id
                  ? 'Traitement…'
                  : tier === 'pro'
                  ? 'Retirer le fond'
                  : 'Retirer le fond · Pro'}
              </button>
            </div>
          </div>
        ))}

        {logos.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-1">Aucun logo enregistré</p>
        )}
      </div>

      {/* Position & size */}
      {logoSettings.logoId && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div>
            <p className="section-title mb-2">Position</p>
            <div className="grid grid-cols-5 gap-1">
              {POSITIONS.map((pos) => {
                const isActive = logoSettings.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    title={pos.label}
                    onClick={() => onLogoSettingsChange({ ...logoSettings, position: pos.id })}
                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-sm leading-none">{pos.icon}</span>
                    <span className="text-[9px] leading-tight text-center">{pos.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="section-title">Taille</p>
              <span className="text-xs font-semibold text-gray-700 tabular-nums">{logoSettings.size}%</span>
            </div>
            <input
              type="range" min={8} max={40} step={1}
              value={logoSettings.size}
              onChange={(e) => onLogoSettingsChange({ ...logoSettings, size: Number(e.target.value) })}
              className="w-full h-1.5 accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>8%</span><span>40%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="ml-auto w-4 h-4 text-violet-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
    </svg>
  );
}
