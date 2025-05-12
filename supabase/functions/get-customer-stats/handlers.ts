
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createSuccessResponse, createErrorResponse } from "../_shared/api-utils.ts";
import { getCustomers, getCalls, calculateCustomerStats } from "./service.ts";
import { CustomerStatsRequest, CustomerStats } from "./models.ts";

// Cache simple en mémoire pour démonstration
// En production, utiliser un cache distribué comme Redis
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute de cache

export async function handleGetCustomerStats(req: Request): Promise<Response> {
  const requestStartTime = Date.now();
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
  
  try {
    // Extraire et valider le paramètre agentId
    let agentId = '';
    try {
      const body = await req.json() as CustomerStatsRequest;
      agentId = body.agentId;
      logger.info(`Received agentId: ${agentId}`);
    } catch (error) {
      logger.error('Error parsing request body', error);
      return createErrorResponse({
        status: 400,
        message: "The request body could not be parsed as JSON",
        code: "INVALID_REQUEST"
      });
    }

    // Vérifier le cache pour cet agentId
    const cacheKey = `customer-stats-${agentId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      logger.info(`Cache hit for agentId: ${agentId}`);
      return new Response(JSON.stringify(cachedData.data), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-Cache': 'HIT'
        },
      });
    }

    logger.info(`Cache miss for agentId: ${agentId}, fetching from database`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Récupérer les données des clients
      const customers = await getCustomers(supabase);

      if (!customers || customers.length === 0) {
        logger.info("No customers found in database");
        return createSuccessResponse([]);
      }

      // Récupérer les appels filtrés par agent si applicable
      const calls = await getCalls(supabase, agentId);

      // Si pas d'appels, retourner des statistiques vides
      if (!calls || calls.length === 0) {
        logger.info("No calls found in database, returning empty customer stats");
        const emptyCustomerStats = customers.map(customer => ({
          customerId: customer.id,
          customerName: customer.name,
          totalCalls: 0,
          avgDuration: 0,
          avgSatisfaction: 0,
          lastCallDate: null
        }));
        
        // Stocker dans le cache
        cache.set(cacheKey, { data: emptyCustomerStats, timestamp: Date.now() });
        
        return new Response(JSON.stringify(emptyCustomerStats), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'MISS'
          },
        });
      }

      // Calculer les statistiques des clients
      const customerStats = calculateCustomerStats(customers, calls);
      
      logger.info(`Returning stats for ${customerStats.length} customers`);

      // Stocker dans le cache
      cache.set(cacheKey, { data: customerStats, timestamp: Date.now() });

      const executionTime = Date.now() - requestStartTime;
      
      return new Response(JSON.stringify(customerStats), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'X-Cache': 'MISS',
          'X-Execution-Time': `${executionTime}ms`
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error in get-customer-stats function', error);
      return createErrorResponse({
        status: 500,
        message: "Failed to retrieve customer statistics",
        code: "SERVER_ERROR"
      });
    }
  } catch (unhandledError) {
    const errorMessage = unhandledError instanceof Error ? unhandledError.message : String(unhandledError);
    console.error('Unhandled error in get-customer-stats function:', unhandledError);
    return createErrorResponse({
      status: 500,
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
