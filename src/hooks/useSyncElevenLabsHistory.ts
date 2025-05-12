
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
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  
  const syncHistory = async (agentId = AGENT_ID) => {
    if (!agentId) {
      toast.error("Aucun ID d'agent ElevenLabs n'est configuré");
      return { success: false };
    }
    
    setIsSyncing(true);
    
    try {
      console.log("Calling sync-elevenlabs-history function with agentId:", agentId);
      
      // First try diagnostic to check connection
      try {
        const diagnosticResult = await supabase.functions.invoke('elevenlabs-diagnostic');
        console.log("Diagnostic result:", diagnosticResult);
      } catch (diagError) {
        console.log("Diagnostic check failed, continuing anyway:", diagError);
      }
      
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
        const noDataError = new Error("Aucune données reçues de la fonction");
        throw noDataError;
      }
      
      setLastSyncResult(data);
      
      if (data.success) {
        if (data.summary?.total === 0) {
          toast.info("Aucun nouvel appel à synchroniser");
        } else {
          toast.success(`Synchronisation réussie: ${data.summary?.success || 0} appels importés sur ${data.summary?.total || 0}.`);
        }
      } else if (data.error) {
        let errorMessage = data.error.message || "Une erreur s'est produite";
        
        // Add more context for specific errors
        if (data.error.code === "ELEVENLABS_FETCH_ERROR") {
          if (errorMessage.includes("Invalid ElevenLabs API key")) {
            errorMessage = "Clé API ElevenLabs invalide. Veuillez vérifier votre configuration.";
          } else if (errorMessage.includes("Missing ElevenLabs API key")) {
            errorMessage = "Clé API ElevenLabs manquante. Veuillez configurer la variable d'environnement ELEVENLABS_API_KEY.";
          } else if (errorMessage.includes("rate limit") || errorMessage.includes("quota exceeded")) {
            errorMessage = "Limite d'utilisation de l'API ElevenLabs dépassée. Veuillez réessayer plus tard.";
          }
        }
        
        toast.error(`Erreur de synchronisation: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error("Error in syncHistory:", error);
      
      handleApiError(error, (props) => {
        toast.error(props.description || "Une erreur est survenue lors de la synchronisation");
      });
      
      return { success: false, error: { message: error.message, code: "SYNC_FAILED" } };
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    syncHistory,
    isSyncing,
    lastSyncResult
  };
}
