-- Add paddle_product_id and payment_interval to user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS paddle_product_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_interval TEXT;

-- Add foreign key constraint from user_subscriptions.paddle_product_id to subscription_plans.paddle_product_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_paddle_product_id_fkey'
  ) THEN
    ALTER TABLE public.user_subscriptions
      ADD CONSTRAINT user_subscriptions_paddle_product_id_fkey
      FOREIGN KEY (paddle_product_id)
      REFERENCES public.subscription_plans(paddle_product_id)
      ON DELETE SET NULL;
  END IF;
END $$; 