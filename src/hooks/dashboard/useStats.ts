
import { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useOrgDashboardStats } from '@/hooks/useOrgDashboardStats';

interface UseStatsOptions {
  orgSlug?: string;
  dateRange?: DateRange;
  enabled?: boolean;
}

export function useStats({ orgSlug, dateRange, enabled = true }: UseStatsOptions = {}) {
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { 
    callStats: statsData, 
    isLoading, 
    hasError: error, 
    handleRefresh: refetch 
  } = useOrgDashboardStats(orgSlug || "", {
    dateRange,
    enabled: !!orgSlug && enabled
  });

  return {
    statsData,
    isLoading,
    error: error ? new Error("Error loading stats") : null,
    refetch
  };
}
