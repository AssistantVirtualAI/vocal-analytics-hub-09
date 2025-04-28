
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { limit = 10, offset = 0, sort = 'date', order = 'desc', search = '' } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create query
    let query = supabase
      .from("calls_view")
      .select("*", { count: 'exact' })
      .order(sort, { ascending: order === 'asc' });
    
    // Add search filter if provided
    if (search && search.trim() !== '') {
      // Search in transcript, summary, customer_name, agent_name
      query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%,transcript.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: calls, error, count } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({ calls, count }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-calls function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
