
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reportApiMetrics } from '@/utils/api-metrics';

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
      toast("Missing Agent ID", {
        description: "Please select an agent first"
      });
      return { success: false, error: "Missing Agent ID" };
    }

    setIsSyncing(true);
    const startTime = Date.now();
    
    try {
      // Sample dummy calls data - in a real app, you would fetch this from ElevenLabs API
      const dummyCalls = [
        {
          id: `call-${Date.now()}-1`,
          date: new Date().toISOString(),
          duration: "0:19",
          customerName: "Test client 1",
          evaluationResult: "Successful"
        },
        {
          id: `call-${Date.now()}-2`,
          date: new Date().toISOString(),
          duration: "0:27",
          customerName: "Test client 2",
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
        await reportApiMetrics("sync-calls-elevenlabs", startTime, 500, error.message);
        throw new Error(error.message || "An error occurred while calling the function");
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || "Failed to synchronize calls";
        console.error("Sync failed:", errorMsg);
        await reportApiMetrics("sync-calls-elevenlabs", startTime, 400, errorMsg);
        throw new Error(errorMsg);
      }

      // Report successful API call
      await reportApiMetrics("sync-calls-elevenlabs", startTime, 200);

      toast("Sync successful", {
        description: `${data.summary?.success || 0} call(s) synchronized`
      });
      
      return data as SyncResult;
    } catch (error: any) {
      console.error("Error syncing calls:", error);
      toast("Sync error", {
        description: error.message || "An error occurred while synchronizing calls"
      });
      return { 
        success: false, 
        error: error.message || "An error occurred while synchronizing calls" 
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
