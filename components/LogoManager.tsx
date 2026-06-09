'use client';

import { useRef } from 'react';
import { Logo, LogoPosition, LogoSettings } from '@/lib/types';

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
  const maxLogos = tier === 'pro' ? Infinity : 1;
  const atLimit = logos.length >= maxLogos;

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Logo</h2>
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
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              active(logo.id)
                ? 'border-violet-600 bg-violet-50'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
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
