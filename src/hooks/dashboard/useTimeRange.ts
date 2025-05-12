
import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

export interface TimeRangeOptions {
  initialTimeRange?: TimeRange;
}

export function useTimeRange({ initialTimeRange = '14d' }: TimeRangeOptions = {}) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  
  // Calculate date range based on selected time range
  const dateRange: DateRange = useMemo(() => {
    const today = new Date();
    let from: Date;
    
    switch (timeRange) {
      case '24h':
        from = subDays(today, 1);
        break;
      case '7d':
        from = subDays(today, 7);
        break;
      case '14d':
        from = subDays(today, 14);
        break;
      case '30d':
        from = subDays(today, 30);
        break;
      case 'all':
        from = subDays(today, 365); // A year ago as fallback
        break;
      default:
        from = subDays(today, 14);
    }
    
    return { from, to: today };
  }, [timeRange]);

  return {
    timeRange,
    setTimeRange,
    dateRange
  };
}
