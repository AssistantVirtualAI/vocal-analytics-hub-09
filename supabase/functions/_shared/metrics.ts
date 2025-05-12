
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
