
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";
import { ApiRequest, ApiMetricsResponse } from "./models.ts";
import { 
  storeApiRequest, 
  getFilteredRequests, 
  checkErrorThreshold,
  calculateMetricsByFunction,
  calculateP95Duration
} from "./service.ts";

// Circular buffer to store the last 100 API requests in memory
const apiRequests: ApiRequest[] = [];
const MAX_REQUESTS = 100;
const ERROR_THRESHOLD = 5; // Number of errors in last minute to trigger an alert

export async function handleMonitorRequest(req: Request): Promise<Response> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Record new API request stats
    if (req.method === 'POST') {
      return await handleStoreMetrics(req);
    } 
    // Get API metrics
    else if (req.method === 'GET') {
      return await handleGetMetrics(req);
    }
    
    return createErrorResponse({
      status: 405,
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED"
    });
  } catch (error) {
    console.error('Error in api-monitor function:', error);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}

async function handleStoreMetrics(req: Request): Promise<Response> {
  try {
    const reqData = await req.json();
    const apiRequest: ApiRequest = {
      functionName: reqData.functionName,
      duration: reqData.duration,
      status: reqData.status,
      error: reqData.error,
      timestamp: reqData.timestamp || new Date().toISOString()
    };
    
    // Store in our circular buffer
    storeApiRequest(apiRequests, apiRequest, MAX_REQUESTS);
    
    // Check for errors in the last minute
    checkErrorThreshold(apiRequests, ERROR_THRESHOLD);
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Error storing metrics:', error);
    return createErrorResponse({
      status: 400,
      message: "Failed to store metrics",
      code: "BAD_REQUEST"
    });
  }
}

async function handleGetMetrics(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '1h';
    
    const filteredRequests = getFilteredRequests(apiRequests, timeframe);
    
    // Calculate metrics
    const metrics: ApiMetricsResponse = {
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
    
    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error getting metrics:', error);
    return createErrorResponse({
      status: 400,
      message: "Failed to get metrics",
      code: "BAD_REQUEST"
    });
  }
}
