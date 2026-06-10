'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthHashHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash.includes('access_token=')) return;

    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        window.location.replace('/studio');
      }
    });

    // Trigger session detection from URL hash
    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
