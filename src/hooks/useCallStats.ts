
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallStats, Call } from "@/types";

const calculateStats = (calls: Call[]): CallStats => {
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
  const totalSatisfaction = calls.reduce((sum, call) => sum + (call.satisfactionScore || 0), 0);

  // Group calls by date
  const callsPerDay = calls.reduce((acc: { [key: string]: number }, call) => {
    const date = new Date(call.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCalls,
    avgDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
    avgSatisfaction: totalCalls > 0 ? totalSatisfaction / totalCalls : 0,
    callsPerDay,
  };
};

export const useCallStats = () => {
  return useQuery({
    queryKey: ["callStats"],
    queryFn: async () => {
      const { data: calls, error } = await supabase
        .from("calls_view")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const formattedCalls = calls.map(call => ({
        id: call.id,
        customerId: call.customer_id,
        customerName: call.customer_name,
        agentId: call.agent_id,
        agentName: call.agent_name,
        date: call.date,
        duration: call.duration,
        audioUrl: call.audio_url,
        summary: call.summary || "",
        transcript: call.transcript,
        satisfactionScore: call.satisfaction_score || 0,
        tags: call.tags || [],
      }));

      return calculateStats(formattedCalls);
    },
  });
};
