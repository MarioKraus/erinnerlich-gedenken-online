import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication
    await requireAdmin(req);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: jobs, error } = await supabase.rpc('get_cron_jobs');

    if (error) {
      console.error('Error fetching cron jobs:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, jobs: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedJobs = (jobs || []).map((job: any) => {
      let targetFunction = 'Unknown';
      let targetSources: string[] = [];
      
      const urlMatch = job.command?.match(/url:='([^']+)'/);
      if (urlMatch) {
        const url = urlMatch[1];
        const functionName = url.split('/functions/v1/')[1];
        targetFunction = functionName || url;
      }
      
      const sourcesMatch = job.command?.match(/"sources":\s*\[([^\]]+)\]/);
      if (sourcesMatch) {
        targetSources = sourcesMatch[1]
          .split(',')
          .map((s: string) => s.trim().replace(/"/g, ''));
      }
      
      return {
        id: job.jobid,
        name: job.jobname,
        schedule: job.schedule,
        active: job.active,
        target_function: targetFunction,
        target_sources: targetSources,
        raw_command: job.command?.substring(0, 300) + (job.command?.length > 300 ? '...' : '')
      };
    });

    return new Response(
      JSON.stringify({ success: true, jobs: parsedJobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    console.error('Error fetching cron jobs:', error);
    return new Response(
      JSON.stringify({ success: false, error: message, jobs: [] }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
