
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const EmptyState = () => {
  return (
    <>
      <CardHeader>
        <CardTitle>Statistiques ElevenLabs</CardTitle>
        <CardDescription>Aucune statistique disponible</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Les statistiques ne sont pas disponibles pour cet appel. Cela peut être 
          dû au traitement en cours par ElevenLabs, à l'absence de cette fonctionnalité 
          pour l'appel, ou à un problème de configuration.
        </p>
      </CardContent>
    </>
  );
};
