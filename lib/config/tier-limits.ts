import { LayoutType } from '@/lib/types';

export const ESSENTIEL_LAYOUTS: LayoutType[] = [
  'full',
  'side-by-side',
  'stack-2',
  'strip-h-3',
];

export const TIER_LIMITS = {
  essentiel: {
    generationsPerMonth: 20,
    maxLogos: Infinity,
    maxPhotos: 6,
    availableLayouts: 'all' as const,
    platforms: ['fb', 'ig'] as const,
    postHistory: false,
  },
  pro: {
    generationsPerMonth: 150,
    maxLogos: Infinity,
    maxPhotos: 6,
    availableLayouts: 'all' as const,
    platforms: ['fb', 'ig'] as const,
    postHistory: true,
  },
} as const;

export function getTierLimits(tier: 'essentiel' | 'pro') {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.essentiel;
}
