-- Update Paddle product IDs for subscription plans
UPDATE public.subscription_plans
SET paddle_product_id = 'pri_01jzd18ccw9bacpda72n20z7c8'
WHERE LOWER(name) = 'premium';

UPDATE public.subscription_plans
SET paddle_product_id = 'pri_01jz83w5yaedw208g22mke3k9j'
WHERE LOWER(name) = 'basic' OR LOWER(name) = 'free';
