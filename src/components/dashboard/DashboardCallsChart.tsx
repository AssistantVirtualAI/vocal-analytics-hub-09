
import React from 'react';
import { CallsChart } from './CallsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export interface DashboardCallsChartProps {
  callData?: CallStats;
  isLoading?: boolean;
}

export function DashboardCallsChart({ callData, isLoading = false }: DashboardCallsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Appels par jour</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : (
          <CallsChart data={callData?.callsPerDay || {}} />
        )}
      </CardContent>
    </Card>
  );
}
