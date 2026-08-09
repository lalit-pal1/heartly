-- Create migration for referrals and free plan restriction

-- 1. Add referral_code column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Generator function for referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT;
  i INTEGER;
BEGIN
  LOOP
    result := 'HRT';
    FOR i IN 1..5 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate existing users with referral codes
UPDATE public.users SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- 3. Modify handle_new_user function to generate and insert referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url, provider, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    public.generate_referral_code()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create public.referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    is_rewarded BOOLEAN NOT NULL DEFAULT false,
    rewarded_at TIMESTAMPTZ,
    trigger_order_id UUID,
    refund_review_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_referral CHECK (referrer_id <> referred_user_id)
);

-- 5. Create public.reward_credits table
CREATE TABLE IF NOT EXISTS public.reward_credits (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    basic_credits INTEGER NOT NULL DEFAULT 0 CHECK (basic_credits >= 0),
    lifetime_credits INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_credits >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create public.reward_transactions table
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'revoke')),
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create public.free_plan_usage table
CREATE TABLE IF NOT EXISTS public.free_plan_usage (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    surprise_id UUID NOT NULL REFERENCES public.surprises(id) ON DELETE CASCADE,
    consumed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Enable refunded status in order payment status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'captured', 'failed', 'refunded'));

-- Add foreign key constraint to trigger_order_id in referrals
ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_trigger_order_id_fkey;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_trigger_order_id_fkey FOREIGN KEY (trigger_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- 9. Reward distribution function
CREATE OR REPLACE FUNCTION public.process_referral_reward(referred_uid UUID, order_id UUID)
RETURNS VOID AS $$
DECLARE
  ref_row RECORD;
BEGIN
  -- Find an unrewarded referral record for this referred user
  SELECT * INTO ref_row 
  FROM public.referrals 
  WHERE referred_user_id = referred_uid AND is_rewarded = false;

  IF ref_row.id IS NOT NULL THEN
    -- 1. Mark referral as rewarded
    UPDATE public.referrals 
    SET is_rewarded = true, 
        rewarded_at = now(),
        trigger_order_id = order_id
    WHERE id = ref_row.id;

    -- 2. Grant basic credits to referrer (Upsert)
    INSERT INTO public.reward_credits (user_id, basic_credits, lifetime_credits, updated_at)
    VALUES (ref_row.referrer_id, 1, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      basic_credits = public.reward_credits.basic_credits + 1,
      lifetime_credits = public.reward_credits.lifetime_credits + 1,
      updated_at = now();

    -- 3. Log earn transaction
    INSERT INTO public.reward_transactions (user_id, amount, transaction_type, referral_id)
    VALUES (ref_row.referrer_id, 1, 'earn', ref_row.id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Reward revoking function for refunds
CREATE OR REPLACE FUNCTION public.process_referral_refund(order_id UUID)
RETURNS VOID AS $$
DECLARE
  ref_row RECORD;
  credits_row RECORD;
BEGIN
  -- Find the referral triggered by this order
  SELECT * INTO ref_row 
  FROM public.referrals 
  WHERE trigger_order_id = order_id AND is_rewarded = true;

  IF ref_row.id IS NOT NULL THEN
    -- Get referrer credits
    SELECT * INTO credits_row FROM public.reward_credits WHERE user_id = ref_row.referrer_id;
    
    IF credits_row.basic_credits > 0 THEN
      -- Revoke credit
      UPDATE public.reward_credits 
      SET basic_credits = basic_credits - 1,
          updated_at = now()
      WHERE user_id = ref_row.referrer_id;

      -- Log revoke transaction
      INSERT INTO public.reward_transactions (user_id, amount, transaction_type, referral_id)
      VALUES (ref_row.referrer_id, -1, 'revoke', ref_row.id);
    ELSE
      -- Credit already spent, flag for manual review
      UPDATE public.referrals 
      SET refund_review_required = true
      WHERE id = ref_row.id;
    END IF;

    -- Mark referral as unrewarded to allow future reward if they purchase again
    UPDATE public.referrals 
    SET is_rewarded = false,
        trigger_order_id = NULL
    WHERE id = ref_row.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger function for order payment changes
CREATE OR REPLACE FUNCTION public.check_order_payment_captured()
RETURNS TRIGGER AS $$
BEGIN
  -- Transition to captured
  IF NEW.payment_status = 'captured' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'captured') THEN
    PERFORM public.process_referral_reward(NEW.user_id, NEW.id);
  END IF;

  -- Transition to refunded
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'captured' THEN
    PERFORM public.process_referral_refund(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders
DROP TRIGGER IF EXISTS trigger_order_payment_captured ON public.orders;
CREATE TRIGGER trigger_order_payment_captured
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_payment_captured();

-- 12. Trigger function for Free Plan limits
CREATE OR REPLACE FUNCTION public.handle_free_surprise_activation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type = 'Free' AND NEW.status = 'active' THEN
    -- Check if already used
    IF EXISTS (
      SELECT 1 FROM public.free_plan_usage WHERE user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'You''ve already used your free surprise. Unlock more unforgettable moments with Premium.';
    END IF;

    -- Insert into free_plan_usage
    INSERT INTO public.free_plan_usage (user_id, surprise_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on surprises
DROP TRIGGER IF EXISTS trigger_free_surprise_activation ON public.surprises;
CREATE TRIGGER trigger_free_surprise_activation
  BEFORE INSERT OR UPDATE ON public.surprises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_free_surprise_activation();

-- 13. Public RPC function to validate code
CREATE OR REPLACE FUNCTION public.validate_referral_code(code_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE referral_code = code_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Public RPC function to record referral relation
CREATE OR REPLACE FUNCTION public.record_referral(referred_id UUID, ref_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  ref_id UUID;
BEGIN
  -- Check if referral already exists for this referred user
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = referred_id) THEN
    RETURN FALSE;
  END IF;

  -- Get referrer_id
  SELECT id INTO ref_id FROM public.users WHERE referral_code = ref_code;

  -- Validation
  IF ref_id IS NULL OR ref_id = referred_id THEN
    RETURN FALSE;
  END IF;

  -- Insert referral record
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code)
  VALUES (ref_id, referred_id, ref_code);

  -- Initialize reward_credits entry for the referred user
  INSERT INTO public.reward_credits (user_id, basic_credits, lifetime_credits)
  VALUES (referred_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize reward_credits entry for the referrer if not exists
  INSERT INTO public.reward_credits (user_id, basic_credits, lifetime_credits)
  VALUES (ref_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Public RPC function to spend basic credit
CREATE OR REPLACE FUNCTION public.redeem_basic_credit(u_id UUID, s_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  -- Decrement credits
  UPDATE public.reward_credits 
  SET basic_credits = basic_credits - 1,
      updated_at = now()
  WHERE user_id = u_id AND basic_credits > 0;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  
  IF updated_rows = 0 THEN
    RETURN FALSE;
  END IF;

  -- Activate surprise on Basic plan
  UPDATE public.surprises 
  SET status = 'active',
      plan_type = 'Basic'
  WHERE id = s_id AND user_id = u_id;

  -- Create order record with 0 amount
  INSERT INTO public.orders (user_id, surprise_id, amount, currency, payment_status, razorpay_payment_id)
  VALUES (u_id, s_id, 0, 'INR', 'captured', 'credit_redeemed')
  ON CONFLICT (surprise_id) DO UPDATE SET
    payment_status = 'captured',
    razorpay_payment_id = 'credit_redeemed',
    amount = 0;

  -- Log transaction
  INSERT INTO public.reward_transactions (user_id, amount, transaction_type, surprise_id)
  VALUES (u_id, -1, 'spend', s_id);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Joined referral view
CREATE OR REPLACE VIEW public.referral_history_view AS
SELECT 
  r.id,
  r.referrer_id,
  r.referred_user_id,
  r.referral_code,
  r.is_rewarded,
  r.rewarded_at,
  r.refund_review_required,
  r.created_at AS signup_time,
  u.full_name AS friend_name,
  u.email AS friend_email,
  COALESCE(
    (
      SELECT o.payment_status
      FROM public.orders o
      WHERE o.user_id = r.referred_user_id AND o.payment_status = 'captured'
      LIMIT 1
    ),
    'pending'
  ) AS purchase_status
FROM public.referrals r
JOIN public.users u ON r.referred_user_id = u.id
WHERE r.referrer_id = auth.uid() OR r.referred_user_id = auth.uid();

-- 17. Row Level Security Configuration
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_plan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Allow select for own credits" ON public.reward_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow select for own transactions" ON public.reward_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow select for own free usage" ON public.free_plan_usage
    FOR SELECT USING (auth.uid() = user_id);
