
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { showToast } from '@/hooks/use-toast'; // Utilisation de showToast à la place de toast
import { AGENT_ID } from '@/config/agent';
import { handleApiError } from '@/utils/api-metrics';

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
        variant: "destructive"
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
        throw error;
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
          variant: "destructive"
        });
      }
      
      return data;
    } catch (error) {
      handleApiError(error, (props) => {
        showToast(props.title, { 
          description: props.description,
          variant: props.variant as "default" | "destructive" | undefined
        });
      }, "Une erreur est survenue lors de la synchronisation");
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
