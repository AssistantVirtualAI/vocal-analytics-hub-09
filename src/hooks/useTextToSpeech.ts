
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTextToSpeech = () => {
  return useMutation({
    mutationFn: async ({ text, voiceId }: { text: string; voiceId?: string }) => {
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: JSON.stringify({ text, voiceId }),
      });

      if (error) throw error;

      return data;
    },
  });
};
