
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver/index.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface MigrationResponse {
  success: boolean;
  message: string;
  organizations_updated?: number;
  calls_updated?: number;
  errors?: string[];
}

/**
 * Migrate organizations table data
 */
async function migrateOrganizations(supabase: ReturnType<typeof createClient>): Promise<{count: number, errors: string[]}> {
  const errors: string[] = [];
  let updatedCount = 0;

  // Get all organizations
  const { data: organizations, error: fetchError } = await supabase
    .from("organizations")
    .select("id, agent_id")
    .is("agent_id", true);  // Select where agent_id is not null

  if (fetchError) {
    errors.push(`Error fetching organizations: ${fetchError.message}`);
    return { count: 0, errors };
  }

  if (!organizations || organizations.length === 0) {
    logInfo("No organizations to migrate");
    return { count: 0, errors };
  }

  logInfo(`Found ${organizations.length} organizations to check for migration`);

  // Process each organization
  for (const org of organizations) {
    try {
      // Skip if agent_id is already a valid UUID
      try {
        // Try to parse as UUID
        const uuid = crypto.randomUUID(); // Just to validate the format
        if (org.agent_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // It's already a UUID, check if it exists in agents table
          const { data: agentCheck } = await supabase
            .from("agents")
            .select("id")
            .eq("id", org.agent_id)
            .single();
            
          if (agentCheck) {
            logInfo(`Organization ${org.id} already has valid UUID agent_id: ${org.agent_id}`);
            continue;  // Skip this organization
          }
        }
      } catch (e) {
        // Not a UUID, continue with migration
      }

      // Try to resolve the external agent ID to an internal UUID
      const internalAgentId = await getAgentUUIDByExternalId(supabase, org.agent_id);
      
      if (!internalAgentId) {
        // If no matching agent, create one
        logInfo(`No agent found for organization ${org.id} with agent_id ${org.agent_id}, creating new agent`);
        
        const { data: newAgent, error: createError } = await supabase
          .from("agents")
          .insert({
            name: `Agent for ${org.id}`,
            external_id: org.agent_id,
            role: "assistant"
          })
          .select("id")
          .single();
          
        if (createError) {
          errors.push(`Failed to create agent for organization ${org.id}: ${createError.message}`);
          continue;
        }
        
        // Update the organization with the new agent ID
        const { error: updateError } = await supabase
          .from("organizations")
          .update({ agent_id: newAgent.id })
          .eq("id", org.id);
          
        if (updateError) {
          errors.push(`Failed to update organization ${org.id}: ${updateError.message}`);
          continue;
        }
        
        updatedCount++;
        logInfo(`Created and linked new agent ${newAgent.id} for organization ${org.id}`);
      } else {
        // Update the organization with the resolved agent ID
        const { error: updateError } = await supabase
          .from("organizations")
          .update({ agent_id: internalAgentId })
          .eq("id", org.id);
          
        if (updateError) {
          errors.push(`Failed to update organization ${org.id}: ${updateError.message}`);
          continue;
        }
        
        updatedCount++;
        logInfo(`Updated organization ${org.id} with agent_id ${internalAgentId}`);
      }
    } catch (err) {
      const errMsg = `Error processing organization ${org.id}: ${err instanceof Error ? err.message : String(err)}`;
      logError(errMsg);
      errors.push(errMsg);
    }
  }

  return { count: updatedCount, errors };
}

/**
 * Migrate calls table data
 */
async function migrateCalls(supabase: ReturnType<typeof createClient>): Promise<{count: number, errors: string[]}> {
  const errors: string[] = [];
  let updatedCount = 0;

  // Get all calls that need migration (where agent_id might be an external ID instead of UUID)
  const { data: calls, error: fetchError } = await supabase
    .from("calls")
    .select("id, agent_id");

  if (fetchError) {
    errors.push(`Error fetching calls: ${fetchError.message}`);
    return { count: 0, errors };
  }

  if (!calls || calls.length === 0) {
    logInfo("No calls to migrate");
    return { count: 0, errors };
  }

  logInfo(`Found ${calls.length} calls to check for migration`);

  // Process each call
  for (const call of calls) {
    try {
      // Skip if agent_id is already a valid UUID and exists in agents table
      try {
        // Check if it's a valid UUID format
        if (call.agent_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Check if this UUID exists in the agents table
          const { data: agentCheck } = await supabase
            .from("agents")
            .select("id")
            .eq("id", call.agent_id)
            .maybeSingle();
            
          if (agentCheck) {
            // Valid UUID referring to an existing agent, check if elevenlabs_history_item_id needs to be set
            if (call.id && !call.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              // Call ID is not a UUID, it might be an ElevenLabs ID
              logInfo(`Call ${call.id} has a non-UUID id, it might be an ElevenLabs ID`);
              
              const { error: updateError } = await supabase
                .from("calls")
                .update({ elevenlabs_history_item_id: call.id })
                .eq("id", call.id);
                
              if (!updateError) {
                updatedCount++;
                logInfo(`Set elevenlabs_history_item_id for call ${call.id}`);
              } else {
                errors.push(`Failed to set elevenlabs_history_item_id for call ${call.id}: ${updateError.message}`);
              }
            }
            
            continue;  // Skip further processing for this call
          }
        }
      } catch (e) {
        // Not a UUID or error checking, continue with migration
      }

      // Try to resolve the external agent ID to an internal UUID
      const internalAgentId = await getAgentUUIDByExternalId(supabase, call.agent_id);
      
      if (!internalAgentId) {
        // If no matching agent, create one
        logInfo(`No agent found for call ${call.id} with agent_id ${call.agent_id}, creating new agent`);
        
        const { data: newAgent, error: createError } = await supabase
          .from("agents")
          .insert({
            name: `Agent for call ${call.id}`,
            external_id: call.agent_id,
            role: "assistant"
          })
          .select("id")
          .single();
          
        if (createError) {
          errors.push(`Failed to create agent for call ${call.id}: ${createError.message}`);
          continue;
        }
        
        // Update the call with the new agent ID
        const { error: updateError } = await supabase
          .from("calls")
          .update({ 
            agent_id: newAgent.id,
            elevenlabs_history_item_id: call.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? null : call.id
          })
          .eq("id", call.id);
          
        if (updateError) {
          errors.push(`Failed to update call ${call.id}: ${updateError.message}`);
          continue;
        }
        
        updatedCount++;
        logInfo(`Created and linked new agent ${newAgent.id} for call ${call.id}`);
      } else {
        // Update the call with the resolved agent ID
        const { error: updateError } = await supabase
          .from("calls")
          .update({ 
            agent_id: internalAgentId,
            elevenlabs_history_item_id: call.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? null : call.id
          })
          .eq("id", call.id);
          
        if (updateError) {
          errors.push(`Failed to update call ${call.id}: ${updateError.message}`);
          continue;
        }
        
        updatedCount++;
        logInfo(`Updated call ${call.id} with agent_id ${internalAgentId}`);
      }
    } catch (err) {
      const errMsg = `Error processing call ${call.id}: ${err instanceof Error ? err.message : String(err)}`;
      logError(errMsg);
      errors.push(errMsg);
    }
  }

  return { count: updatedCount, errors };
}

// Handle request
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only POST method is supported
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Only POST method is supported" 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log("Edge function migrate-agent-data called");

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Missing Supabase credentials" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Migrate organizations
    logInfo("Starting migration of organizations");
    const orgResult = await migrateOrganizations(supabase);
    
    // Migrate calls
    logInfo("Starting migration of calls");
    const callsResult = await migrateCalls(supabase);

    // Prepare response
    const response: MigrationResponse = {
      success: orgResult.errors.length === 0 && callsResult.errors.length === 0,
      message: "Migration completed",
      organizations_updated: orgResult.count,
      calls_updated: callsResult.count,
      errors: [...orgResult.errors, ...callsResult.errors]
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: response.success ? 200 : 207, // Use 207 Multi-Status if there were some errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error in migrate-agent-data function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
