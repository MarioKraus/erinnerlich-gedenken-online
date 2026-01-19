-- Create a rate limiting table to track submissions
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT NOT NULL,
    action_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role has full access to rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (ip_hash, action_type, created_at DESC);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 hour';
END;
$$;

-- Create a function to check rate limits (max 5 per hour per IP/action)
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip_hash TEXT, p_action TEXT, p_max_requests INT DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    recent_count INT;
BEGIN
    -- Cleanup old entries first
    PERFORM cleanup_old_rate_limits();
    
    -- Count recent requests
    SELECT COUNT(*) INTO recent_count
    FROM public.rate_limits
    WHERE ip_hash = p_ip_hash
      AND action_type = p_action
      AND created_at > now() - interval '1 hour';
    
    -- If under limit, record this request and return true
    IF recent_count < p_max_requests THEN
        INSERT INTO public.rate_limits (ip_hash, action_type)
        VALUES (p_ip_hash, p_action);
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;