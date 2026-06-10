'use client';

import { LayoutType } from '@/lib/types';
import { LAYOUT_META, LAYOUT_ORDER } from '@/lib/layouts';

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
  onLayoutChange,
}: LayoutPickerProps) {
  return (
    <div className="space-y-3">
      <h2 className="section-title">Mise en page</h2>
      <div className="grid grid-cols-4 gap-1.5">
        {LAYOUT_ORDER.map((id) => {
          const l = LAYOUT_META[id];
          const active = layout === id;

          return (
            <button
              key={id}
              onClick={() => onLayoutChange(id)}
              title={l.name}
              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                active
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-violet-300'
              }`}
            >
              <svg
                viewBox="0 0 36 36"
                className={`w-8 h-8 ${active ? 'fill-violet-600' : 'fill-gray-300'}`}
              >
                {LAYOUT_PREVIEWS[id]}
              </svg>
              <span className={`text-[9px] font-medium leading-tight text-center line-clamp-2 ${
                active ? 'text-violet-700' : 'text-gray-400'
              }`}>
                {l.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
