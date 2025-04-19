/*
  # Add avatar_url to profiles table

  1. Changes
    - Add avatar_url column to profiles table
    
  2. Security
    - No changes to security policies
*/

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;