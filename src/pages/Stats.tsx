
import { DashboardLayout } from '@/components/dashboard/Layout';
import { TabsContent } from '@/components/ui/tabs';
import { OverviewTab } from '@/components/stats/OverviewTab';
import { SatisfactionTab } from '@/components/stats/SatisfactionTab';
import { AgentsTab } from '@/components/stats/AgentsTab';
import { CustomersTab } from '@/components/stats/CustomersTab';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { StatsError } from '@/components/stats/StatsError';
import { StatsTabsContainer } from '@/components/stats/StatsTabsContainer';
import { useStatsData } from '@/components/stats/useStatsData';

export default function Stats() {
  const {
    activeTab,
    setActiveTab,
    callStats,
    customerStats,
    chartData,
    isLoading,
    hasError,
    formatLastUpdated,
    handleRefresh
  } = useStatsData();

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-purple-400/5 dark:bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        
        <StatsHeader 
          onRefresh={handleRefresh}
          lastUpdatedText={formatLastUpdated()}
          isLoading={isLoading}
        />

        {hasError && <StatsError onRetry={handleRefresh} />}

        {isLoading ? (
          <StatsOverview
            data={{
              totalCalls: 0,
              avgDuration: 0,
              avgSatisfaction: 0,
              callsPerDay: {},
              lastUpdated: '',
              topCustomers: []
            }}
            isLoading={true}
          />
        ) : (
          <StatsOverview
            data={callStats}
            isLoading={false}
            error={hasError ? new Error("Failed to load stats") : null}
            refetch={handleRefresh}
          />
        )}

        <StatsTabsContainer 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isLoading={isLoading}
        >
          <TabsContent value="overview" className="animate-fade-in">
            <OverviewTab chartData={chartData} customerStats={customerStats || []} />
          </TabsContent>
          
          <TabsContent value="satisfaction" className="animate-fade-in">
            <SatisfactionTab />
          </TabsContent>
          
          <TabsContent value="agents" className="animate-fade-in">
            <AgentsTab />
          </TabsContent>
          
          <TabsContent value="customers" className="animate-fade-in">
            <CustomersTab data={customerStats || []} />
          </TabsContent>
        </StatsTabsContainer>
      </div>
    </DashboardLayout>
  );
}
