-- Make paddle_product_id unique for foreign key reference
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_paddle_product_id_unique UNIQUE (paddle_product_id); 