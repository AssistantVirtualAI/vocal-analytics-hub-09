
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Call } from "@/types";

interface RecentCallsListProps {
  calls: Call[];
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function RecentCallsList({ calls, isLoading, formatDuration }: RecentCallsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels récents</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucun appel récent trouvé.
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map(call => (
              <div 
                key={call.id} 
                className="flex items-center justify-between p-4 border rounded-md hover:bg-accent cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="font-medium">{call.customerName}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(call.date), { addSuffix: true, locale: fr })}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDuration(call.duration)}</span>
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
                          className={i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                  </div>
                  <Link 
                    to={`/calls/${call.id}`} 
                    className="text-primary hover:underline text-sm"
                  >
                    Voir détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <Link 
            to="/calls"
            className="text-primary hover:underline"
          >
            Voir tous les appels
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
