/*
  # Fix user creation trigger and phone handling

  1. Changes
    - Improve phone number format handling
    - Add better error handling
    - Fix profile creation logic
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate the function with better phone handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number text;
  user_name text;
BEGIN
  -- Get phone number, trying different sources
  phone_number := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phoneNumber',
    NEW.raw_user_meta_data->>'phone_number'
  );

  -- Clean up phone number format
  IF phone_number IS NOT NULL THEN
    -- Remove any spaces
    phone_number := regexp_replace(phone_number, '\s+', '', 'g');
    
    -- Ensure it starts with '+'
    IF LEFT(phone_number, 1) != '+' THEN
      phone_number := '+' || phone_number;
    END IF;
    
    -- If it starts with '66' but not '+66', add the '+'
    IF LEFT(phone_number, 2) = '66' AND LEFT(phone_number, 1) != '+' THEN
      phone_number := '+' || phone_number;
    END IF;
  END IF;

  -- Get name from metadata or use default
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'userName',
    'Guest User'
  );

  -- Only proceed if we have a valid phone number
  IF phone_number IS NOT NULL AND phone_number != '' THEN
    -- Insert or update the profile
    INSERT INTO public.profiles (id, phone, name)
    VALUES (NEW.id, phone_number, user_name)
    ON CONFLICT (id) DO UPDATE
    SET phone = EXCLUDED.phone,
        name = EXCLUDED.name;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error (will appear in Supabase logs)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Return NEW to allow the auth.users insert to complete
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();

-- Update any existing users that might have invalid phone numbers
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, phone, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    BEGIN
      -- Try to create profile for existing users
      INSERT INTO public.profiles (id, phone, name)
      VALUES (
        user_record.id,
        COALESCE(
          user_record.phone,
          user_record.raw_user_meta_data->>'phone',
          user_record.raw_user_meta_data->>'phoneNumber',
          user_record.raw_user_meta_data->>'phone_number'
        ),
        COALESCE(
          user_record.raw_user_meta_data->>'name',
          user_record.raw_user_meta_data->>'full_name',
          user_record.raw_user_meta_data->>'userName',
          'Guest User'
        )
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN others THEN
        -- Log any errors but continue processing
        RAISE LOG 'Error processing user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$;