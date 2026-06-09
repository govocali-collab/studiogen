import { FormatType, Layout, LayoutCell, LayoutType } from './types';

export const FORMATS: Record<FormatType, { width: number; height: number; label: string }> = {
  '1:1':  { width: 1080, height: 1080, label: 'Carré 1:1' },
  '4:5':  { width: 1080, height: 1350, label: 'Portrait 4:5' },
  '9:16': { width: 1080, height: 1920, label: 'Story 9:16' },
};

const GAP = 4;

function buildCells(id: LayoutType, W: number, H: number): LayoutCell[] {
  const G = GAP;
  const cw  = Math.floor((W - G) / 2);      // half-width column
  const cw3 = Math.floor((W - 2 * G) / 3);  // third-width column
  const rh  = Math.floor((H - G) / 2);      // half-height row
  const rh3 = Math.floor((H - 2 * G) / 3);  // third-height row

  switch (id) {
    case 'full':
      return [{ x: 0, y: 0, w: W, h: H }];

    case 'side-by-side':
      return [
        { x: 0,      y: 0, w: cw,       h: H },
        { x: cw + G, y: 0, w: W - cw - G, h: H },
      ];

    case 'stack-2':
      return [
        { x: 0, y: 0,      w: W, h: rh },
        { x: 0, y: rh + G, w: W, h: H - rh - G },
      ];

    case 'strip':
      return [
        { x: 0,               y: 0, w: cw3,              h: H },
        { x: cw3 + G,         y: 0, w: cw3,              h: H },
        { x: 2 * cw3 + 2 * G, y: 0, w: W - 2 * cw3 - 2 * G, h: H },
      ];

    case 'strip-h-3':
      return [
        { x: 0, y: 0,               w: W, h: rh3 },
        { x: 0, y: rh3 + G,         w: W, h: rh3 },
        { x: 0, y: 2 * rh3 + 2 * G, w: W, h: H - 2 * rh3 - 2 * G },
      ];

    case 'grid-2x2':
      return [
        { x: 0,      y: 0,      w: cw,         h: rh },
        { x: cw + G, y: 0,      w: W - cw - G, h: rh },
        { x: 0,      y: rh + G, w: cw,         h: H - rh - G },
        { x: cw + G, y: rh + G, w: W - cw - G, h: H - rh - G },
      ];

    case 'grid-2x3':
      return [
        { x: 0,      y: 0,               w: cw,         h: rh3 },
        { x: cw + G, y: 0,               w: W - cw - G, h: rh3 },
        { x: 0,      y: rh3 + G,         w: cw,         h: rh3 },
        { x: cw + G, y: rh3 + G,         w: W - cw - G, h: rh3 },
        { x: 0,      y: 2 * rh3 + 2 * G, w: cw,         h: H - 2 * rh3 - 2 * G },
        { x: cw + G, y: 2 * rh3 + 2 * G, w: W - cw - G, h: H - 2 * rh3 - 2 * G },
      ];

    case 'hero-3':
      return [
        { x: 0,      y: 0,               w: cw,         h: H },
        { x: cw + G, y: 0,               w: W - cw - G, h: rh3 },
        { x: cw + G, y: rh3 + G,         w: W - cw - G, h: rh3 },
        { x: cw + G, y: 2 * rh3 + 2 * G, w: W - cw - G, h: H - 2 * rh3 - 2 * G },
      ];
  }
}

export const LAYOUT_META: Record<LayoutType, { name: string; minPhotos: number; maxPhotos: number }> = {
  'full':        { name: 'Plein écran', minPhotos: 1, maxPhotos: 1 },
  'side-by-side':{ name: 'Côte à côte', minPhotos: 2, maxPhotos: 2 },
  'stack-2':     { name: '2 bandes H',  minPhotos: 2, maxPhotos: 2 },
  'strip':       { name: 'Bande × 3',   minPhotos: 3, maxPhotos: 3 },
  'strip-h-3':   { name: '3 bandes H',  minPhotos: 3, maxPhotos: 3 },
  'grid-2x2':    { name: 'Grille 2×2',  minPhotos: 4, maxPhotos: 4 },
  'grid-2x3':    { name: 'Grille 2×3',  minPhotos: 5, maxPhotos: 6 },
  'hero-3':      { name: 'Héro + 3',    minPhotos: 4, maxPhotos: 4 },
};

export function getLayout(id: LayoutType, w: number, h: number): Layout {
  const meta = LAYOUT_META[id];
  return {
    id,
    name: meta.name,
    cells: buildCells(id, w, h),
    minPhotos: meta.minPhotos,
    maxPhotos: meta.maxPhotos,
  };
}

export const LAYOUT_ORDER: LayoutType[] = [
  'full',
  'side-by-side',
  'stack-2',
  'strip',
  'strip-h-3',
  'grid-2x2',
  'hero-3',
  'grid-2x3',
];

export function suggestLayout(photoCount: number): LayoutType {
  if (photoCount <= 1) return 'full';
  if (photoCount === 2) return 'side-by-side';
  if (photoCount === 3) return 'strip';
  if (photoCount === 4) return 'grid-2x2';
  return 'grid-2x3';
}
