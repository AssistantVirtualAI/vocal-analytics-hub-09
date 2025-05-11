
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { AGENT_ID } from '@/config/agent';
import { handleApiError } from '@/utils/api-metrics';

interface SyncResult {
  success: boolean;
  results?: {
    id: string;
    success: boolean;
    action?: string;
    error?: string;
  }[];
  summary?: {
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
      toast.error("Aucun ID d'agent ElevenLabs n'est configuré");
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
        console.error("Supabase function error:", error);
        toast.error(`Erreur de synchronisation: ${error.message || "Une erreur s'est produite"}`);
        throw error;
      }
      
      if (!data) {
        throw new Error("Aucune données reçues de la fonction");
      }
      
      if (data.success) {
        if (data.summary?.total === 0) {
          toast.info("Aucun nouvel appel à synchroniser");
        } else {
          toast.success(`Synchronisation réussie: ${data.summary?.success || 0} appels importés sur ${data.summary?.total || 0}.`);
        }
      } else if (data.error) {
        toast.error(`Erreur de synchronisation: ${data.error.message || "Une erreur s'est produite"}`);
      }
      
      return data;
    } catch (error) {
      console.error("Error in syncHistory:", error);
      
      handleApiError(error, (props) => {
        toast.error(props.description || "Une erreur est survenue lors de la synchronisation");
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
