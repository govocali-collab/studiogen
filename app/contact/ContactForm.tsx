'use client';

import { useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
}

const SUBJECTS = [
  'Question générale',
  'Problème technique',
  'Suggestion / Fonctionnalité',
  'Facturation',
  'Autre',
];

const MAX_FILES = 3;
const MAX_FILE_MB = 5;

const inputCls = 'w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-300 text-gray-800';

export default function ContactForm({ profile }: { profile: Profile }) {
  const [firstName, setFirstName] = useState(profile.first_name ?? '');
  const [lastName, setLastName] = useState(profile.last_name ?? '');
  const [businessName, setBusinessName] = useState(profile.business_name ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [hp, setHp] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter(f => f.type.startsWith('image/') && f.size <= MAX_FILE_MB * 1024 * 1024);
    if (valid.length < selected.length) {
      setError(`Seules les images de moins de ${MAX_FILE_MB} Mo sont acceptées.`);
    } else {
      setError('');
    }
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return;
    if (!subject || !message.trim()) { setError('Remplis tous les champs obligatoires.'); return; }
    if (!turnstileToken) { setError('Vérifie que tu n\'es pas un robot.'); return; }
    setSending(true);
    setError('');

    const fd = new FormData();
    fd.append('firstName', firstName.trim());
    fd.append('lastName', lastName.trim());
    fd.append('businessName', businessName.trim());
    fd.append('subject', subject);
    fd.append('message', message.trim());
    fd.append('cf-turnstile-response', turnstileToken);
    files.forEach(f => fd.append('files', f));

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi. Réessaie dans quelques instants.");
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur de connexion. Vérifie ta connexion internet et réessaie.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Message envoyé !</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Merci de nous avoir contactés. Nous allons répondre à ton message dans un délai de <strong className="text-gray-700">24 heures</strong>.
        </p>
        <button
          onClick={() => { setSent(false); setMessage(''); setSubject(''); setFiles([]); }}
          className="text-xs text-violet-600 hover:text-violet-800 font-medium mt-2"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5">

      {/* Honeypot */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={e => setHp(e.target.value)} />
      </div>

      {/* Nom / Prénom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prénom</label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="ex. Marie"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="ex. Tremblay"
            className={inputCls}
          />
        </div>
      </div>

      {/* Entreprise */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Entreprise <span className="text-gray-400 font-normal">(optionnel)</span></label>
        <input
          type="text"
          value={businessName}
          onChange={e => setBusinessName(e.target.value)}
          placeholder="ex. Salon Belle Vue"
          className={inputCls}
        />
      </div>

      {/* Courriel — lecture seule, c'est l'adresse de réponse */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Courriel</label>
        <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-500 select-all">
          {profile.email}
        </div>
      </div>

      {/* Sujet */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Sujet <span className="text-red-400">*</span>
        </label>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          className={`${inputCls} bg-white`}
        >
          <option value="">Sélectionne un sujet…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Décris ta question ou ton problème en détail…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Captures d'écran */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Captures d&apos;écran <span className="text-gray-400 font-normal">(optionnel · max {MAX_FILES} images · {MAX_FILE_MB} Mo chacune)</span>
        </label>
        {files.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une image
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 max-w-[200px]">
                <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="ml-0.5 text-gray-400 hover:text-red-500 shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
        options={{ theme: 'light', language: 'fr' }}
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending || !turnstileToken}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {sending ? 'Envoi en cours…' : 'Envoyer le message'}
      </button>
    </form>
  );
}
