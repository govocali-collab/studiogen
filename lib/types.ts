export type LayoutType =
  | 'full'
  | 'side-by-side'
  | 'stack-2'
  | 'strip'
  | 'strip-h-3'
  | 'grid-2x2'
  | 'grid-2x3'
  | 'hero-3';

export type FormatType = '1:1' | '4:5' | '9:16';

export interface LayoutCell {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  id: LayoutType;
  name: string;
  cells: LayoutCell[];
  minPhotos: number;
  maxPhotos: number;
}

export interface Logo {
  id: string;
  name: string;
  dataUrl: string;
}

export type LogoPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'center';

export interface LogoSettings {
  logoId: string | null;
  position: LogoPosition;
  size: number; // 8–40 (percentage of canvas width)
}

export type ContentType =
  | 'formation'
  | 'résultats clients'
  | 'produit'
  | 'engagement'
  | 'éducatif'
  | 'promo';

export type Tone = 'chaleureux' | 'énergique' | 'professionnel';

export type TextLength = 'court' | 'moyen' | 'long';

export interface GeneratePostRequest {
  contentType: ContentType;
  tone: Tone;
  details: string;
  length: TextLength;
}

export interface GeneratePostResponse {
  fb: string;
  ig: string;
}
