/*
  # Update deleted_properties table to store complete property data

  1. Changes
    - Drop existing deleted_properties table
    - Create new deleted_properties table with complete property data
    - Add tracking fields for deal status
    
  2. Security
    - Maintain existing RLS policies
    - Keep same access controls
*/

-- Drop existing table
DROP TABLE IF EXISTS deleted_properties;

-- Create new deleted_properties table with complete property data
CREATE TABLE deleted_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Original property data
  original_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('property', 'client-request')),
  category_id uuid REFERENCES property_categories(id),
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
  bedroom_id uuid REFERENCES property_bedrooms(id),
  bathrooms int NOT NULL,
  commission_split_type text NOT NULL CHECK (commission_split_type IN ('fixed', 'percentage')),
  commission_split_value numeric NOT NULL,
  agent_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL,
  
  -- Deletion tracking
  deal_closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  
  -- Related data as JSONB
  locations jsonb,
  amenities jsonb,
  tags jsonb,
  images jsonb,
  bedrooms jsonb -- For client requests with multiple bedrooms
);

-- Enable RLS
ALTER TABLE deleted_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own deleted properties"
  ON deleted_properties
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Users can insert deleted properties"
  ON deleted_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- Create indexes
CREATE INDEX idx_deleted_properties_agent_id ON deleted_properties(agent_id);
CREATE INDEX idx_deleted_properties_deleted_at ON deleted_properties(deleted_at);
CREATE INDEX idx_deleted_properties_original_id ON deleted_properties(original_id);
CREATE INDEX idx_deleted_properties_deal_closed ON deleted_properties(deal_closed);