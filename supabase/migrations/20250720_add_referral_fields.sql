-- Add referral fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ref_id TEXT,
ADD COLUMN IF NOT EXISTS ref_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;
 
-- Create index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ref_id ON profiles(ref_id);