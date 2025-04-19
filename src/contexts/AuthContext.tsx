// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: (User & { profile?: UserProfile; profileComplete?: boolean }) | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
  isPremium: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { profile?: UserProfile; profileComplete?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const handleAuthError = useCallback(async (error: Error) => {
    console.error('[AuthContext] Auth error:', error);
    if (error.message.includes('User from sub claim in JWT does not exist') ||
        error.message.includes('JWT expired') ||
        error.message.includes('Invalid JWT')) {
      try {
        await signOut();
        setUser(null);
      } catch (signOutError) {
        console.error('[AuthContext] Error during error cleanup:', signOutError);
      }
    }
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser: User) => {
    try {
      console.log('[AuthContext] Fetching user profile for:', sessionUser.id);
      const { user: currentUser, error } = await getCurrentUser();
      
      if (error) {
        console.error('[AuthContext] Error in fetchUserProfile:', error);
        await handleAuthError(error);
        return null;
      }

      if (!currentUser?.profile) {
        console.warn('[AuthContext] No profile found for user:', sessionUser.id);
      }

      return currentUser;
    } catch (error) {
      console.error('[AuthContext] Unexpected error in fetchUserProfile:', error);
      await handleAuthError(error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }, [handleAuthError]);

  const refreshProfile = useCallback(async () => {
    if (!initialized) {
      console.log('[AuthContext] Skipping refresh - not initialized');
      return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      await handleAuthError(sessionError);
      return;
    }
    
    if (!session?.user?.id) {
      console.log('[AuthContext] Cannot refresh profile - no active session');
      setUser(null);
      return;
    }
    
    console.log('[AuthContext] Starting profile refresh for user:', session.user.id);
    setLoading(true);
    try {
      const currentUser = await fetchUserProfile(session.user);
      if (currentUser) {
        console.log('[AuthContext] Setting updated user data:', {
          id: currentUser.id,
          hasProfile: !!currentUser.profile,
          profileComplete: currentUser.profileComplete
        });
        setUser(currentUser);
      } else {
        console.log('[AuthContext] No user data returned from refresh');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, handleAuthError, initialized]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (initialized) return;
      
      try {
        console.log('[AuthContext] Starting auth initialization');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          if (mounted) {
            await handleAuthError(sessionError);
          }
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('[AuthContext] Session found, fetching user profile');
          const currentUser = await fetchUserProfile(session.user);
          if (mounted && currentUser) {
            console.log('[AuthContext] Setting initial user data:', {
              id: currentUser.id,
              hasProfile: !!currentUser.profile,
              profileComplete: currentUser.profileComplete
            });
            setUser(currentUser);
          }
        } else {
          console.log('[AuthContext] No session found');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error in initialization:', error);
        if (mounted) {
          await handleAuthError(error instanceof Error ? error : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted || !initialized) return;

      console.log('[AuthContext] Auth state changed:', event, {
        hasSession: !!session,
        userId: session?.user?.id
      });

      // Handle auth state changes outside the callback
      setTimeout(async () => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || !session) {
          console.log('[AuthContext] User signed out or session ended');
          setUser(null);
          return;
        }

        if (session.user) {
          console.log('[AuthContext] Session updated, refreshing user profile');
          const currentUser = await fetchUserProfile(session.user);
          if (mounted && currentUser) {
            console.log('[AuthContext] Updated user profile after state change:', {
              id: currentUser.id,
              hasProfile: !!currentUser.profile,
              profileComplete: currentUser.profileComplete
            });
            setUser(currentUser);
          }
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, handleAuthError, initialized]);

  const handleSignOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out process');
      setLoading(true);
      await signOut();
      setUser(null);
      console.log('[AuthContext] Sign out completed');
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = useMemo(() => {
    if (!user?.profile?.premium_until) return false;
    return new Date(user.profile.premium_until) > new Date();
  }, [user?.profile?.premium_until]);

  const value = useMemo(() => ({
    user,
    loading,
    signOut: handleSignOut,
    refreshProfile,
    isPremium
  }), [user, loading, handleSignOut, refreshProfile, isPremium]);

  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
