
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions, handleApiError } from "../_shared/index.ts";
import { handleGetCall } from "./handlers.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "get-call";
  
  console.log(`[${functionName}] Edge function started`);
  
  // Logging environment variable availability for debugging
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[${functionName}] Environment check - SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
    console.log(`[${functionName}] Environment check - SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Present' : 'Missing'}`);
  } catch (envError) {
    console.error(`[${functionName}] Error checking environment variables:`, envError);
  }

  // Handle CORS preflight requests with explicit status 200
  if (req.method === 'OPTIONS') {
    console.log(`[${functionName}] Handling OPTIONS request with explicit status 200`);
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      }
    });
  }

  try {
    return await handleGetCall(req);
  } catch (error) {
    return await handleApiError(error, functionName, startTime);
  }
});
