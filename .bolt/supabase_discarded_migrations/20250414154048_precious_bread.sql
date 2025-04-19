/*
  # Create enums and lookup tables for property management system

  1. Enums
    - property_type (studio, 1-bedroom, etc.)
    - property_category (condo, apartment, etc.)
    - location_type (area, sub_area, bts, mrt)

  2. Lookup Tables
    - locations (areas and sub-areas hierarchy)
    - stations (BTS/MRT stations)
    - amenities
    - tags

  3. Relations and Constraints
    - Locations have parent-child relationships
    - Properties will reference these lookup tables
*/

-- Create ENUMs if they don't exist
DO $$
BEGIN
  -- Create property_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM (
      'studio',
      '1-bedroom',
      '2-bedroom',
      '3-bedroom',
      '4-bedroom+'
    );
  END IF;

  -- Create property_category enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_category') THEN
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
  END IF;

  -- Create location_type enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM (
      'area',
      'sub_area',
      'bts',
      'mrt'
    );
  END IF;
END $$;

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type location_type NOT NULL,
  parent_id uuid REFERENCES locations(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, type)
);

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('BTS', 'MRT', 'ARL')),
  created_at timestamptz DEFAULT now()
);

-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow read access to all users" ON locations;
  DROP POLICY IF EXISTS "Allow read access to all users" ON stations;
  DROP POLICY IF EXISTS "Allow read access to all users" ON amenities;
  DROP POLICY IF EXISTS "Allow read access to all users" ON tags;
  
  -- Create new policies
  CREATE POLICY "Allow read access to all users" ON locations FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read access to all users" ON stations FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read access to all users" ON amenities FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read access to all users" ON tags FOR SELECT TO authenticated USING (true);
END $$;

-- Insert initial data
-- Areas and sub-areas
DO $$
DECLARE
  sukhumvit_id uuid;
  silom_sathorn_id uuid;
  ratchada_id uuid;
  riverside_id uuid;
  phaya_thai_id uuid;
  chatuchak_id uuid;
BEGIN
  -- Insert main areas
  INSERT INTO locations (name, type) VALUES
    ('Sukhumvit', 'area') 
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO sukhumvit_id;
    
  IF sukhumvit_id IS NULL THEN
    SELECT id INTO sukhumvit_id FROM locations WHERE name = 'Sukhumvit' AND type = 'area';
  END IF;

  INSERT INTO locations (name, type) VALUES
    ('Silom-Sathorn', 'area')
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO silom_sathorn_id;
    
  IF silom_sathorn_id IS NULL THEN
    SELECT id INTO silom_sathorn_id FROM locations WHERE name = 'Silom-Sathorn' AND type = 'area';
  END IF;

  INSERT INTO locations (name, type) VALUES
    ('Ratchada', 'area')
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO ratchada_id;
    
  IF ratchada_id IS NULL THEN
    SELECT id INTO ratchada_id FROM locations WHERE name = 'Ratchada' AND type = 'area';
  END IF;

  INSERT INTO locations (name, type) VALUES
    ('Riverside', 'area')
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO riverside_id;
    
  IF riverside_id IS NULL THEN
    SELECT id INTO riverside_id FROM locations WHERE name = 'Riverside' AND type = 'area';
  END IF;

  INSERT INTO locations (name, type) VALUES
    ('Phaya Thai', 'area')
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO phaya_thai_id;
    
  IF phaya_thai_id IS NULL THEN
    SELECT id INTO phaya_thai_id FROM locations WHERE name = 'Phaya Thai' AND type = 'area';
  END IF;

  INSERT INTO locations (name, type) VALUES
    ('Chatuchak', 'area')
    ON CONFLICT (name, type) DO NOTHING
    RETURNING id INTO chatuchak_id;
    
  IF chatuchak_id IS NULL THEN
    SELECT id INTO chatuchak_id FROM locations WHERE name = 'Chatuchak' AND type = 'area';
  END IF;

  -- Insert sub-areas
  -- Sukhumvit sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Asoke', 'sub_area', sukhumvit_id),
    ('Thonglor', 'sub_area', sukhumvit_id),
    ('Ekkamai', 'sub_area', sukhumvit_id),
    ('Phrom Phong', 'sub_area', sukhumvit_id),
    ('Nana', 'sub_area', sukhumvit_id),
    ('On Nut', 'sub_area', sukhumvit_id),
    ('Phra Khanong', 'sub_area', sukhumvit_id)
  ON CONFLICT (name, type) DO NOTHING;

  -- Silom-Sathorn sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Silom', 'sub_area', silom_sathorn_id),
    ('Sathorn', 'sub_area', silom_sathorn_id),
    ('Sala Daeng', 'sub_area', silom_sathorn_id),
    ('Chong Nonsi', 'sub_area', silom_sathorn_id),
    ('Surasak', 'sub_area', silom_sathorn_id)
  ON CONFLICT (name, type) DO NOTHING;

  -- Ratchada sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Rama 9', 'sub_area', ratchada_id),
    ('Huai Khwang', 'sub_area', ratchada_id),
    ('Thailand Cultural Centre', 'sub_area', ratchada_id),
    ('Sutthisan', 'sub_area', ratchada_id)
  ON CONFLICT (name, type) DO NOTHING;

  -- Riverside sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Saphan Taksin', 'sub_area', riverside_id),
    ('Khlong San', 'sub_area', riverside_id),
    ('Charoen Nakhon', 'sub_area', riverside_id)
  ON CONFLICT (name, type) DO NOTHING;

  -- Phaya Thai sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Ari', 'sub_area', phaya_thai_id),
    ('Sanam Pao', 'sub_area', phaya_thai_id),
    ('Victory Monument', 'sub_area', phaya_thai_id)
  ON CONFLICT (name, type) DO NOTHING;

  -- Chatuchak sub-areas
  INSERT INTO locations (name, type, parent_id) VALUES
    ('Mo Chit', 'sub_area', chatuchak_id),
    ('Lat Phrao', 'sub_area', chatuchak_id),
    ('Ratchayothin', 'sub_area', chatuchak_id)
  ON CONFLICT (name, type) DO NOTHING;
END $$;

-- Insert stations
INSERT INTO stations (name, type) VALUES
  -- BTS Sukhumvit Line
  ('Mo Chit', 'BTS'),
  ('Saphan Khwai', 'BTS'),
  ('Ari', 'BTS'),
  ('Sanam Pao', 'BTS'),
  ('Victory Monument', 'BTS'),
  ('Phaya Thai', 'BTS'),
  ('Ratchathewi', 'BTS'),
  ('Siam', 'BTS'),
  ('Chit Lom', 'BTS'),
  ('Phloen Chit', 'BTS'),
  ('Nana', 'BTS'),
  ('Asok', 'BTS'),
  ('Phrom Phong', 'BTS'),
  ('Thong Lo', 'BTS'),
  ('Ekkamai', 'BTS'),
  ('Phra Khanong', 'BTS'),
  ('On Nut', 'BTS'),
  -- MRT Blue Line
  ('Hua Lamphong', 'MRT'),
  ('Sam Yan', 'MRT'),
  ('Si Lom', 'MRT'),
  ('Lumphini', 'MRT'),
  ('Khlong Toei', 'MRT'),
  ('Sukhumvit', 'MRT'),
  ('Phetchaburi', 'MRT'),
  ('Phra Ram 9', 'MRT'),
  ('Thailand Cultural Centre', 'MRT'),
  ('Huai Khwang', 'MRT'),
  ('Sutthisan', 'MRT'),
  ('Ratchadaphisek', 'MRT'),
  ('Lat Phrao', 'MRT'),
  -- Airport Rail Link
  ('Suvarnabhumi', 'ARL'),
  ('Lat Krabang', 'ARL'),
  ('Ban Thap Chang', 'ARL'),
  ('Hua Mak', 'ARL'),
  ('Ramkhamhaeng', 'ARL'),
  ('Makkasan', 'ARL'),
  ('Ratchaprarop', 'ARL'),
  ('Phaya Thai', 'ARL')
ON CONFLICT (name) DO NOTHING;

-- Insert amenities
INSERT INTO amenities (name) VALUES
  ('Swimming Pool'),
  ('Gym'),
  ('Security'),
  ('Parking'),
  ('Pet-friendly'),
  ('Furnished'),
  ('Balcony'),
  ('Garden'),
  ('River View'),
  ('City View'),
  ('High Floor'),
  ('Corner Unit'),
  ('Washing Machine'),
  ('Dishwasher'),
  ('Built-in Kitchen'),
  ('Smart Home'),
  ('Co-working Space'),
  ('Children Playground'),
  ('Tennis Court'),
  ('Sauna')
ON CONFLICT (name) DO NOTHING;

-- Insert tags
INSERT INTO tags (name) VALUES
  ('Pet-friendly'),
  ('Corner Unit'),
  ('Near School'),
  ('High Floor'),
  ('Low Rise Condo'),
  ('Near Shopping Mall'),
  ('Near Hospital'),
  ('Near Park'),
  ('Near 7/11'),
  ('Quiet Area'),
  ('New Building'),
  ('Renovated'),
  ('Fully Furnished'),
  ('Partially Furnished'),
  ('Unfurnished'),
  ('Ready to Move'),
  ('Pool View'),
  ('Garden View'),
  ('Sea View'),
  ('Mountain View'),
  ('Lake View')
ON CONFLICT (name) DO NOTHING;