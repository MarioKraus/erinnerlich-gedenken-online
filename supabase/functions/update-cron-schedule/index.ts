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

    const body = await req.json();
    const { cron_interval, is_active } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate cron_interval format if provided
    if (cron_interval) {
      const cronParts = cron_interval.trim().split(/\s+/);
      if (cronParts.length !== 5) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid cron expression format" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle pause/activate toggle
    if (typeof is_active === 'boolean') {
      console.log(`Toggling cron job active state to: ${is_active}`);
      
      if (is_active) {
        const { data: settings, error: fetchError } = await supabase
          .from('scraper_settings')
          .select('cron_interval')
          .limit(1)
          .single();
        
        if (fetchError) {
          throw new Error(`Failed to fetch settings: ${fetchError.message}`);
        }
        
        const cronExpression = settings?.cron_interval || '33 13 * * *';
        
        const { error: scheduleError } = await supabase.rpc('schedule_scrape_job', {
          cron_expression: cronExpression,
          function_url: `${supabaseUrl}/functions/v1/scrape-obituaries`,
          anon_key: supabaseAnonKey
        });

        if (scheduleError) {
          console.error('Error scheduling job:', scheduleError);
          throw new Error(`Failed to schedule cron job: ${scheduleError.message}`);
        }
        
        console.log('Cron job reactivated with schedule:', cronExpression);
      } else {
        const { error: unscheduleError } = await supabase.rpc('unschedule_scrape_job');
        if (unscheduleError) {
          console.log('Note: Could not unschedule job:', unscheduleError.message);
        } else {
          console.log('Cron job paused (unscheduled)');
        }
      }

      const { error: updateError } = await supabase
        .from('scraper_settings')
        .update({ 
          is_active: is_active, 
          updated_at: new Date().toISOString() 
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (updateError) {
        console.error('Error updating is_active:', updateError);
        throw new Error(`Failed to update settings: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: is_active ? 'Cron job activated' : 'Cron job paused' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cron_interval) {
      return new Response(
        JSON.stringify({ success: false, error: "cron_interval or is_active is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating cron schedule to: ${cron_interval}`);

    const { error: unscheduleError } = await supabase.rpc('unschedule_scrape_job');
    if (unscheduleError) {
      console.log('Note: Could not unschedule existing job (may not exist):', unscheduleError.message);
    }

    const { error: scheduleError } = await supabase.rpc('schedule_scrape_job', {
      cron_expression: cron_interval,
      function_url: `${supabaseUrl}/functions/v1/scrape-obituaries`,
      anon_key: supabaseAnonKey
    });

    if (scheduleError) {
      console.error('Error scheduling new job:', scheduleError);
      throw new Error(`Failed to schedule cron job: ${scheduleError.message}`);
    }

    const { error: updateError } = await supabase
      .from('scraper_settings')
      .update({ 
        cron_interval: cron_interval,
        is_active: true,
        updated_at: new Date().toISOString() 
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    console.error('Error updating cron schedule:', error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
