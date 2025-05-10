
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useOrg } from "@/context/OrgContext";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { CallsList } from "@/components/dashboard/CallsList";
import { CustomerStatsList } from "@/components/dashboard/CustomerStatsList";

// Import our new specialized hooks
import { 
  useStats, 
  useCallsData, 
  useCustomerData, 
  useChartData 
} from "@/hooks/dashboard";

const CALLS_PER_PAGE = 5;

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentOrg } = useOrg();
  const orgSlug = currentOrg?.slug;

  // State for date range picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // State for calls list filters, sorting, pagination
  const [callsPage, setCallsPage] = useState(1);
  const [callsSortBy, setCallsSortBy] = useState("date");
  const [callsSortOrder, setCallsSortOrder] = useState<"asc" | "desc">("desc");

  // Use our new specialized hooks
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
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
