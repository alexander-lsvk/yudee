/*
  # Convert property enums to reference tables

  1. New Tables
    - `property_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `display_name` (text)
      - `display_order` (integer)
      - `created_at` (timestamptz)

  2. Changes
    - Drop existing enum types
    - Convert properties.category to use reference table
    - Migrate existing data
    
  3. Security
    - Enable RLS on property_categories table
    - Add policy for public read access
*/

-- Drop existing function first
DROP FUNCTION IF EXISTS get_property_categories();

-- Create property_categories table
CREATE TABLE IF NOT EXISTS property_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text NOT NULL,
    display_order integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read property_categories"
    ON property_categories
    FOR SELECT
    TO public
    USING (true);

-- Insert initial categories with display order
INSERT INTO property_categories (name, display_name, display_order) VALUES
    ('condo', 'Condominium', 10),
    ('apartment', 'Apartment', 20),
    ('house', 'House', 30),
    ('townhouse', 'Townhouse', 40),
    ('shophouse', 'Shophouse', 50),
    ('land', 'Land', 60),
    ('office', 'Office Space', 70),
    ('retail', 'Retail Space', 80),
    ('warehouse', 'Warehouse', 90),
    ('hotel', 'Hotel', 100),
    ('resort', 'Resort', 110),
    ('factory', 'Factory', 120)
ON CONFLICT (name) DO NOTHING;

-- Add new category_id column
ALTER TABLE properties 
    ADD COLUMN category_id uuid REFERENCES property_categories(id);

-- Migrate existing data
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN SELECT id, category FROM properties WHERE category IS NOT NULL
    LOOP
        UPDATE properties 
        SET category_id = (
            SELECT id 
            FROM property_categories 
            WHERE name = p.category::text
        )
        WHERE id = p.id;
    END LOOP;
END $$;

-- Drop old category column and enum types
ALTER TABLE properties DROP COLUMN IF EXISTS category;
DROP TYPE IF EXISTS property_category CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;

-- Create helper function to get categories
CREATE OR REPLACE FUNCTION get_property_categories()
RETURNS TABLE (
    id uuid,
    name text,
    display_name text,
    display_order integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id, name, display_name, display_order
    FROM property_categories
    ORDER BY display_order;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_property_categories() TO public;