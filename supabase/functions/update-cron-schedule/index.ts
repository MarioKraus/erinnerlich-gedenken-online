import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cron_interval } = await req.json();
    
    if (!cron_interval) {
      return new Response(
        JSON.stringify({ success: false, error: "cron_interval is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating cron schedule to: ${cron_interval}`);

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, unschedule the existing job if it exists
    const { error: unscheduleError } = await supabase.rpc('unschedule_scrape_job');
    if (unscheduleError) {
      console.log('Note: Could not unschedule existing job (may not exist):', unscheduleError.message);
    }

    // Schedule new cron job
    const { error: scheduleError } = await supabase.rpc('schedule_scrape_job', {
      cron_expression: cron_interval,
      function_url: `${supabaseUrl}/functions/v1/scrape-obituaries`,
      anon_key: supabaseAnonKey
    });

    if (scheduleError) {
      console.error('Error scheduling new job:', scheduleError);
      throw new Error(`Failed to schedule cron job: ${scheduleError.message}`);
    }

    // Update scraper_settings table
    const { error: updateError } = await supabase
      .from('scraper_settings')
      .update({ 
        cron_interval: cron_interval, 
        updated_at: new Date().toISOString() 
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (updateError) {
      console.error('Error updating scraper_settings:', updateError);
    }

    console.log('Cron schedule updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cron schedule updated to: ${cron_interval}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating cron schedule:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
