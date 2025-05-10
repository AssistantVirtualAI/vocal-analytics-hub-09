
import React from 'react';
import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallsAdvancedFilter } from '@/components/calls/CallsAdvancedFilter';
import { DateRange } from '@/types/calendar';

interface OrgFiltersSectionProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedAgent: string;
  setSelectedAgent: (agent: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
  satisfactionScore: string;
  setSatisfactionScore: (score: string) => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  isLoading: boolean;
}

export function OrgFiltersSection({
  showFilters,
  setShowFilters,
  dateRange,
  setDateRange,
  selectedAgent,
  setSelectedAgent,
  selectedCustomer,
  setSelectedCustomer,
  satisfactionScore,
  setSatisfactionScore,
  handleApplyFilters,
  handleResetFilters,
  isLoading
}: OrgFiltersSectionProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Tableau de bord de l'organisation
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon className="mr-2 h-4 w-4" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium mb-3">Filtres avancés</h3>
          <CallsAdvancedFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            satisfactionScore={satisfactionScore}
            onSatisfactionChange={setSatisfactionScore}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
