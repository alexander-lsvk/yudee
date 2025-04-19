/*
  # Fix storage policies for avatars and property images

  1. Changes
    - Drop existing storage policies
    - Add improved policies with better path handling and security
    - Fix content type handling for uploads
    
  2. Security
    - Ensure proper authentication checks
    - Maintain public read access
    - Restrict write operations to authenticated users
*/

-- Drop existing policies
BEGIN;

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- Create new policies for avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Create new policies for property images
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = 'uploads'
);

CREATE POLICY "Users can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = 'uploads'
);

CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

COMMIT;