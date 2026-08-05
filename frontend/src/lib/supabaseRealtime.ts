import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ylxshybjrvbdmiozajxo.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseHNoeWJqcnZiZG1pb3phanhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzE1NDgsImV4cCI6MjEwMTQwNzU0OH0._bM3JFcIlwNbO1mmZ2j86ikA6q6HKyZ0iuR8iYllM8Q';

export const supabaseRealtime = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
