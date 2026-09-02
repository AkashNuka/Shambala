const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('project_id', '10000000-0000-0000-0000-000000000000');
    
  console.log(data);
}

check();
