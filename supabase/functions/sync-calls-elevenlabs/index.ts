import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format to handle ElevenLabs date format to ISO string
function formatDate(dateString: string): string {
  // If the date is already in ISO format, return it
  if (dateString.includes('T')) {
    return dateString;
  }
  
  // Parse date in format "9 mai 2025, 17:23" to ISO string
  const parts = dateString.split(',');
  const datePart = parts[0].trim(); // "9 mai 2025"
  const timePart = parts[1].trim(); // "17:23"
  
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

// Parse duration string like "0:19" to seconds
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(':');
  let seconds = 0;
  
  if (parts.length === 2) {
    // Format "0:19"
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // Format "0:00:19"
    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  
  return seconds;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Edge function sync-calls-elevenlabs called");

  try {
    // Parse request body
    const { calls, agentId } = await req.json();
    
    if (!calls || !Array.isArray(calls) || calls.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No calls provided or invalid format",
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!agentId) {
      return new Response(JSON.stringify({ 
        error: "No agent ID provided",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Received ${calls.length} calls to sync for agent ID: ${agentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error: missing credentials",
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, check if the agent exists or create it
    let agentUUID;
    
    try {
      // Look up agent by name
      const { data: existingAgent, error: agentError } = await supabase
        .from("agents")
        .select("id")
        .eq("name", agentId)
        .maybeSingle();
      
      if (agentError) {
        console.error("Error checking for existing agent:", agentError);
        throw new Error(`Database error: ${agentError.message}`);
      }
      
      if (existingAgent && existingAgent.id) {
        agentUUID = existingAgent.id;
        console.log(`Found existing agent with UUID: ${agentUUID}`);
      } else {
        // Create a new agent
        const { data: newAgent, error: createError } = await supabase
          .from("agents")
          .insert({
            name: agentId,
            role: "assistant"
          })
          .select("id")
          .single();
        
        if (createError) {
          console.error("Error creating agent:", createError);
          throw new Error(`Failed to create agent: ${createError.message}`);
        }
        
        agentUUID = newAgent.id;
        console.log(`Created new agent with UUID: ${agentUUID}`);
      }
    } catch (agentError) {
      console.error("Agent processing error:", agentError);
      return new Response(JSON.stringify({ 
        error: agentError.message || "Failed to process agent information",
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Process each call
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const call of calls) {
      try {
        // Extract necessary data from the call object
        const conversationId = call.id || call.conversationId;
        const date = formatDate(call.date);
        const duration = parseDuration(call.duration);
        const audioUrl = call.audioUrl || "";
        const transcript = call.transcript || "";
        const summary = call.summary || "";
        const customerName = call.customerName || "Unknown Customer";
        
        // Generate a satisfaction score based on the evaluation result if available
        let satisfactionScore = 0;
        if (call.evaluationResult && call.evaluationResult.toLowerCase() === "successful") {
          // Random satisfaction score between 4-5 for successful calls
          satisfactionScore = Math.floor(Math.random() * 2) + 4;
        } else if (call.evaluationResult) {
          // Random satisfaction score between 1-3 for other calls
          satisfactionScore = Math.floor(Math.random() * 3) + 1;
        }
        
        // Check if call already exists
        const { data: existingCall } = await supabase
          .from("calls")
          .select("id")
          .eq("id", conversationId)
          .maybeSingle();
        
        if (existingCall) {
          // Update existing call
          console.log(`Updating existing call with ID: ${conversationId}`);
          const { data, error } = await supabase
            .from("calls")
            .update({
              duration,
              satisfaction_score: satisfactionScore,
              date,
              audio_url: audioUrl,
              transcript,
              summary
            })
            .eq("id", conversationId);
          
          if (error) {
            console.error(`Error updating call ${conversationId}:`, error);
            results.push({ id: conversationId, success: false, error: error.message });
            errorCount++;
          } else {
            results.push({ id: conversationId, success: true, action: "updated" });
            successCount++;
          }
        } else {
          // Create new customer or use existing one
          let customerId;
          
          // Check if customer exists with this name
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id")
            .eq("name", customerName)
            .maybeSingle();
          
          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Create new customer
            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: customerName
              })
              .select("id")
              .single();
            
            if (customerError) {
              console.error("Error creating customer:", customerError);
              results.push({ id: conversationId, success: false, error: "Failed to create customer" });
              errorCount++;
              continue;
            }
            
            customerId = newCustomer.id;
          }
          
          // Insert new call
          console.log(`Creating new call with ID: ${conversationId}`);
          const { data, error } = await supabase
            .from("calls")
            .insert({
              id: conversationId,
              duration,
              satisfaction_score: satisfactionScore,
              date,
              audio_url: audioUrl,
              transcript,
              summary,
              agent_id: agentUUID,
              customer_id: customerId,
            });
          
          if (error) {
            console.error(`Error creating call ${conversationId}:`, error);
            results.push({ id: conversationId, success: false, error: error.message });
            errorCount++;
          } else {
            results.push({ id: conversationId, success: true, action: "created" });
            successCount++;
          }
        }
      } catch (callError) {
        console.error("Error processing call:", callError);
        results.push({ id: call.id || "unknown", success: false, error: callError.message });
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: errorCount === 0,
      results,
      summary: {
        total: calls.length,
        success: successCount,
        error: errorCount
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in sync-calls-elevenlabs function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
