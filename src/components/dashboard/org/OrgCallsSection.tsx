
import React from 'react';
import { OrgCallsTable } from './OrgCallsTable';
import { Call } from '@/types';

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

interface OrgCallsSectionProps {
  isLoading: boolean;
  sortedCalls: Call[];
  sortState: SortState;
  handleSortChange: (column: string) => void;
  formatDuration: (seconds: number) => string;
}

export function OrgCallsSection({
  isLoading,
  sortedCalls,
  sortState,
  handleSortChange,
  formatDuration
}: OrgCallsSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Derniers appels</h2>
      
      <OrgCallsTable
        calls={sortedCalls}
        isLoading={isLoading}
        sortState={sortState}
        onSortChange={handleSortChange}
        formatDuration={formatDuration}
      />
    </div>
  );
}
