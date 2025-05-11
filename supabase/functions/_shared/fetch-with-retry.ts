
/**
 * Utility function to fetch with automatic retry for API calls
 * Handles 429 rate limit errors and network failures with exponential backoff
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Fetching ${url} (attempt ${retries + 1}/${maxRetries})`);
      const response = await fetch(url, options);
      
      // If we get a 429 (too many requests), wait and retry
      if (response.status === 429) {
        // Get recommended wait time or use default
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        console.log(`Rate limited (429), waiting ${retryAfter}s before retry`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // Exponential backoff between attempts
      const waitTime = 1000 * Math.pow(2, retries);
      console.log(`Request failed, retrying in ${waitTime/1000}s (${retries}/${maxRetries})`, error);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // This should never be reached since the loop above will either return or throw
  throw new Error(`Failed after ${maxRetries} attempts`);
}

