/*
  # Add storage policies for property-images bucket

  1. Changes
    - Add storage policies for the property-images bucket:
      - Allow authenticated users to upload/delete images for their properties
      - Allow public read access to all property images
*/

-- Create policies for the property-images bucket
BEGIN;

-- Policy for uploading property images
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
);

-- Policy for deleting property images
CREATE POLICY "Users can delete their property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
);

-- Policy for reading property images (public access)
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

COMMIT;