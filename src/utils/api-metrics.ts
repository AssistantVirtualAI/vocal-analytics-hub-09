
import { supabase } from "@/integrations/supabase/client";

/**
 * Rapporte les métriques API au moniteur
 */
export async function reportApiMetrics(
  functionName: string, 
  startTime: number, 
  status: number, 
  error?: string
): Promise<void> {
  try {
    const duration = Date.now() - startTime;
    await supabase.functions.invoke("api-monitor", {
      body: {
        functionName,
        duration,
        status,
        error,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error("Failed to report API metrics:", e);
    // Don't throw - this is a non-critical operation
  }
}
