/*
  # Create properties schema and related tables

  1. New Types
    - property_type ENUM ('studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom+')
    - property_category ENUM ('condo', 'apartment', 'house', 'townhouse')
    - location_type ENUM ('area', 'sub_area', 'bts', 'mrt')

  2. New Tables
    - locations
      - id (uuid)
      - name (text)
      - type (location_type)
      - parent_id (uuid, self-reference for hierarchical structure)
    
    - properties
      - id (uuid)
      - type (text: 'property' or 'client-request')
      - category (property_category)
      - title (text)
      - description (text)
      - project_name (text, nullable)
      - floor (int, nullable)
      - move_in_date (date, nullable)
      - build_year (int, nullable)
      - area (numeric for property, null for client request)
      - area_min (numeric for client request, null for property)
      - area_max (numeric for client request, null for property)
      - price (numeric for property, null for client request)
      - price_min (numeric for client request, null for property)
      - price_max (numeric for client request, null for property)
      - bedrooms (property_type for property, null for client request)
      - bathrooms (int)
      - balcony (boolean)
      - commission_split_type (text: 'fixed' or 'percentage')
      - commission_split_value (numeric)
      - agent_id (uuid, references profiles)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Add policies for:
      - Users can read all properties
      - Users can only create/update/delete their own properties
      - Users can read all locations, amenities, and tags
*/

-- Create ENUMs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM (
      'studio',
      '1-bedroom',
      '2-bedroom',
      '3-bedroom',
      '4-bedroom+'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_category') THEN
    CREATE TYPE property_category AS ENUM (
      'condo',
      'apartment',
      'house',
      'townhouse'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM (
      'area',
      'sub_area',
      'bts',
      'mrt'
    );
  END IF;
END$$;

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type location_type NOT NULL,
  parent_id uuid REFERENCES public.locations(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, type)
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('property', 'client-request')),
  category property_category NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  project_name text,
  floor int,
  move_in_date date,
  build_year int,
  area numeric,
  area_min numeric,
  area_max numeric,
  price numeric,
  price_min numeric,
  price_max numeric,
  bedrooms property_type,
  bathrooms int NOT NULL,
  balcony boolean DEFAULT false,
  commission_split_type text NOT NULL CHECK (commission_split_type IN ('fixed', 'percentage')),
  commission_split_value numeric NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_area_range CHECK (
    (type = 'property' AND area IS NOT NULL AND area_min IS NULL AND area_max IS NULL) OR
    (type = 'client-request' AND area IS NULL AND area_min IS NOT NULL AND area_max IS NOT NULL)
  ),
  CONSTRAINT valid_price_range CHECK (
    (type = 'property' AND price IS NOT NULL AND price_min IS NULL AND price_max IS NULL) OR
    (type = 'client-request' AND price IS NULL AND price_min IS NOT NULL AND price_max IS NOT NULL)
  )
);

-- Create property_locations junction table
CREATE TABLE IF NOT EXISTS public.property_locations (
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, location_id)
);

-- Create property_amenities table
CREATE TABLE IF NOT EXISTS public.property_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create property_amenities_junction table
CREATE TABLE IF NOT EXISTS public.property_amenities_junction (
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_id uuid REFERENCES public.property_amenities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, amenity_id)
);

-- Create property_tags table
CREATE TABLE IF NOT EXISTS public.property_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create property_tags_junction table
CREATE TABLE IF NOT EXISTS public.property_tags_junction (
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.property_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, tag_id)
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
DO $$
BEGIN
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_locations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_amenities_junction ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_tags ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_tags_junction ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create policies for locations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read locations" ON public.locations;
  CREATE POLICY "Anyone can read locations"
    ON public.locations
    FOR SELECT
    TO public
    USING (true);
END$$;

-- Create policies for properties
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read properties" ON public.properties;
  CREATE POLICY "Anyone can read properties"
    ON public.properties
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Users can create their own properties" ON public.properties;
  CREATE POLICY "Users can create their own properties"
    ON public.properties
    FOR INSERT
    TO authenticated
    WITH CHECK (agent_id = auth.uid());

  DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
  CREATE POLICY "Users can update their own properties"
    ON public.properties
    FOR UPDATE
    TO authenticated
    USING (agent_id = auth.uid())
    WITH CHECK (agent_id = auth.uid());

  DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;
  CREATE POLICY "Users can delete their own properties"
    ON public.properties
    FOR DELETE
    TO authenticated
    USING (agent_id = auth.uid());
END$$;

-- Create policies for property_locations
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_locations" ON public.property_locations;
  CREATE POLICY "Anyone can read property_locations"
    ON public.property_locations
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Users can modify property_locations for their properties" ON public.property_locations;
  CREATE POLICY "Users can modify property_locations for their properties"
    ON public.property_locations
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    ));
END$$;

-- Create policies for property_amenities
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_amenities" ON public.property_amenities;
  CREATE POLICY "Anyone can read property_amenities"
    ON public.property_amenities
    FOR SELECT
    TO public
    USING (true);
END$$;

-- Create policies for property_amenities_junction
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_amenities_junction" ON public.property_amenities_junction;
  CREATE POLICY "Anyone can read property_amenities_junction"
    ON public.property_amenities_junction
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Users can modify property_amenities_junction for their properties" ON public.property_amenities_junction;
  CREATE POLICY "Users can modify property_amenities_junction for their properties"
    ON public.property_amenities_junction
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    ));
END$$;

-- Create policies for property_tags
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_tags" ON public.property_tags;
  CREATE POLICY "Anyone can read property_tags"
    ON public.property_tags
    FOR SELECT
    TO public
    USING (true);
END$$;

-- Create policies for property_tags_junction
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_tags_junction" ON public.property_tags_junction;
  CREATE POLICY "Anyone can read property_tags_junction"
    ON public.property_tags_junction
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Users can modify property_tags_junction for their properties" ON public.property_tags_junction;
  CREATE POLICY "Users can modify property_tags_junction for their properties"
    ON public.property_tags_junction
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    ));
END$$;

-- Create policies for property_images
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read property_images" ON public.property_images;
  CREATE POLICY "Anyone can read property_images"
    ON public.property_images
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Users can modify property_images for their properties" ON public.property_images;
  CREATE POLICY "Users can modify property_images for their properties"
    ON public.property_images
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    ));
END$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert initial amenities
INSERT INTO public.property_amenities (name) VALUES
  ('Swimming Pool'),
  ('Gym'),
  ('Security'),
  ('Parking'),
  ('Garden'),
  ('Pet-friendly'),
  ('Furnished'),
  ('Balcony'),
  ('River View'),
  ('City View'),
  ('Near BTS')
ON CONFLICT (name) DO NOTHING;

-- Insert initial tags
INSERT INTO public.property_tags (name) VALUES
  ('Luxury'),
  ('Renovated'),
  ('Quiet Area'),
  ('High Floor'),
  ('Corner Unit'),
  ('Near School'),
  ('Smart Home')
ON CONFLICT (name) DO NOTHING;

-- Insert main areas
INSERT INTO public.locations (name, type) VALUES
  ('Central Bangkok', 'area'),
  ('Sukhumvit', 'area'),
  ('Riverside', 'area'),
  ('Other Areas', 'area')
ON CONFLICT (name, type) DO NOTHING;

-- Insert sub-areas for Central Bangkok
WITH central_bangkok AS (
  SELECT id FROM public.locations WHERE name = 'Central Bangkok' AND type = 'area'
)
INSERT INTO public.locations (name, type, parent_id)
SELECT sub_area, 'sub_area'::location_type, central_bangkok.id
FROM central_bangkok,
UNNEST(ARRAY['Chidlom', 'Ploenchit', 'Ratchaprasong', 'Siam']) AS sub_area
ON CONFLICT (name, type) DO NOTHING;

-- Insert sub-areas for Sukhumvit
WITH sukhumvit AS (
  SELECT id FROM public.locations WHERE name = 'Sukhumvit' AND type = 'area'
)
INSERT INTO public.locations (name, type, parent_id)
SELECT sub_area, 'sub_area'::location_type, sukhumvit.id
FROM sukhumvit,
UNNEST(ARRAY['Asoke', 'Ekkamai', 'Nana', 'On Nut', 'Phra Khanong', 'Phrom Phong', 'Thonglor']) AS sub_area
ON CONFLICT (name, type) DO NOTHING;

-- Insert sub-areas for Riverside
WITH riverside AS (
  SELECT id FROM public.locations WHERE name = 'Riverside' AND type = 'area'
)
INSERT INTO public.locations (name, type, parent_id)
SELECT sub_area, 'sub_area'::location_type, riverside.id
FROM riverside,
UNNEST(ARRAY['Charoen Krung', 'Khlong San', 'Ratchawong']) AS sub_area
ON CONFLICT (name, type) DO NOTHING;

-- Insert sub-areas for Other Areas
WITH other_areas AS (
  SELECT id FROM public.locations WHERE name = 'Other Areas' AND type = 'area'
)
INSERT INTO public.locations (name, type, parent_id)
SELECT sub_area, 'sub_area'::location_type, other_areas.id
FROM other_areas,
UNNEST(ARRAY['Ari', 'Lat Phrao', 'Sathorn', 'Silom']) AS sub_area
ON CONFLICT (name, type) DO NOTHING;

-- Insert BTS/MRT stations
INSERT INTO public.locations (name, type) VALUES
  ('Asok', 'bts'),
  ('Ari', 'bts'),
  ('Bang Na', 'bts'),
  ('Chidlom', 'bts'),
  ('Chong Nonsi', 'bts'),
  ('Ekkamai', 'bts'),
  ('Mo Chit', 'bts'),
  ('Nana', 'bts'),
  ('On Nut', 'bts'),
  ('Phloen Chit', 'bts'),
  ('Phrom Phong', 'bts'),
  ('Sala Daeng', 'bts'),
  ('Samrong', 'bts'),
  ('Saphan Taksin', 'bts'),
  ('Siam', 'bts'),
  ('Si Lom', 'bts'),
  ('Sukhumvit', 'bts'),
  ('Thong Lo', 'bts')
ON CONFLICT (name, type) DO NOTHING;