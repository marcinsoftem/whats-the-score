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
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));

  // Let's also check if we can query by email if it exists
  const { data: q1 } = await supabase.from('profiles').select('*').eq('email', 'marcin@softem.pl');
  console.log("Email query:", q1);
  const { data: q2 } = await supabase.from('profiles').select('*').eq('nickname', 'Marcin Mikłas');
  console.log("Nickname query:", q2);
}
run();
