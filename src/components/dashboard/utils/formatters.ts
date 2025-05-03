
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
