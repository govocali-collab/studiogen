'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TextOverlay } from '@/lib/types';

const SNAP_THRESHOLD = 0.03; // 3% of canvas dimension — distance to snap to center

export const OVERLAY_FONTS: { label: string; value: string; css: string }[] = [
  { label: 'Helvetica',  value: 'Helvetica Neue',      css: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Arial',      value: 'Arial',               css: 'Arial, sans-serif' },
  { label: 'Roboto',     value: 'Roboto',              css: "'Roboto', Arial, sans-serif" },
  { label: 'Garamond',   value: 'EB Garamond',         css: "'EB Garamond', Garamond, Georgia, serif" },
  { label: 'Minion',     value: 'Cormorant Garamond',  css: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Times',      value: 'Times New Roman',     css: "'Times New Roman', Times, serif" },
];

export function fontCss(family: string): string {
  return OVERLAY_FONTS.find(f => f.value === family)?.css ?? 'Arial, sans-serif';
}

interface Props {
  overlays: TextOverlay[];
  onChange: (overlays: TextOverlay[]) => void;
  canvasWidth: number;
  displayW: number;
  displayH: number;
}

export default function TextOverlayLayer({ overlays, onChange, canvasWidth, displayW, displayH }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toolbarOffset, setToolbarOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => { setIsTouchDevice('ontouchstart' in window); }, []);

  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  const overlaysRef = useRef(overlays);
  useEffect(() => { overlaysRef.current = overlays; }, [overlays]);
  const displayWRef = useRef(displayW);
  const displayHRef = useRef(displayH);
  useEffect(() => { displayWRef.current = displayW; displayHRef.current = displayH; }, [displayW, displayH]);

  // Track live typed text so onDown can save before React unmounts the element
  const liveEditTextRef = useRef('');
  const editSavedRef = useRef(false);
  const editingIdRef = useRef<string | null>(null);
  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

  // Reset toolbar position when a different overlay is selected
  useEffect(() => { setToolbarOffset({ x: 0, y: 0 }); }, [selectedId]);

  const scale = displayW > 0 ? displayW / canvasWidth : 1;

  const update = useCallback((id: string, patch: Partial<TextOverlay>) => {
    onChange(overlaysRef.current.map(o => o.id === id ? { ...o, ...patch } : o));
  }, [onChange]);

  const remove = useCallback((id: string) => {
    onChange(overlaysRef.current.filter(o => o.id !== id));
    setSelectedId(null);
    setEditingId(null);
  }, [onChange]);

  // ── Drag overlay (move) ───────────────────────────────────────────────────
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const beginDrag = (id: string, cx: number, cy: number) => {
    const ov = overlaysRef.current.find(o => o.id === id);
    if (!ov) return;
    dragRef.current = { id, sx: cx, sy: cy, ox: ov.x, oy: ov.y };
  };

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!dragRef.current) return;
      const { id, sx, sy, ox, oy } = dragRef.current;
      const w = displayWRef.current || 1;
      const h = displayHRef.current || 1;
      const rawX = ox + (cx - sx) / w;
      const rawY = oy + (cy - sy) / h;
      const snapX = Math.abs(rawX - 0.5) < SNAP_THRESHOLD;
      const snapY = Math.abs(rawY - 0.5) < SNAP_THRESHOLD;
      setSnapGuides({ x: snapX, y: snapY });
      update(id, {
        x: Math.max(0.02, Math.min(0.98, snapX ? 0.5 : rawX)),
        y: Math.max(0.01, Math.min(0.9, snapY ? 0.5 : rawY)),
      });
    };
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchMove = (e: TouchEvent) => { if (!dragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const end = () => { dragRef.current = null; setSnapGuides({ x: false, y: false }); };
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', end);
    };
  }, [update]);

  // ── Drag toolbar (reposition) ─────────────────────────────────────────────
  const toolbarDragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const toolbarOffsetRef = useRef(toolbarOffset);
  useEffect(() => { toolbarOffsetRef.current = toolbarOffset; }, [toolbarOffset]);

  const beginToolbarDrag = (cx: number, cy: number) => {
    toolbarDragRef.current = { sx: cx, sy: cy, ox: toolbarOffsetRef.current.x, oy: toolbarOffsetRef.current.y };
  };

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!toolbarDragRef.current) return;
      const { sx, sy, ox, oy } = toolbarDragRef.current;
      setToolbarOffset({ x: ox + (cx - sx), y: oy + (cy - sy) });
    };
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchMove = (e: TouchEvent) => { if (!toolbarDragRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const end = () => { toolbarDragRef.current = null; };
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', end);
    };
  }, []);

  // ── Resize (font size via bottom-right handle) ────────────────────────────
  const resizeRef = useRef<{ id: string; sx: number; sy: number; sf: number } | null>(null);

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!resizeRef.current) return;
      const { id, sx, sy, sf } = resizeRef.current;
      const sc = (displayWRef.current / canvasWidth) || 1;
      // Use sum of horizontal + vertical delta so dragging any direction resizes
      // correctly regardless of text alignment.
      const delta = ((cx - sx) + (cy - sy)) / (2 * sc);
      update(id, { fontSize: Math.max(16, Math.min(400, Math.round(sf + delta))) });
    };
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchMove = (e: TouchEvent) => { if (!resizeRef.current) return; e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const end = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', end);
    };
  }, [update, canvasWidth]);

  // Escape to deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click outside any overlay → deselect
  useEffect(() => {
    if (!selectedId) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e instanceof MouseEvent ? e.target : e.touches[0]?.target;
      if (containerRef.current && !containerRef.current.contains(target as Node)) {
        // Save typed text BEFORE any setState so we don't depend on onBlur
        // firing on a still-mounted element (timing is unreliable).
        const eId = editingIdRef.current;
        if (eId) {
          editSavedRef.current = true;
          const typed = liveEditTextRef.current.trim();
          const editOv = overlaysRef.current.find(o => o.id === eId);
          if (editOv) update(eId, { text: typed || editOv.text });
          liveEditTextRef.current = '';
        }
        setSelectedId(null);
        setEditingId(null);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('touchstart', onDown);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('touchstart', onDown);
    };
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      {/* ── Snap guides ── */}
      {snapGuides.x && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '50%', width: 1, background: 'rgba(124,58,237,0.65)', transform: 'translateX(-0.5px)', zIndex: 50 }}
        />
      )}
      {snapGuides.y && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: '50%', height: 1, background: 'rgba(124,58,237,0.65)', transform: 'translateY(-0.5px)', zIndex: 50 }}
        />
      )}

      {overlays.map(ov => {
        const isSelected = ov.id === selectedId;
        const isEditing = ov.id === editingId;
        const dfs = Math.max(8, ov.fontSize * scale);
        const align = ov.align ?? 'left';
        const toolbarBelow = ov.y < 0.18;
        const toolbarRight = ov.x > 0.5;

        return (
          <div
            key={ov.id}
            className="absolute"
            style={{
              left: `${ov.x * 100}%`,
              top: `${ov.y * 100}%`,
              zIndex: isSelected ? 30 : 20,
              pointerEvents: 'auto',
              transform: align === 'center'
                ? 'translateX(-50%)'
                : align === 'right'
                ? 'translateX(-100%)'
                : 'none',
            }}
          >
            {/* ── Toolbar ── */}
            {isSelected && (
              <div
                className={`absolute ${toolbarBelow ? 'top-full mt-2' : 'bottom-full mb-2'} ${toolbarRight ? 'right-0' : 'left-0'} bg-gray-900 rounded-xl shadow-2xl flex items-center gap-0.5 p-1.5 z-50`}
                style={{
                  transform: `translate(${toolbarOffset.x}px, ${toolbarOffset.y}px)`,
                  overflowX: 'auto',
                  overflowY: 'visible',
                  whiteSpace: 'nowrap',
                  // Cap to viewport width on mobile so toolbar is scrollable rather than cut off
                  maxWidth: 'calc(100vw - 32px)',
                  WebkitOverflowScrolling: 'touch',
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {/* ── Grip handle (drag toolbar) ── */}
                <div
                  className="flex items-center justify-center w-5 shrink-0 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing select-none"
                  title="Déplacer la barre"
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); beginToolbarDrag(e.clientX, e.clientY); }}
                  onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); beginToolbarDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                >
                  <svg className="w-3 h-4" viewBox="0 0 8 16" fill="currentColor">
                    <circle cx="2" cy="3.5" r="1.2"/><circle cx="6" cy="3.5" r="1.2"/>
                    <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
                    <circle cx="2" cy="12.5" r="1.2"/><circle cx="6" cy="12.5" r="1.2"/>
                  </svg>
                </div>

                <div className="w-px h-4 bg-gray-700 mx-0.5 shrink-0" />

                {/* ── Delete ── */}
                <button type="button" onClick={() => remove(ov.id)}
                  className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 shrink-0 transition-colors flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="w-px h-4 bg-gray-700 mx-0.5 shrink-0" />

                {/* ── Font family dropdown ── */}
                <select
                  value={ov.fontFamily}
                  onChange={(e) => update(ov.id, { fontFamily: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-2 py-1 shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500"
                  style={{ fontFamily: fontCss(ov.fontFamily) }}
                >
                  {OVERLAY_FONTS.map(f => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.css }}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <div className="w-px h-4 bg-gray-700 mx-0.5 shrink-0" />

                {/* ── Style ── */}
                <button type="button" onClick={() => update(ov.id, { bold: !ov.bold })}
                  className={`w-7 h-7 rounded-lg text-sm font-bold shrink-0 transition-colors ${ov.bold ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>B</button>
                <button type="button" onClick={() => update(ov.id, { italic: !ov.italic })}
                  className={`w-7 h-7 rounded-lg text-sm italic shrink-0 transition-colors ${ov.italic ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>I</button>
                <button type="button" onClick={() => update(ov.id, { underline: !ov.underline })}
                  className={`w-7 h-7 rounded-lg text-sm shrink-0 transition-colors ${ov.underline ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                  style={{ textDecoration: 'underline' }}>U</button>

                <div className="w-px h-4 bg-gray-700 mx-0.5 shrink-0" />

                {/* ── Alignment ── */}
                {(['left', 'center', 'right'] as const).map(a => (
                  <button key={a} type="button" onClick={() => update(ov.id, { align: a })}
                    className={`w-7 h-7 rounded-lg shrink-0 transition-colors flex items-center justify-center ${align === a ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    title={a === 'left' ? 'Gauche' : a === 'center' ? 'Centré' : 'Droite'}
                  >
                    {a === 'left' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="9" height="2" rx="1"/><rect x="1" y="10" width="12" height="2" rx="1"/><rect x="1" y="14" width="7" height="2" rx="1"/>
                      </svg>
                    )}
                    {a === 'center' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="6" width="9" height="2" rx="1"/><rect x="2" y="10" width="12" height="2" rx="1"/><rect x="4.5" y="14" width="7" height="2" rx="1"/>
                      </svg>
                    )}
                    {a === 'right' && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="6" width="9" height="2" rx="1"/><rect x="3" y="10" width="12" height="2" rx="1"/><rect x="8" y="14" width="7" height="2" rx="1"/>
                      </svg>
                    )}
                  </button>
                ))}

                <div className="w-px h-4 bg-gray-700 mx-0.5 shrink-0" />

                {/* ── Color picker ── */}
                <div className="relative shrink-0 flex items-center justify-center" title="Couleur du texte">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor: ov.color,
                      outline: ov.color === '#FFFFFF' ? '1px solid #4b5563' : 'none',
                    }}
                  />
                  <input
                    type="color"
                    value={ov.color}
                    onChange={(e) => update(ov.id, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                    title="Choisir une couleur"
                  />
                </div>

                {/* Quick swatches: white + black */}
                {['#FFFFFF', '#000000'].map(c => (
                  <button key={c} type="button" onClick={() => update(ov.id, { color: c })}
                    className="shrink-0 rounded-full border-2 transition-all"
                    style={{
                      width: 18, height: 18, backgroundColor: c,
                      borderColor: ov.color === c ? '#7c3aed' : 'transparent',
                      outline: c === '#FFFFFF' ? '1px solid #4b5563' : 'none',
                    }}
                  />
                ))}

                {/* Right padding spacer */}
                <div className="w-1 shrink-0" />
              </div>
            )}

            {/* ── Text box ── */}
            <div
              key={isEditing ? `e-${ov.id}` : `d-${ov.id}`}
              ref={isEditing ? (el) => {
                // Guard: only initialize on first mount of this edit session.
                // The inline arrow function creates a new reference on every render,
                // which would cause React to re-call this ref and reset innerText.
                // data-initialized prevents that reset on subsequent renders.
                if (!el || el.dataset.initialized === '1') return;
                el.dataset.initialized = '1';
                el.innerText = ov.text;
                el.focus();
                try {
                  const r = document.createRange();
                  r.selectNodeContents(el);
                  r.collapse(false);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(r);
                } catch { /* ignore */ }
              } : undefined}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onMouseDown={(e) => { e.stopPropagation(); if (!isEditing) beginDrag(ov.id, e.clientX, e.clientY); }}
              onTouchStart={(e) => { e.stopPropagation(); if (!isEditing) beginDrag(ov.id, e.touches[0].clientX, e.touches[0].clientY); }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(ov.id); }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                dragRef.current = null;
                editSavedRef.current = false;
                liveEditTextRef.current = '';
                setEditingId(ov.id);
              }}
              onInput={(e) => { liveEditTextRef.current = (e.currentTarget as HTMLElement).innerText; }}
              onBlur={(e) => {
                // If onDown already saved (click-outside case), skip to avoid double-save with stale ov.text
                if (!editSavedRef.current) {
                  const typed = (liveEditTextRef.current || e.currentTarget.innerText || '').trim();
                  update(ov.id, { text: typed || ov.text });
                  liveEditTextRef.current = '';
                }
                editSavedRef.current = false;
                setEditingId(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLElement).blur(); }}
              style={{
                fontSize: dfs,
                fontFamily: fontCss(ov.fontFamily),
                color: ov.color,
                fontWeight: ov.bold ? 'bold' : 'normal',
                fontStyle: ov.italic ? 'italic' : 'normal',
                textDecoration: ov.underline ? 'underline' : 'none',
                textAlign: align,
                outline: isEditing
                  ? '2px solid rgba(124,58,237,0.9)'
                  : isSelected
                  ? '2px dashed rgba(124,58,237,0.7)'
                  : 'none',
                outlineOffset: 4,
                padding: '2px 6px',
                cursor: isEditing ? 'text' : 'grab',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: isEditing ? 'text' : 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.55)',
                lineHeight: 1.25,
                touchAction: 'none',
                minWidth: dfs,
              }}
            >
              {!isEditing ? ov.text : undefined}
            </div>

            {/* ── Mobile edit hint ── */}
            {isSelected && !isEditing && isTouchDevice && (
              <div
                className="absolute top-full mt-1 left-1/2 pointer-events-none"
                style={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
              >
                <span className="text-[10px] font-medium text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Double-tap pour modifier
                </span>
              </div>
            )}

            {/* ── Resize handle ── */}
            {isSelected && (
              <div
                className="absolute bg-violet-600 border-2 border-white rounded-full shadow-lg"
                style={{ width: 14, height: 14, bottom: -7, right: -7, cursor: 'se-resize', zIndex: 40 }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); resizeRef.current = { id: ov.id, sx: e.clientX, sy: e.clientY, sf: ov.fontSize }; }}
                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); resizeRef.current = { id: ov.id, sx: e.touches[0].clientX, sy: e.touches[0].clientY, sf: ov.fontSize }; }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
