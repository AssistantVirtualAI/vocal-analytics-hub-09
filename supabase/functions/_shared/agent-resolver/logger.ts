
/**
 * Log an informational message with the agent-resolver prefix
 * @param message Message to log
 */
export function logInfo(message: string): void {
  console.log(`[agent-resolver] ${message}`);
}

/**
 * Log an error message with the agent-resolver prefix
 * @param message Error message to log
 */
export function logError(message: string): void {
  console.error(`[agent-resolver] ${message}`);
}
