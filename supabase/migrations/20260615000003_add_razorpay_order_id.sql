-- Add razorpay_order_id to orders table
ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT;

-- Update plan prices in database to match the new rates
UPDATE public.plans SET price = 39.00 WHERE plan_name = 'Basic';
UPDATE public.plans SET price = 79.00 WHERE plan_name = 'Premium';
UPDATE public.plans SET price = 149.00 WHERE plan_name = 'Luxury';
