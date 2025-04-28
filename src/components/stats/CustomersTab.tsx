
import type { CustomerStats } from '@/types';
import { CustomerCallsChart } from './CustomerCallsChart';
import { CustomerSatisfactionChart } from './CustomerSatisfactionChart';

type CustomersTabProps = {
  data: CustomerStats[];
};

export const CustomersTab = ({ data }: CustomersTabProps) => {
  return (
    <div className="space-y-4">
      <CustomerCallsChart data={data} />
      <CustomerSatisfactionChart data={data} />
    </div>
  );
};
