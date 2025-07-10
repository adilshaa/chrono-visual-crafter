/*
  # Add Subscription Audit Logs Table

  1. New Tables
    - `subscription_audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (text, references user)
      - `subscription_id` (text, subscription identifier)
      - `action` (text, type of action performed)
      - `old_status` (text, previous status)
      - `new_status` (text, new status)
      - `metadata` (jsonb, additional data)
      - `timestamp` (timestamptz, when action occurred)
      - `ip_address` (text, client IP)
      - `user_agent` (text, client user agent)

  2. Security
    - Enable RLS on `subscription_audit_logs` table
    - Add policy for users to read their own audit logs
    - Add policy for service role to manage all audit logs

  3. Indexes
    - Index on user_id for fast user queries
    - Index on subscription_id for subscription-specific queries
    - Index on timestamp for chronological queries
*/

-- Create subscription audit logs table
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  subscription_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'reactivated', 'payment_failed', 'payment_succeeded')),
  old_status text,
  new_status text NOT NULL,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_audit_logs_user_id ON subscription_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_logs_subscription_id ON subscription_audit_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_logs_timestamp ON subscription_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_logs_action ON subscription_audit_logs(action);

-- RLS Policies
CREATE POLICY "Users can view their own audit logs"
  ON subscription_audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all audit logs"
  ON subscription_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update user_subscriptions table to support cancellation workflow
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'grace_period_ends'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN grace_period_ends timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancellation_reason text;
  END IF;
END $$;

-- Update status enum to include new states
DO $$
BEGIN
  -- Check if we need to update the status column constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%user_subscriptions_status%'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
  END IF;
  
  -- Add new constraint with updated values
  ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN ('active', 'cancelling', 'cancelled', 'past_due', 'trialing', 'paused'));
END $$;

-- Create function to handle subscription cancellation
CREATE OR REPLACE FUNCTION handle_subscription_cancellation(
  p_user_id text,
  p_subscription_id text,
  p_reason text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_current_status text;
  v_grace_period_end timestamptz;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM user_subscriptions
  WHERE user_id = p_user_id AND paddle_subscription_id = p_subscription_id;

  -- Calculate grace period end (30 days from now)
  v_grace_period_end := now() + interval '30 days';

  -- Update subscription to cancelling status
  UPDATE user_subscriptions
  SET 
    status = 'cancelling',
    cancelled_at = now(),
    grace_period_ends = v_grace_period_end,
    cancellation_reason = p_reason,
    updated_at = now()
  WHERE user_id = p_user_id AND paddle_subscription_id = p_subscription_id;

  -- Log the cancellation
  INSERT INTO subscription_audit_logs (
    user_id,
    subscription_id,
    action,
    old_status,
    new_status,
    metadata
  ) VALUES (
    p_user_id,
    p_subscription_id,
    'cancelled',
    v_current_status,
    'cancelling',
    jsonb_build_object(
      'cancellation_reason', p_reason,
      'grace_period_ends', v_grace_period_end
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle subscription reactivation
CREATE OR REPLACE FUNCTION handle_subscription_reactivation(
  p_user_id text,
  p_subscription_id text
)
RETURNS void AS $$
DECLARE
  v_current_status text;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM user_subscriptions
  WHERE user_id = p_user_id AND paddle_subscription_id = p_subscription_id;

  -- Update subscription to active status
  UPDATE user_subscriptions
  SET 
    status = 'active',
    cancelled_at = NULL,
    grace_period_ends = NULL,
    cancellation_reason = NULL,
    updated_at = now()
  WHERE user_id = p_user_id AND paddle_subscription_id = p_subscription_id;

  -- Update profile
  UPDATE profiles
  SET 
    subscription_status = 'active',
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log the reactivation
  INSERT INTO subscription_audit_logs (
    user_id,
    subscription_id,
    action,
    old_status,
    new_status,
    metadata
  ) VALUES (
    p_user_id,
    p_subscription_id,
    'reactivated',
    v_current_status,
    'active',
    jsonb_build_object('reactivated_from_grace_period', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically cancel subscriptions after grace period
CREATE OR REPLACE FUNCTION process_expired_grace_periods()
RETURNS void AS $$
BEGIN
  -- Update subscriptions where grace period has expired
  UPDATE user_subscriptions
  SET status = 'cancelled'
  WHERE status = 'cancelling'
    AND grace_period_ends IS NOT NULL
    AND grace_period_ends < now();

  -- Update corresponding profiles
  UPDATE profiles
  SET 
    subscription_status = 'cancelled',
    subscription_plan = 'free',
    updated_at = now()
  WHERE user_id IN (
    SELECT user_id
    FROM user_subscriptions
    WHERE status = 'cancelled'
      AND grace_period_ends IS NOT NULL
      AND grace_period_ends < now()
  );

  -- Log the automatic cancellations
  INSERT INTO subscription_audit_logs (
    user_id,
    subscription_id,
    action,
    old_status,
    new_status,
    metadata
  )
  SELECT 
    user_id,
    paddle_subscription_id,
    'updated',
    'cancelling',
    'cancelled',
    jsonb_build_object('automatic_cancellation', true, 'grace_period_expired', true)
  FROM user_subscriptions
  WHERE status = 'cancelled'
    AND grace_period_ends IS NOT NULL
    AND grace_period_ends < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;