
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useOrg } from "@/context/OrgContext";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { CallsList } from "@/components/dashboard/CallsList";
import { CustomerStatsList } from "@/components/dashboard/CustomerStatsList";

// Custom hooks
import { useOrgCallsList } from "@/hooks/useOrgCallsList";
import { useCallsPerDay } from "@/hooks/useCallsPerDay";
import { useCustomerStats } from "@/hooks/useCustomerStats";

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

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Setup the stats query - we need to fix the hook call
  const { 
    callStats: statsData, 
    isLoading: isLoadingStats, 
    hasError: errorStats, 
    handleRefresh: refetchStats,
    chartData: callsPerDayData
  } = useOrgDashboardStats(orgSlug || "", {
    dateRange,
    enabled: !!orgSlug
  });

  // Fetch calls list data
  const { data: callsListData, isLoading: isLoadingCallsList, error: errorCallsList, refetch: refetchCallsList } = useOrgCallsList({
    orgSlug,
    limit: CALLS_PER_PAGE,
    page: callsPage,
    sortBy: callsSortBy,
    sortOrder: callsSortOrder,
    startDate,
    endDate,
    enabled: !!orgSlug && activeTab === "calls",
  });

  // Fetch customer stats
  const { data: customerStatsData, isLoading: isLoadingCustomerStats, error: errorCustomerStats, refetch: refetchCustomerStats } = useCustomerStats({ 
    orgSlug, 
    startDate, 
    endDate, 
    enabled: !!orgSlug && activeTab === "customers" 
  });

  // Function to refetch all overview data
  const handleRefreshOverview = () => {
    refetchStats();
  };

  // Prepare chart data for calls per day using real data
  const chartData = useMemo(() => {
    return callsPerDayData || [];
  }, [callsPerDayData]);

  // Get calls list data
  const callsList = callsListData?.calls || [];
  const callsTotalCount = callsListData?.totalCount || 0;
  const callsTotalPages = callsListData?.totalPages || 0;

  // Get customer stats using real data
  const customerStats = customerStatsData || [];

  // Handle sort change
  const handleSortChange = (sort: string, order: "asc" | "desc") => {
    setCallsSortBy(sort);
    setCallsSortOrder(order);
  };

  // Reset page to 1 when filters/sorting change
  useEffect(() => {
    setCallsPage(1);
  }, [callsSortBy, callsSortOrder, dateRange]); 

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
              disabled={isLoadingStats}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoadingStats && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <TabsTrigger value="overview">Vue d\u0027ensemble</TabsTrigger>
            <TabsTrigger value="calls">Appels</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4">
            <StatsOverview 
              data={statsData} 
              isLoading={isLoadingStats} 
              error={errorStats ? new Error("Error loading stats") : null} 
              refetch={refetchStats} 
            />
            <CallsChart 
              chartData={chartData} 
              isLoading={isLoadingStats} 
              error={errorStats ? new Error("Error loading chart data") : null} 
              refetch={refetchStats} 
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
