-- 1. Create the heartly-storage public bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'heartly-storage', 
  'heartly-storage', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent migration conflicts
DROP POLICY IF EXISTS "Allow public read access to heartly-storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to heartly-storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from heartly-storage" ON storage.objects;

-- 3. Create RLS Policies for storage.objects on the new bucket
CREATE POLICY "Allow public read access to heartly-storage"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'heartly-storage');

CREATE POLICY "Allow public upload to heartly-storage"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'heartly-storage');

CREATE POLICY "Allow public delete from heartly-storage"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'heartly-storage');
