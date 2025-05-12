
import { corsHeaders } from "./cors.ts";

/**
 * Helper function for handling CORS preflight requests with explicit status 200
 */
export function handleCorsOptions(): Response {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}
