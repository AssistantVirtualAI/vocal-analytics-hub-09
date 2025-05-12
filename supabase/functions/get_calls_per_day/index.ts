import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver-improved.ts";

// Define CORS headers directly in this file to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Edge function get_calls_per_day called");
    
    let body: { days?: number; agentId?: string; timeRange?: string; startDate?: string; endDate?: string };
    
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const externalAgentId = body.agentId; // Renommé pour plus de clarté
    
    if (!externalAgentId) {
      console.error("Missing agentId in request body");
      return new Response(
        JSON.stringify({ error: "MISSING_PARAMETER - agentId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const days = body.days || 14;
    const startDate = body.startDate;
    const endDate = body.endDate;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Résoudre l'ID externe de l'agent en UUID interne
    console.log(`Attempting to resolve externalAgentId: ${externalAgentId} to internal UUID`);
    const internalAgentUUID = await getAgentUUIDByExternalId(supabase, externalAgentId);

    if (!internalAgentUUID) {
      console.error(`Could not resolve externalAgentId '${externalAgentId}' to an internal UUID. Agent might not exist or mapping is incorrect.`);
      // Retourner une liste vide ou une erreur 404 selon la logique métier souhaitée
      return new Response(
        JSON.stringify({ 
          error: `Agent not found for external ID: ${externalAgentId}`,
          callsPerDay: {},
          timeRange: { from: '', to: '', days }, // Fournir une structure vide pour éviter les erreurs frontend
          total: 0,
          agentId: externalAgentId // Retourner l'ID externe pour référence
        }),
        { 
          status: 404, // Ou 200 avec des données vides si préféré
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log(`Resolved externalAgentId ${externalAgentId} to internalAgentUUID: ${internalAgentUUID}`);

    const now = new Date();
    let fromDate = new Date();
    fromDate.setDate(now.getDate() - days);
    
    if (startDate) {
      fromDate = new Date(startDate);
    }
    
    let toDate = now;
    if (endDate) {
      toDate = new Date(endDate);
    }
    
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    console.log(`Fetching calls from ${fromDateStr} to ${toDateStr} for internal agent UUID ${internalAgentUUID}`);
    
    let query = supabase.from('calls_view') // Assurez-vous que c'est la bonne table/vue
                        .select('created_at', { count: 'exact' }) // 'date' a été remplacé par 'created_at' pour correspondre à la vue
                        .eq('agent_id', internalAgentUUID) // Utilisation de l'UUID interne
                        .gte('created_at', fromDateStr)
                        .lte('created_at', toDateStr);
    
    const { data: calls, error, count } = await query;
    
    if (error) {
      console.error("Error fetching calls:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error }), // Inclure plus de détails sur l'erreur
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const callsPerDay: Record<string, number> = {};
    const currentDateLoop = new Date(fromDate);
    while (currentDateLoop <= toDate) {
      const dateStr = currentDateLoop.toISOString().split('T')[0];
      callsPerDay[dateStr] = 0;
      currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }
    
    calls?.forEach(call => {
      if (call.created_at) {
        const callDate = new Date(call.created_at);
        const dateStr = callDate.toISOString().split('T')[0];
        if (callsPerDay.hasOwnProperty(dateStr)) {
            callsPerDay[dateStr]++;
        }
      }
    });
    
    const response = {
      callsPerDay,
      timeRange: {
        from: fromDateStr,
        to: toDateStr,
        days
      },
      total: count || 0,
      agentId: externalAgentId, // Retourner l'ID externe pour référence
      internalAgentUUID // Optionnel: pour débogage
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Unhandled error in get_calls_per_day function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
