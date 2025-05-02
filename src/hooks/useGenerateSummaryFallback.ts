
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGenerateSummaryFallback = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ callId, transcript }: { callId: string; transcript: string }) => {
      if (!transcript) {
        throw new Error("La transcription est requise pour générer un résumé de secours");
      }

      console.log(`Generating fallback summary for call ID: ${callId}`);
      
      const { data, error } = await supabase.functions.invoke("generate-summary-fallback", {
        body: { callId, transcript },
      });

      if (error) {
        console.error("Error generating fallback summary:", error);
        throw error;
      }

      return data.summary;
    },
    onSuccess: (_, { callId }) => {
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["callAudio", callId] });
      queryClient.invalidateQueries({ queryKey: ["call", callId] });
      toast({
        title: "Résumé généré",
        description: "Un résumé alternatif a été généré avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la génération du résumé alternatif: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};
