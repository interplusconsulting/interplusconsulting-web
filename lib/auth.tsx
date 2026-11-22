'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import type { Profile } from './types';

type AuthState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (current: Session | null) => {
    if (!current) { setProfile(null); return; }
    const { data } = await supabase().from('profiles').select('*').eq('id', current.user.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase().auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (active) setReady(true);
    });
    const { data: listener } = supabase().auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Defer the query so it does not run inside the auth callback.
      window.setTimeout(() => { void loadProfile(next); }, 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value: AuthState = {
    ready,
    session,
    profile,
    refreshProfile: () => loadProfile(session),
    signOut: async () => { await supabase().auth.signOut(); setSession(null); setProfile(null); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
