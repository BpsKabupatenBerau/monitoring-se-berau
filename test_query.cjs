const { createClient } = require('@supabase/supabase-js');

const url = 'https://geodrldzzyzfppczimok.supabase.co';
const key = 'sb_publishable_p6akiT90rlerBz0jDF6z8Q_QmAnpULM';
const supabase = createClient(url, key);

async function run() {
  for (const table of ['pengguna', 'plot_wilayah', 'laporan_harian', 'kendala_lapangan']) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else {
      console.log(`Table ${table} has ${count} rows`);
    }
  }
}

run();
