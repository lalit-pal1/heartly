-- 1. Create rate limiting table for bot & spam protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 0,
    expire_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS (No select/insert/update/delete policies are added, making it strictly service_role/admin accessible only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index to optimize rate-limit cleanups and lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire_at ON public.rate_limits(expire_at);


-- 2. Configure public storage bucket metadata (enforcing strict size & MIME type limits)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'heartly-storage',
  'heartly-storage',
  true,
  10485760, -- 10MB limit in bytes
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a', 'audio/m4a', 'audio/x-aac', 'audio/aac',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a', 'audio/m4a', 'audio/x-aac', 'audio/aac',
    'video/mp4', 'video/webm', 'video/ogg'
  ];


-- 3. Configure storage objects Row Level Security (RLS) policies for owner-isolation
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own media" ON storage.objects;

-- Allow public viewing of images, music, and videos for receivers
CREATE POLICY "Allow public read access to media" ON storage.objects
    FOR SELECT USING (bucket_id = 'heartly-storage');

-- Allow users to upload to their own user-isolated folders
CREATE POLICY "Allow authenticated users to upload their own media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'heartly-storage' 
        AND auth.role() = 'authenticated' 
        AND name LIKE 'users/' || auth.uid()::text || '/%'
    );

-- Allow users to update files in their own user-isolated folders
CREATE POLICY "Allow authenticated users to update their own media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'heartly-storage' 
        AND auth.role() = 'authenticated' 
        AND name LIKE 'users/' || auth.uid()::text || '/%'
    );

-- Allow users to delete files from their own user-isolated folders
CREATE POLICY "Allow authenticated users to delete their own media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'heartly-storage' 
        AND auth.role() = 'authenticated' 
        AND name LIKE 'users/' || auth.uid()::text || '/%'
    );
