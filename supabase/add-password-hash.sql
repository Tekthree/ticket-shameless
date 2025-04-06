-- Add password_hash column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_hash TEXT;
  END IF;
END
$$;

-- Add direct login policy for the profiles table
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
CREATE POLICY "Allow public read access to profiles" ON profiles
  FOR SELECT
  USING (true);

-- Add policy for direct profile creation
DROP POLICY IF EXISTS "Allow public insert to profiles" ON profiles;
CREATE POLICY "Allow public insert to profiles" ON profiles
  FOR INSERT
  WITH CHECK (true);
