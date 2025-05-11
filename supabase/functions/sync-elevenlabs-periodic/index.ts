
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchWithRetry } from "../_shared/fetch-with-retry.ts";

// Format to handle ElevenLabs date format to ISO string
function formatDate(dateString: string | number): string {
  if (typeof dateString === 'number') {
    return new Date(dateString * 1000).toISOString();
  }
  
  // If the date is already in ISO format, return it
  if (typeof dateString === 'string' && dateString.includes('T')) {
    return dateString;
  }
  
  // Parse date in format "9 mai 2025, 17:23" to ISO string
  const parts = (dateString as string).split(',');
  const datePart = parts[0].trim(); // "9 mai 2025"
  const timePart = parts[1]?.trim() || "00:00"; // "17:23"
  
  const dateParts = datePart.split(' ');
  const day = parseInt(dateParts[0]);
  
  // Convert month name to number (French)
  let month: number;
  switch (dateParts[1].toLowerCase()) {
    case 'janvier': month = 0; break;
    case 'février': case 'fevrier': month = 1; break;
    case 'mars': month = 2; break;
    case 'avril': month = 3; break;
    case 'mai': month = 4; break;
    case 'juin': month = 5; break;
    case 'juillet': month = 6; break;
    case 'août': case 'aout': month = 7; break;
    case 'septembre': month = 8; break;
    case 'octobre': month = 9; break;
    case 'novembre': month = 10; break;
    case 'décembre': case 'decembre': month = 11; break;
    default: month = 0;
  }
  
  const year = parseInt(dateParts[2]);
  
  const timeParts = timePart.split(':');
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  
  // Create date object and return ISO string
  const date = new Date(year, month, day, hour, minute);
  return date.toISOString();
}

// Calculate duration in minutes from start and end times
function calculateDuration(startTime?: number, endTime?: number): number {
  if (!startTime || !endTime) return 0;
  const durationInSeconds = endTime - startTime;
  return Math.max(1, Math.floor(durationInSeconds / 60)); // Ensure at least 1 minute
}

// Fetch calls from ElevenLabs API for a given agent within a date range
async function fetchElevenLabsCalls(
  agentId: string, 
  startAfter: string | Date, 
  apiKey: string
): Promise<any[]> {
  // Convert start date to Unix timestamp
  const startDate = new Date(startAfter);
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  
  // Set up API request parameters
  const params = new URLSearchParams();
  params.append('agent_id', agentId);
  params.append('call_start_after_unix', startTimestamp.toString());
  params.append('limit', '100'); // Maximum allowed by ElevenLabs API
  
  const url = `https://api.elevenlabs.io/v1/convai/conversations?${params.toString()}`;
  console.log(`Fetching ElevenLabs calls from URL: ${url}`);
  
  try {
    const response = await fetchWithRetry(
      url,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "xi-api-key": apiKey,
        }
      },
      3 // 3 retries
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error response from ElevenLabs (${response.status}): ${errorData}`);
      throw new Error(`Failed to fetch calls: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from ElevenLabs API: data is not an object');
    }
    
    if (!Array.isArray(data.conversations)) {
      console.warn('Unexpected response format from ElevenLabs API:', data);
      return [];
    }
    
    return data.conversations || [];
  } catch (error) {
    console.error(`Error fetching ElevenLabs calls: ${error.message}`);
    throw error;
  }
}

// Helper function to ensure customer exists, returns customer_id
async function ensureCustomerExists(supabase: any, customerName: string): Promise<string> {
  try {
    // First, try to find existing customer by name
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('name', customerName)
      .maybeSingle();
    
    if (existingCustomer?.id) {
      return existingCustomer.id;
    }
    
    // Create a new customer if not found
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: customerName
      })
      .select('id')
      .single();
    
    if (error) {
      console.error(`Error creating customer: ${error.message}`);
      throw error;
    }
    
    return newCustomer.id;
  } catch (error) {
    console.error(`Error in ensureCustomerExists: ${error.message}`);
    throw error;
  }
}

// Main function to sync calls for all agents
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log("Starting ElevenLabs periodic sync function");
  
  try {
    // Parse request body for any options
    let options = {};
    try {
      const requestText = await req.text();
      if (requestText) {
        options = JSON.parse(requestText);
        if (options && (options as any).debug) {
          console.log("Debug mode enabled, verbose logging will be used");
        }
      }
    } catch (e) {
      console.log("No request body provided or invalid JSON");
    }
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL environment variable");
    }
    
    if (!supabaseServiceKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }
    
    if (!elevenLabsApiKey) {
      throw new Error("Missing ElevenLabs API key (ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY)");
    }
    
    console.log("Environment variables validated successfully");
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get last sync date from sync_status table
    const { data: syncStatus, error: syncStatusError } = await supabase
      .from('sync_status')
      .select('*')
      .eq('provider', 'elevenlabs')
      .maybeSingle();
    
    if (syncStatusError) {
      console.error("Error fetching sync status:", syncStatusError);
      throw syncStatusError;
    }
    
    // Default to 30 days ago if no sync status found
    const lastSyncDate = syncStatus?.last_sync_date
      ? new Date(syncStatus.last_sync_date)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`Last sync date: ${lastSyncDate.toISOString()}`);
    
    // Update sync status to 'in_progress'
    await supabase
      .from('sync_status')
      .upsert({
        provider: 'elevenlabs',
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }, { onConflict: 'provider' });
    
    // Get all active ElevenLabs agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('provider', 'elevenlabs')
      .eq('status', 'active');
    
    if (agentsError) {
      console.error("Error fetching agents:", agentsError);
      throw agentsError;
    }
    
    console.log(`Found ${agents?.length || 0} active ElevenLabs agents`);
    
    // Process each agent
    const results = [];
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    
    for (const agent of agents || []) {
      try {
        console.log(`Processing agent: ${agent.name} (${agent.external_id})`);
        
        if (!agent.external_id) {
          console.warn(`Agent ${agent.id} has no external_id, skipping`);
          results.push({
            agent_id: agent.id,
            status: 'skipped',
            reason: 'No external ID'
          });
          continue;
        }
        
        // Fetch calls for this agent
        const calls = await fetchElevenLabsCalls(
          agent.external_id,
          lastSyncDate,
          elevenLabsApiKey
        );
        
        console.log(`Retrieved ${calls.length} calls for agent ${agent.name}`);
        totalCalls += calls.length;
        
        // Process each call
        for (const call of calls) {
          try {
            if (!call.id) {
              console.warn("Call missing ID, generating random UUID");
              call.id = crypto.randomUUID();
            }
            
            // Ensure caller has a name
            const callerName = call.caller_name || 'Unknown Caller';
            
            // Get or create customer
            const customerId = await ensureCustomerExists(supabase, callerName);
            
            // Transform ElevenLabs call to match our schema
            const transformedCall = {
              id: call.id,
              customer_id: customerId,
              date: formatDate(call.start_time_unix || Date.now()),
              duration: calculateDuration(call.start_time_unix, call.end_time_unix),
              agent_id: agent.id,
              audio_url: call.audio_url || null,
              transcript: call.transcript ? JSON.stringify(call.transcript) : null,
              raw_data: call,
              satisfaction_score: call.success ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1 // Random score based on success
            };
            
            // Upsert call data
            const { error: upsertError } = await supabase
              .from('calls')
              .upsert(transformedCall, { onConflict: 'id' });
            
            if (upsertError) {
              console.error(`Error upserting call ${call.id}:`, upsertError);
              failedCalls++;
              results.push({
                call_id: call.id,
                status: 'error',
                error: upsertError.message
              });
            } else {
              successfulCalls++;
              results.push({
                call_id: call.id,
                status: 'success'
              });
            }
          } catch (callError) {
            console.error(`Error processing call ${call.id}:`, callError);
            failedCalls++;
            results.push({
              call_id: call.id || 'unknown',
              status: 'error',
              error: callError.message
            });
          }
        }
      } catch (agentError) {
        console.error(`Error processing agent ${agent.id}:`, agentError);
        results.push({
          agent_id: agent.id,
          status: 'error',
          error: agentError.message
        });
      }
    }
    
    // Update sync status with success or partial success
    const finalStatus = failedCalls === 0 ? 'success' : 'partial_success';
    await supabase
      .from('sync_status')
      .upsert({
        provider: 'elevenlabs',
        last_sync_date: new Date().toISOString(),
        status: finalStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'provider' });
    
    console.log(`Sync completed: ${successfulCalls} successful, ${failedCalls} failed out of ${totalCalls} total calls`);
    
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: totalCalls,
          success: successfulCalls,
          error: failedCalls
        },
        results: results.slice(0, 100) // Limit results to 100 items to avoid response size limits
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Error in sync-elevenlabs-periodic function:", error);
    
    // Update sync status to error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('sync_status')
          .upsert({
            provider: 'elevenlabs',
            status: 'error',
            updated_at: new Date().toISOString()
          }, { onConflict: 'provider' });
      }
    } catch (updateError) {
      console.error("Failed to update sync status:", updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
