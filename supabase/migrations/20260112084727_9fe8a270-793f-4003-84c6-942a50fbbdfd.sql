-- Allow public read access to scraper_settings for the admin dashboard display
-- This only exposes non-sensitive configuration data (schedule, status)
CREATE POLICY "Public can view scraper settings"
ON public.scraper_settings
FOR SELECT
TO anon, authenticated
USING (true);