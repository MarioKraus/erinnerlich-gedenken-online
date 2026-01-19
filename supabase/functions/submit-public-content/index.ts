import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

interface SubmitRequest {
  type: "obituary" | "condolence" | "candle";
  data: Record<string, unknown>;
}

function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback to a hash of user-agent + timestamp to prevent unlimited submissions
  const userAgent = req.headers.get("user-agent") || "unknown";
  return userAgent.substring(0, 50);
}

// Simple hash function for IP anonymization
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Basic spam detection
function containsSpam(text: string): boolean {
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|winner|prize|click here|free money)\b/i,
    /https?:\/\/[^\s]+/g, // URLs (be careful, some URLs might be legitimate)
    /(.)\1{10,}/g, // Repeated characters
  ];
  
  // Only check for obvious spam patterns, allow most content
  const lowercaseText = text.toLowerCase();
  if (spamPatterns[0].test(lowercaseText)) return true;
  
  // Check for excessive repeated characters
  if (spamPatterns[2].test(text)) return true;
  
  return false;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SubmitRequest = await req.json();
    const { type, data } = body;

    // Get and hash client IP
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);

    // Rate limit configuration per type
    const rateLimits: Record<string, number> = {
      obituary: 3,    // Max 3 obituaries per hour
      condolence: 10, // Max 10 condolences per hour
      candle: 20,     // Max 20 candles per hour
    };

    const maxRequests = rateLimits[type] || 5;

    // Check rate limit
    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      { p_ip_hash: ipHash, p_action: type, p_max_requests: maxRequests }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue anyway on error, don't block users
    } else if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
          code: "RATE_LIMITED"
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Handle each content type
    if (type === "obituary") {
      const { name, birth_date, death_date, location, text, photo_url } = data as {
        name: string;
        birth_date?: string;
        death_date: string;
        location?: string;
        text?: string;
        photo_url?: string;
      };

      // Validate required fields
      if (!name?.trim() || !death_date) {
        return new Response(
          JSON.stringify({ error: "Name und Sterbedatum sind erforderlich." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for spam in text
      if (text && containsSpam(text)) {
        return new Response(
          JSON.stringify({ error: "Der Text enthält ungültige Inhalte." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: result, error } = await supabase
        .from("obituaries")
        .insert({
          name: name.trim(),
          birth_date: birth_date || null,
          death_date,
          location: location?.trim() || null,
          text: text?.trim() || null,
          photo_url: photo_url?.trim() || null,
          source: "Erinnerlich",
        })
        .select()
        .single();

      if (error) {
        console.error("Insert obituary error:", error);
        return new Response(
          JSON.stringify({ error: "Traueranzeige konnte nicht erstellt werden." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (type === "condolence") {
      const { obituary_id, author_name, author_email, message } = data as {
        obituary_id: string;
        author_name: string;
        author_email?: string;
        message: string;
      };

      // Validate required fields
      if (!obituary_id || !author_name?.trim() || !message?.trim()) {
        return new Response(
          JSON.stringify({ error: "Alle Pflichtfelder müssen ausgefüllt werden." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for spam
      if (containsSpam(message) || containsSpam(author_name)) {
        return new Response(
          JSON.stringify({ error: "Die Nachricht enthält ungültige Inhalte." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("condolences")
        .insert({
          obituary_id,
          author_name: author_name.trim(),
          author_email: author_email || null,
          message: message.trim(),
          is_approved: false, // Requires moderation!
        });

      if (error) {
        console.error("Insert condolence error:", error);
        return new Response(
          JSON.stringify({ error: "Kondolenz konnte nicht gesendet werden." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Ihre Kondolenz wurde eingereicht und wird nach Prüfung veröffentlicht."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (type === "candle") {
      const { obituary_id, lighter_name, message } = data as {
        obituary_id: string;
        lighter_name?: string;
        message?: string;
      };

      // Validate required fields
      if (!obituary_id) {
        return new Response(
          JSON.stringify({ error: "Traueranzeige nicht gefunden." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for spam if message provided
      if ((message && containsSpam(message)) || (lighter_name && containsSpam(lighter_name))) {
        return new Response(
          JSON.stringify({ error: "Die Nachricht enthält ungültige Inhalte." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("candles")
        .insert({
          obituary_id,
          lighter_name: lighter_name?.trim() || null,
          message: message?.trim() || null,
        });

      if (error) {
        console.error("Insert candle error:", error);
        return new Response(
          JSON.stringify({ error: "Kerze konnte nicht angezündet werden." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ungültiger Anfrage-Typ." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Submit public content error:", error);
    return new Response(
      JSON.stringify({ error: "Ein Fehler ist aufgetreten." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});