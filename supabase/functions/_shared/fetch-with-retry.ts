
/**
 * Helper for fetching with retry and timeout
 * @param url URL to fetch from
 * @param options Fetch options
 * @param retries Number of retries
 * @param delay Initial delay between retries in ms
 * @param timeout Timeout in ms
 * @returns Response object
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
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.log(`Fetch attempt ${i + 1} failed, retrying in ${delay}ms: ${error.message}`);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log(`Request timed out after ${timeout}ms`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay *= 2;
    }
  }
  
  throw lastError;
}
