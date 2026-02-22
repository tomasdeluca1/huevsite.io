const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

async function check() {
  const { data, error } = await supabase.from('blocks').select('*');
  console.log("Blocks:", data.map(b => ({id: b.id, type: b.type, data: b.data})));
}

check();
