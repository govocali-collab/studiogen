'use client';

import { FormatType } from '@/lib/types';
import { FORMATS } from '@/lib/layouts';

interface FormatPickerProps {
  format: FormatType;
  onFormatChange: (format: FormatType) => void;
}

const FORMAT_SVG: Record<FormatType, { vw: number; vh: number }> = {
  '1:1':  { vw: 26, vh: 26 },
  '4:5':  { vw: 22, vh: 28 },
  '9:16': { vw: 16, vh: 28 },
};

export default function FormatPicker({ format, onFormatChange }: FormatPickerProps) {
  return (
    <div className="space-y-3">
      <h2 className="section-title">Format</h2>
      <div className="flex gap-2">
        {(Object.keys(FORMATS) as FormatType[]).map((id) => {
          const { label } = FORMATS[id];
          const { vw, vh } = FORMAT_SVG[id];
          const active = format === id;
          return (
            <button
              key={id}
              onClick={() => onFormatChange(id)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
                active
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-violet-300'
              }`}
            >
              <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
                <rect
                  x="1.5" y="1.5"
                  width={vw - 3} height={vh - 3}
                  rx="2"
                  fill={active ? '#7c3aed' : '#f3f4f6'}
                  stroke={active ? '#7c3aed' : '#d1d5db'}
                  strokeWidth="1.5"
                />
              </svg>
              <span className={`text-[11px] font-semibold leading-none ${active ? 'text-violet-700' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
