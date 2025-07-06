-- Fix subscription_plans table to properly handle both product_id and price_id

-- Step 0: Create the subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval_type TEXT NOT NULL DEFAULT 'month',
  paddle_product_id TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 1: Rename the existing paddle_product_id column to paddle_price_id (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscription_plans' AND column_name='paddle_product_id'
  ) THEN
    ALTER TABLE public.subscription_plans RENAME COLUMN paddle_product_id TO paddle_price_id;
  END IF;
END $$;

-- Step 2: Add the new paddle_product_id column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscription_plans' AND column_name='paddle_product_id'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN paddle_product_id TEXT;
  END IF;
END $$;

-- Step 3: Insert default subscription plans if they don't exist
INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Free', 'Basic features for getting started', 0, 'USD', 'month', '["Basic counter", "Standard designs", "Limited exports"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE LOWER(name) = 'free');

INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Basic', 'Basic timer functionality', 9.99, 'USD', 'month', '["Basic timer", "3 custom designs", "Local storage"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE LOWER(name) = 'basic');

INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Pro', 'Advanced features for professionals', 9.99, 'USD', 'month', '["Advanced counter", "All designs", "Unlimited exports", "Custom fonts", "Save presets"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE LOWER(name) = 'pro');

INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Premium', 'All features for power users', 19.99, 'USD', 'month', '["Everything in Pro", "Priority support", "Advanced animations", "Team collaboration", "Custom branding"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE LOWER(name) = 'premium');

-- Step 4: Update existing data with the correct product IDs
-- Basic plan
UPDATE public.subscription_plans 
SET paddle_product_id = 'pro_01jz838yvwd9vbw6f9kxb8azxp'
WHERE LOWER(name) = 'basic' OR LOWER(name) = 'free';

-- Premium plan  
UPDATE public.subscription_plans 
SET paddle_product_id = 'pro_01jzd18ccw9bacpda72n20z7c8'
WHERE LOWER(name) = 'premium';

-- Pro plan
UPDATE public.subscription_plans 
SET paddle_product_id = 'pro_01jzd18ccw9bacpda72n20z7c8'
WHERE LOWER(name) = 'pro';

-- Step 5: Add comments to clarify the column usage
COMMENT ON COLUMN public.subscription_plans.paddle_product_id IS 'Paddle product ID (e.g., pro_01jz838yvwd9vbw6f9kxb8azxp)';
COMMENT ON COLUMN public.subscription_plans.paddle_price_id IS 'Paddle price ID (e.g., pri_01jz83w5yaedw208g22mke3k9j)';

-- Step 6: Add an index on paddle_product_id for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_paddle_product_id 
ON public.subscription_plans(paddle_product_id);

-- Step 7: Enable RLS and create policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription plans (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view subscription plans' AND tablename = 'subscription_plans'
  ) THEN
    EXECUTE $q$
      CREATE POLICY "Anyone can view subscription plans"
      ON public.subscription_plans
      FOR SELECT
      USING (is_active = true)
    $q$;
  END IF;
END $$; 