
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getAgentUUIDByExternalId, createServiceClient } from "../_shared/agent-resolver-improved.ts";
import { safeGetEnv } from "../_shared/env.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting system diagnostic function");
    
    const startTime = Date.now();
    
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      environment: {},
      database: {},
      api: {},
      agents: [],
      systemInfo: {}
    };
    
    // 1. Check environment variables
    console.log("Checking environment variables");
    const supabaseUrl = safeGetEnv('SUPABASE_URL');
    const supabaseServiceKey = safeGetEnv('SUPABASE_SERVICE_ROLE_KEY');
    const elevenLabsApiKey1 = safeGetEnv('ELEVENLABS_API_KEY');
    const elevenLabsApiKey2 = safeGetEnv('ELEVEN_LABS_API_KEY');
    const openaiApiKey = safeGetEnv('OPENAI_API_KEY');
    const anthropicApiKey = safeGetEnv('ANTHROPIC_API_KEY');
    
    diagnosticResults.environment = {
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseServiceKeyConfigured: !!supabaseServiceKey,
      elevenLabsApiKeyConfigured: !!(elevenLabsApiKey1 || elevenLabsApiKey2),
      activeElevenLabsKeyName: elevenLabsApiKey1 ? 'ELEVENLABS_API_KEY' : (elevenLabsApiKey2 ? 'ELEVEN_LABS_API_KEY' : 'None'),
      aiKeys: {
        openaiConfigured: !!openaiApiKey,
        anthropicConfigured: !!anthropicApiKey
      }
    };
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }
    
    const apiKey = elevenLabsApiKey1 || elevenLabsApiKey2;
    if (!apiKey) {
      console.warn("ElevenLabs API key missing, API diagnostic will be skipped");
    }
    
    // 2. Check ElevenLabs API connectivity (if key available)
    console.log("Checking ElevenLabs API connectivity");
    if (apiKey) {
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
            characterLimit: userData.subscription?.character_limit || 0,
            nextResetDate: userData.subscription?.next_character_count_reset_unix || null
          };
          
          // Check voice availability
          try {
            const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'xi-api-key': apiKey
              }
            });
            
            if (voicesResponse.ok) {
              const voicesData = await voicesResponse.json();
              diagnosticResults.api.voicesAvailable = voicesData.voices?.length || 0;
            }
          } catch (voicesError) {
            console.error("Error fetching voices:", voicesError);
            diagnosticResults.api.voicesError = voicesError instanceof Error ? voicesError.message : String(voicesError);
          }
        } else {
          const errorText = await apiResponse.text();
          diagnosticResults.api.error = errorText;
        }
      } catch (apiError) {
        console.error("ElevenLabs API error:", apiError);
        diagnosticResults.api.error = apiError instanceof Error ? apiError.message : String(apiError);
        diagnosticResults.api.elevenlabsConnected = false;
      }
    } else {
      diagnosticResults.api.elevenlabsConnected = false;
      diagnosticResults.api.missingKey = true;
    }
    
    // 3. Check database tables and data
    console.log("Checking database tables");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check Deno runtime information
    try {
      diagnosticResults.systemInfo = {
        denoVersion: Deno.version.deno,
        v8Version: Deno.version.v8,
        typescript: Deno.version.typescript,
        runtime: "Deno",
        region: Deno.env.get("DENO_REGION") || "unknown"
      };
    } catch (sysError) {
      console.error("Error getting system information:", sysError);
    }
    
    // Check tables - using a more portable approach
    try {
      console.log("Checking tables existence");
      
      // Check multiple important tables
      const tables = ['calls', 'agents', 'organizations', 'sync_status', 'customers'];
      const tableStatus = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
            
          tableStatus[`${table}Exists`] = !error;
          if (error) {
            console.warn(`Error checking ${table} table:`, error.message);
          }
        } catch (tableError) {
          console.error(`Error checking ${table} table:`, tableError);
          tableStatus[`${table}Exists`] = false;
          tableStatus[`${table}Error`] = tableError instanceof Error ? tableError.message : String(tableError);
        }
      }
      
      diagnosticResults.database = {
        ...tableStatus
      };
    } catch (error) {
      console.error("Error checking tables:", error);
      diagnosticResults.database.tableCheckError = error instanceof Error ? error.message : String(error);
    }
    
    // Count records
    console.log("Counting records in tables");
    try {
      const counts = {};
      
      // Count calls
      const { count: callsCount, error: callsError } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });
        
      counts.callsCount = callsCount || 0;
      if (callsError) {
        counts.callsCountError = callsError.message;
      }
      
      // Count agents
      const { count: agentsCount, error: agentsCountError } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true });
        
      counts.agentsCount = agentsCount || 0;
      if (agentsCountError) {
        counts.agentsCountError = agentsCountError.message;
      }
      
      // Count organizations
      const { count: orgsCount, error: orgsCountError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
        
      counts.organizationsCount = orgsCount || 0;
      if (orgsCountError) {
        counts.organizationsCountError = orgsCountError.message;
      }
      
      diagnosticResults.database = {
        ...diagnosticResults.database,
        ...counts
      };
    } catch (countError) {
      console.error("Error counting records:", countError);
      diagnosticResults.database.countError = countError instanceof Error ? countError.message : String(countError);
    }
    
    // Check agents
    console.log("Checking agents configuration");
    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, provider, external_id, status');
        
      if (agentsError) {
        console.error("Error fetching agents:", agentsError);
        diagnosticResults.database.agentsError = agentsError.message;
      } else {
        diagnosticResults.agents = agents || [];
        diagnosticResults.database.agentsCount = agents?.length || 0;
        
        // Test agent resolver for each agent with external_id
        const agentsWithExternalId = agents?.filter(a => a.external_id) || [];
        if (agentsWithExternalId.length > 0) {
          console.log("Testing agent resolver with existing external IDs");
          
          const resolverTests = [];
          for (const agent of agentsWithExternalId.slice(0, 3)) { // Test up to 3 agents
            try {
              const resolvedId = await getAgentUUIDByExternalId(supabase, agent.external_id);
              resolverTests.push({
                externalId: agent.external_id,
                expectedId: agent.id,
                resolvedId: resolvedId,
                success: resolvedId === agent.id
              });
            } catch (resolverError) {
              resolverTests.push({
                externalId: agent.external_id,
                expectedId: agent.id,
                error: resolverError instanceof Error ? resolverError.message : String(resolverError),
                success: false
              });
            }
          }
          
          diagnosticResults.agentResolver = {
            testsRun: resolverTests.length,
            successCount: resolverTests.filter(t => t.success).length,
            tests: resolverTests
          };
        }
      }
    } catch (agentsError) {
      console.error("Error processing agents:", agentsError);
      diagnosticResults.database.agentsFetchError = agentsError instanceof Error ? agentsError.message : String(agentsError);
    }
    
    // Check sync status
    console.log("Checking sync status");
    try {
      const { data: syncStatus, error: syncError } = await supabase
        .from('sync_status')
        .select('*');
      
      if (syncError) {
        console.error("Error fetching sync status:", syncError);
        diagnosticResults.database.syncError = syncError.message;
      } else {
        diagnosticResults.database.syncStatus = syncStatus || [];
        
        // Get the ElevenLabs sync status specifically
        const elevenlabsSync = syncStatus?.find(s => s.provider === 'elevenlabs');
        if (elevenlabsSync) {
          diagnosticResults.database.elevenlabsSync = elevenlabsSync;
        }
      }
    } catch (syncError) {
      console.error("Error fetching sync status:", syncError);
      diagnosticResults.database.syncError = syncError instanceof Error ? syncError.message : String(syncError);
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    diagnosticResults.executionTimeMs = executionTime;
    
    console.log(`Diagnostic complete in ${executionTime}ms`);
    
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
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
