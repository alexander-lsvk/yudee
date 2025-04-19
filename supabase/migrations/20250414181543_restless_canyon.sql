/*
  # Create profiles table and auth triggers

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `phone` (text, unique)
      - `name` (text)
      - `line_id` (text, nullable)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to:
      - Read their own profile
      - Update their own profile
    
  3. Triggers
    - Create trigger to update updated_at timestamp
    - Create trigger to create profile on new user
*/

-- Drop existing policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

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

-- Create policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
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
END $$;

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number text;
BEGIN
  -- Get phone number from raw_user_meta_data
  phone_number := NEW.raw_user_meta_data->>'phone';
  
  -- If phone number is not in raw_user_meta_data, try phone field
  IF phone_number IS NULL THEN
    phone_number := NEW.phone;
  END IF;

  -- If we still don't have a phone number, use a fallback
  IF phone_number IS NULL THEN
    phone_number := 'unknown';
  END IF;

  -- Insert into profiles
  INSERT INTO public.profiles (id, phone, name)
  VALUES (
    NEW.id,
    phone_number,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Guest User')
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();