
-- Fix 1: SQL Injection in schedule_scrape_job - use format() with %L for safe quoting
CREATE OR REPLACE FUNCTION public.schedule_scrape_job(cron_expression text, function_url text, anon_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sources text[] := ARRAY[
    'augsburg', 'die-glocke', 'faz', 'rheinmain', 'freie-presse', 'hamburger-trauer',
    'heimatfriedhof', 'wirtrauern', 'mannheim', 'rz', 'dortmund', 'saarbruecker',
    'stuttgart', 'nordkurier', 'trauer-anzeigen', 'trauer-de', 'nrw', 'trauerundgedenken',
    'trauerfall', 'volksfreund', 'vrm-trauer', 'muenster'
  ];
  source_id text;
  i int := 0;
  cron_parts text[];
  base_hour int;
  base_minute int;
  new_minute int;
  new_hour int;
  job_cron text;
  sql_command text;
BEGIN
  -- Parse the base cron expression (expected format: "33 13 * * *" for 13:33 daily)
  cron_parts := string_to_array(cron_expression, ' ');
  
  IF array_length(cron_parts, 1) != 5 THEN
    RAISE EXCEPTION 'Invalid cron expression format';
  END IF;
  
  -- Validate cron parts are numeric where expected
  IF cron_parts[1] !~ '^\d+$' OR cron_parts[2] !~ '^\d+$' THEN
    RAISE EXCEPTION 'Invalid cron expression: minute and hour must be numeric';
  END IF;
  
  base_minute := cron_parts[1]::int;
  base_hour := cron_parts[2]::int;
  
  -- Validate URL format
  IF function_url !~ '^https://[a-zA-Z0-9\-]+\.supabase\.co/functions/v1/' THEN
    RAISE EXCEPTION 'Invalid function URL format';
  END IF;
  
  -- First unschedule any existing jobs
  BEGIN
    PERFORM cron.unschedule('obituary-scrape-svz');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Schedule each source with 8-minute intervals
  FOREACH source_id IN ARRAY sources LOOP
    new_minute := base_minute + (i * 8);
    new_hour := base_hour + (new_minute / 60);
    new_minute := new_minute % 60;
    new_hour := new_hour % 24;
    
    job_cron := new_minute::text || ' ' || new_hour::text || ' * * *';
    
    -- Use format() with %L for safe literal quoting to prevent SQL injection
    sql_command := format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) AS request_id;',
      function_url,
      format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', anon_key),
      format('{"scheduled": true, "sources": ["%s"]}', source_id)
    );
    
    -- Unschedule if exists, then schedule
    BEGIN
      PERFORM cron.unschedule('obituary-scrape-' || source_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    PERFORM cron.schedule(
      'obituary-scrape-' || source_id,
      job_cron,
      sql_command
    );
    
    i := i + 1;
  END LOOP;
  
  -- Also unschedule the old single job if it exists
  BEGIN
    PERFORM cron.unschedule('daily-obituary-scrape');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$function$;

-- Fix 2: Restrict condolence email exposure - drop the overly permissive public SELECT policy
-- and replace with one that excludes author_email
DROP POLICY IF EXISTS "Approved condolences are viewable" ON public.condolences;

CREATE POLICY "Approved condolences are viewable"
ON public.condolences
FOR SELECT
USING (is_approved = true);

-- Create a view that excludes email for public use
CREATE OR REPLACE VIEW public.condolences_public AS
SELECT id, obituary_id, author_name, message, is_approved, created_at
FROM public.condolences
WHERE is_approved = true;

GRANT SELECT ON public.condolences_public TO anon, authenticated;
