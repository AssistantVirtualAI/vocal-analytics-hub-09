import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallStats } from '@/hooks/useCallStats';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { OverviewTab } from '@/components/stats/OverviewTab';
import { SatisfactionTab } from '@/components/stats/SatisfactionTab';
import { AgentsTab } from '@/components/stats/AgentsTab';
import { CustomersTab } from '@/components/stats/CustomersTab';
import { StatsOverview } from '@/components/stats/StatsOverview';

export default function Stats() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: callStats, isLoading: callStatsLoading } = useCallStats();
  const { data: customerStats, isLoading: customerStatsLoading } = useCustomerStats();
  
  const isLoading = callStatsLoading || customerStatsLoading;
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container p-4 sm:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-muted-foreground">Chargement des statistiques...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data for calls per day
  const chartData = Object.entries(callStats?.callsPerDay || {})
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      appels: count,
    }))
    .slice(-14);

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Statistiques</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Dernière mise à jour: il y a 5 minutes
            </span>
          </div>
        </div>

        <StatsOverview
          totalCalls={callStats?.totalCalls || 0}
          avgDuration={callStats?.avgDuration || 0}
          avgSatisfaction={callStats?.avgSatisfaction || 0}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid sm:inline-grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab chartData={chartData} customerStats={customerStats || []} />
          </TabsContent>
          
          <TabsContent value="satisfaction">
            <SatisfactionTab 
              satisfactionData={satisfactionData} 
              satisfactionOverTime={satisfactionOverTime} 
            />
          </TabsContent>
          
          <TabsContent value="agents">
            <AgentsTab />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomersTab data={customerStats || []} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
