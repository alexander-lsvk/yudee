/*
  # Add storage policies for avatars bucket

  1. Changes
    - Add storage policies for the avatars bucket:
      - Allow authenticated users to upload/delete their own avatars
      - Allow public read access to all avatars
*/

-- Create policies for the avatars bucket
BEGIN;

-- Policy for uploading avatars (authenticated users can upload to their own folder)
CREATE POLICY "Users can upload avatars to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for deleting avatars (users can only delete their own avatars)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for reading avatars (public access)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

COMMIT;