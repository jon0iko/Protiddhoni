import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwkvsvhpmwzhxvodtkfp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a3ZzdmhwbXd6aHh2b2R0a2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTg3ODgsImV4cCI6MjA3NTMzNDc4OH0.eMlZf-plSVEm7qClLcAcbrJLM-8U20wb33lAaNXogB0';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
