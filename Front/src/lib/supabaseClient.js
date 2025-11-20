// src/lib/supabaseClient.js
// IMPORTANT: polyfills must be imported before @supabase/supabase-js is imported.

import "react-native-get-random-values";         // provide crypto.getRandomValues
import "react-native-url-polyfill/auto";         // provides global URL and URLSearchParams

import { createClient } from "@supabase/supabase-js";

// read from env or hardcode for quick testing (do NOT commit service role key)
export const SUPABASE_URL = "https://tbcmqnfcdhpethzwpmga.supabase.co";         // e.g. https://xxx.supabase.co
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiY21xbmZjZGhwZXRoendwbWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjA3ODAsImV4cCI6MjA3OTE5Njc4MH0.1X64BZGLz4eMkWxDUhyTni1rwmtqnzNNGUDUptbC73Y"; // anon key

// create client for frontend (anon key)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }, // optional
});

export default supabase;
