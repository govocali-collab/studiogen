'use client';

import { LayoutType } from '@/lib/types';
import { LAYOUT_META, LAYOUT_ORDER } from '@/lib/layouts';
import { ESSENTIEL_LAYOUTS } from '@/lib/config/tier-limits';

interface LayoutPickerProps {
  photoCount: number;
  layout: LayoutType;
  suggestedLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  tier?: 'essentiel' | 'pro';
  onUpgradeClick?: () => void;
}

const LAYOUT_PREVIEWS: Record<LayoutType, React.ReactNode> = {
  full: <rect x="1" y="1" width="34" height="34" rx="2" />,
  'side-by-side': (
    <>
      <rect x="1" y="1" width="16" height="34" rx="2" />
      <rect x="19" y="1" width="16" height="34" rx="2" />
    </>
  ),
  'stack-2': (
    <>
      <rect x="1" y="1" width="34" height="16" rx="2" />
      <rect x="1" y="19" width="34" height="16" rx="2" />
    </>
  ),
  strip: (
    <>
      <rect x="1" y="1" width="10" height="34" rx="2" />
      <rect x="13" y="1" width="10" height="34" rx="2" />
      <rect x="25" y="1" width="10" height="34" rx="2" />
    </>
  ),
  'strip-h-3': (
    <>
      <rect x="1" y="1" width="34" height="10" rx="2" />
      <rect x="1" y="13" width="34" height="10" rx="2" />
      <rect x="1" y="25" width="34" height="10" rx="2" />
    </>
  ),
  'grid-2x2': (
    <>
      <rect x="1" y="1" width="16" height="16" rx="2" />
      <rect x="19" y="1" width="16" height="16" rx="2" />
      <rect x="1" y="19" width="16" height="16" rx="2" />
      <rect x="19" y="19" width="16" height="16" rx="2" />
    </>
  ),
  'grid-2x3': (
    <>
      <rect x="1" y="1" width="16" height="10" rx="1" />
      <rect x="19" y="1" width="16" height="10" rx="1" />
      <rect x="1" y="13" width="16" height="10" rx="1" />
      <rect x="19" y="13" width="16" height="10" rx="1" />
      <rect x="1" y="25" width="16" height="10" rx="1" />
      <rect x="19" y="25" width="16" height="10" rx="1" />
    </>
  ),
  'hero-3': (
    <>
      <rect x="1" y="1" width="16" height="34" rx="2" />
      <rect x="19" y="1" width="16" height="10" rx="1" />
      <rect x="19" y="13" width="16" height="10" rx="1" />
      <rect x="19" y="25" width="16" height="10" rx="1" />
    </>
  ),
};

export default function LayoutPicker({
  layout,
  suggestedLayout,
  onLayoutChange,
  tier = 'essentiel',
  onUpgradeClick,
}: LayoutPickerProps) {
  const availableIds = tier === 'pro' ? LAYOUT_ORDER : ESSENTIEL_LAYOUTS;

  return (
    <div className="space-y-3">
      <h2 className="section-title">Mise en page</h2>
      <div className="grid grid-cols-4 gap-1.5">
        {LAYOUT_ORDER.map((id) => {
          const l = LAYOUT_META[id];
          const active = layout === id;
          const suggested = suggestedLayout === id;
          const locked = !availableIds.includes(id as typeof availableIds[number]);

          return (
            <button
              key={id}
              onClick={() => locked ? onUpgradeClick?.() : onLayoutChange(id)}
              title={locked ? `${l.name} — Plan Pro requis` : l.name}
              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                locked
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-pointer'
                  : active
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-violet-300'
              }`}
            >
              <svg
                viewBox="0 0 36 36"
                className={`w-8 h-8 ${active ? 'fill-violet-600' : locked ? 'fill-gray-200' : 'fill-gray-300'}`}
              >
                {LAYOUT_PREVIEWS[id]}
              </svg>
              <span className={`text-[9px] font-medium leading-tight text-center line-clamp-2 ${
                active ? 'text-violet-700' : 'text-gray-400'
              }`}>
                {l.name}
              </span>
              {locked && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-400 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {suggested && !locked && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-fuchsia-600 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white fill-current" viewBox="0 0 12 12">
                    <path d="M6 1l1.3 3.9H11L7.9 7.1l1.3 3.9L6 8.8l-3.2 2.2 1.3-3.9L1 4.9h3.7z"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400">
        ★ = suggérée · 🔒 = Plan Pro
      </p>
    </div>
  );
}
