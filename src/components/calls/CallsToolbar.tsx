
import { useState } from 'react';
import { SearchBar } from '@/components/calls/SearchBar';
import { CallsFilter } from '@/components/calls/CallsFilter';
import { FilterButton } from '@/components/calls/FilterButton';
import { DateRange } from '@/components/ui/calendar';

interface CallsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFilterChange: (filters: any) => void;
}

export function CallsToolbar({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onFilterChange,
}: CallsToolbarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="Rechercher dans les transcriptions..." />
        <div className="flex-shrink-0">
          <FilterButton onToggle={onToggleFilters} />
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 border rounded-md">
          <h3 className="text-sm font-medium mb-3">Filtres avancés</h3>
          <CallsFilter onFilterChange={onFilterChange} />
        </div>
      )}
    </>
  );
}
