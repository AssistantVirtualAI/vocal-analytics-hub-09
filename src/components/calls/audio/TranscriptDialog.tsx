
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
        <Button variant="outline" size="sm">Voir tout</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transcription complète</DialogTitle>
          <DialogDescription>
            Transcription générée par ElevenLabs
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto mt-4">
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
