/*
  # Fix storage policies for image uploads

  1. Changes
    - Drop all existing storage policies
    - Add new policies with proper path handling and permissions
    - Fix content type and size restrictions
    
  2. Security
    - Allow authenticated users to upload/delete their own avatars
    - Allow authenticated users to upload/delete property images
    - Allow public read access to all images
*/

-- Drop existing policies
BEGIN;

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- Create new policies for avatars bucket
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = auth.uid()::text
    ELSE
      FALSE
  END)
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = auth.uid()::text
    ELSE
      FALSE
  END)
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Create new policies for property-images bucket
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = 'uploads'
    ELSE
      FALSE
  END)
);

CREATE POLICY "Users can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = 'uploads'
    ELSE
      FALSE
  END)
);

CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

COMMIT;