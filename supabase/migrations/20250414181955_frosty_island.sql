/*
  # Fix profile creation and policies

  1. Changes
    - Add policy existence checks
    - Improve phone number handling in trigger
    - Clean up existing objects safely
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper authentication checks
*/

-- Drop existing triggers if they exist
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop existing functions if they exist (with CASCADE)
DO $$
BEGIN
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
EXCEPTION
    WHEN undefined_function THEN NULL;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  line_id text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can read own profile'
    ) THEN
        CREATE POLICY "Users can read own profile"
          ON public.profiles
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
          ON public.profiles
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = id)
          WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
          ON public.profiles
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Create handle_new_user function with better phone handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number text;
  user_name text;
BEGIN
  -- Get phone from phone field first (most reliable source)
  phone_number := NEW.phone;
  
  -- If no phone in phone field, try raw_user_meta_data
  IF phone_number IS NULL OR phone_number = '' THEN
    phone_number := NEW.raw_user_meta_data->>'phone';
  END IF;

  -- Get name from metadata or use default
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Guest User');

  -- Only create profile if we have a valid phone number
  IF phone_number IS NOT NULL AND phone_number != '' THEN
    INSERT INTO public.profiles (id, phone, name)
    VALUES (NEW.id, phone_number, user_name);
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();