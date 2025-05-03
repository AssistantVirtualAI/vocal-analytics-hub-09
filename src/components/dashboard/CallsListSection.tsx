
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CallsToolbar } from "@/components/calls/CallsToolbar";
import { CallsTable } from "@/components/dashboard/CallsTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CallsListSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFilterChange: (filters: any) => void;
  callsData: any;
  isCallsLoading: boolean;
  callsError: any;
  formatDurationMinutes: (seconds: number) => string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRenderError: (message: string) => JSX.Element;
}

export function CallsListSection({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onFilterChange,
  callsData,
  isCallsLoading,
  callsError,
  formatDurationMinutes,
  currentPage,
  onPageChange,
  onRenderError
}: CallsListSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Derniers appels</CardTitle>
        <div className="text-sm text-muted-foreground">
          {!isCallsLoading && `${callsData?.totalCount || 0} appel(s) au total`}
        </div>
      </CardHeader>
      <CardContent>
        {callsError && onRenderError("Échec du chargement des appels. " + (callsError as Error).message)}
        
        <CallsToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          showFilters={showFilters}
          onToggleFilters={onToggleFilters}
          onFilterChange={onFilterChange}
        />

        <CallsTable
          calls={callsData?.calls}
          isLoading={isCallsLoading}
          formatDurationMinutes={formatDurationMinutes}
          totalCount={callsData?.totalCount}
          currentPage={currentPage}
          totalPages={callsData?.totalPages}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
