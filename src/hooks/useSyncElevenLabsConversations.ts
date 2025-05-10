
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast'; 
import { AGENT_ID } from '@/config/agent';
import { handleApiError } from '@/utils/api-metrics';

interface SyncOptions {
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

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

export function useSyncElevenLabsConversations() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const syncConversations = async (agentId = AGENT_ID, options: SyncOptions = {}) => {
    if (!agentId) {
      toast("Erreur", {
        description: "Aucun ID d'agent ElevenLabs n'est configuré",
        variant: "destructive"
      });
      return { success: false };
    }
    
    setIsSyncing(true);
    
    try {
      console.log("Calling sync-elevenlabs-conversations function with agentId:", agentId, "and options:", options);
      
      const { data, error } = await supabase.functions.invoke<SyncResult>(
        'sync-elevenlabs-conversations', 
        {
          body: { 
            agentId,
            fromDate: options.fromDate?.toISOString(),
            toDate: options.toDate?.toISOString(),
            limit: options.limit
          }
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
        toast("Synchronisation réussie", {
          description: `${data.summary.success} conversations importées sur ${data.summary.total}.`
        });
      } else if (data.error) {
        toast("Erreur de synchronisation", {
          description: data.error.message || "Une erreur s'est produite",
          variant: "destructive"
        });
      }
      
      return data;
    } catch (error) {
      handleApiError(error, (props) => {
        toast(props.title, { 
          description: props.description,
          variant: props.variant as "default" | "destructive" | undefined
        });
      }, "Une erreur est survenue lors de la synchronisation");
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  };
  
  // On conserve l'ancienne fonction pour compatibilité
  const syncHistory = async (agentId = AGENT_ID) => {
    if (!agentId) {
      toast("Erreur", {
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
        toast("Synchronisation réussie", {
          description: `${data.summary.success} appels importés sur ${data.summary.total}.`
        });
      } else if (data.error) {
        toast("Erreur de synchronisation", {
          description: data.error.message || "Une erreur s'est produite",
          variant: "destructive"
        });
      }
      
      return data;
    } catch (error) {
      handleApiError(error, (props) => {
        toast(props.title, { 
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
    syncConversations,
    syncHistory, // Pour compatibilité avec le code existant
    isSyncing
  };
}
