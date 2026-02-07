-- Create table to track scraper runs (regardless of whether new data was found)
CREATE TABLE public.scraper_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'error'
  entries_found INTEGER DEFAULT 0,
  entries_new INTEGER DEFAULT 0,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.scraper_runs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage scraper_runs"
ON public.scraper_runs
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated admins to read
CREATE POLICY "Admins can read scraper_runs"
ON public.scraper_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for efficient queries
CREATE INDEX idx_scraper_runs_source_started ON public.scraper_runs(source, started_at DESC);
CREATE INDEX idx_scraper_runs_started ON public.scraper_runs(started_at DESC);