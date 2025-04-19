/*
  # Fix storage policies for avatars bucket

  1. Changes
    - Drop existing policies
    - Add corrected storage policies for the avatars bucket:
      - Fix path handling for uploads
      - Ensure proper authorization checks
*/

-- Drop existing policies
BEGIN;

DROP POLICY IF EXISTS "Users can upload avatars to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create new policies with correct path handling
-- Policy for uploading avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = auth.uid()::text
    ELSE
      TRUE
  END)
);

-- Policy for deleting avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (CASE
    WHEN POSITION('/' in name) > 0 THEN
      SPLIT_PART(name, '/', 1) = auth.uid()::text
    ELSE
      auth.uid()::text = SPLIT_PART(name, '-', 1)
  END)
);

-- Policy for reading avatars (public access)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

COMMIT;