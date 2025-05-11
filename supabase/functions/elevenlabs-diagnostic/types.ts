
/**
 * Type definitions for ElevenLabs diagnostic functionality
 */

export interface DiagnosticResults {
  agentDetails: {
    providedId: string;
    resolvedId: string | null;
    effectiveId: string;
    isNewAgent: boolean;
  };
  apiConnection: {
    success: boolean;
    error: string | null;
    data?: {
      subscription: string;
      username: string;
    };
  };
  conversationsApi: {
    success: boolean;
    error: string | null;
    count: number;
    data: {
      sampleItems: any[];
      hasCursor: boolean;
    } | null;
  };
  dashboardSettings: {
    success: boolean;
    error: string | null;
    data: any | null;
  };
  historyApi: {
    success: boolean;
    error: string | null;
    count: number;
  };
  database?: {
    success: boolean;
    error: string | null;
    callsFound: number;
  };
}
