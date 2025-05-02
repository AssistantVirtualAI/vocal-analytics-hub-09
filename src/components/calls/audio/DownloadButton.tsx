
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DownloadButtonProps {
  audioUrl: string;
  callId?: string;
}

export const DownloadButton = ({ audioUrl, callId }: DownloadButtonProps) => {
  const { toast } = useToast();
  
  const handleDownload = () => {
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = audioUrl;
      
      // Generate filename with timestamp for uniqueness
      const now = format(new Date(), 'yyyy-MM-dd-HH-mm-ss', { locale: fr });
      const filename = callId 
        ? `appel-${callId}-elevenlabs-${now}.mp3`
        : `audio-elevenlabs-${now}.mp3`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Téléchargement démarré",
        description: "L'audio est en cours de téléchargement.",
      });
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'audio.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload}
      title="Télécharger l'audio"
      aria-label="Télécharger l'audio"
    >
      <Download className="h-4 w-4 mr-2" />
      Télécharger
    </Button>
  );
};
