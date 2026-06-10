'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthHashHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.includes('access_token=')) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (!error) window.location.href = '/studio';
      });
  }, []);

  return null;
}
