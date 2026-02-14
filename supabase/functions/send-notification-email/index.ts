import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  agentId: string;
  obituaryIds: string[];
}

interface Obituary {
  id: string;
  name: string;
  death_date: string;
  location: string | null;
  birth_date: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication
    await requireAdmin(req);

    console.log("Starting send-notification-email function");

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      console.error("Missing SMTP configuration");
      throw new Error("SMTP configuration incomplete");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, obituaryIds }: NotificationRequest = await req.json();

    // Validate inputs
    if (!agentId || !Array.isArray(obituaryIds) || obituaryIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "agentId and obituaryIds are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing notification for agent ${agentId} with ${obituaryIds.length} obituaries`);

    const { data: agent, error: agentError } = await supabase
      .from("search_agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      console.error("Agent not found:", agentError);
      throw new Error("Search agent not found");
    }

    const { data: obituaries, error: obitsError } = await supabase
      .from("obituaries")
      .select("id, name, death_date, location, birth_date")
      .in("id", obituaryIds);

    if (obitsError) {
      console.error("Error fetching obituaries:", obitsError);
      throw new Error("Could not fetch obituary details");
    }

    if (!obituaries || obituaries.length === 0) {
      console.log("No obituaries to notify about");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agentName = agent.name || "Ihr Suchagent";
    const obituaryList = (obituaries as Obituary[])
      .map((o) => {
        const location = o.location ? `, ${o.location}` : "";
        const birthDate = o.birth_date ? ` (*${o.birth_date})` : "";
        return `• ${o.name}${birthDate} - verstorben am ${o.death_date}${location}`;
      })
      .join("\n");

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Neue Traueranzeigen gefunden</h2>
          <p>Ihr Suchagent "${agentName}" hat ${obituaries.length} neue Traueranzeige(n) gefunden:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${(obituaries as Obituary[])
              .map(
                (o) => `
              <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <strong>${o.name}</strong><br>
                ${o.birth_date ? `Geboren: ${o.birth_date}<br>` : ""}
                Verstorben: ${o.death_date}<br>
                ${o.location ? `Ort: ${o.location}` : ""}
              </div>
            `
              )
              .join("")}
          </div>
          <p>
            <a href="https://traueranzeigen.lovable.app/suche" style="background: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Zur Suche
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sie erhalten diese E-Mail, weil Sie einen Suchagenten auf traueranzeigen.lovable.app eingerichtet haben.
          </p>
        </body>
      </html>
    `;

    const emailText = `
Neue Traueranzeigen gefunden

Ihr Suchagent "${agentName}" hat ${obituaries.length} neue Traueranzeige(n) gefunden:

${obituaryList}

Besuchen Sie https://traueranzeigen.lovable.app/suche für weitere Details.
    `;

    console.log(`Connecting to SMTP server ${smtpHost}:${smtpPort}`);
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: smtpUsername,
      to: agent.email,
      subject: `${obituaries.length} neue Traueranzeige(n) - ${agentName}`,
      content: emailText,
      html: emailHtml,
    });

    await client.close();

    console.log(`Email sent successfully to ${agent.email}`);

    return new Response(
      JSON.stringify({ success: true, sent: 1, recipient: agent.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
