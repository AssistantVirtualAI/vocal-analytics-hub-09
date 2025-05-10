
import { supabase } from "@/integrations/supabase/client";

/**
 * Rapporte les métriques API au moniteur
 * @param functionName Nom de la fonction
 * @param startTime Temps de début d'exécution
 * @param status Code de statut HTTP
 * @param error Message d'erreur optionnel
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

/**
 * Gestionnaire d'erreur standardisé pour le frontend
 * @param error Erreur attrapée
 * @param toast Fonction toast à utiliser pour afficher l'erreur
 * @param defaultMessage Message par défaut si l'erreur n'a pas de message
 */
export function handleApiError(
  error: unknown, 
  toast: (props: { title: string, description: string, variant?: string }) => void,
  defaultMessage: string = "Une erreur inattendue s'est produite"
): void {
  console.error("API Error:", error);
  
  let errorMessage = defaultMessage;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    errorMessage = errorObj.message || errorObj.error || JSON.stringify(error);
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  toast({ 
    title: "Erreur", 
    description: errorMessage,
    variant: "destructive"
  });
}
