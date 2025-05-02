
import React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface PlayerHeaderProps {
  isLoading: boolean;
  error?: Error | null;
}

export const PlayerHeader = ({ isLoading, error }: PlayerHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle>Enregistrement audio ElevenLabs</CardTitle>
      {isLoading && (
        <CardDescription>Chargement de l'audio depuis ElevenLabs...</CardDescription>
      )}
      {error && (
        <CardDescription className="text-red-500">
          Erreur lors du chargement de l'audio: {error.message || 'Erreur inconnue'}
        </CardDescription>
      )}
    </CardHeader>
  );
};
