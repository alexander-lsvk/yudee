import { supabase } from './supabase';

export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms',
    },
  });
  
  if (error) {
    throw error;
  }
  return { data, error: null };
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  
  if (error) {
    throw error;
  }
  return { data, error: null };
}

export async function signOut() {
  try {
    // Clear storage first to prevent any race conditions
    localStorage.clear();
    sessionStorage.clear();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] Sign out error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Auth] Unexpected error during sign out:', error);
    // Storage is already cleared, just throw the error
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { user: null, error: sessionError };
    }

    if (!session) {
      return { user: null, error: new Error('No active session') };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // If user doesn't exist, ensure we clean up
      if (userError.message.includes('User from sub claim in JWT does not exist')) {
        await signOut();
      }
      return { user: null, error: userError };
    }
    
    if (!user) {
      return { user: null, error: new Error('No authenticated user found') };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profileError) {
      return { user: null, error: profileError };
    }

    // Return the user even if profile is not found
    return { 
      user: { 
        ...user, 
        profile: profile || undefined,
        profileComplete: !!profile?.name && !profile.name.startsWith('Agent #')
      }, 
      error: null 
    };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

function generateAgentNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getUniqueAgentName(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const agentNumber = generateAgentNumber();
      const agentName = `Agent #${agentNumber}`;

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', agentName)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Error checking agent name:', error);
        attempts++;
        continue;
      }

      if (!data) {
        return agentName;
      }

      attempts++;
    } catch (error) {
      console.error('[Auth] Unexpected error in getUniqueAgentName:', error);
      attempts++;
    }
  }

  // If we couldn't find a unique number after max attempts,
  // use timestamp to ensure uniqueness
  return `Agent #${Date.now().toString().slice(-6)}`;
}

export async function createProfile(phone: string, name?: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('Auth session missing!');
    }

    if (!session) {
      throw new Error('No active session');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error('Failed to get user');
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      // If profile exists and name is provided, update it
      if (name) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ name })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return { profile: updatedProfile, error: null };
      }
      return { profile: existingProfile, error: null };
    }

    // Generate default agent name if none provided
    const defaultName = name || await getUniqueAgentName();

    // Create profile with generated name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        phone,
        name: defaultName
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error('Failed to create profile');
    }

    return { profile, error: null };
  } catch (error) {
    console.error('[Auth] Error creating profile:', error);
    return { 
      profile: null, 
      error: error instanceof Error ? error : new Error('Failed to create profile') 
    };
  }
}

interface UpdateProfileParams {
  name: string;
  line_id?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(userId: string, params: UpdateProfileParams) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: params.name,
        line_id: params.line_id,
        avatar_url: params.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error('[Auth] Error updating profile:', error);
    return {
      profile: null,
      error: error instanceof Error ? error : new Error('Failed to update profile')
    };
  }
}