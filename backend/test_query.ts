import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ylxshybjrvbdmiozajxo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseHNoeWJqcnZiZG1pb3phanhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzE1NDgsImV4cCI6MjEwMTQwNzU0OH0._bM3JFcIlwNbO1mmZ2j86ikA6q6HKyZ0iuR8iYllM8Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase.from('teams').select('id, event_id, team_name, slot_id, registered_at, slots(slot_code)');
  console.log("Error:", error);
  console.log("Data:", data);
}

testQuery();
