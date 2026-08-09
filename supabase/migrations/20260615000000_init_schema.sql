-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Helper function for updating updated_at columns
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PLANS TABLE (Pricing configs)
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT UNIQUE NOT NULL,
    max_photos INTEGER NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    premium_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 3. USERS TABLE (Linked with Supabase Auth users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    provider TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- Trigger to sync new user signups from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. SURPRISES TABLE (Core surprise info)
CREATE TABLE public.surprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipient_name TEXT NOT NULL,
    relationship_type TEXT,
    occasion TEXT,
    special_note TEXT,
    custom_message TEXT,
    selected_theme TEXT DEFAULT 'dreamy',
    selected_music TEXT,
    plan_type TEXT NOT NULL REFERENCES public.plans(plan_name) ON UPDATE CASCADE,
    surprise_slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired')),
    password_lock TEXT,
    countdown_enabled BOOLEAN NOT NULL DEFAULT false,
    midnight_unlock BOOLEAN NOT NULL DEFAULT false,
    cute_no_button BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 5. PHOTOS TABLE (Sentimental memory collage links)
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 6. MUSIC_UPLOADS TABLE (Custom voice notes or music uploads)
CREATE TABLE public.music_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE CASCADE NOT NULL UNIQUE,
    music_url TEXT NOT NULL,
    music_type TEXT NOT NULL CHECK (music_type IN ('default', 'custom')),
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 7. ORDERS TABLE (Billing transactions)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE SET NULL UNIQUE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'captured', 'failed')),
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- 8. DRAFTS TABLE (Single autosave workspace state per user)
CREATE TABLE public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 9. SURPRISE_VIEWS TABLE (Analytics logging)
CREATE TABLE public.surprise_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surprise_id UUID REFERENCES public.surprises(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    device_type TEXT
);


-- Automatic update timestamp triggers
CREATE TRIGGER trigger_update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

CREATE TRIGGER trigger_update_surprises_timestamp
  BEFORE UPDATE ON public.surprises
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

CREATE TRIGGER trigger_update_drafts_timestamp
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();


-- ROW LEVEL SECURITY (RLS) configuration
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_views ENABLE ROW LEVEL SECURITY;


-- RLS Policies: plans
CREATE POLICY "Allow public read access on plans" ON public.plans
    FOR SELECT USING (true);


-- RLS Policies: users
CREATE POLICY "Allow read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);


-- RLS Policies: surprises
CREATE POLICY "Allow read active or own surprises" ON public.surprises
    FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Allow insert own surprises" ON public.surprises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own surprises" ON public.surprises
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow delete own surprises" ON public.surprises
    FOR DELETE USING (auth.uid() = user_id);


-- RLS Policies: photos
CREATE POLICY "Allow select photos for active/owned surprises" ON public.photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = photos.surprise_id
            AND (surprises.status = 'active' OR surprises.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow insert photos for owned surprises" ON public.photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = photos.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow update photos for owned surprises" ON public.photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = photos.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow delete photos for owned surprises" ON public.photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = photos.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );


-- RLS Policies: music_uploads
CREATE POLICY "Allow select music for active/owned surprises" ON public.music_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = music_uploads.surprise_id
            AND (surprises.status = 'active' OR surprises.user_id = auth.uid())
        )
    );

CREATE POLICY "Allow insert music for owned surprises" ON public.music_uploads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = music_uploads.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow update music for owned surprises" ON public.music_uploads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = music_uploads.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow delete music for owned surprises" ON public.music_uploads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = music_uploads.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );


-- RLS Policies: drafts
CREATE POLICY "Allow read own draft" ON public.drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert own draft" ON public.drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update own draft" ON public.drafts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow delete own draft" ON public.drafts
    FOR DELETE USING (auth.uid() = user_id);


-- RLS Policies: orders
CREATE POLICY "Allow read own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);


-- RLS Policies: surprise_views
CREATE POLICY "Allow public insert of surprise views" ON public.surprise_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read views of own surprises" ON public.surprise_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surprises
            WHERE surprises.id = surprise_views.surprise_id
            AND surprises.user_id = auth.uid()
        )
    );


-- High performance query indexes
CREATE INDEX IF NOT EXISTS idx_surprises_user_id ON public.surprises(user_id);
CREATE INDEX IF NOT EXISTS idx_surprises_slug ON public.surprises(surprise_slug);
CREATE INDEX IF NOT EXISTS idx_photos_surprise_id_order ON public.photos(surprise_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_music_uploads_surprise_id ON public.music_uploads(surprise_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_surprise_id ON public.orders(surprise_id);
CREATE INDEX IF NOT EXISTS idx_surprise_views_surprise_id ON public.surprise_views(surprise_id);
CREATE INDEX IF NOT EXISTS idx_surprise_views_surprise_time ON public.surprise_views(surprise_id, viewed_at DESC);
