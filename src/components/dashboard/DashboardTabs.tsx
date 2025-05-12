
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface DashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  overviewContent: ReactNode;
  callsContent: ReactNode;
  customersContent: ReactNode;
}

export function DashboardTabs({
  activeTab,
  setActiveTab,
  overviewContent,
  callsContent,
  customersContent
}: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="calls">Appels</TabsTrigger>
        <TabsTrigger value="customers">Clients</TabsTrigger>
      </TabsList>

      {/* Overview Tab Content */}
      <TabsContent value="overview" className="space-y-4">
        {overviewContent}
      </TabsContent>

      {/* Calls Tab Content */}
      <TabsContent value="calls" className="space-y-4">
        {callsContent}
      </TabsContent>

      {/* Customers Tab Content */}
      <TabsContent value="customers" className="space-y-4">
        {customersContent}
      </TabsContent>
    </Tabs>
  );
}
