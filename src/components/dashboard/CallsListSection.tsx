
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
import { Button } from "@/components/ui/button";

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
  onRetry: () => void;
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
  onRetry
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
        {callsError && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>Échec du chargement des appels: {callsError.message}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2"
              >
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
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
