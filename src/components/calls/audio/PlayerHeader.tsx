
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface PlayerHeaderProps {
  isLoading: boolean;
  error?: Error | null;
  retryCount?: number; // Added this prop to fix the TypeScript error
}

export const PlayerHeader = ({ isLoading, error, retryCount = 0 }: PlayerHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle>ElevenLabs Audio</CardTitle>
      {isLoading && (
        <CardDescription>
          Chargement de l'audio depuis ElevenLabs...
        </CardDescription>
      )}
      {error && (
        <CardDescription className="text-red-500">
          {retryCount > 0 ? 
            `Erreur de chargement (tentative ${retryCount}) - Nouvel essai en cours...` : 
            "Erreur lors du chargement de l'audio depuis ElevenLabs."}
        </CardDescription>
      )}
    </CardHeader>
  );
};
