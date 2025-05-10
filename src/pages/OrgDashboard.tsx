import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/context/AuthContext';
import { SecurityIssuesFixer } from '@/components/security/SecurityIssuesFixer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StatsError } from '@/components/stats/StatsError';
import { CallsLast30DaysChart } from '@/components/stats/CallsLast30DaysChart';
import { DateRange } from '@/types/calendar';
import { useOrgDashboardStats } from '@/hooks/useOrgDashboardStats';
import { useOrgCallsSorting } from '@/hooks/dashboard/useOrgCallsSorting';
import { OrgFiltersSection } from '@/components/dashboard/org/OrgFiltersSection';
import { OrgCallsSection } from '@/components/dashboard/org/OrgCallsSection';
import { SyncCallsButton } from '@/components/dashboard/SyncCallsButton';
import { useOrg } from '@/context/OrgContext';

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { currentOrg } = useOrg();
  const { isAdmin } = useAuth();
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
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 left-0 w-48 h-48 bg-purple-400/5 dark:bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        
        {/* Add the security fixer component only for admins */}
        {isAdmin && <SecurityIssuesFixer />}
        
        <div className="flex justify-between items-center mb-4">
          <DashboardHeader
            lastUpdated={lastUpdated}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
          
          {currentOrg?.agentId && (
            <SyncCallsButton
              agentId={currentOrg.agentId}
              onSuccess={handleRefresh}
              className="ml-2"
              variant="secondary"
            />
          )}
        </div>

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
