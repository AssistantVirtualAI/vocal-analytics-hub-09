
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGenerateSummaryAnthopic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ callId, transcript }: { callId: string; transcript: string }) => {
      if (!transcript) {
        throw new Error("La transcription est requise pour générer un résumé via Anthropic");
      }

      console.log(`Generating Anthropic summary for call ID: ${callId}`);
      
      const { data, error } = await supabase.functions.invoke("generate-summary-anthropic", {
        body: { callId, transcript },
      });

      if (error) {
        console.error("Error generating Anthropic summary:", error);
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
        description: "Un résumé Claude AI a été généré avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la génération du résumé Claude AI: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};
