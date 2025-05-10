
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SyncCallsButtonProps {
  agentId: string;
  onSuccess?: () => void;
}

export function SyncCallsButton({ agentId, onSuccess }: SyncCallsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!agentId) {
      toast({
        title: "Agent ID manquant",
        description: "Veuillez d'abord sélectionner un agent",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      // Sample dummy calls data - in a real app, you would fetch this from ElevenLabs API
      const dummyCalls = [
        {
          id: `call-${Date.now()}-1`,
          date: new Date().toISOString(),
          duration: "0:19",
          customerName: "Client test 1",
          evaluationResult: "Successful"
        },
        {
          id: `call-${Date.now()}-2`,
          date: new Date().toISOString(),
          duration: "0:27",
          customerName: "Client test 2",
          evaluationResult: "Successful"
        }
      ];

      const { data, error } = await supabase.functions.invoke("sync-calls-elevenlabs", {
        body: { calls: dummyCalls, agentId }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Échec de la synchronisation des appels");
      }

      toast({
        title: "Synchronisation réussie",
        description: `${data.summary?.success || 0} appel(s) synchronisé(s)`,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error syncing calls:", error);
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Une erreur s'est produite lors de la synchronisation des appels",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      variant="outline"
      className="gap-2"
    >
      {isSyncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      Synchroniser les appels ElevenLabs
    </Button>
  );
}
