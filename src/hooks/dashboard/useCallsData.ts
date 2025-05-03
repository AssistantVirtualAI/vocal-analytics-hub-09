
import { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useOrgCallsList } from '@/hooks/useOrgCallsList';

interface UseCallsDataOptions {
  orgSlug?: string;
  dateRange?: DateRange;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

export function useCallsData({
  orgSlug, 
  dateRange, 
  page = 1, 
  limit = 5, 
  sortBy = 'date', 
  sortOrder = 'desc', 
  enabled = true
}: UseCallsDataOptions = {}) {
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { 
    data: callsListData, 
    isLoading, 
    error, 
    refetch 
  } = useOrgCallsList({
    orgSlug,
    limit,
    page,
    sortBy,
    sortOrder,
    startDate,
    endDate,
    enabled: !!orgSlug && enabled,
  });

  return {
    callsList: callsListData?.calls || [],
    totalCount: callsListData?.totalCount || 0,
    totalPages: callsListData?.totalPages || 0,
    isLoading,
    error,
    refetch,
  };
}
