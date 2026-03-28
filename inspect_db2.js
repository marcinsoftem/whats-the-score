const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key.trim()] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1).eq('type', 'real');
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));

  // Also query nickname directly
  const { data: qs, error: qsError } = await supabase.from('profiles').select('*').ilike('nickname', 'marcin%');
  console.log("Marcin profiles:", JSON.stringify(qs, null, 2));
}
run();
