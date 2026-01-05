-- Create helper functions for cron job management

-- Function to unschedule the scrape job
CREATE OR REPLACE FUNCTION public.unschedule_scrape_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  PERFORM cron.unschedule('daily-obituary-scrape');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$func$;

-- Function to schedule the scrape job with dynamic SQL building
CREATE OR REPLACE FUNCTION public.schedule_scrape_job(
  cron_expression text,
  function_url text,
  anon_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  sql_command text;
BEGIN
  sql_command := 'SELECT net.http_post(url := ''' || function_url || ''', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer ' || anon_key || '"}''::jsonb, body := ''{"scheduled": true}''::jsonb) AS request_id;';
  
  PERFORM cron.schedule(
    'daily-obituary-scrape',
    cron_expression,
    sql_command
  );
END;
$func$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.unschedule_scrape_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_scrape_job(text, text, text) TO service_role;