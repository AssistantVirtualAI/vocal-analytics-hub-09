
import { corsHeaders } from "./cors.ts";

// Helper to create consistent success responses
export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

// Helper to create consistent error responses
export function createErrorResponse({ 
  message = "An unexpected error occurred", 
  status = 500, 
  code = "INTERNAL_SERVER_ERROR"
}) {
  console.error(`Error: ${code} - ${message}`);
  
  return new Response(
    JSON.stringify({ 
      error: {
        message,
        code
      } 
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

// Helper function for handling CORS preflight requests
export function handleCorsOptions() {
  return new Response(null, { headers: corsHeaders });
}

// Helper for fetching with retry
export async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      console.log(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms...`);
      lastError = error;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay *= 2;
    }
  }
  
  throw lastError;
}
