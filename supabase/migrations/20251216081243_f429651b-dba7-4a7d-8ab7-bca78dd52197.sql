-- Create table for search agents (email alerts)
CREATE TABLE public.search_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for search agent filters
CREATE TABLE public.search_agent_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.search_agents(id) ON DELETE CASCADE,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('name', 'location')),
  filter_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track filter logic (AND/OR between filters)
CREATE TABLE public.search_agent_filter_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.search_agents(id) ON DELETE CASCADE,
  logic_operator TEXT NOT NULL DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for condolences
CREATE TABLE public.condolences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  message TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for virtual candles
CREATE TABLE public.candles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
  lighter_name TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for cron job settings
CREATE TABLE public.scraper_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_interval TEXT NOT NULL DEFAULT '0 * * * *',
  last_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_agent_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_agent_filter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condolences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_settings ENABLE ROW LEVEL SECURITY;

-- Search agents are public (anyone can create email alerts)
CREATE POLICY "Anyone can create search agents" ON public.search_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Search agents are viewable by email" ON public.search_agents FOR SELECT USING (true);
CREATE POLICY "Search agents can be updated by email match" ON public.search_agents FOR UPDATE USING (true);
CREATE POLICY "Search agents can be deleted" ON public.search_agents FOR DELETE USING (true);

-- Filters follow parent
CREATE POLICY "Filters follow parent agent" ON public.search_agent_filters FOR ALL USING (true);
CREATE POLICY "Filter groups follow parent agent" ON public.search_agent_filter_groups FOR ALL USING (true);

-- Condolences: anyone can create, view approved ones
CREATE POLICY "Anyone can create condolences" ON public.condolences FOR INSERT WITH CHECK (true);
CREATE POLICY "Approved condolences are viewable" ON public.condolences FOR SELECT USING (is_approved = true);

-- Candles: anyone can create and view
CREATE POLICY "Anyone can light candles" ON public.candles FOR INSERT WITH CHECK (true);
CREATE POLICY "Candles are viewable by everyone" ON public.candles FOR SELECT USING (true);

-- Scraper settings: public access for admin
CREATE POLICY "Scraper settings are public" ON public.scraper_settings FOR ALL USING (true);

-- Insert default scraper settings
INSERT INTO public.scraper_settings (cron_interval, is_active) VALUES ('0 * * * *', true);

-- Add new columns to obituaries table for extended information
ALTER TABLE public.obituaries 
  ADD COLUMN IF NOT EXISTS birth_location TEXT,
  ADD COLUMN IF NOT EXISTS death_location TEXT,
  ADD COLUMN IF NOT EXISTS funeral_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS funeral_location TEXT,
  ADD COLUMN IF NOT EXISTS funeral_time TEXT,
  ADD COLUMN IF NOT EXISTS mourners TEXT,
  ADD COLUMN IF NOT EXISTS publication_date DATE;