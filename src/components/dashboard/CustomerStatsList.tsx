
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataWrapper } from "./DataWrapper";
import { CustomerStats } from "@/types";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDuration } from "@/utils/formatters";
import { TimeRange } from "@/components/dashboard/TimeRangeSelector";

interface CustomerStatsListProps {
  customerStats: CustomerStats[];
  isLoading: boolean;
  error: Error | null;
  orgSlug?: string;
  refetch: () => void;
  timeRange?: TimeRange; // Added the timeRange prop
}

export function CustomerStatsList({
  customerStats,
  isLoading,
  error,
  orgSlug,
  refetch,
  timeRange,
}: CustomerStatsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques clients</CardTitle>
      </CardHeader>
      <CardContent>
        <DataWrapper isLoading={isLoading} error={error} refetch={refetch}>
          {customerStats.length > 0 ? (
            <div className="space-y-4">
              {customerStats.map((stats) => (
                <div
                  key={stats.customerId}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-accent"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{stats.customerName || "Client inconnu"}</div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{stats.totalCalls} appels</span>
                      <span className="mx-2">•</span>
                      <span>Durée moy. {formatDuration(stats.avgDuration ?? 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < Math.round(stats.avgSatisfaction ?? 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                    </div>
                    <Link
                      to={`/${orgSlug}/customers/${stats.customerId}`}
                      className="text-primary hover:underline text-sm"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              Aucune statistique client trouvée pour cette période.
            </p>
          )}
        </DataWrapper>
      </CardContent>
    </Card>
  );
}
