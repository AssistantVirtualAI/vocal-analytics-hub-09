
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
      <div className="container p-4 sm:p-6 space-y-6">
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
          <TabsContent value="overview">
            <OverviewTab chartData={chartData} customerStats={customerStats || []} />
          </TabsContent>
          
          <TabsContent value="satisfaction">
            <SatisfactionTab />
          </TabsContent>
          
          <TabsContent value="agents">
            <AgentsTab />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomersTab data={customerStats || []} />
          </TabsContent>
        </StatsTabsContainer>
      </div>
    </DashboardLayout>
  );
}
