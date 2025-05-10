
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StatsError } from '@/components/stats/StatsError';
import { CallsLast30DaysChart } from '@/components/stats/CallsLast30DaysChart';
import { DateRange } from '@/types/calendar';
import { useOrgDashboardStats } from '@/hooks/useOrgDashboardStats';
import { useOrgCallsSorting } from '@/hooks/dashboard/useOrgCallsSorting';
import { OrgFiltersSection } from '@/components/dashboard/org/OrgFiltersSection';
import { OrgCallsSection } from '@/components/dashboard/org/OrgCallsSection';

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [satisfactionScore, setSatisfactionScore] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const {
    callStats,
    calls,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh,
    formatDuration,
    applyFilters
  } = useOrgDashboardStats(orgSlug, {
    dateRange,
    agentId: selectedAgent,
    customerId: selectedCustomer,
    satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : undefined
  });

  const { sortState, handleSortChange, sortedCalls } = useOrgCallsSorting(calls);

  const handleApplyFilters = () => {
    applyFilters({
      dateRange,
      agentId: selectedAgent,
      customerId: selectedCustomer,
      satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : undefined
    });
  };

  const handleResetFilters = () => {
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    });
    setSelectedAgent('');
    setSelectedCustomer('');
    setSatisfactionScore('');
    
    applyFilters({
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      },
      agentId: '',
      customerId: '',
      satisfactionScore: undefined
    });
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />

        <OrgFiltersSection
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          satisfactionScore={satisfactionScore}
          setSatisfactionScore={setSatisfactionScore}
          handleApplyFilters={handleApplyFilters}
          handleResetFilters={handleResetFilters}
          isLoading={isLoading}
        />

        {hasError ? (
          <StatsError onRetry={handleRefresh} />
        ) : (
          <>
            <DashboardStats
              displayData={callStats}
              isLoading={isLoading}
              formatDuration={formatDuration}
            />

            <CallsLast30DaysChart 
              data={chartData} 
              isLoading={isLoading} 
              error={null}
              onRetry={handleRefresh}
            />

            <OrgCallsSection
              isLoading={isLoading}
              sortedCalls={sortedCalls}
              sortState={sortState}
              handleSortChange={handleSortChange}
              formatDuration={formatDuration}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
