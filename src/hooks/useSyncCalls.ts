
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  summary?: {
    total: number;
    success: number;
    error: number;
  };
  results?: Array<{
    id: string;
    success: boolean;
    action?: string;
    error?: string;
  }>;
  error?: string;
}

export function useSyncCalls() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCalls = async (agentId: string): Promise<SyncResult> => {
    if (!agentId) {
      toast("Agent ID manquant", {
        description: "Veuillez d'abord sélectionner un agent"
      });
      return { success: false, error: "Agent ID manquant" };
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
        body: { 
          calls: dummyCalls, 
          agentId 
        }
      });

      if (error) {
        console.error("Sync error:", error);
        throw new Error(error.message || "Une erreur s'est produite lors de l'appel de la fonction");
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || "Échec de la synchronisation des appels";
        console.error("Sync failed:", errorMsg);
        throw new Error(errorMsg);
      }

      toast("Synchronisation réussie", {
        description: `${data.summary?.success || 0} appel(s) synchronisé(s)`
      });
      
      return data as SyncResult;
    } catch (error: any) {
      console.error("Error syncing calls:", error);
      toast("Erreur de synchronisation", {
        description: error.message || "Une erreur s'est produite lors de la synchronisation des appels"
      });
      return { 
        success: false, 
        error: error.message || "Une erreur s'est produite lors de la synchronisation des appels" 
      };
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncCalls,
    isSyncing
  };
}
