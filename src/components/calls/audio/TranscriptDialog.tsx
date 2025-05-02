
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
          className="max-h-[60vh] overflow-y-auto mt-4 focus:outline-none focus:ring-2 focus:ring-primary" 
          tabIndex={0}
          role="document"
          aria-label="Transcription complète de l'appel"
        >
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
