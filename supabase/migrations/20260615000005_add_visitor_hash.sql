-- Add visitor_hash column to surprise_views table to support unique view tracking and deduplication
ALTER TABLE public.surprise_views ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

-- Create an index to optimize count/group queries by visitor hash
CREATE INDEX IF NOT EXISTS idx_surprise_views_visitor_hash ON public.surprise_views(visitor_hash);
