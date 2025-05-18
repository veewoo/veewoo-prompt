'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[AuthContext] onAuthStateChange event:', _event);
        console.log('[AuthContext] Session from onAuthStateChange:', session);
        
        if (session) {
          console.log('[AuthContext] User from session:', session.user);
          // Attempt to log cookies from the client-side
          // Note: document.cookie only provides access to non-HttpOnly cookies.
          // Supabase auth cookies are HttpOnly, so they won't be visible here directly.
          // However, the act of logging in *should* have set them.
          console.log('[AuthContext] Current document.cookie (client-side, HttpOnly cookies not visible):', document.cookie);
        } else {
          console.log('[AuthContext] No session from onAuthStateChange.');
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Or a specific callback page
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
    // setLoading(false) will be handled by onAuthStateChange or if there's an immediate error
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      setLoading(false);
    }
    // setUser and setSession will be updated by onAuthStateChange
    // setLoading(false) will be handled by onAuthStateChange
  };

  return (
    <AuthContext.Provider value={{ session, user, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
