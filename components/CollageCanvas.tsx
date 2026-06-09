'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { FormatType, Layout, Logo, LogoSettings } from '@/lib/types';

interface CollageCanvasProps {
  photos: string[];
  layout: Layout;
  logos: Logo[];
  logoSettings: LogoSettings;
  canvasWidth: number;
  canvasHeight: number;
  format: FormatType;
}

export interface CollageCanvasHandle {
  download: () => void;
}

type Adjustment = { x: number; y: number; zoom: number };
type AdjustMap = Map<string, Adjustment>;

interface DragState {
  photoSrc: string;
  startScreenX: number;
  startScreenY: number;
  startOffX: number;
  startOffY: number;
}

interface PinchState {
  photoSrc: string;
  startDist: number;
  startZoom: number;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const LOGO_PADDING = 28;

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Cover-fit an image into a canvas cell with independent pan (canvas-px from centre)
 * and zoom (1 = default cover fit, >1 = zoomed in, shows less of the image).
 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  offsetX = 0,
  offsetY = 0,
  zoom = 1,
) {
  const { naturalWidth: iw, naturalHeight: ih } = img;
  const cellRatio = dw / dh;
  const imgRatio = iw / ih;

  // Baseline cover-fit crop (zoom = 1)
  const swBase = imgRatio > cellRatio ? ih * cellRatio : iw;
  const shBase = imgRatio > cellRatio ? ih : iw / cellRatio;

  // Apply zoom — larger zoom = smaller crop window = more zoomed in
  const sw = swBase / zoom;
  const sh = shBase / zoom;

  // Pan offset: canvas-px → source-image-px
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) / 2 - offsetX * (sw / dw)));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) / 2 - offsetY * (sh / dh)));

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

async function renderCollage(
  canvas: HTMLCanvasElement,
  photos: string[],
  layout: Layout,
  logos: Logo[],
  logoSettings: LogoSettings,
  adjustMap: AdjustMap,
  imgCache: Map<string, HTMLImageElement>,
  cw: number,
  ch: number,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = cw;
  canvas.height = ch;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cw, ch);

  const usedCells = layout.cells.slice(0, photos.length);

  await Promise.all(
    usedCells.map(async (cell, i) => {
      try {
        let img = imgCache.get(photos[i]);
        if (!img) { img = await loadImageEl(photos[i]); imgCache.set(photos[i], img); }
        const adj = adjustMap.get(photos[i]) ?? { x: 0, y: 0, zoom: 1 };
        drawCover(ctx, img, cell.x, cell.y, cell.w, cell.h, adj.x, adj.y, adj.zoom);
      } catch {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      }
    }),
  );

  if (logoSettings.logoId) {
    const logo = logos.find((l) => l.id === logoSettings.logoId);
    if (logo) {
      try {
        let logoImg = imgCache.get(logo.dataUrl);
        if (!logoImg) { logoImg = await loadImageEl(logo.dataUrl); imgCache.set(logo.dataUrl, logoImg); }
        const logoW = Math.round(cw * logoSettings.size / 100);
        const logoH = Math.round(logoW * logoImg.naturalHeight / logoImg.naturalWidth);
        let lx = 0, ly = 0;
        const { position } = logoSettings;
        if (position === 'bottom-right') { lx = cw - logoW - LOGO_PADDING; ly = ch - logoH - LOGO_PADDING; }
        else if (position === 'bottom-left') { lx = LOGO_PADDING; ly = ch - logoH - LOGO_PADDING; }
        else if (position === 'top-right') { lx = cw - logoW - LOGO_PADDING; ly = LOGO_PADDING; }
        else if (position === 'top-left') { lx = LOGO_PADDING; ly = LOGO_PADDING; }
        else { lx = Math.round((cw - logoW) / 2); ly = Math.round((ch - logoH) / 2); }
        ctx.drawImage(logoImg, lx, ly, logoW, logoH);
      } catch { /* skip */ }
    }
  }
}

const CollageCanvas = forwardRef<CollageCanvasHandle, CollageCanvasProps>(
  function CollageCanvas({ photos, layout, logos, logoSettings, canvasWidth, canvasHeight, format }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawIdRef = useRef(0);
    const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

    const [adjustMap, setAdjustMap] = useState<AdjustMap>(new Map());
    const adjustMapRef = useRef<AdjustMap>(new Map());
    useEffect(() => { adjustMapRef.current = adjustMap; }, [adjustMap]);

    const dragRef = useRef<DragState | null>(null);
    const pinchRef = useRef<PinchState | null>(null);
    const [cursor, setCursor] = useState('default');

    // Zoom indicator
    const [zoomLabel, setZoomLabel] = useState('');
    const [zoomVisible, setZoomVisible] = useState(false);
    const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flashZoom = useCallback((zoom: number) => {
      setZoomLabel(`${zoom.toFixed(1)}×`);
      setZoomVisible(true);
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = setTimeout(() => setZoomVisible(false), 1400);
    }, []);

    // Preload
    useEffect(() => {
      photos.forEach(async (src) => {
        if (!imgCacheRef.current.has(src)) {
          try { imgCacheRef.current.set(src, await loadImageEl(src)); } catch { /* skip */ }
        }
      });
    }, [photos]);

    // Draw
    const draw = useCallback(async () => {
      const id = ++drawIdRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (photos.length === 0) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvasWidth; canvas.height = canvasHeight;
        ctx.fillStyle = '#f3f4f6'; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#d1d5db'; ctx.textAlign = 'center';
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText('Ajoutez des photos', canvasWidth / 2, canvasHeight / 2 - 10);
        ctx.font = '32px sans-serif';
        ctx.fillText('pour créer votre collage', canvasWidth / 2, canvasHeight / 2 + 50);
        return;
      }

      await renderCollage(canvas, photos, layout, logos, logoSettings, adjustMap, imgCacheRef.current, canvasWidth, canvasHeight);
      if (id !== drawIdRef.current) return;
    }, [photos, layout, logos, logoSettings, adjustMap, canvasWidth, canvasHeight]);

    useEffect(() => { draw(); }, [draw]);

    useImperativeHandle(ref, () => ({
      download: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const suffix = format === '9:16' ? 'story' : format.replace(':', 'x');
        const link = document.createElement('a');
        link.download = `collage-station-beaute-${suffix}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
      },
    }));

    // ── Helpers ──────────────────────────────────────────────

    const getScale = () => {
      const c = canvasRef.current;
      return c ? c.getBoundingClientRect().width / canvasWidth : 1;
    };

    const getCellIndex = useCallback(
      (screenX: number, screenY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return -1;
        const rect = canvas.getBoundingClientRect();
        const scale = getScale();
        const cx = (screenX - rect.left) / scale;
        const cy = (screenY - rect.top) / scale;
        return layout.cells.slice(0, photos.length)
          .findIndex((c) => cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [layout, photos.length],
    );

    // ── Mouse wheel zoom (non-passive) ───────────────────────

    const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);

    useEffect(() => {
      wheelHandlerRef.current = (e: WheelEvent) => {
        const idx = getCellIndex(e.clientX, e.clientY);
        if (idx < 0 || idx >= photos.length) return;
        e.preventDefault();
        const photoSrc = photos[idx];
        const adj = adjustMapRef.current.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
        const factor = e.deltaY < 0 ? 1.04 : 1 / 1.04;
        const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, adj.zoom * factor));
        setAdjustMap((prev) => {
          const next = new Map(prev);
          next.set(photoSrc, { ...adj, zoom: newZoom });
          return next;
        });
        flashZoom(newZoom);
      };
    }, [getCellIndex, photos, flashZoom]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const handler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
      canvas.addEventListener('wheel', handler, { passive: false });
      return () => canvas.removeEventListener('wheel', handler);
    }, []);

    // ── Drag (pan) ───────────────────────────────────────────

    const startDrag = useCallback((screenX: number, screenY: number) => {
      const idx = getCellIndex(screenX, screenY);
      if (idx < 0 || idx >= photos.length) return false;
      const photoSrc = photos[idx];
      const adj = adjustMapRef.current.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
      dragRef.current = { photoSrc, startScreenX: screenX, startScreenY: screenY, startOffX: adj.x, startOffY: adj.y };
      setCursor('grabbing');
      return true;
    }, [getCellIndex, photos]);

    const moveDrag = useCallback((screenX: number, screenY: number) => {
      if (!dragRef.current) return;
      const { photoSrc, startScreenX, startScreenY, startOffX, startOffY } = dragRef.current;
      const scale = getScale();
      const dx = (screenX - startScreenX) / scale;
      const dy = (screenY - startScreenY) / scale;
      setAdjustMap((prev) => {
        const next = new Map(prev);
        const adj = next.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
        next.set(photoSrc, { ...adj, x: startOffX + dx, y: startOffY + dy });
        return next;
      });
    }, []);

    const endDrag = useCallback(() => { dragRef.current = null; setCursor('grab'); }, []);

    // ── Pinch zoom ───────────────────────────────────────────

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        const idx = getCellIndex(midX, midY);
        if (idx >= 0 && idx < photos.length) {
          const photoSrc = photos[idx];
          const adj = adjustMapRef.current.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
          pinchRef.current = { photoSrc, startDist: dist, startZoom: adj.zoom };
          e.preventDefault();
        }
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        if (startDrag(t.clientX, t.clientY)) e.preventDefault();
      }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2 && pinchRef.current) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const { photoSrc, startDist, startZoom } = pinchRef.current;
        const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, startZoom * (dist / startDist)));
        setAdjustMap((prev) => {
          const next = new Map(prev);
          const adj = next.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
          next.set(photoSrc, { ...adj, zoom: newZoom });
          return next;
        });
        flashZoom(newZoom);
        e.preventDefault();
      } else if (e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) endDrag();
    };

    // ── Mouse events ─────────────────────────────────────────

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (startDrag(e.clientX, e.clientY)) e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragRef.current) {
        moveDrag(e.clientX, e.clientY);
      } else {
        const idx = getCellIndex(e.clientX, e.clientY);
        setCursor(idx >= 0 && idx < photos.length ? 'grab' : 'default');
      }
    };

    const handleMouseUp = () => endDrag();
    const handleMouseLeave = () => { endDrag(); setCursor('default'); };

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const idx = getCellIndex(e.clientX, e.clientY);
      if (idx < 0 || idx >= photos.length) return;
      const photoSrc = photos[idx];
      setAdjustMap((prev) => { const next = new Map(prev); next.delete(photoSrc); return next; });
      setZoomVisible(false);
    };

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="rounded-xl shadow-lg ring-1 ring-black/5 select-none block mx-auto"
          style={{ cursor, maxHeight: '580px', width: 'auto', maxWidth: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Zoom indicator */}
        {zoomVisible && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-fuchsia-600/90 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none tabular-nums transition-opacity">
            {zoomLabel}
          </div>
        )}

        {/* Hint */}
        {photos.length > 0 && (
          <p className="absolute bottom-2 right-3 text-[10px] text-white/60 select-none pointer-events-none drop-shadow">
            Glisser · molette pour zoomer · double-clic pour réinitialiser
          </p>
        )}
      </div>
    );
  },
);

export default CollageCanvas;
