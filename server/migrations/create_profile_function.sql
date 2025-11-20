-- Create a function to insert profiles that bypasses RLS
-- This function has SECURITY DEFINER, so it runs with the privileges of the function owner (postgres)
-- and can bypass RLS policies

CREATE OR REPLACE FUNCTION create_user_profile(
  p_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_role TEXT,
  p_vendor_status TEXT DEFAULT NULL,
  p_shop_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  vendor_status TEXT,
  shop_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id,
    full_name,
    phone,
    role,
    vendor_status,
    shop_name,
    created_at
  ) VALUES (
    p_id,
    p_full_name,
    p_phone,
    p_role,
    p_vendor_status,
    p_shop_name,
    NOW()
  )
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users (or service role)
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;

