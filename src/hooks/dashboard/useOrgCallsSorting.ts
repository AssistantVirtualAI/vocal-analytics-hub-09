
import { useState, useMemo } from 'react';
import { Call } from '@/types';

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

export function useOrgCallsSorting(calls: Call[] | undefined) {
  const [sortState, setSortState] = useState<SortState>({
    column: 'date',
    direction: 'desc'
  });

  const handleSortChange = (column: string) => {
    setSortState(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortCalls = (callsToSort: Call[]): Call[] => {
    return [...callsToSort].sort((a, b) => {
      const direction = sortState.direction === 'asc' ? 1 : -1;
      
      switch (sortState.column) {
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
        case 'customerName':
          return a.customerName.localeCompare(b.customerName) * direction;
        case 'agentName':
          return a.agentName.localeCompare(b.agentName) * direction;
        case 'duration':
          return (a.duration - b.duration) * direction;
        case 'satisfactionScore':
          return ((a.satisfactionScore || 0) - (b.satisfactionScore || 0)) * direction;
        default:
          return 0;
      }
    });
  };

  const sortedCalls = useMemo(() => {
    return calls ? sortCalls(calls) : [];
  }, [calls, sortState]);

  return {
    sortState,
    handleSortChange,
    sortedCalls
  };
}
