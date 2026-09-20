'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ilznoggvvbepzoocbywx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XAeTrxwngA646iGgtv0Usg_GM8bzkN8';

export async function signUpAction(data: { email: string; password: string; name: string; nick: string; phone?: string }) {
  try {
    const { email, password, name, nick, phone } = data;
    const supabase = await getSupabaseServer();

    // Comprobamos si estamos logueados como anónimos
    const { data: currentUserData } = await supabase.auth.getUser();
    const isAnonymous = currentUserData.user?.is_anonymous;

    let authData;
    let authError;

    if (isAnonymous) {
      // Convertir cuenta anónima a cuenta permanente
      const result = await supabase.auth.updateUser({
        email,
        password,
      });
      authData = { user: result.data.user, session: null }; // updateUser no devuelve session de la misma forma, pero ya estamos logueados
      authError = result.error;
      
      if (!authError) {
        // En este caso, como ya tenemos sesión, podemos insertar el perfil con el cliente normal
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: result.data.user!.id,
            name,
            nick,
            email,
            phone,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          });
          
        if (profileError) {
          console.error('Error creando perfil en conversión anónima:', profileError);
          throw new Error('Error al guardar los datos del perfil.');
        }

        // Además, actualizar sala_members donde user_id sea este usuario, para cambiar is_virtual a false y actualizar el nombre
        await supabase
          .from('sala_members')
          .update({ is_virtual: false, name: nick, user_id: result.data.user!.id })
          .eq('user_id', result.data.user!.id);
          
        return { success: true, userId: result.data.user!.id, message: 'Cuenta convertida con éxito.' };
      }
    } else {
      // 1. Sign up normal
      const result = await supabase.auth.signUp({
        email,
        password,
      });
      authData = result.data;
      authError = result.error;

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario.');
      }

      const userId = authData.user.id;

      if (!authData.session) {
        return { 
          success: false, 
          message: '⚠️ Debes ir al panel de Supabase > Authentication > Providers > Email y DESACTIVAR "Confirm email". Si no, el perfil no se puede crear automáticamente.' 
        };
      }

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
    }

    if (authError) {
      throw new Error(authError.message);
    }
    
    return { success: false, message: 'Fallo inesperado al crear cuenta' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error desconocido' };
  }
}

export async function signInAction(data: { email: string; password: string }) {
  try {
    const { email, password } = data;
    const supabase = await getSupabaseServer();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message === 'Invalid login credentials') {
        throw new Error('Credenciales incorrectas');
      }
      throw new Error(authError.message);
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    return { success: false, message: error.message || 'Credenciales incorrectas' };
  }
}

export async function signInGuestAction(nick: string) {
  try {
    const supabase = await getSupabaseServer();
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la sesión de invitado.');
    }

    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session!.access_token}`,
        },
      },
    });

    // We can also create a profile for the guest so they appear normal
    await authenticatedSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: nick,
        nick: nick,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nick)}&background=random`,
      });

    return { success: true, user: authData.user };
  } catch (error: any) {
    return { success: false, message: error.message || 'No se pudo entrar como invitado. Verifica que "Anonymous Sign-Ins" esté activo en Supabase.' };
  }
}

export async function signOutAction() {
  try {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
