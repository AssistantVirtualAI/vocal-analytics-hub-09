
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
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
      toast("Erreur", {
        description: "Aucun ID d'agent ElevenLabs n'est configuré"
      });
      return { success: false };
    }
    
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<SyncResult>(
        'sync-elevenlabs-history', 
        {
          body: { agentId }
        }
      );
      
      if (error || !data) {
        throw new Error(error?.message || "Erreur lors de la synchronisation");
      }
      
      if (data.success) {
        toast("Synchronisation réussie", {
          description: `${data.summary.success} appels importés sur ${data.summary.total}.`
        });
      } else if (data.error) {
        toast("Erreur de synchronisation", {
          description: data.error.message || "Une erreur s'est produite"
        });
      }
      
      return data;
    } catch (error: any) {
      toast("Erreur", {
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
