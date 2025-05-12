
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataWrapper } from "./DataWrapper";
import type { CustomerStats } from '@/types';
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDuration } from '@/utils/formatters';

interface CustomerStatsSectionProps {
  stats: CustomerStats[];
  isLoading: boolean;
}

export function CustomerStatsSection({ stats, isLoading }: CustomerStatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques clients</CardTitle>
      </CardHeader>
      <CardContent>
        <DataWrapper isLoading={isLoading} error={null} refetch={() => {}}>
          {stats && stats.length > 0 ? (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.customerId}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-accent"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{stat.customerName || "Client inconnu"}</div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{stat.totalCalls} appels</span>
                      <span className="mx-2">•</span>
                      <span>Durée moy. {formatDuration(stat.avgDuration || 0)}</span>
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
                              i < Math.round(stat.avgSatisfaction || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                    </div>
                    <Link
                      to={`/customers/${stat.customerId}`}
                      className="text-primary hover:underline text-sm"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune statistique client disponible</p>
            </div>
          )}
        </DataWrapper>
      </CardContent>
    </Card>
  );
}
