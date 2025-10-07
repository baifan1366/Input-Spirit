/**
 * useAuth Hook
 * Manages authentication state and provides auth functions
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { 
  signUp, 
  signIn, 
  signOut, 
  signInWithOAuth,
  getCurrentUser,
  onAuthStateChange 
} from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    // Get initial session
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Listen for auth changes
    const subscription = onAuthStateChange((user, session) => {
      setUser(user);
      setSession(session);
      setLoading(false);

      // Notify Electron main process about auth state change
      if (typeof window !== 'undefined' && window.electronAPI) {
        if (user) {
          window.electronAPI.send('auth-state-changed', { 
            event: 'SIGNED_IN', 
            userId: user.id 
          });
        } else {
          window.electronAPI.send('auth-state-changed', { 
            event: 'SIGNED_OUT' 
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const handleSignUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { error } = await signUp(email, password, displayName);
    return { error };
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return { error };
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const { error } = await signInWithOAuth('google');
    return { error: error || null };
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    const { error } = await signInWithOAuth('github');
    return { error: error || null };
  }, []);

  const handleSignOut = useCallback(async () => {
    const { error } = await signOut();
    return { error: error || null };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGithub: handleSignInWithGithub,
    signOut: handleSignOut,
    isConfigured: configured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
