
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
      
      // Log response status and headers for debugging
      console.log(`Response status: ${response.status}, URL: ${url}`);
      
      // Handle common error status codes with better information
      if (!response.ok) {
        const statusText = response.statusText || '';
        console.error(`Error response (${response.status}): ${statusText}`);
        
        try {
          // Try to parse response as JSON for better error details
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Error response details:', errorData);
          } else {
            const errorText = await response.text();
            console.error('Error response text:', errorText.substring(0, 500)); // Limit text size
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        // If we get a 429 (too many requests), wait and retry
        if (response.status === 429) {
          // Get recommended wait time or use default
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          console.log(`Rate limited (429), waiting ${retryAfter}s before retry`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retries++;
          continue;
        }
        
        // For server errors (5xx), we should retry with backoff
        if (response.status >= 500 && response.status < 600) {
          if (retries < maxRetries - 1) {
            const waitTime = 1000 * Math.pow(2, retries);
            console.log(`Server error (${response.status}), retrying in ${waitTime/1000}s (${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Network error (attempt ${retries + 1}/${maxRetries}):`, error);
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

/**
 * Helper function to safely parse JSON with fallback
 * @param response The fetch response
 * @returns Parsed JSON data
 */
export async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    const text = await response.text();
    console.log('Raw response text:', text.substring(0, 500)); // Limit text size for logs
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}
