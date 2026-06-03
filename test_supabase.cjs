const { createClient } = require('@supabase/supabase-js');

const url = 'https://geodrldzzyzfppczimok.supabase.co';
const key = 'sb_publishable_p6akiT90rlerBz0jDF6z8Q_QmAnpULM';
const supabase = createClient(url, key);

async function testCreateUser() {
  console.log('Testing createUser...');
  const username = 'test_user_' + Date.now();
  const email = username + '@gmail.com'; // Use gmail.com instead of se2026.bps.go.id
  const password = 'password123';

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        nama_lengkap: 'Test User name',
        peran: 'PPL',
      },
    },
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  console.log('Auth user created successfully:', authData.user?.id);
}

testCreateUser();
