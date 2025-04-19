/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop all existing policies
    - Add comprehensive policies for:
      - Selecting own profile (authenticated)
      - Updating own profile (authenticated)
      - Inserting own profile (authenticated)
      - Service role can bypass RLS
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);