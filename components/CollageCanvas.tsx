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
const TAP_MAX_MS = 300;
const TAP_MAX_PX = 12;
const DOUBLE_TAP_MS = 400;

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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
  const swBase = imgRatio > cellRatio ? ih * cellRatio : iw;
  const shBase = imgRatio > cellRatio ? ih : iw / cellRatio;
  const sw = swBase / zoom;
  const sh = shBase / zoom;
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

    // ── Mobile selection state ────────────────────────────────
    const [selectedPhotoSrc, setSelectedPhotoSrc] = useState<string | null>(null);
    const selectedRef = useRef<string | null>(null);
    useEffect(() => { selectedRef.current = selectedPhotoSrc; }, [selectedPhotoSrc]);

    // Deselect if selected photo is removed
    useEffect(() => {
      if (selectedPhotoSrc && !photos.includes(selectedPhotoSrc)) {
        setSelectedPhotoSrc(null);
      }
    }, [photos, selectedPhotoSrc]);

    const dragRef = useRef<DragState | null>(null);
    const pinchRef = useRef<PinchState | null>(null);
    const [cursor, setCursor] = useState('default');

    // Tap detection
    const tapStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const tapMovedRef = useRef(false);
    const lastTapRef = useRef<{ time: number; photoSrc: string } | null>(null);

    // Is touch device (for hint text)
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    useEffect(() => { setIsTouchDevice('ontouchstart' in window); }, []);

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

    // ── Draw ─────────────────────────────────────────────────
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

      // Draw selection border on selected cell
      const selSrc = selectedRef.current;
      if (selSrc) {
        const selIdx = photos.indexOf(selSrc);
        if (selIdx >= 0 && selIdx < layout.cells.length) {
          const cell = layout.cells[selIdx];
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 8;
            ctx.strokeRect(cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 8);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2;
            ctx.strokeRect(cell.x + 10, cell.y + 10, cell.w - 20, cell.h - 20);
            ctx.restore();
          }
        }
      }
    }, [photos, layout, logos, logoSettings, adjustMap, canvasWidth, canvasHeight, selectedPhotoSrc]);

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

    // ── Mouse wheel zoom (desktop) ────────────────────────────
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
    const startDrag = useCallback((photoSrc: string, screenX: number, screenY: number) => {
      const adj = adjustMapRef.current.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
      dragRef.current = { photoSrc, startScreenX: screenX, startScreenY: screenY, startOffX: adj.x, startOffY: adj.y };
      setCursor('grabbing');
    }, []);

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

    // ── Touch handlers (mobile selection model) ───────────────
    //
    // No selection  →  touch-action: pan-y  (page scrolls normally)
    //                  Tap a photo          → select it
    //
    // Photo selected → touch-action: none   (browser defers all gestures to us)
    //                  Drag anywhere        → pan selected photo
    //                  Pinch anywhere       → zoom selected photo
    //                  Tap same / outside   → deselect
    //                  Tap different photo  → switch selection
    //                  Double-tap           → reset zoom + deselect

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        // Pinch: zoom selected photo (or the photo under the midpoint)
        tapStartRef.current = null;
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const photoSrc = selectedRef.current;
        if (photoSrc) {
          const adj = adjustMapRef.current.get(photoSrc) ?? { x: 0, y: 0, zoom: 1 };
          pinchRef.current = { photoSrc, startDist: dist, startZoom: adj.zoom };
        } else {
          const midX = (t0.clientX + t1.clientX) / 2;
          const midY = (t0.clientY + t1.clientY) / 2;
          const idx = getCellIndex(midX, midY);
          if (idx >= 0 && idx < photos.length) {
            const adj = adjustMapRef.current.get(photos[idx]) ?? { x: 0, y: 0, zoom: 1 };
            pinchRef.current = { photoSrc: photos[idx], startDist: dist, startZoom: adj.zoom };
          }
        }
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        tapStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        tapMovedRef.current = false;
        // If a photo is selected, start dragging it immediately
        if (selectedRef.current) {
          startDrag(selectedRef.current, t.clientX, t.clientY);
        }
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
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        if (tapStartRef.current) {
          const dx = Math.abs(t.clientX - tapStartRef.current.x);
          const dy = Math.abs(t.clientY - tapStartRef.current.y);
          if (dx > TAP_MAX_PX || dy > TAP_MAX_PX) tapMovedRef.current = true;
        }
        if (dragRef.current) moveDrag(t.clientX, t.clientY);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length < 2) pinchRef.current = null;

      if (e.touches.length === 0) {
        const tap = tapStartRef.current;
        const wasTap = tap && !tapMovedRef.current && (Date.now() - tap.time) < TAP_MAX_MS;

        if (wasTap && tap) {
          const { x, y } = tap;
          const idx = getCellIndex(x, y);
          const tappedSrc = idx >= 0 && idx < photos.length ? photos[idx] : null;
          const now = Date.now();

          // Double-tap: reset zoom + deselect
          const lastTap = lastTapRef.current;
          if (lastTap && tappedSrc && lastTap.photoSrc === tappedSrc && (now - lastTap.time) < DOUBLE_TAP_MS) {
            setAdjustMap((prev) => { const next = new Map(prev); next.delete(tappedSrc); return next; });
            setZoomVisible(false);
            setSelectedPhotoSrc(null);
            lastTapRef.current = null;
          } else {
            lastTapRef.current = tappedSrc ? { time: now, photoSrc: tappedSrc } : null;
            if (selectedRef.current) {
              // Already selected
              if (tappedSrc && tappedSrc !== selectedRef.current) {
                setSelectedPhotoSrc(tappedSrc); // switch to another photo
              } else {
                setSelectedPhotoSrc(null); // deselect
              }
            } else {
              if (tappedSrc) setSelectedPhotoSrc(tappedSrc); // select
            }
          }
        }

        endDrag();
        tapStartRef.current = null;
      }
    };

    // ── Mouse events (desktop, unchanged) ────────────────────
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const idx = getCellIndex(e.clientX, e.clientY);
      if (idx < 0 || idx >= photos.length) return;
      e.preventDefault();
      startDrag(photos[idx], e.clientX, e.clientY);
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

    const selectedIdx = selectedPhotoSrc ? photos.indexOf(selectedPhotoSrc) : -1;

    return (
      <div className="relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="rounded-xl shadow-lg ring-1 ring-black/5 select-none block mx-auto"
          style={{
            cursor,
            maxHeight: '580px',
            width: 'auto',
            maxWidth: '100%',
            // Selected: block all browser gestures so WE control zoom/pan
            // Not selected: allow vertical scroll so user can scroll past canvas
            touchAction: selectedPhotoSrc ? 'none' : 'pan-y',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Mobile selection indicator */}
        {selectedPhotoSrc && selectedIdx >= 0 && (
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between sm:hidden">
            <div className="bg-violet-700/90 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
              Photo {selectedIdx + 1} · Pincer pour zoomer · Glisser pour déplacer
            </div>
            <button
              className="bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold backdrop-blur-sm leading-none"
              onTouchEnd={(e) => { e.preventDefault(); setSelectedPhotoSrc(null); }}
            >
              ×
            </button>
          </div>
        )}

        {/* Zoom indicator */}
        {zoomVisible && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-fuchsia-600/90 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none tabular-nums">
            {zoomLabel}
          </div>
        )}

        {/* Hint */}
        {photos.length > 0 && (
          <p className="absolute bottom-2 right-3 text-[10px] text-white/60 select-none pointer-events-none drop-shadow">
            {isTouchDevice
              ? selectedPhotoSrc
                ? 'Double-tap pour réinitialiser · Tap ailleurs pour déselectionner'
                : 'Tap pour sélectionner · Pincer pour zoomer'
              : 'Glisser · molette pour zoomer · double-clic pour réinitialiser'}
          </p>
        )}
      </div>
    );
  },
);

export default CollageCanvas;
