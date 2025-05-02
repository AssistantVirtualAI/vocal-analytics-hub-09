
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TranscriptText } from './TranscriptText';

interface TranscriptDialogProps {
  transcript: string;
}

export const TranscriptDialog = ({ transcript }: TranscriptDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          aria-label="Voir la transcription complète"
          title="Voir la transcription complète"
        >
          Voir tout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transcription complète</DialogTitle>
          <DialogDescription>
            Transcription générée par ElevenLabs
          </DialogDescription>
        </DialogHeader>
        <div 
          className="mt-4 focus:outline-none focus:ring-2 focus:ring-primary" 
          role="document"
          aria-label="Transcription complète de l'appel"
        >
          <TranscriptText 
            transcript={transcript}
            maxHeight="max-h-[60vh]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
