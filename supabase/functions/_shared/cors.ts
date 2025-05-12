
// CORS headers for Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for handling CORS preflight requests
export function handleCorsOptions() {
  return new Response(null, { headers: corsHeaders });
}
