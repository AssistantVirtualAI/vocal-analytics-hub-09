
// Define CORS headers directly in this file
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Helper function for handling CORS preflight requests with explicit status 200
 */
export function handleCorsOptions(): Response {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}
