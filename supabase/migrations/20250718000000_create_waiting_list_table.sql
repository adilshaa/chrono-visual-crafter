-- Create waiting list table with email field
CREATE TABLE IF NOT EXISTS public.waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add comment to the table
COMMENT ON TABLE public.waiting_list IS 'Table for storing waiting list emails';

-- Add RLS (Row Level Security) policies
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (anyone can join the waiting list)
CREATE POLICY "Allow public inserts to waiting_list" 
ON public.waiting_list 
FOR INSERT 
TO public
WITH CHECK (true);

-- -- Create policy for admins to view and manage the waiting list
-- CREATE POLICY "Allow admins to manage waiting_list" 
-- ON public.waiting_list 
-- FOR ALL 
-- TO authenticated
-- USING (auth.jwt() ->> 'role' = 'admin');

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS waiting_list_email_idx ON public.waiting_list (email);