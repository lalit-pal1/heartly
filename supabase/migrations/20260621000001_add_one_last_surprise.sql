-- Add "One Last Surprise" feature columns to public.surprises
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS one_last_surprise_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS one_last_surprise_message TEXT;
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS one_last_surprise_style TEXT DEFAULT 'auto';
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS one_last_surprise_music_url TEXT;
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS one_last_surprise_voice_note_url TEXT;

-- Update trigger check function to validate plan features
CREATE OR REPLACE FUNCTION public.check_surprise_features()
RETURNS TRIGGER AS $$
DECLARE
  v_features JSONB;
  v_max_photos INTEGER;
BEGIN
  SELECT premium_features, max_photos INTO v_features, v_max_photos 
  FROM public.plans 
  WHERE plan_name = NEW.plan_type;

  IF NEW.password_lock IS NOT NULL AND NEW.password_lock <> '' AND NOT (v_features @> '["password_lock"]'::jsonb) THEN
    RAISE EXCEPTION 'Password lock is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.countdown_enabled AND NOT (v_features @> '["countdown"]'::jsonb) THEN
    RAISE EXCEPTION 'Countdown timer is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.midnight_unlock AND NOT (v_features @> '["midnight_unlock"]'::jsonb) THEN
    RAISE EXCEPTION 'Midnight unlock is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.selected_music LIKE 'http%' AND NOT (v_features @> '["custom_music"]'::jsonb) THEN
    RAISE EXCEPTION 'Custom music uploads are not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.cute_no_button AND NOT (v_features @> '["cute_no_button"]'::jsonb) THEN
    RAISE EXCEPTION 'Interactive No button is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.voice_note_url IS NOT NULL AND NOT (v_features @> '["voice_note"]'::jsonb) THEN
    RAISE EXCEPTION 'Voice note is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.hidden_ending_url IS NOT NULL AND NOT (v_features @> '["hidden_ending"]'::jsonb) THEN
    RAISE EXCEPTION 'Hidden secret ending is not allowed on plan %', NEW.plan_type;
  END IF;

  -- "One Last Surprise" premium validation: only allowed if plan supports hidden_ending
  IF NEW.one_last_surprise_enabled AND NOT (v_features @> '["hidden_ending"]'::jsonb) THEN
    RAISE EXCEPTION 'One Last Surprise is not allowed on plan %', NEW.plan_type;
  END IF;

  IF NEW.plan_type = 'Free' AND length(NEW.custom_message) > 300 THEN
    RAISE EXCEPTION 'Message exceeds 300 characters limit for Free plan';
  END IF;
  
  IF length(NEW.custom_message) > 2000 THEN
    RAISE EXCEPTION 'Message exceeds 2000 characters limit';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
