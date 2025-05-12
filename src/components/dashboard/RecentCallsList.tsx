
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataWrapper } from "./DataWrapper";
import { Link } from "react-router-dom";
import { BadgeCheck, Calendar, Clock, Phone } from "lucide-react";
import type { Call } from '@/types';

interface RecentCallsListProps {
  calls: Call[];
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function RecentCallsList({ calls, isLoading, formatDuration }: RecentCallsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appels récents</CardTitle>
      </CardHeader>
      <CardContent>
        <DataWrapper isLoading={isLoading} error={null} refetch={() => {}}>
          {calls && calls.length > 0 ? (
            <div className="space-y-4">
              {calls.map((call) => (
                <div key={call.id} className="border-b pb-3 last:pb-0 last:border-0">
                  <Link to={`/calls/${call.id}`} className="flex items-start space-x-3 hover:bg-accent p-2 rounded-md transition-colors">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{call.customerName || "Client inconnu"}</h4>
                        {call.satisfactionScore > 3 && (
                          <BadgeCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-3">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(call.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(call.duration)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>Aucun appel récent</p>
              <p className="text-sm mt-1">Les nouveaux appels apparaîtront ici</p>
            </div>
          )}
        </DataWrapper>
      </CardContent>
    </Card>
  );
}
