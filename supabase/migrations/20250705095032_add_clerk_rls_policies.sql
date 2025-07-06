-- Add RLS policies for Clerk authentication
-- For now, we'll use a simpler approach that works with Clerk

-- Option 1: Temporarily disable RLS for development (uncomment if needed)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saved_text_settings DISABLE ROW LEVEL SECURITY;

-- Option 2: Create policies that allow all operations (for development)
-- This is less secure but will work immediately
CREATE POLICY "Allow all operations on profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_subscriptions" ON public.user_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on saved_text_settings" ON public.saved_text_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Note: Subscription plans already have a public read policy from previous migrations

-- For production, you would want to implement proper Clerk JWT verification
-- This would require:
-- 1. Configuring Supabase to accept Clerk JWT tokens
-- 2. Using current_setting('request.jwt.claims') to get the user ID
-- 3. Creating proper user-specific policies
