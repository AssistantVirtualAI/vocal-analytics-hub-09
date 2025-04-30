
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Creates a standardized error response object
 */
export function formatError(error: any, status = 500): { response: Response } {
  console.error("Error in send-invitation-email function:", error);
  
  const errorObj = {
    success: false,
    error: {
      message: typeof error === 'object' ? 
        (error.message || JSON.stringify(error)) : 
        String(error),
      code: status,
      name: "internal_error"
    }
  };
  
  return {
    response: new Response(
      JSON.stringify(errorObj),
      {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  };
}
