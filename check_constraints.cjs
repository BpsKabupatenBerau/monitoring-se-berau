const { createClient } = require('@supabase/supabase-js');

const url = 'https://geodrldzzyzfppczimok.supabase.co';
const key = 'sb_publishable_p6akiT90rlerBz0jDF6z8Q_QmAnpULM';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'pengguna' });
  // If rpc is not available, we can query it via postgrest read from pg_catalog or information_schema?
  // Let's try querying information_schema.columns directly via postgrest if allowed, or check what error we get.
  
  // Let's try a custom select from pg_catalog.pg_policies or information_schema.columns:
  // Note: standard postgrest doesn't allow querying information_schema unless it's exposed in the API schema.
  // Let's run a query to check if we can read information_schema.columns.
  const { data: cols, error: err } = await supabase.from('pengguna').select('*').limit(1);
  console.log('Columns in pengguna (keys of empty row):', cols, err);
}

run();
