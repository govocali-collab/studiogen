'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarPost } from '@/lib/supabase/types';

// ── Couleurs et labels par type de contenu ────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'formation':        { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  'résultats clients':{ bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'produit':          { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  'engagement':       { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  'éducatif':         { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500'    },
  'promo':            { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
};
const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

const CONTENT_TYPES = ['formation', 'résultats clients', 'produit', 'engagement', 'éducatif', 'promo'];

const PLATFORM_LABEL: Record<string, string> = { fb: 'Facebook', ig: 'Instagram' };

function typeColor(ct: string) { return TYPE_COLORS[ct] ?? DEFAULT_COLOR; }

function toLocalDate(iso: string) {
  // 'YYYY-MM-DD' → local Date (midnight)
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateFr(iso: string) {
  return toLocalDate(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Mois en français ──────────────────────────────────────────────────────────
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

// ── Calendrier grille mensuelle ───────────────────────────────────────────────
function MonthGrid({ year, month, posts, onDayClick, onDropPost }: {
  year: number;
  month: number;
  posts: CalendarPost[];
  onDayClick: (post: CalendarPost) => void;
  onDropPost: (postId: string, newDate: string) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Refs for touch drag (avoid stale closures in event listeners)
  const touchDragIdRef = useRef<string | null>(null);
  const dragOverDateRef = useRef<string | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const onDropPostRef = useRef(onDropPost);
  useEffect(() => { onDropPostRef.current = onDropPost; }, [onDropPost]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const postsByDay: Record<number, CalendarPost[]> = {};
  for (const p of posts) {
    const d = toLocalDate(p.scheduled_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(p);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // ── Touch drag handlers ────────────────────────────────────────────────────
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchDragIdRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];

    if (ghostRef.current) {
      ghostRef.current.style.left = `${touch.clientX - 48}px`;
      ghostRef.current.style.top  = `${touch.clientY - 28}px`;
      ghostRef.current.style.display = 'none';
    }
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (ghostRef.current) ghostRef.current.style.display = '';

    const cell = el?.closest('[data-date]');
    const date = cell?.getAttribute('data-date') ?? null;
    if (date !== dragOverDateRef.current) {
      dragOverDateRef.current = date;
      setDragOverDate(date);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const postId = touchDragIdRef.current;
    const date   = dragOverDateRef.current;
    touchDragIdRef.current  = null;
    dragOverDateRef.current = null;

    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
    setDraggingId(null);
    setDragOverDate(null);

    if (postId && date) onDropPostRef.current(postId, date);
  }, []);

  useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend',  handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend',  handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const startTouchDrag = (e: React.TouchEvent, p: CalendarPost) => {
    e.stopPropagation();
    touchDragIdRef.current = p.id;
    setDraggingId(p.id);

    const touch = e.touches[0];
    const isFb  = p.platform === 'fb';
    const ghost = document.createElement('div');
    ghost.style.cssText = [
      'position:fixed', 'z-index:9999', 'pointer-events:none',
      `left:${touch.clientX - 48}px`, `top:${touch.clientY - 28}px`,
      'width:96px', 'padding:6px 8px', 'border-radius:10px',
      'font-size:11px', 'font-weight:700', 'text-align:center',
      'box-shadow:0 8px 24px rgba(0,0,0,0.25)', 'opacity:0.92',
      isFb ? 'background:#eff6ff;border:2px solid #3b82f6;color:#1d4ed8'
           : 'background:#fff1f2;border:2px solid #ef4444;color:#b91c1c',
    ].join(';');
    ghost.textContent = isFb ? 'FB' : 'IG';
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  };

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 mb-1">
        {JOURS_FR.map(j => (
          <div key={j} className="text-center text-xs font-semibold text-gray-400 py-1">{j}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="bg-white min-h-[110px]" />;
          const cellDate = new Date(year, month, day);
          cellDate.setHours(0, 0, 0, 0);
          const isToday   = cellDate.getTime() === today.getTime();
          const dayPosts  = postsByDay[day] ?? [];
          const iso       = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isDragOver = dragOverDate === iso;

          return (
            <div
              key={day}
              data-date={iso}
              className={`bg-white min-h-[110px] p-1.5 flex flex-col gap-1 transition-colors
                ${isDragOver ? 'bg-violet-50 ring-2 ring-inset ring-violet-400' : 'hover:bg-gray-50/60'}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(iso); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDate(null); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDate(null);
                setDraggingId(null);
                const id = e.dataTransfer.getData('postId');
                if (id) onDropPost(id, iso);
              }}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full self-start ${isToday ? 'bg-violet-600 text-white' : 'text-gray-500'}`}>
                {day}
              </span>
              {isDragOver && draggingId && (
                <div className="text-[10px] text-violet-500 font-medium text-center py-1">Déposer ici</div>
              )}
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayPosts.slice(0, 3).map(p => {
                  const isFb      = p.platform === 'fb';
                  const c         = typeColor(p.content_type);
                  const isDragging = draggingId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('postId', p.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingId(p.id);
                      }}
                      onDragEnd={() => { setDraggingId(null); setDragOverDate(null); }}
                      onTouchStart={(e) => startTouchDrag(e, p)}
                      onClick={() => !draggingId && onDayClick(p)}
                      className={`w-full text-left rounded-md px-1.5 py-1 flex flex-col gap-0.5 cursor-grab active:cursor-grabbing transition-all
                        ${isDragging ? 'opacity-40 scale-95' : 'hover:opacity-80'}
                        ${isFb ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}
                      `}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFb ? 'bg-blue-500' : 'bg-red-500'}`} />
                        <span className={`text-[10px] font-bold leading-none ${isFb ? 'text-blue-700' : 'text-red-700'}`}>
                          {isFb ? 'FB' : 'IG'}
                        </span>
                        <span className={`text-[10px] font-medium leading-none capitalize truncate ${c.text}`}>
                          {p.content_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight line-clamp-2 text-left">
                        {p.content.slice(0, 60)}
                      </p>
                    </button>
                  );
                })}
                {dayPosts.length > 3 && (
                  <span className="text-[10px] text-gray-400 px-1 font-medium">+{dayPosts.length - 3} autres</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal de détail ───────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose, onDelete }: {
  post: CalendarPost;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const c = typeColor(post.content_type);

  const [imageExpanded, setImageExpanded] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadImage = async () => {
    if (!post.image_url) return;
    const res = await fetch(post.image_url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-${post.scheduled_date}-${post.platform}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async () => {
    setDeleting(true);
    await fetch(`/api/calendar/${post.id}`, { method: 'DELETE' });
    onDelete(post.id);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
              {post.content_type}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.platform === 'fb' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
              {PLATFORM_LABEL[post.platform]}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date */}
          <p className="text-xs text-gray-400 font-medium">{formatDateFr(post.scheduled_date)}</p>

          {/* Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden border border-gray-100 relative group cursor-pointer" onClick={() => setImageExpanded(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt="Collage" className="w-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Agrandir
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
            {post.content}
          </pre>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copy}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${copied ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
            >
              {copied ? '✓ Copié' : 'Copier le texte'}
            </button>
            {post.image_url && (
              <button
                onClick={downloadImage}
                className="py-2 px-4 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Image
              </button>
            )}
            <button
              onClick={del}
              disabled={deleting}
              className="py-2 px-4 rounded-xl text-sm font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? '…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Image plein écran */}
    {imageExpanded && post.image_url && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setImageExpanded(false)}>
        <button className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image_url} alt="Collage" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        <button
          onClick={(e) => { e.stopPropagation(); downloadImage(); }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Télécharger
        </button>
      </div>
    )}
    </>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function CalendrierClient({ isPro = false }: { isPro?: boolean }) {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendrier' | 'liste'>('calendrier');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPlatform, setFilterPlatform] = useState<'fb' | 'ig' | ''>('');
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);

  // Calendar navigation
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/calendar');
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setSelectedPost(null);
  };

  const handleDropPost = async (postId: string, newDate: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduled_date: newDate } : p));
    const res = await fetch(`/api/calendar/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_date: newDate }),
    });
    if (!res.ok) {
      // Revert on failure
      fetchPosts();
    }
  };

  const filtered = posts.filter(p =>
    (!filterType || p.content_type === filterType) &&
    (!filterPlatform || p.platform === filterPlatform)
  );

  // List: grouped by date descending
  const listPosts = [...filtered].sort((a, b) =>
    new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
  );

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const nav = (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/studio">
          <Image src="/logo-black.png" alt="StudioGen" width={180} height={36} className="h-9 w-auto" priority />
        </Link>
        <Link href="/studio" className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
          ← Retour au studio
        </Link>
      </div>
    </header>
  );

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50">
        {nav}
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto text-3xl">📅</div>
          <h1 className="text-xl font-bold text-gray-900">Calendrier de contenu</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Planifiez vos publications à l'avance, visualisez votre mois d'un coup d'oeil et gardez une longueur d'avance sur votre contenu.
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-left space-y-2">
            {['Calendrier mensuel interactif', 'Vue liste avec filtres par type', 'Image du collage jointe', 'Historique 90 jours'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-violet-500 font-bold">✓</span> {f}
              </div>
            ))}
          </div>
          <Link href="/billing" className="inline-block bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
            Passer au plan Pro →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      {nav}

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Title + view toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Calendrier de contenu</h1>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['calendrier', 'liste'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${view === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {v === 'calendrier' ? '📅 Calendrier' : '☰ Liste'}
              </button>
            ))}
          </div>
        </div>

        {/* Filter by platform */}
        <div className="flex gap-1.5">
          {([['', 'Tous'], ['fb', 'Facebook'], ['ig', 'Instagram']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterPlatform(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filterPlatform === val ? (val === 'fb' ? 'bg-blue-600 text-white border-blue-600' : val === 'ig' ? 'bg-rose-500 text-white border-rose-500' : 'bg-violet-600 text-white border-violet-600') : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter by content type */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!filterType ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
          >
            Tous
          </button>
          {CONTENT_TYPES.map(ct => {
            const c = typeColor(ct);
            const active = filterType === ct;
            return (
              <button
                key={ct}
                onClick={() => setFilterType(active ? '' : ct)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize ${active ? `${c.bg} ${c.text} border-transparent` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                {ct}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="w-6 h-6 text-violet-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          </div>
        ) : view === 'calendrier' ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-bold text-gray-900">{MOIS_FR[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <MonthGrid year={calYear} month={calMonth} posts={filtered} onDayClick={setSelectedPost} onDropPost={handleDropPost} />
          </div>
        ) : (
          /* ── Vue liste ── */
          <div className="space-y-2">
            {listPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <p className="text-sm text-gray-400">Aucun post planifié.</p>
                <Link href="/studio" className="mt-3 inline-block text-xs font-semibold text-violet-600 hover:text-violet-800">
                  Créer un post dans le studio →
                </Link>
              </div>
            ) : listPosts.map(p => {
              const c = typeColor(p.content_type);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPost(p)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 hover:border-violet-300 hover:shadow-sm transition-all text-left"
                >
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  )}
                  {!p.image_url && (
                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${c.bg}`}>
                      <span className="text-lg">{p.platform === 'fb' ? '📘' : '📸'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${c.bg} ${c.text}`}>{p.content_type}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.platform === 'fb' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {PLATFORM_LABEL[p.platform]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 truncate leading-snug">{p.content.slice(0, 100)}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                      {toLocalDate(p.scheduled_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
