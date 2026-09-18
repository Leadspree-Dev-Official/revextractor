import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isLive } from './supabase';
import { demoUser } from './demo';

export interface AuthUser {
  email: string;
  name: string;
  initials: string;
  role: string;
}

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  live: boolean;
  /** true when this account is a LeadBro platform admin, not just a workspace owner */
  isPlatformAdmin: boolean;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<string | null>;
  sendMagicLink(email: string): Promise<string | null>;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

const initialsOf = (value: string) =>
  value.replace(/@.*/, '').split(/[.\s_-]+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]!.toUpperCase()).join('') || 'LS';

const fromSession = (session: Session | null): AuthUser | null => {
  if (!session?.user) return null;
  const email = session.user.email ?? '';
  const name = (session.user.user_metadata?.full_name as string | undefined) ?? email.replace(/@.*/, '');
  return { email, name, initials: initialsOf(name || email), role: 'Owner' };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo mode signs in immediately — there is no account to create.
  const [user, setUser] = useState<AuthUser | null>(isLive ? null : demoUser);
  const [loading, setLoading] = useState(isLive);
  // Demo mode signs you in as the platform owner, so the console is visible.
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(!isLive);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(fromSession(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(fromSession(session));
      setLoading(false);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Platform-admin status comes from the database, never from a client claim.
  useEffect(() => {
    if (!supabase) return;              // demo mode keeps its seeded value
    if (!user) { setIsPlatformAdmin(false); return; }
    let alive = true;
    supabase.rpc('is_platform_admin').then(({ data }) => {
      if (alive) setIsPlatformAdmin(Boolean(data));
    });
    return () => { alive = false; };
  }, [user]);

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    live: isLive,
    isPlatformAdmin,
    async signIn(email, password) {
      if (!supabase) return null;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    async signUp(email, password) {
      if (!supabase) return null;
      const { error } = await supabase.auth.signUp({ email, password });
      return error?.message ?? null;
    },
    async sendMagicLink(email) {
      if (!supabase) return null;
      const { error } = await supabase.auth.signInWithOtp({ email });
      return error?.message ?? null;
    },
    async signOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  }), [user, loading, isPlatformAdmin]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
