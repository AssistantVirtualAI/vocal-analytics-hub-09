
import { corsHeaders } from "./cors.ts";

interface ErrorResponseOptions {
  message?: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Helper to create consistent success responses
 * @param data - The data to include in the response
 * @param status - The HTTP status code (defaults to 200)
 * @param headers - Optional additional headers
 */
export function createSuccessResponse(data: any, status = 200, headers = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...headers
      }
    }
  );
}

/**
 * Helper to create consistent error responses
 * @param options - Error response options
 */
export function createErrorResponse(options: ErrorResponseOptions = {}) {
  const {
    message = "An unexpected error occurred",
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    details
  } = options;

  console.error(`Error: ${code} - ${message}${details ? ` - Details: ${JSON.stringify(details)}` : ''}`);
  
  const errorBody: any = {
    error: {
      message,
      code
    }
  };

  if (details) {
    errorBody.error.details = details;
  }
  
  return new Response(
    JSON.stringify(errorBody),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

/**
 * Helper function for handling CORS preflight requests with explicit status 200
 */
export function handleCorsOptions() {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

/**
 * Helper for handling API errors consistently
 * @param error - The error object
 * @param functionName - The name of the function where the error occurred
 * @param startTime - The start time of the API call for metrics
 */
export async function handleApiError(error: any, functionName: string, startTime: number) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in ${functionName}: ${errorMessage}`, error);
  
  // Report metrics for the failed API call
  try {
    await reportApiMetrics(functionName, startTime, 500, errorMessage);
  } catch (metricsError) {
    console.error(`Failed to report metrics for failed API call: ${String(metricsError)}`);
  }
  
  // Determine if this is a known error type with a specific status code
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";
  
  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') {
      status = error.status;
    }
    if ('code' in error && typeof error.code === 'string') {
      code = error.code;
    }
  }
  
  return createErrorResponse({
    message: errorMessage,
    status,
    code
  });
}

/**
 * Helper function to report API metrics
 * @param endpoint - The API endpoint name
 * @param startTime - The start time of the API call in milliseconds
 * @param statusCode - The HTTP status code of the response
 * @param errorMessage - Optional error message if the call failed
 */
export async function reportApiMetrics(
  endpoint: string,
  startTime: number,
  statusCode: number,
  errorMessage?: string
) {
  try {
    const duration = Date.now() - startTime;
    console.log(`API Metrics - Endpoint: ${endpoint}, Duration: ${duration}ms, Status: ${statusCode}${errorMessage ? `, Error: ${errorMessage}` : ''}`);
    
    // If we have the api-monitor function available, we can log these metrics to the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return; // Can't report metrics without Supabase credentials
    }
    
    const body = {
      endpoint,
      duration,
      statusCode,
      errorMessage: errorMessage || null,
      timestamp: new Date().toISOString()
    };
    
    // Call the api-monitor function
    const response = await fetch(`${supabaseUrl}/functions/v1/api-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to report API metrics: ${errorText}`);
    }
  } catch (error) {
    // Don't let metrics reporting failures affect the main flow
    console.error(`Error reporting API metrics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Enhanced fetcher with retry, timeout, and error handling
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries (default: 3)
 * @param delay - Initial delay between retries in ms (default: 1000)
 * @param timeout - Request timeout in ms (default: 10000)
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 3, 
  delay = 1000,
  timeout = 10000
): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Check if response is OK, otherwise throw an error
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      console.log(`Fetch attempt ${i + 1} failed, ${i < retries - 1 ? `retrying in ${delay}ms` : 'giving up'}: ${error.message}`);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log(`Request timed out after ${timeout}ms`);
      }
      
      // If this is the last retry, don't wait
      if (i >= retries - 1) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay *= 2;
    }
  }
  
  throw lastError;
}
