import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Circular buffer to store the last 100 API requests in memory
const apiRequests = [];
const MAX_REQUESTS = 100;
const ERROR_THRESHOLD = 5; // Number of errors in last minute to trigger an alert

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Record new API request stats
    if (req.method === 'POST') {
      const { functionName, duration, status, error, timestamp } = await req.json();
      
      // Store in our circular buffer
      apiRequests.unshift({
        functionName,
        duration,
        status,
        error,
        timestamp: timestamp || new Date().toISOString()
      });
      
      // Keep only the last MAX_REQUESTS
      if (apiRequests.length > MAX_REQUESTS) {
        apiRequests.pop();
      }
      
      // Count errors in the last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const recentErrors = apiRequests.filter(req => 
        req.timestamp > oneMinuteAgo && 
        (req.status >= 500 || req.error)
      );
      
      // If error threshold exceeded, trigger an alert
      if (recentErrors.length >= ERROR_THRESHOLD) {
        console.error(`ALERT: ${recentErrors.length} API errors in the last minute!`);
        // In a real system, send an alert via email/SMS/Slack
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    // Get API metrics
    else if (req.method === 'GET') {
      const url = new URL(req.url);
      const timeframe = url.searchParams.get('timeframe') || '1h';
      
      let cutoffTime;
      switch(timeframe) {
        case '5m':
          cutoffTime = new Date(Date.now() - 5 * 60 * 1000);
          break;
        case '15m':
          cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
          break;
        case '1h':
          cutoffTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Default 1h
      }
      
      const cutoffTimeStr = cutoffTime.toISOString();
      const filteredRequests = apiRequests.filter(req => req.timestamp > cutoffTimeStr);
      
      // Calculate metrics
      const metrics = {
        totalRequests: filteredRequests.length,
        successRequests: filteredRequests.filter(req => req.status >= 200 && req.status < 300).length,
        clientErrorRequests: filteredRequests.filter(req => req.status >= 400 && req.status < 500).length,
        serverErrorRequests: filteredRequests.filter(req => req.status >= 500).length,
        avgDuration: filteredRequests.length > 0 
          ? filteredRequests.reduce((sum, req) => sum + req.duration, 0) / filteredRequests.length 
          : 0,
        p95Duration: calculateP95Duration(filteredRequests),
        byFunction: calculateMetricsByFunction(filteredRequests),
        timeframe
      };
      
      return new Response(JSON.stringify(metrics), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in api-monitor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to calculate p95 duration
function calculateP95Duration(requests) {
  if (requests.length === 0) return 0;
  
  const durations = requests.map(req => req.duration).sort((a, b) => a - b);
  const idx = Math.floor(durations.length * 0.95);
  return durations[idx] || durations[durations.length - 1];
}

// Helper function to group metrics by function name
function calculateMetricsByFunction(requests) {
  const byFunction = {};
  
  for (const req of requests) {
    if (!byFunction[req.functionName]) {
      byFunction[req.functionName] = {
        totalRequests: 0,
        successRequests: 0,
        clientErrorRequests: 0,
        serverErrorRequests: 0,
        totalDuration: 0
      };
    }
    
    byFunction[req.functionName].totalRequests++;
    byFunction[req.functionName].totalDuration += req.duration;
    
    if (req.status >= 200 && req.status < 300) {
      byFunction[req.functionName].successRequests++;
    } else if (req.status >= 400 && req.status < 500) {
      byFunction[req.functionName].clientErrorRequests++;
    } else if (req.status >= 500) {
      byFunction[req.functionName].serverErrorRequests++;
    }
  }
  
  // Calculate average duration for each function
  for (const func in byFunction) {
    if (byFunction[func].totalRequests > 0) {
      byFunction[func].avgDuration = byFunction[func].totalDuration / byFunction[func].totalRequests;
      delete byFunction[func].totalDuration; // Remove intermediate calculation
    }
  }
  
  return byFunction;
}
