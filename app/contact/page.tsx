'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { createClient } from '@/lib/supabase/client';
import ContactForm from './ContactForm';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
}

export default function ContactPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, business_name')
        .eq('id', user.id)
        .single();
      setProfile({
        first_name: (data as { first_name?: string | null } | null)?.first_name ?? null,
        last_name: (data as { last_name?: string | null } | null)?.last_name ?? null,
        business_name: (data as { business_name?: string | null } | null)?.business_name ?? null,
        email: user.email ?? null,
      });
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Aide & Support</h1>
          <p className="text-sm text-gray-500 mt-1">Une question, un problème ou une suggestion ? Écris-nous.</p>
        </div>
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
          </div>
        ) : profile ? (
          <ContactForm profile={profile} />
        ) : null}
      </div>
    </div>
  );
}
