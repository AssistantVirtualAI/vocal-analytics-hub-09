
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { showToast } from '@/hooks/use-toast';
import { AGENT_ID } from '@/config/agent';

interface SyncResult {
  success: boolean;
  results: {
    id: string;
    success: boolean;
    action?: string;
    error?: string;
  }[];
  summary: {
    total: number;
    success: number;
    error: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

export function useSyncElevenLabsHistory() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const syncHistory = async (agentId = AGENT_ID) => {
    if (!agentId) {
      showToast("Erreur", {
        description: "Aucun ID d'agent ElevenLabs n'est configuré",
      });
      return { success: false };
    }
    
    setIsSyncing(true);
    
    try {
      console.log("Calling sync-elevenlabs-history function with agentId:", agentId);
      
      const { data, error } = await supabase.functions.invoke<SyncResult>(
        'sync-elevenlabs-history', 
        {
          body: { agentId }
        }
      );
      
      console.log("Function response:", { data, error });
      
      if (error) {
        console.error("Function invocation error:", error);
        throw new Error(error.message || "Erreur lors de la synchronisation");
      }
      
      if (!data) {
        throw new Error("Aucune données reçues de la fonction");
      }
      
      if (data.success) {
        showToast("Synchronisation réussie", {
          description: `${data.summary.success} appels importés sur ${data.summary.total}.`
        });
      } else if (data.error) {
        showToast("Erreur de synchronisation", {
          description: data.error.message || "Une erreur s'est produite",
        });
      }
      
      return data;
    } catch (error: any) {
      console.error("Sync history error:", error);
      showToast("Erreur", {
        description: error.message || "Une erreur inattendue s'est produite"
      });
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    syncHistory,
    isSyncing
  };
}
