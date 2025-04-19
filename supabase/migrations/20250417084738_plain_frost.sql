/*
  # Add deleted_properties table for tracking deleted listings

  1. New Tables
    - `deleted_properties`
      - `id` (uuid, primary key)
      - `property_id` (uuid)
      - `deal_closed` (boolean)
      - `closed_at` (timestamptz, nullable)
      - `deleted_at` (timestamptz)
      - `agent_id` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can read their own deleted properties
      - Users can insert deleted properties
*/

CREATE TABLE IF NOT EXISTS deleted_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  deal_closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  agent_id uuid NOT NULL REFERENCES profiles(id)
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

-- Create index for faster queries
CREATE INDEX idx_deleted_properties_agent_id ON deleted_properties(agent_id);
CREATE INDEX idx_deleted_properties_deleted_at ON deleted_properties(deleted_at);