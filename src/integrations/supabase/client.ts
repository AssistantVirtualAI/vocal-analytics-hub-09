// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rzzywdulzfyycivwwfsd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3ZHVsemZ5eWNpdnd3ZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTA1OTQsImV4cCI6MjA2MDA2NjU5NH0.R7JxHxKM6ZM5iZD1n17e7BkavIPJEe_Qi00PNMP9a5M";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);