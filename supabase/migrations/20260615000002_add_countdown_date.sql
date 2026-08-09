-- Add countdown_date column to surprises table
ALTER TABLE public.surprises ADD COLUMN countdown_date TIMESTAMPTZ;
