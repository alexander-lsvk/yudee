/*
  # Add support for multiple bedrooms for client requests

  1. New Tables
    - `property_bedrooms_junction`
      - `property_id` (uuid, references properties)
      - `bedroom_id` (uuid, references property_bedrooms)
      - `created_at` (timestamptz)

  2. Changes
    - Make bedroom_id nullable in properties table
    - Add RLS policies for the new junction table
*/

-- Create property_bedrooms_junction table
CREATE TABLE IF NOT EXISTS public.property_bedrooms_junction (
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  bedroom_id uuid REFERENCES public.property_bedrooms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, bedroom_id)
);

-- Enable RLS
ALTER TABLE public.property_bedrooms_junction ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read property_bedrooms_junction"
  ON public.property_bedrooms_junction
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can modify property_bedrooms_junction for their properties"
  ON public.property_bedrooms_junction
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id AND agent_id = auth.uid()
  ));

-- Make bedroom_id nullable in properties table
ALTER TABLE public.properties
  ALTER COLUMN bedroom_id DROP NOT NULL;