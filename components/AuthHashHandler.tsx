'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthHashHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const search = window.location.search;
    const hasToken = hash.includes('access_token=');
    const codeParam = new URLSearchParams(search).get('code');

    if (!hasToken && !codeParam) return;

    const supabase = createClient();

    if (codeParam) {
      supabase.auth.exchangeCodeForSession(codeParam).then(({ error }) => {
        if (!error) window.location.replace('/studio');
      });
      return;
    }

    // Implicit flow via hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        window.location.replace('/studio');
      }
    });
    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
