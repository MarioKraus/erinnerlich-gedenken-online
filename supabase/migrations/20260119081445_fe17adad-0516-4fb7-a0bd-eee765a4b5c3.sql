-- Drop the overly permissive policies that allow anyone to insert
DROP POLICY IF EXISTS "Anyone can create obituaries" ON public.obituaries;
DROP POLICY IF EXISTS "Anyone can create condolences" ON public.condolences;
DROP POLICY IF EXISTS "Anyone can light candles" ON public.candles;

-- Create new policies that only allow service role to insert
-- This forces all inserts to go through the edge function which has rate limiting and spam protection

CREATE POLICY "Service role can create obituaries"
ON public.obituaries
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can create condolences"
ON public.condolences
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can create candles"
ON public.candles
FOR INSERT
TO service_role
WITH CHECK (true);