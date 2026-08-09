-- Create migration to fix free plan trigger idempotency and change to AFTER trigger

CREATE OR REPLACE FUNCTION public.handle_free_surprise_activation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type = 'Free' AND NEW.status = 'active' THEN
    -- Check if already used on a DIFFERENT surprise
    IF EXISTS (
      SELECT 1 FROM public.free_plan_usage 
      WHERE user_id = NEW.user_id AND surprise_id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'You''ve already used your free surprise. Unlock more unforgettable moments with Premium.';
    END IF;

    -- Only insert if it doesn't exist yet for this surprise (idempotency)
    IF NOT EXISTS (
      SELECT 1 FROM public.free_plan_usage 
      WHERE user_id = NEW.user_id AND surprise_id = NEW.id
    ) THEN
      INSERT INTO public.free_plan_usage (user_id, surprise_id)
      VALUES (NEW.user_id, NEW.id)
      ON CONFLICT (user_id) DO UPDATE SET surprise_id = EXCLUDED.surprise_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger as AFTER trigger to ensure surprise_id exists in surprises table first
DROP TRIGGER IF EXISTS trigger_free_surprise_activation ON public.surprises;
CREATE TRIGGER trigger_free_surprise_activation
  AFTER INSERT OR UPDATE ON public.surprises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_free_surprise_activation();
