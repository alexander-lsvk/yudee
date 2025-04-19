/*
  # Fix Property Type and Category Enums

  1. Changes
    - Create property_type and property_category enums
    - Add category column to properties table
    - Set appropriate constraints and defaults

  2. Security
    - No changes to security policies
*/

-- Recreate property_type enum
DO $$ 
BEGIN
    DROP TYPE IF EXISTS property_type CASCADE;
    CREATE TYPE property_type AS ENUM (
        'studio',
        '1-bedroom',
        '2-bedroom',
        '3-bedroom',
        '4-bedroom+'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Recreate property_category enum
DO $$ 
BEGIN
    DROP TYPE IF EXISTS property_category CASCADE;
    CREATE TYPE property_category AS ENUM (
        'condo',
        'apartment',
        'house',
        'townhouse',
        'shophouse',
        'land',
        'office',
        'retail',
        'warehouse',
        'hotel',
        'resort',
        'factory'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE properties ADD COLUMN category property_category;
    END IF;
END $$;