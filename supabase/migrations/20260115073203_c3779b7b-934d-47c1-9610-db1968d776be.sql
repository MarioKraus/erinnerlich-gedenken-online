-- Drop old schedule_scrape_job and create new one that schedules all sources with 8-minute offsets
DROP FUNCTION IF EXISTS public.schedule_scrape_job(text, text, text);

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
    'stuttgart', 'svz', 'trauer-anzeigen', 'trauer-de', 'nrw', 'trauerundgedenken',
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
  
  base_minute := cron_parts[1]::int;
  base_hour := cron_parts[2]::int;
  
  -- Schedule each source with 8-minute intervals
  FOREACH source_id IN ARRAY sources LOOP
    -- Calculate offset: source 0 = base time, source 1 = +8 min, source 2 = +16 min, etc.
    new_minute := base_minute + (i * 8);
    new_hour := base_hour + (new_minute / 60);
    new_minute := new_minute % 60;
    new_hour := new_hour % 24;
    
    job_cron := new_minute::text || ' ' || new_hour::text || ' * * *';
    
    sql_command := 'SELECT net.http_post(url := ''' || function_url || ''', headers := ''{"Content-Type": "application/json", "Authorization": "Bearer ' || anon_key || '"}''::jsonb, body := ''{"scheduled": true, "sources": ["' || source_id || '"]}''::jsonb) AS request_id;';
    
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

-- Update unschedule to remove all individual source jobs
DROP FUNCTION IF EXISTS public.unschedule_scrape_job();

CREATE OR REPLACE FUNCTION public.unschedule_scrape_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sources text[] := ARRAY[
    'augsburg', 'die-glocke', 'faz', 'rheinmain', 'freie-presse', 'hamburger-trauer',
    'heimatfriedhof', 'wirtrauern', 'mannheim', 'rz', 'dortmund', 'saarbruecker',
    'stuttgart', 'svz', 'trauer-anzeigen', 'trauer-de', 'nrw', 'trauerundgedenken',
    'trauerfall', 'volksfreund', 'vrm-trauer', 'muenster'
  ];
  source_id text;
BEGIN
  -- Unschedule all individual source jobs
  FOREACH source_id IN ARRAY sources LOOP
    BEGIN
      PERFORM cron.unschedule('obituary-scrape-' || source_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
  
  -- Also try to unschedule the old single job
  BEGIN
    PERFORM cron.unschedule('daily-obituary-scrape');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$function$;