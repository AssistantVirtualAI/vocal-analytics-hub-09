
/**
 * Formats a duration in seconds to a string in the format "M:SS"
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Formats a duration in seconds to a string in the format "X.Y min"
 */
export const formatDurationMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const decimal = Math.round((seconds % 60) / 6) / 10; // Convert to decimal minutes
  return `${minutes + decimal} min`;
};

// Format as HH:MM:SS for longer durations
export const formatDurationLong = (seconds: number): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return 'N/A';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

// Format as percentage with 1 decimal place
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

