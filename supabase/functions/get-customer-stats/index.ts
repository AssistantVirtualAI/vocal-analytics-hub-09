
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Structured logger for better monitoring
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

// Simple in-memory cache for demonstration
// In production, use a proper distributed cache like Redis
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

serve(async (req) => {
  const requestStartTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting (in a real system, use Redis or similar for distributed rate limiting)
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  
  try {
    logger.info("Edge function get-customer-stats called", { 
      method: req.method,
      path: new URL(req.url).pathname,
      clientIP 
    });

    // Parse request body to get agentId
    let agentId = '';
    try {
      const body = await req.json();
      agentId = body.agentId;
      logger.info(`Received agentId: ${agentId}`);
    } catch (error) {
      logger.error('Error parsing request body', error);
      return new Response(JSON.stringify({ 
        error: "Invalid request body",
        message: "The request body could not be parsed as JSON"
      }), {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
      });
    }

    // Check cache for this agentId
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
      // Get customers data
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*");

      if (customersError) {
        logger.error("Error fetching customers", customersError);
        throw customersError;
      }

      logger.info(`Retrieved ${customers?.length || 0} customers from database`);

      if (!customers || customers.length === 0) {
        logger.info("No customers found in database");
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          },
        });
      }

      // Get calls data filtered by agent if applicable
      let query = supabase.from("calls_view").select("*");
      
      // Check if agentId matches a UUID pattern before using it in a query
      // This prevents SQL errors when using non-UUID strings with UUID columns
      if (agentId) {
        // Check if agentId is associated with an organization
        const { data: orgCheck } = await supabase
          .from("organizations")
          .select("id")
          .eq("agent_id", agentId)
          .maybeSingle();
        
        if (orgCheck?.id) {
          // If found in organizations, filter by organization_id
          query = query.eq("organization_id", orgCheck.id);
          logger.info(`Found organization with agent_id: ${agentId}, filtering by organization_id: ${orgCheck.id}`);
        } else {
          // Check if this is a real agent UUID in the agents table
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidPattern.test(agentId)) {
            // If it matches UUID pattern, use it directly
            query = query.eq("agent_id", agentId);
            logger.info(`Using agent_id as UUID filter: ${agentId}`);
          } else {
            // For non-UUID ElevenLabs IDs that aren't in organizations, use external_id field
            query = query.eq("agent_external_id", agentId);
            logger.info(`Using agent_external_id filter for non-UUID: ${agentId}`);
          }
        }
      }
      
      const { data: calls, error: callsError } = await query;

      if (callsError) {
        logger.error("Error fetching calls", callsError);
        throw callsError;
      }

      logger.info(`Retrieved ${calls?.length || 0} calls from database`);

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
        
        // Store in cache
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

      // Calculate customer stats
      const customerStats = customers.map(customer => {
        const customerCalls = calls.filter(call => call.customer_id === customer.id);
        const totalCalls = customerCalls.length;
        
        // Calculate averages
        const totalDuration = customerCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
        
        const totalSatisfaction = customerCalls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
        const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
        
        // Find last call date
        const lastCallDate = customerCalls.length > 0 
          ? customerCalls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
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

      // Sort by total calls
      customerStats.sort((a, b) => b.totalCalls - a.totalCalls);
      
      logger.info(`Returning stats for ${customerStats.length} customers`);

      // Store in cache
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
      return new Response(JSON.stringify({ 
        error: errorMessage,
        message: "Failed to retrieve customer statistics" 
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
      });
    }
  } catch (unhandledError) {
    logger.error('Unhandled error in get-customer-stats function', unhandledError);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      message: "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      },
    });
  }
});
