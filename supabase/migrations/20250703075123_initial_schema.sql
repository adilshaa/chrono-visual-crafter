-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  paddle_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval_type TEXT NOT NULL DEFAULT 'month', -- month, year
  paddle_product_id TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table  
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id UUID NOT NULL,
  paddle_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (disabled for now since no auth)
-- These will need to be updated based on your authentication system
-- CREATE POLICY "Users can view their own profile" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own profile" 
-- ON public.profiles 
-- FOR UPDATE 
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own profile" 
-- ON public.profiles 
-- FOR INSERT 
-- WITH CHECK (auth.uid() = user_id);

-- Create policies for subscription plans (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can view subscription plans'
  ) THEN
    CREATE POLICY "Anyone can view subscription plans" 
    ON public.subscription_plans 
    FOR SELECT 
    USING (is_active = true);
  END IF;
END $$;

-- Create policies for user subscriptions (disabled for now)
-- CREATE POLICY "Users can view their own subscriptions" 
-- ON public.user_subscriptions 
-- FOR SELECT 
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own subscriptions" 
-- ON public.user_subscriptions 
-- FOR INSERT 
-- WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Note: Removed auth trigger since not using Supabase Auth
-- The handle_new_user function and on_auth_user_created trigger are removed

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, description, price, interval_type, features) VALUES
('Free', 'Basic timer functionality', 0.00, 'month', '["Basic timer", "3 custom designs", "Local storage"]'),
('Pro', 'Advanced features and customization', 9.99, 'month', '["Unlimited timers", "All designs", "Cloud sync", "Advanced analytics", "Priority support"]'),
('Premium', 'Everything + team features', 19.99, 'month', '["Everything in Pro", "Team collaboration", "Advanced reporting", "Custom branding", "API access"]')
ON CONFLICT (name) DO NOTHING;