'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ilznoggvvbepzoocbywx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XAeTrxwngA646iGgtv0Usg_GM8bzkN8';

// Create a server client (using anon key for now, we should ideally use service role for bypassing RLS on user creation, 
// but Supabase auth handles profile creation if we hook into it, or we insert it manually).
// For the sake of simplicity, we'll use the anon client.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUpAction(data: { email: string; password: string; name: string; nick: string; phone?: string }) {
  try {
    const { email, password, name, nick, phone } = data;

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario.');
    }

    const userId = authData.user.id;

    // Si Supabase no devuelve sesión, significa que la confirmación de email está ACTIVA
    // y no podemos insertar el perfil sin un Service Role Key o un Trigger de BD.
    if (!authData.session) {
      return { 
        success: false, 
        message: '⚠️ Debes ir al panel de Supabase > Authentication > Providers > Email y DESACTIVAR "Confirm email". Si no, el perfil no se puede crear automáticamente.' 
      };
    }

    // 2. Insert the user profile into public.profiles usando el token de la sesión recién creada
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      },
    });

    const { error: profileError } = await authenticatedSupabase
      .from('profiles')
      .upsert({
        id: userId,
        name,
        nick,
        email,
        phone,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      });

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      throw new Error('Error al guardar los datos del perfil.');
    }

    return { success: true, userId, message: 'Cuenta creada con éxito.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error desconocido' };
  }
}

export async function signInAction(data: { email: string; password: string }) {
  try {
    const { email, password } = data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    return { success: false, message: error.message || 'Credenciales incorrectas' };
  }
}
