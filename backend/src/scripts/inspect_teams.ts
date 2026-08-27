import { supabase } from '../services/supabaseClient';

async function checkTeams() {
  const { data, error } = await supabase.from('teams').select('*');
  console.log('Teams query error:', error);
  console.log('Teams query data:', data);
}

checkTeams().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
