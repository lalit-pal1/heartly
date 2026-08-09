-- Add countdown_duration column to public.surprises table (in seconds)
ALTER TABLE public.surprises ADD COLUMN countdown_duration INTEGER DEFAULT 60;
