/*
  # Add bedrooms table and update properties table

  1. New Tables
    - `property_bedrooms`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)

  2. Changes
    - Drop property_type enum
    - Modify properties table to use property_bedrooms reference
    - Add initial bedroom types
    
  3. Security
    - Enable RLS on property_bedrooms table
    - Add policy for public read access
*/

-- Drop the property_type enum and related columns
ALTER TABLE properties DROP COLUMN bedrooms;

-- Create property_bedrooms table
CREATE TABLE IF NOT EXISTS public.property_bedrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add new bedrooms column to properties referencing property_bedrooms
ALTER TABLE properties 
ADD COLUMN bedroom_id uuid REFERENCES property_bedrooms(id);

-- Enable RLS
ALTER TABLE public.property_bedrooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read property_bedrooms"
  ON public.property_bedrooms
  FOR SELECT
  TO public
  USING (true);

-- Insert initial bedroom types
INSERT INTO public.property_bedrooms (name) VALUES
  ('studio'),
  ('1-bedroom'),
  ('2-bedroom'),
  ('3-bedroom'),
  ('4-bedroom+')
ON CONFLICT (name) DO NOTHING;