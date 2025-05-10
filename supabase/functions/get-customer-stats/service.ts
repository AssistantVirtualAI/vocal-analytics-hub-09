
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Customer, Call, CustomerStats } from "./models.ts";

// Structured logger pour la surveillance
const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    console.log(JSON.stringify({ level: "info", message, metadata, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any, metadata?: Record<string, any>) => {
    console.error(JSON.stringify({ 
      level: "error", 
      message, 
      error: error?.toString() || null,
      stack: error?.stack || null,
      metadata,
      timestamp: new Date().toISOString() 
    }));
  }
};

/**
 * Récupère les clients depuis la base de données
 */
export async function getCustomers(supabase: SupabaseClient): Promise<Customer[]> {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*");

  if (error) {
    logger.error("Error fetching customers", error);
    throw error;
  }

  logger.info(`Retrieved ${customers?.length || 0} customers from database`);
  return customers || [];
}

/**
 * Récupère les appels filtrés par agent ou organisation
 */
export async function getCalls(
  supabase: SupabaseClient, 
  agentId: string
): Promise<Call[]> {
  let query = supabase.from("calls_view").select("*");
  
  // Essayer de trouver une organisation associée à cet agent
  if (agentId) {
    const { data: orgCheck } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", agentId)
      .maybeSingle();
    
    if (orgCheck?.id) {
      // Si trouvé dans les organisations, filtrer par organization_id
      query = query.eq("organization_id", orgCheck.id);
      logger.info(`Found organization with agent_id: ${agentId}, filtering by organization_id: ${orgCheck.id}`);
    } else {
      // Vérifier si c'est un UUID d'agent valide
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(agentId)) {
        query = query.eq("agent_id", agentId);
        logger.info(`Using agent_id as UUID filter: ${agentId}`);
      } else {
        query = query.eq("agent_external_id", agentId);
        logger.info(`Using agent_external_id filter for non-UUID: ${agentId}`);
      }
    }
  }
  
  const { data: calls, error } = await query;

  if (error) {
    logger.error("Error fetching calls", error);
    throw error;
  }

  logger.info(`Retrieved ${calls?.length || 0} calls from database`);
  return calls || [];
}

/**
 * Calcule les statistiques des clients en fonction des appels
 */
export function calculateCustomerStats(
  customers: Customer[], 
  calls: Call[]
): CustomerStats[] {
  const customerStats = customers.map(customer => {
    const customerCalls = calls.filter(call => call.customer_id === customer.id);
    const totalCalls = customerCalls.length;
    
    // Calculer les moyennes
    const totalDuration = customerCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    const totalSatisfaction = customerCalls.reduce((sum, call) => 
      sum + (call.satisfaction_score || 0), 0);
    const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
    
    // Trouver la date du dernier appel
    const lastCallDate = customerCalls.length > 0 
      ? customerCalls.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null;
    
    return {
      customerId: customer.id,
      customerName: customer.name,
      totalCalls,
      avgDuration,
      avgSatisfaction,
      lastCallDate
    };
  });

  // Trier par nombre total d'appels
  customerStats.sort((a, b) => b.totalCalls - a.totalCalls);
  
  return customerStats;
}
