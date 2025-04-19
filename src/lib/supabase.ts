import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the Supabase client with enhanced session handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      // Use local storage for session persistence with error handling
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling for fetch operations
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    if (!response.ok) {
      // Handle auth-specific errors
      if (response.status === 401 || response.status === 403) {
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            // Clear any invalid session data and force sign out
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
          }
        }, 0);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    // If it's an auth error, ensure we clean up properly
    if (error instanceof Error && 
        (error.message.includes('User from sub claim in JWT does not exist') ||
         error.message.includes('JWT expired') ||
         error.message.includes('Invalid JWT'))) {
      setTimeout(async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
      }, 0);
    }
    throw error;
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Use setTimeout to avoid deadlocks
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
    }, 0);
  }
});