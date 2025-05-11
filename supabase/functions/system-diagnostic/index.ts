
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting system diagnostic function");
    
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      environment: {},
      database: {},
      api: {},
      agents: []
    };
    
    // 1. Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const elevenLabsApiKey1 = Deno.env.get('ELEVENLABS_API_KEY');
    const elevenLabsApiKey2 = Deno.env.get('ELEVEN_LABS_API_KEY');
    
    diagnosticResults.environment = {
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseServiceKeyConfigured: !!supabaseServiceKey,
      elevenLabsApiKeyConfigured: !!(elevenLabsApiKey1 || elevenLabsApiKey2),
      activeElevenLabsKeyName: elevenLabsApiKey1 ? 'ELEVENLABS_API_KEY' : (elevenLabsApiKey2 ? 'ELEVEN_LABS_API_KEY' : 'None')
    };
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }
    
    const apiKey = elevenLabsApiKey1 || elevenLabsApiKey2;
    if (!apiKey) {
      throw new Error("ElevenLabs API key missing");
    }
    
    // 2. Check ElevenLabs API connectivity
    try {
      const apiResponse = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey
        }
      });
      
      diagnosticResults.api.elevenlabsStatus = apiResponse.status;
      diagnosticResults.api.elevenlabsConnected = apiResponse.ok;
      
      if (apiResponse.ok) {
        const userData = await apiResponse.json();
        diagnosticResults.api.userInfo = {
          tier: userData.subscription?.tier || 'unknown',
          characterCount: userData.subscription?.character_count || 0,
          characterLimit: userData.subscription?.character_limit || 0
        };
      } else {
        const errorText = await apiResponse.text();
        diagnosticResults.api.error = errorText;
      }
    } catch (apiError) {
      diagnosticResults.api.error = apiError.message;
      diagnosticResults.api.elevenlabsConnected = false;
    }
    
    // 3. Check database tables and data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check tables - using a more portable approach since rpc might not be available
    try {
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('id')
        .limit(1);
        
      diagnosticResults.database.callsTableExists = !callsError;
    } catch (error) {
      diagnosticResults.database.callsTableExists = false;
      diagnosticResults.database.tableCheckError = error.message;
    }
    
    // Count records
    try {
      const { count: callsCount, error: countError } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });
        
      diagnosticResults.database.callsCount = callsCount || 0;
      diagnosticResults.database.countError = countError?.message;
    } catch (error) {
      diagnosticResults.database.countError = error.message;
    }
    
    // Check agents
    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, provider, external_id');
        
      diagnosticResults.agents = agents || [];
      diagnosticResults.database.agentsCount = agents?.length || 0;
      diagnosticResults.database.agentsError = agentsError?.message;
    } catch (error) {
      diagnosticResults.database.agentsError = error.message;
    }
    
    // Check sync status
    try {
      const { data: syncStatus, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('provider', 'elevenlabs')
        .maybeSingle();
      
      diagnosticResults.database.syncStatus = syncStatus || { status: 'unknown' };
      diagnosticResults.database.syncError = syncError?.message;
    } catch (error) {
      diagnosticResults.database.syncError = error.message;
    }
    
    // Return full diagnostic info
    return new Response(
      JSON.stringify(diagnosticResults),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in system-diagnostic function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
