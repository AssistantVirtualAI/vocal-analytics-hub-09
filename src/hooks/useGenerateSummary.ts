
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGenerateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: JSON.stringify({ callId }),
      });

      if (error) throw error;

      return data;
    },
    onSuccess: (_, callId) => {
      // Invalidate and refetch call details
      queryClient.invalidateQueries({ queryKey: ["call", callId] });
    },
  });
};
