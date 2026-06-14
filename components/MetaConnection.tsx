'use client';

import { useEffect, useState } from 'react';

interface MetaStatus {
  connected: boolean;
  facebookPageName?: string;
  facebookPageId?: string;
  instagramUsername?: string;
  instagramId?: string;
  connectedAt?: string;
  availablePages?: { id: string; name: string; instagram_business_account?: { id: string; username: string } }[];
}

export default function MetaConnection() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [switchingPage, setSwitchingPage] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/meta/status')
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Pick up success/error from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_success')) {
      window.history.replaceState({}, '', window.location.pathname + '?tab=connexions');
    }
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter ton compte Facebook / Instagram ?')) return;
    setDisconnecting(true);
    await fetch('/api/meta/disconnect', { method: 'DELETE' });
    setDisconnecting(false);
    load();
  };

  const handleSelectPage = async (pageId: string) => {
    setSwitchingPage(true);
    await fetch('/api/meta/select-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId }),
    });
    setSwitchingPage(false);
    load();
  };

  if (loading) {
    return <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          {/* Facebook icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Facebook & Instagram</h3>
            <p className="text-xs text-gray-400">Publication directe depuis le studio</p>
          </div>
          {status?.connected && (
            <span className="ml-auto text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
              Connecté
            </span>
          )}
        </div>

        {!status?.connected ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Connecte ta Page Facebook et ton compte Instagram Business pour publier directement depuis StudioGen, sans copier-coller.
            </p>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {['Publication immédiate ou planifiée', 'Facebook + Instagram en un clic', 'Ton texte et ton image envoyés automatiquement'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-violet-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="/api/meta/auth"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Connecter avec Facebook
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected accounts */}
            <div className="space-y-2">
              {status.facebookPageName && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900">{status.facebookPageName}</p>
                    <p className="text-[10px] text-blue-500">Page Facebook</p>
                  </div>
                </div>
              )}
              {status.instagramUsername ? (
                <div className="flex items-center gap-3 bg-fuchsia-50 border border-fuchsia-100 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-fuchsia-900">@{status.instagramUsername}</p>
                    <p className="text-[10px] text-fuchsia-500">Instagram Business</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Aucun Instagram Business détecté</p>
                    <p className="text-[10px] text-gray-400">Lie ton Instagram à ta Page Facebook dans Meta Business Suite</p>
                  </div>
                </div>
              )}
            </div>

            {/* Page switcher if multiple pages available */}
            {(status.availablePages?.length ?? 0) > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Changer de Page :</p>
                <div className="space-y-1.5">
                  {status.availablePages!.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPage(p.id)}
                      disabled={switchingPage || p.id === status.facebookPageId}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        p.id === status.facebookPageId
                          ? 'border-blue-300 bg-blue-50 text-blue-800 cursor-default'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      {p.id === status.facebookPageId ? '✓ ' : ''}{p.name}
                      {p.instagram_business_account && (
                        <span className="ml-1.5 text-[10px] text-fuchsia-500">+ Instagram</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Déconnexion…' : 'Déconnecter le compte'}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Tes identifiants Meta sont stockés de façon sécurisée et ne sont jamais partagés.
      </p>
    </div>
  );
}
