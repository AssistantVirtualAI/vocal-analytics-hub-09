
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCallsChart } from '@/components/dashboard/DashboardCallsChart';
import { CallsListSection } from '@/components/dashboard/CallsListSection';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { DateRange } from 'react-day-picker';
import { formatDuration } from '@/components/dashboard/utils/formatters';
import { useDashboardFetch } from '@/hooks/dashboard/useDashboardFetch';
import { SyncCallsButton } from '@/components/dashboard/SyncCallsButton';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/hooks/useConfig';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { agentId } = useConfig();

  // Get dashboard data
  const {
    callStats,
    callsData,
    isLoading,
    hasError,
    handleRefresh,
    lastUpdated
  } = useDashboardFetch();

  // Format duration in minutes:seconds
  const formatDurationMinutes = (seconds: number): string => {
    return formatDuration(seconds);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  // Handle filter toggle
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter change
  const handleFilterChange = (filters: any) => {
    // Apply filters logic
    console.log("Filters applied:", filters);
  };

  // Handle refresh data
  const handleRefreshData = async () => {
    try {
      await handleRefresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-sm p-4 rounded-lg border border-border/40 bg-background/60 shadow-lg">
            <DashboardHeader 
              lastUpdated={lastUpdated} 
              isLoading={isLoading} 
              onRefresh={handleRefreshData} 
            />
            
            <div className="flex gap-2">
              <SyncCallsButton 
                agentId={agentId} 
                onSuccess={handleRefreshData} 
                className="bg-primary/80 hover:bg-primary transition-all duration-200"
              />
              <DateRangeSelector 
                dateRange={dateRange || { from: undefined, to: undefined }} 
                onDateRangeChange={handleDateRangeChange}
                className="bg-background/80 backdrop-blur-sm border border-border/40"
              />
            </div>
          </div>

          <DashboardStats 
            callStats={callStats} 
            isLoading={isLoading}
            formatDuration={formatDurationMinutes}
          />

          <div className={cn("transition-all duration-300", isLoading ? "opacity-50" : "opacity-100")}>
            <DashboardCallsChart 
              callData={callStats}
              isLoading={isLoading}
            />
          </div>

          <div className="backdrop-blur-sm rounded-lg border border-border/40 bg-background/60 shadow-lg p-4">
            <CallsListSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showFilters={showFilters}
              onToggleFilters={handleToggleFilters}
              onFilterChange={handleFilterChange}
              callsData={callsData}
              isCallsLoading={isLoading}
              callsError={hasError ? new Error("Failed to load calls") : null}
              formatDurationMinutes={formatDurationMinutes}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onRetry={handleRefreshData}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
