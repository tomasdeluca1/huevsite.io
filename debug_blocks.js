const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=(.*)/)[1];

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('blocks').select('*');
  if (error) {
    console.error("Error fetching blocks:", error);
  } else {
    console.log(JSON.stringify(data.map(b => ({id: b.id, type: b.type, user: b.user_id, data: b.data})), null, 2));
  }
}
check();
