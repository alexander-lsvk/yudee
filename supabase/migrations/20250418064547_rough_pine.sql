/*
  # Add premium subscription fields to profiles table

  1. Changes
    - Add premium_until column to track subscription expiry
    - Add premium_trial_used to track if free trial was used
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add premium-related columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS premium_until timestamptz,
ADD COLUMN IF NOT EXISTS premium_trial_used boolean DEFAULT false;

-- Create index for faster premium status checks
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON profiles(premium_until);