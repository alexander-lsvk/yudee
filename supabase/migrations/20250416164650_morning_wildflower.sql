/*
  # Remove balcony column from properties table

  1. Changes
    - Remove balcony column from properties table since it's redundant with amenities
    - Add balcony amenity if it doesn't exist
    - Migrate existing balcony data to amenities
*/

-- First, ensure we have a balcony amenity
INSERT INTO property_amenities (name)
VALUES ('Balcony')
ON CONFLICT (name) DO NOTHING;

-- Get the ID of the balcony amenity
DO $$
DECLARE
  balcony_amenity_id uuid;
BEGIN
  SELECT id INTO balcony_amenity_id
  FROM property_amenities
  WHERE name = 'Balcony';

  -- Add balcony amenity for properties that had balcony = true
  INSERT INTO property_amenities_junction (property_id, amenity_id)
  SELECT id, balcony_amenity_id
  FROM properties
  WHERE balcony = true
  ON CONFLICT (property_id, amenity_id) DO NOTHING;
END $$;

-- Remove the balcony column
ALTER TABLE properties DROP COLUMN IF EXISTS balcony;