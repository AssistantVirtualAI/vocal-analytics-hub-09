
/**
 * Reports API metrics for monitoring
 */
export async function reportApiMetrics(
  endpoint: string, 
  startTime: number, 
  statusCode: number, 
  errorMessage?: string
): Promise<void> {
  const duration = Date.now() - startTime;
  
  // Log metrics for now, in the future this could send to a monitoring service
  console.log(`API Metrics: ${endpoint} - Status: ${statusCode} - Duration: ${duration}ms ${errorMessage ? `- Error: ${errorMessage}` : ''}`);
}
