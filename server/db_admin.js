// server/db_admin.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("\n❌ Missing Supabase admin environment variables!");
  console.error("📝 Please create a .env file in the server directory with:");
  console.error("   SUPABASE_URL=your_supabase_project_url");
  console.error("   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key");
  console.error("\n💡 Copy .env.example to .env and fill in your values\n");
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export default supabaseAdmin;