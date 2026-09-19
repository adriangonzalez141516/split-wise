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

export async function updateUserProfileAction(data: { nick: string; phone: string }) {
  try {
    const supabase = await getSupabaseServer();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData?.user) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nick: data.nick,
        phone: data.phone,
      })
      .eq('id', userData.user.id);

    if (error) {
      console.error('Error al actualizar el perfil:', error);
      return { success: false, message: 'Error al guardar los cambios en la base de datos' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Exception en update profile:', error);
    return { success: false, message: error.message || 'Error inesperado' };
  }
}
