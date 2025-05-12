
/**
 * Utility functions for consistent logging in the agent resolver
 */

/**
 * Log informational message with agent-resolver prefix
 */
export function logInfo(message: string): void {
  console.log(`[agent-resolver] ${message}`);
}

/**
 * Log error message with agent-resolver prefix
 */
export function logError(message: string): void {
  console.error(`[agent-resolver] ${message}`);
}
