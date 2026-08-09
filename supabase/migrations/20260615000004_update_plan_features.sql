-- Add columns for voice note and hidden ending if they do not exist
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
ALTER TABLE public.surprises ADD COLUMN IF NOT EXISTS hidden_ending_url TEXT;

-- Update features configurations in public.plans
UPDATE public.plans SET max_photos = 2, premium_features = '["watermark"]'::jsonb WHERE plan_name = 'Free';
UPDATE public.plans SET max_photos = 5, premium_features = '["custom_music"]'::jsonb WHERE plan_name = 'Basic';
UPDATE public.plans SET max_photos = 10, premium_features = '["custom_music", "password_lock", "countdown", "cute_no_button"]'::jsonb WHERE plan_name = 'Premium';
UPDATE public.plans SET max_photos = 20, premium_features = '["custom_music", "password_lock", "countdown", "cute_no_button", "midnight_unlock", "voice_note", "hidden_ending", "custom_url"]'::jsonb WHERE plan_name = 'Luxury';

-- Trigger to check photo limits before inserts
CREATE OR REPLACE FUNCTION public.check_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_max_photos INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT plan_type INTO v_plan FROM public.surprises WHERE id = NEW.surprise_id;
  SELECT max_photos INTO v_max_photos FROM public.plans WHERE plan_name = v_plan;
  SELECT count(*) INTO v_current_count FROM public.photos WHERE surprise_id = NEW.surprise_id;
  
  IF v_current_count >= v_max_photos THEN
    RAISE EXCEPTION 'Photo limit exceeded for plan % (maximum: % photos)', v_plan, v_max_photos;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_photo_limit
  BEFORE INSERT ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.check_photo_limit();

-- Trigger to check surprise premium features before inserts/updates
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

  IF NEW.plan_type = 'Free' AND length(NEW.custom_message) > 300 THEN
    RAISE EXCEPTION 'Message exceeds 300 characters limit for Free plan';
  END IF;
  
  IF length(NEW.custom_message) > 2000 THEN
    RAISE EXCEPTION 'Message exceeds 2000 characters limit';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_surprise_features
  BEFORE INSERT OR UPDATE ON public.surprises
  FOR EACH ROW EXECUTE FUNCTION public.check_surprise_features();

-- Trigger to check custom music uploads table
CREATE OR REPLACE FUNCTION public.check_music_upload()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_features JSONB;
BEGIN
  SELECT plan_type INTO v_plan FROM public.surprises WHERE id = NEW.surprise_id;
  SELECT premium_features INTO v_features FROM public.plans WHERE plan_name = v_plan;
  
  IF NEW.music_type = 'custom' AND NOT (v_features @> '["custom_music"]'::jsonb) THEN
    RAISE EXCEPTION 'Custom music uploads are not allowed on plan %', v_plan;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_check_music_upload
  BEFORE INSERT OR UPDATE ON public.music_uploads
  FOR EACH ROW EXECUTE FUNCTION public.check_music_upload();
