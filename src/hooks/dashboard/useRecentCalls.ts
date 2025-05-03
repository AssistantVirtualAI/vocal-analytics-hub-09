
import type { Call } from '@/types';

interface CallsListData {
  calls: Call[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Hook to extract recent calls from calls data
 */
export function useRecentCalls(callsData: CallsListData | undefined) {
  // Get recent calls
  const getRecentCalls = (): Call[] => {
    return callsData?.calls || [];
  };

  return {
    recentCalls: getRecentCalls()
  };
}
