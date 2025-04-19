/*
  # Fix property images storage policies

  1. Changes
    - Drop existing policies
    - Add storage policies for the property-images bucket:
      - Allow authenticated users to upload images
      - Allow authenticated users to delete their images
      - Allow public read access
*/

-- Drop existing policies if they exist
BEGIN;

DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- Create new policies
-- Policy for uploading property images
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
);

-- Policy for deleting property images
CREATE POLICY "Users can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
);

-- Policy for reading property images (public access)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

COMMIT;