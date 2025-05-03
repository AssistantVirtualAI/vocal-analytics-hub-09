
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useCustomerStats } from '@/hooks/useCustomerStats';

interface UseCustomerDataOptions {
  orgSlug?: string;
  dateRange?: DateRange;
  enabled?: boolean;
}

export function useCustomerData({ orgSlug, dateRange, enabled = true }: UseCustomerDataOptions = {}) {
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { 
    data: customerStatsData, 
    isLoading, 
    error, 
    refetch 
  } = useCustomerStats({ 
    orgSlug, 
    startDate, 
    endDate, 
    enabled: !!orgSlug && enabled 
  });

  return {
    customerStats: customerStatsData || [],
    isLoading,
    error,
    refetch,
  };
}
