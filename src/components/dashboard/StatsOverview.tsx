
import React from 'react';
import { CallStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from './utils/formatters';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StatsOverviewProps {
  data?: CallStats;  // Changed from callStats to data to match usage in Index.tsx
  isLoading?: boolean;
  hasError?: boolean;
  error?: Error | null;  // Added to match usage in Index.tsx
  refetch?: () => void;  // Added to match usage in Index.tsx
  onRetry?: () => void;
}

export function StatsOverview({ 
  data, // Changed from callStats to data
  isLoading = false, 
  hasError = false,
  error = null, 
  refetch,
  onRetry 
}: StatsOverviewProps) {
  // Check if there's an error from either source
  const hasAnyError = hasError || !!error;
  
  if (hasAnyError) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-lg font-medium">Erreur de chargement des statistiques</p>
                <p className="text-sm text-muted-foreground">
                  Impossible de récupérer les données des appels.
                </p>
              </div>
              {(onRetry || refetch) && (
                <Button onClick={onRetry || refetch} variant="outline" className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Réessayer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des appels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{data?.totalCalls || 0}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Nombre total d'appels enregistrés
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{formatDuration(data?.avgDuration || 0)}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Durée moyenne des appels
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">
              {data?.avgSatisfaction ? data.avgSatisfaction.toFixed(1) : "0"}/5
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Score moyen de satisfaction client
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
