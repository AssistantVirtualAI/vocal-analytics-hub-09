
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Call } from '@/types';

export const useAudioPlayback = () => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayToggle = (call: Call) => {
    const audioElement = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
    
    if (currentlyPlaying === call.id) {
      audioElement.pause();
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying) {
        const currentAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      
      audioElement.play().catch(error => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio. Veuillez réessayer.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
      setCurrentlyPlaying(call.id);
    }
  };

  useEffect(() => {
    const handleAudioEnd = () => {
      setCurrentlyPlaying(null);
    };

    return () => {
      if (currentlyPlaying) {
        const audio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement;
        if (audio) {
          audio.pause();
        }
      }
    };
  }, [currentlyPlaying]);

  return {
    currentlyPlaying,
    handlePlayToggle,
    formatDuration
  };
};
