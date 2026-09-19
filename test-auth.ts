import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilznoggvvbepzoocbywx.supabase.co';
const supabaseAnonKey = 'sb_publishable_XAeTrxwngA646iGgtv0Usg_GM8bzkN8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test User';
  
  console.log('1. Signing up user:', email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  if (!authData.session) {
    console.error('No session returned. Email confirmation is probably ON.');
    return;
  }
  console.log('User signed up successfully. UID:', authData.user?.id);

  const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });

  console.log('2. Upserting into profiles...');
  const { data, error: profileError } = await authenticatedSupabase
    .from('profiles')
    .upsert({
      id: authData.user?.id,
      name,
      email,
    })
    .select();

  if (profileError) {
    console.error('Profile Error Details:', JSON.stringify(profileError, null, 2));
  } else {
    console.log('Profile created successfully!', data);
  }
}

test();
