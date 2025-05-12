
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { RecentCalls } from '@/components/dashboard/RecentCalls';
import { DashboardCallsChart } from '@/components/dashboard/DashboardCallsChart';
import { CustomerStatsSection } from '@/components/dashboard/CustomerStatsSection';
import { useTimeRange } from '@/hooks/dashboard/useTimeRange';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { timeRange, setTimeRange, dateRange } = useTimeRange();
  
  const { 
    callStats, 
    customerStats, 
    recentCalls, 
    chartData, 
    lastUpdated, 
    isLoading, 
    hasError, 
    handleRefresh 
  } = useDashboardStats();

  // Ensure lastUpdated is a string when passed to DashboardHeader
  const formattedLastUpdated = typeof lastUpdated === 'string' ? lastUpdated : '';

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6">
        <DashboardHeader
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          lastUpdated={formattedLastUpdated}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="calls">Appels</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-6">
            <StatsOverview 
              data={callStats} 
              isLoading={isLoading} 
              hasError={hasError} 
              onRetry={handleRefresh} 
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <DashboardCallsChart 
                data={chartData} 
                isLoading={isLoading} 
              />
              <RecentCalls 
                calls={recentCalls} 
                isLoading={isLoading} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="calls" className="space-y-4 mt-6">
            <RecentCalls 
              calls={recentCalls} 
              isLoading={isLoading} 
              showAll={true} 
            />
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4 mt-6">
            <CustomerStatsSection 
              stats={customerStats} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
