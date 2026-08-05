import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ylxshybjrvbdmiozajxo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseHNoeWJqcnZiZG1pb3phanhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzE1NDgsImV4cCI6MjEwMTQwNzU0OH0._bM3JFcIlwNbO1mmZ2j86ikA6q6HKyZ0iuR8iYllM8Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
