
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const LoadingState = () => {
  return (
    <>
      <CardHeader>
        <CardTitle>Statistiques ElevenLabs</CardTitle>
        <CardDescription>Chargement des statistiques...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-20 flex items-center justify-center text-muted-foreground">
          Chargement...
        </div>
      </CardContent>
    </>
  );
};
