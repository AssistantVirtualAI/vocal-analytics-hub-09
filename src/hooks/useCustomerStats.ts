
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { AGENT_ID } from "@/config/agent";
import type { CustomerStats } from "@/types";

export const useCustomerStats = (enabled = true) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  // Use organization's agent ID if available, otherwise fall back to the default
  const agentId = currentOrganization?.agentId || AGENT_ID;
  
  return useQuery<CustomerStats[]>({
    queryKey: ["customerStats", agentId],
    queryFn: async () => {
      if (!user) {
        throw new Error("Authentication required");
      }
      
      console.log(`Fetching customer stats for agent: ${agentId}`);
      
      try {
        const { data, error } = await supabase.functions.invoke("get-customer-stats", {
          body: { agentId }
        });

        if (error) {
          console.error("Error fetching customer stats:", error);
          throw error;
        }

        console.log("Customer stats data received:", data);
        
        if (!data || !Array.isArray(data)) {
          return [];
        }

        return data.map((customer: any) => ({
          customerId: customer.customerId || "",
          customerName: customer.customerName || "Unknown Customer",
          totalCalls: customer.totalCalls || 0,
          avgDuration: customer.avgDuration || 0,
          avgSatisfaction: customer.avgSatisfaction || 0,
          lastCallDate: customer.lastCallDate || null
        }));
      } catch (error) {
        console.error("Error in useCustomerStats:", error);
        return []; // Return empty array instead of throwing to prevent page crash
      }
    },
    enabled: !!user && !!agentId && enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};
