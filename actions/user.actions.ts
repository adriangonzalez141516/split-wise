'use server';

import { getSupabaseServer } from '@/lib/supabase/server';

export interface UserProfile {
  id: string;
  name: string;
  nick: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export async function getCurrentUserAction(): Promise<UserProfile | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name,
      nick: profile.nick || profile.name, // Fallback to name if nick is empty
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
