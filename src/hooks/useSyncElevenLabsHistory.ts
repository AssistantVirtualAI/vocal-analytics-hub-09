
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
      toast({
        title: "Erreur",
        description: "Aucun ID d'agent ElevenLabs n'est configuré",
        variant: "destructive",
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
        toast({
          title: "Synchronisation réussie",
          description: `${data.summary.success} appels importés sur ${data.summary.total}.`,
        });
      } else if (data.error) {
        toast({
          title: "Erreur de synchronisation",
          description: data.error.message || "Une erreur s'est produite",
          variant: "destructive",
        });
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue s'est produite",
        variant: "destructive",
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
