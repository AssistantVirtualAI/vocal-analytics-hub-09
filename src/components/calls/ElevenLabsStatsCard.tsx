
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ElevenLabsStatsCardProps {
  statistics: any;
  isLoading: boolean;
}

export const ElevenLabsStatsCard = ({ statistics, isLoading }: ElevenLabsStatsCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques ElevenLabs</CardTitle>
          <CardDescription>Chargement des statistiques...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!statistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques ElevenLabs</CardTitle>
          <CardDescription>Aucune statistique disponible pour cet appel</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Les statistiques ne sont pas disponibles pour cet appel. Cela peut être dû au fait que l'appel n'a pas été traité par ElevenLabs ou que la fonctionnalité de statistiques n'est pas activée pour votre compte.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Format the statistics for display
  const renderStatistics = () => {
    if (typeof statistics !== 'object' || statistics === null) {
      return <p>Format de statistiques non reconnu</p>;
    }
    
    return (
      <div className="space-y-4">
        {/* Show any available statistics in a clean format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(statistics).map(([key, value]) => {
            // Skip nested objects for now, or you could recursively render them
            if (typeof value === 'object' && value !== null) {
              return null;
            }
            
            const formattedKey = key
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            return (
              <div key={key} className="p-3 bg-muted rounded-md">
                <div className="text-xs font-medium text-muted-foreground mb-1">{formattedKey}</div>
                <div className="font-medium">{value?.toString() || 'N/A'}</div>
              </div>
            );
          })}
        </div>
        
        {/* If there are nested objects, display them separately */}
        {Object.entries(statistics).map(([key, value]) => {
          if (typeof value !== 'object' || value === null) {
            return null;
          }
          
          const formattedKey = key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          return (
            <div key={key} className="mt-4">
              <h3 className="text-sm font-medium mb-2">{formattedKey}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                  <div key={subKey} className="p-3 bg-muted rounded-md">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {subKey.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                    <div className="font-medium">{subValue?.toString() || 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques ElevenLabs</CardTitle>
        <CardDescription>Données de performance pour cet appel</CardDescription>
      </CardHeader>
      <CardContent>
        {renderStatistics()}
      </CardContent>
    </Card>
  );
};
