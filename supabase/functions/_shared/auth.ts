import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function requireAdmin(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error('Unauthorized');
  }

  const userId = data.claims.sub as string;

  // Verify admin role using service role client
  const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: hasRole } = await serviceClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (!hasRole) {
    throw new Error('Forbidden - Admin access required');
  }

  return { userId };
}
