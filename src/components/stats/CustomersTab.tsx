
import { useState } from 'react';
import type { CustomerStats } from '@/types';
import { CustomerCallsChart } from './CustomerCallsChart';
import { CustomerSatisfactionChart } from './CustomerSatisfactionChart';
import { CustomerFilters } from './CustomerFilters';
import type { CustomerFiltersProps } from './CustomerFilters';

type CustomersTabProps = {
  data: CustomerStats[];
};

export const CustomersTab = ({ data }: CustomersTabProps) => {
  const [sortField, setSortField] = useState<CustomerFiltersProps['sortField']>('totalCalls');
  const [sortDirection, setSortDirection] = useState<CustomerFiltersProps['sortDirection']>('desc');
  const [limit, setLimit] = useState(5);

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  }).slice(0, limit);

  const handleSort = (field: CustomerFiltersProps['sortField'], direction: CustomerFiltersProps['sortDirection']) => {
    setSortField(field);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-4">
      <CustomerFilters
        sortField={sortField}
        sortDirection={sortDirection}
        currentLimit={limit}
        onSort={handleSort}
        onLimitChange={setLimit}
      />
      <CustomerCallsChart data={sortedData} />
      <CustomerSatisfactionChart data={sortedData} />
    </div>
  );
};
