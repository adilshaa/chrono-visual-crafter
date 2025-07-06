-- This migration only adds missing policies and functions
-- Tables already exist from previous migrations

-- Create trigger functions for updated_at timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON public.profiles 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_updated_at') THEN
    CREATE TRIGGER update_subscription_plans_updated_at 
      BEFORE UPDATE ON public.subscription_plans 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_subscriptions_updated_at') THEN
    CREATE TRIGGER update_user_subscriptions_updated_at 
      BEFORE UPDATE ON public.user_subscriptions 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_text_settings_updated_at') THEN
    CREATE TRIGGER update_saved_text_settings_updated_at 
      BEFORE UPDATE ON public.saved_text_settings 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert some default subscription plans (if not exist)
INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Free', 'Basic features for getting started', 0, 'USD', 'month', '["Basic counter", "Standard designs", "Limited exports"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Free');

INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Pro', 'Advanced features for professionals', 9.99, 'USD', 'month', '["Advanced counter", "All designs", "Unlimited exports", "Custom fonts", "Save presets"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Pro');

INSERT INTO public.subscription_plans (name, description, price, currency, interval_type, features, is_active) 
SELECT 'Premium', 'All features for power users', 19.99, 'USD', 'month', '["Everything in Pro", "Priority support", "Advanced animations", "Team collaboration", "Custom branding"]', true
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Premium');

-- Add updated_at column to subscription_plans if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscription_plans' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create trigger for updated_at on subscription_plans if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_updated_at') THEN
    CREATE TRIGGER update_subscription_plans_updated_at 
      BEFORE UPDATE ON public.subscription_plans 
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
