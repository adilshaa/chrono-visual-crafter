/*
  # Create webhook logs table

  1. New Tables
    - `webhook_logs`
      - `id` (uuid, primary key)
      - `event_id` (text, unique) - Paddle event ID for deduplication
      - `event_type` (text) - Type of webhook event
      - `payload` (jsonb) - Full webhook payload
      - `status` (text) - Processing status (pending, success, failed)
      - `error_message` (text) - Error details if processing failed
      - `processed_at` (timestamp) - When the webhook was processed
      - `created_at` (timestamp) - When the webhook was received
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `webhook_logs` table
    - Add policy for service role access only

  3. Indexes
    - Index on event_id for fast lookups
    - Index on event_type for filtering
    - Index on status for monitoring
    - Index on created_at for time-based queries
*/

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON public.webhook_logs(processed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access (webhooks should only be accessible by service role)
CREATE POLICY "Service role can manage webhook logs"
  ON public.webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to view their own webhook events (optional)
CREATE POLICY "Users can view webhook logs related to their data"
  ON public.webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to see webhook logs that contain their user_id in the payload
    payload->>'user_id' = auth.uid()::text OR
    payload->'data'->'custom_data'->>'userId' = auth.uid()::text
  );

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_webhook_logs_updated_at
  BEFORE UPDATE ON public.webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up old webhook logs (optional - keeps last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.webhook_logs 
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Create a view for webhook statistics (optional)
CREATE OR REPLACE VIEW public.webhook_stats AS
SELECT 
  event_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
FROM public.webhook_logs 
WHERE created_at > now() - interval '7 days'
GROUP BY event_type, status
ORDER BY event_type, status;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.webhook_stats TO authenticated;