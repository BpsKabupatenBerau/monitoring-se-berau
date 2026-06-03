const { createClient } = require('@supabase/supabase-js');

const url = 'https://geodrldzzyzfppczimok.supabase.co';
const key = 'sb_publishable_p6akiT90rlerBz0jDF6z8Q_QmAnpULM';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('pengguna').insert({
    id:               'admin', // Non-UUID!
    legacy_id:        'admin',
    username:         'admin',
    nama_lengkap:     'Admin BPS Berau',
    email:            'admin@se2026.bps.go.id',
    peran:            'ADMIN',
    status:           'AKTIF',
  });
  if (error) {
    console.error('Error inserting admin user:', error);
  } else {
    console.log('Success:', data);
  }
}

run();
