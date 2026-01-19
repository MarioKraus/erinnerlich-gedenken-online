-- Remove the public read policy for scraper_settings
DROP POLICY IF EXISTS "Public can view scraper settings" ON public.scraper_settings;