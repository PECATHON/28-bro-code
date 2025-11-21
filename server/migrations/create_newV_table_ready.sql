-- ============================================
-- READY-TO-RUN SQL: Create newV table in Supabase
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================

-- Step 1: Create newV table with same structure as vendors
CREATE TABLE IF NOT EXISTS newV (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT,
  shop_name TEXT NOT NULL,
  name TEXT, -- For backward compatibility
  email TEXT,
  phone TEXT,
  description TEXT,
  status TEXT DEFAULT 'approved', -- approved, pending, etc.
  is_approved BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  location JSONB,
  avg_rating DECIMAL(3, 1) DEFAULT 0,
  college_id UUID,
  image_path TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Copy all data from vendors to newV (if vendors table exists)
-- This will safely skip if vendors table doesn't exist or if data already copied
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendors') THEN
    INSERT INTO newV (
      id, owner_name, shop_name, name, email, phone, description, 
      status, is_approved, is_active, location, avg_rating, 
      college_id, image_path, owner_id, created_at, updated_at
    )
    SELECT 
      id, owner_name, shop_name, name, email, phone, description,
      COALESCE(status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) as status,
      COALESCE(is_approved, true) as is_approved,
      COALESCE(is_active, true) as is_active,
      location, avg_rating, college_id, image_path, owner_id,
      created_at, updated_at
    FROM vendors
    ON CONFLICT (id) DO NOTHING; -- Skip if already exists
  END IF;
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newV_shop_name ON newV(shop_name);
CREATE INDEX IF NOT EXISTS idx_newV_owner_name ON newV(owner_name);
CREATE INDEX IF NOT EXISTS idx_newV_email ON newV(email);
CREATE INDEX IF NOT EXISTS idx_newV_status ON newV(status);
CREATE INDEX IF NOT EXISTS idx_newV_is_active ON newV(is_active);
CREATE INDEX IF NOT EXISTS idx_newV_created_at ON newV(created_at DESC);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE newV ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for newV
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "newV is publicly readable" ON newV;
DROP POLICY IF EXISTS "Users can update own newV" ON newV;

-- Users can view all newV entries (public read)
CREATE POLICY "newV is publicly readable"
  ON newV FOR SELECT
  USING (true);

-- Users can update their own newV entry
CREATE POLICY "Users can update own newV"
  ON newV FOR UPDATE
  USING (auth.uid() = id);

-- Step 6: Update foreign key references in orders table (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Drop old foreign key constraint if it exists
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_vendor_id_fkey;
    
    -- Add new foreign key to newV
    ALTER TABLE orders 
      ADD CONSTRAINT orders_vendor_id_fkey 
      FOREIGN KEY (vendor_id) REFERENCES newV(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 7: Update foreign key references in transactions table (if transactions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    -- Drop old foreign key constraint if it exists
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_vendor_id_fkey;
    
    -- Add new foreign key to newV
    ALTER TABLE transactions 
      ADD CONSTRAINT transactions_vendor_id_fkey 
      FOREIGN KEY (vendor_id) REFERENCES newV(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 8: Update RLS policies in orders and transactions to use newV
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Drop old policy
    DROP POLICY IF EXISTS "Vendors can view own shop orders" ON orders;
    
    -- Create new policy using newV
    CREATE POLICY "Vendors can view own shop orders"
      ON orders FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM newV
          WHERE newV.id = orders.vendor_id
          AND newV.id = auth.uid()
        )
      );
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    -- Drop old policy
    DROP POLICY IF EXISTS "Vendors can view own shop transactions" ON transactions;
    
    -- Create new policy using newV
    CREATE POLICY "Vendors can view own shop transactions"
      ON transactions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM newV
          WHERE newV.id = transactions.vendor_id
          AND newV.id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- SUCCESS! The newV table has been created.
-- ============================================
-- To verify, run: SELECT * FROM newV LIMIT 5;
-- ============================================

