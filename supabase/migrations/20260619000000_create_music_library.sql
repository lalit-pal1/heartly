-- 1. Create music_library table
CREATE TABLE IF NOT EXISTS public.music_library (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT NOT NULL,
    duration TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable Row Level Security to match the rest of the heartly schema
ALTER TABLE public.music_library DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_library_category ON public.music_library(category);
CREATE INDEX IF NOT EXISTS idx_music_library_sort_order ON public.music_library(sort_order);

-- 2. Create heartly-music public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'heartly-music', 
  'heartly-music', 
  true, 
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to heartly-music" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to heartly-music" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from heartly-music" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow public read access to heartly-music" ON storage.objects FOR SELECT TO public USING (bucket_id = 'heartly-music');
CREATE POLICY "Allow public upload to heartly-music" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'heartly-music');
CREATE POLICY "Allow public delete from heartly-music" ON storage.objects FOR DELETE TO public USING (bucket_id = 'heartly-music');

-- 3. Database starts empty as requested (demo songs removed).

