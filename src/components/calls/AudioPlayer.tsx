
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioPlayerControls } from './audio/AudioPlayerControls';

interface AudioPlayerProps {
  audioUrl: string;
  isLoading: boolean;
  error?: Error | null;
}

export const AudioPlayer = ({ audioUrl, isLoading, error }: AudioPlayerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrement audio</CardTitle>
        {isLoading && (
          <CardDescription>Chargement de l'audio...</CardDescription>
        )}
        {error && (
          <CardDescription className="text-red-500">
            Erreur lors du chargement de l'audio. Utilisation de l'audio par défaut.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <AudioPlayerControls audioUrl={audioUrl} isDisabled={isLoading} />
      </CardContent>
    </Card>
  );
};
