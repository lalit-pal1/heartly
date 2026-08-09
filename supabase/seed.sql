-- Seed Pricing Plans
INSERT INTO public.plans (plan_name, max_photos, price, premium_features) VALUES
('Free', 2, 0.00, '[]'::jsonb),
('Basic', 5, 199.00, '["password_lock"]'::jsonb),
('Premium', 10, 499.00, '["password_lock", "countdown", "custom_slug"]'::jsonb),
('Luxury', 25, 999.00, '["password_lock", "countdown", "custom_slug", "custom_music", "midnight_unlock"]'::jsonb)
ON CONFLICT (plan_name) DO UPDATE SET
  max_photos = EXCLUDED.max_photos,
  price = EXCLUDED.price,
  premium_features = EXCLUDED.premium_features;
