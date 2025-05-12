
import { RecentCallsList } from './RecentCallsList';
import type { Call } from '@/types';
import { formatDuration } from '@/utils/formatters';

interface RecentCallsProps {
  calls: Call[];
  isLoading: boolean;
  showAll?: boolean;
}

export function RecentCalls({ calls, isLoading, showAll = false }: RecentCallsProps) {
  const formatCallDuration = (seconds: number): string => {
    return formatDuration(seconds);
  };

  // If showAll is true, we show all calls, otherwise we limit to 5
  const displayCalls = showAll ? calls : calls.slice(0, 5);

  return (
    <RecentCallsList
      calls={displayCalls}
      isLoading={isLoading}
      formatDuration={formatCallDuration}
    />
  );
}
