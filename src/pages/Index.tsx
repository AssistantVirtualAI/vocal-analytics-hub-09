
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useOrg } from "@/context/OrgContext";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { cn } from "@/lib/utils";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { CallsList } from "@/components/dashboard/CallsList";
import { CustomerStatsList } from "@/components/dashboard/CustomerStatsList";
import { ElevenLabsDiagnosticsButton } from "@/components/dashboard/ElevenLabsDiagnosticsButton";
import { DiagnosticPanel } from "@/components/dashboard/DiagnosticPanel";
import { TimeRangeButtonGroup, TimeRange } from "@/components/dashboard/TimeRangeSelector";

// Import our specialized hooks
import { 
  useStats, 
  useCallsData, 
  useCustomerData, 
  useChartData,
  useTimeRange
} from "@/hooks/dashboard";

const CALLS_PER_PAGE = 5;

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentOrg } = useOrg();
  const orgSlug = currentOrg?.slug;
  
  // Use our time range hook
  const { timeRange, setTimeRange, dateRange } = useTimeRange();

  // State for calls list filters, sorting, pagination
  const [callsPage, setCallsPage] = useState(1);
  const [callsSortBy, setCallsSortBy] = useState("date");
  const [callsSortOrder, setCallsSortOrder] = useState<"asc" | "desc">("desc");
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Use our specialized hooks with the time range
  const { 
    statsData, 
    isLoading: isLoadingStats, 
    error: errorStats, 
    refetch: refetchStats 
  } = useStats({
    orgSlug,
    dateRange,
    enabled: !!orgSlug
  });

  const { 
    chartData, 
    isLoading: isLoadingChartData, 
    error: errorChartData, 
    refetch: refetchChartData 
  } = useChartData({
    orgSlug,
    dateRange,
    enabled: !!orgSlug
  });

  const { 
    callsList, 
    totalCount: callsTotalCount, 
    totalPages: callsTotalPages, 
    isLoading: isLoadingCallsList, 
    error: errorCallsList, 
    refetch: refetchCallsList 
  } = useCallsData({
    orgSlug,
    dateRange,
    page: callsPage,
    limit: CALLS_PER_PAGE,
    sortBy: callsSortBy,
    sortOrder: callsSortOrder,
    enabled: !!orgSlug && activeTab === "calls"
  });

  const { 
    customerStats, 
    isLoading: isLoadingCustomerStats, 
    error: errorCustomerStats, 
    refetch: refetchCustomerStats 
  } = useCustomerData({
    orgSlug,
    dateRange,
    enabled: !!orgSlug && activeTab === "customers"
  });

  // Function to refetch all overview data
  const handleRefreshOverview = () => {
    refetchStats();
    refetchChartData();
  };

  // Handle sort change
  const handleSortChange = (sort: string, order: "asc" | "desc") => {
    setCallsSortBy(sort);
    setCallsSortOrder(order);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Tableau de bord {currentOrg ? `- ${currentOrg.name}` : ""}
          </h1>
          <div className="flex items-center space-x-2">
            <ElevenLabsDiagnosticsButton 
              variant="outline" 
              size="sm" 
              className="mr-2" 
              onClick={() => setShowDiagnostics(!showDiagnostics)} 
            />
            <TimeRangeButtonGroup
              value={timeRange}
              onChange={setTimeRange}
              className="mr-2"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshOverview}
              disabled={isLoadingStats || isLoadingChartData}
            >
              <RefreshCw
                className={cn("h-4 w-4", (isLoadingStats || isLoadingChartData) && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {/* Diagnostic Panel - conditionally shown */}
        {showDiagnostics && (
          <div className="mb-6">
            <DiagnosticPanel />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="calls">Appels</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4">
            <StatsOverview 
              data={statsData} 
              isLoading={isLoadingStats} 
              error={errorStats} 
              refetch={refetchStats} 
            />
            <CallsChart 
              data={statsData?.callsPerDay || {}} 
              isLoading={isLoadingChartData} 
              error={errorChartData} 
              refetch={refetchChartData} 
              timeRange={timeRange}
            />
          </TabsContent>

          {/* Calls Tab Content */}
          <TabsContent value="calls" className="space-y-4">
            <CallsList 
              calls={callsList}
              totalCount={callsTotalCount}
              totalPages={callsTotalPages}
              currentPage={callsPage}
              sortBy={callsSortBy}
              sortOrder={callsSortOrder}
              isLoading={isLoadingCallsList}
              error={errorCallsList}
              orgSlug={orgSlug}
              onPageChange={setCallsPage}
              onSortChange={handleSortChange}
              refetch={refetchCallsList}
              timeRange={timeRange}
            />
          </TabsContent>

          {/* Customers Tab Content */}
          <TabsContent value="customers" className="space-y-4">
            <CustomerStatsList 
              customerStats={customerStats}
              isLoading={isLoadingCustomerStats}
              error={errorCustomerStats}
              orgSlug={orgSlug}
              refetch={refetchCustomerStats}
              timeRange={timeRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
