
import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsTabsContainerProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  isLoading: boolean;
  children: ReactNode;
}

export function StatsTabsContainer({ 
  activeTab, 
  setActiveTab, 
  isLoading, 
  children 
}: StatsTabsContainerProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid sm:inline-grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
        <TabsTrigger value="agents">Agents</TabsTrigger>
        <TabsTrigger value="customers">Clients</TabsTrigger>
      </TabsList>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 h-[300px]">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="w-full h-full rounded-lg" />
          ))}
        </div>
      ) : (
        children
      )}
    </Tabs>
  );
}
