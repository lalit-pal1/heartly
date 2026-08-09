-- Add caption column to photos table for storing sentimental memory text
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS caption TEXT;
