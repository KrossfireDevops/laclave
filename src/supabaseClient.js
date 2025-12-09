// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cucogkhwxgdbgkmlnetq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y29na2h3eGdkYmdrbWxuZXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzUwMjQsImV4cCI6MjA3ODcxMTAyNH0.GuYfWSUtguAXeyxjLxg3tPp80DvXpLBdqhLlPFPgRCM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})