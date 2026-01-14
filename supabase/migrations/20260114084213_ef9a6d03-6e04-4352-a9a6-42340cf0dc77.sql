-- Create a function to query cron jobs that can be called via RPC
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.command::text,
    j.active
  FROM cron.job j
  ORDER BY j.jobid;
END;
$$;