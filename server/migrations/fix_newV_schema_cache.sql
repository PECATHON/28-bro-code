-- ============================================
-- FIX: Refresh Supabase Schema Cache for newV table
-- Run this if you get "Could not find the table 'public.newV' in the schema cache"
-- ============================================

-- Step 1: Verify the table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'newV' AND table_schema = 'public';

-- Step 2: Grant necessary permissions (if not already granted)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.newV TO anon, authenticated, service_role;

-- Step 3: Refresh the PostgREST schema cache
-- This is done automatically, but you can trigger it by:
-- Option A: Restart your Supabase project (in dashboard: Settings > General > Restart)
-- Option B: Make a small change to trigger cache refresh (add a comment column temporarily)
ALTER TABLE newV ADD COLUMN IF NOT EXISTS _cache_refresh TEXT;
ALTER TABLE newV DROP COLUMN IF EXISTS _cache_refresh;

-- Step 4: Verify RLS is enabled
ALTER TABLE newV ENABLE ROW LEVEL SECURITY;

-- Step 5: Recreate policies to ensure they're active
DROP POLICY IF EXISTS "newV is publicly readable" ON newV;
CREATE POLICY "newV is publicly readable"
  ON newV FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own newV" ON newV;
CREATE POLICY "Users can update own newV"
  ON newV FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- After running this, wait 10-30 seconds for cache to refresh
-- Then test your API again
-- ============================================

