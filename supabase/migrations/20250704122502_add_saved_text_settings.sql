-- Create table for saving text settings for paid users
CREATE TABLE public.saved_text_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.saved_text_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for saved text settings (disabled for now since no auth)
-- These will need to be updated based on your authentication system
-- CREATE POLICY "Users can view their own text settings" 
--   ON public.saved_text_settings 
--   FOR SELECT 
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can create their own text settings" 
--   ON public.saved_text_settings 
--   FOR INSERT 
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own text settings" 
--   ON public.saved_text_settings 
--   FOR UPDATE 
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own text settings" 
--   ON public.saved_text_settings 
--   FOR DELETE 
--   USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_saved_text_settings_updated_at 
  BEFORE UPDATE ON public.saved_text_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_subscriptions table to allow updates (needed for subscription webhook)
-- Note: This policy is disabled since we're not using auth
-- DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.user_subscriptions;
-- CREATE POLICY "Users can update their own subscriptions" 
--   ON public.user_subscriptions 
--   FOR UPDATE 
--   USING ((auth.uid())::text = (user_id)::text);
