
// Utility functions for the sync-calls-elevenlabs function

/**
 * Format date from French format "9 mai 2025, 17:23" to ISO string
 */
export function formatDate(dateString: string): string {
  // If the date is already in ISO format, return it
  if (dateString.includes('T')) {
    return dateString;
  }
  
  // Parse date in format "9 mai 2025, 17:23" to ISO string
  const parts = dateString.split(',');
  const datePart = parts[0].trim(); // "9 mai 2025"
  const timePart = parts[1].trim(); // "17:23"
  
  const dateParts = datePart.split(' ');
  const day = parseInt(dateParts[0]);
  
  // Convert month name to number (French)
  let month: number;
  switch (dateParts[1].toLowerCase()) {
    case 'janvier': month = 0; break;
    case 'février': case 'fevrier': month = 1; break;
    case 'mars': month = 2; break;
    case 'avril': month = 3; break;
    case 'mai': month = 4; break;
    case 'juin': month = 5; break;
    case 'juillet': month = 6; break;
    case 'août': case 'aout': month = 7; break;
    case 'septembre': month = 8; break;
    case 'octobre': month = 9; break;
    case 'novembre': month = 10; break;
    case 'décembre': case 'decembre': month = 11; break;
    default: month = 0;
  }
  
  const year = parseInt(dateParts[2]);
  
  const timeParts = timePart.split(':');
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  
  // Create date object and return ISO string
  const date = new Date(year, month, day, hour, minute);
  return date.toISOString();
}

/**
 * Parse duration string like "0:19" to seconds
 */
export function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(':');
  let seconds = 0;
  
  if (parts.length === 2) {
    // Format "0:19"
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // Format "0:00:19"
    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  
  return seconds;
}

// Define CORS headers for the response
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
