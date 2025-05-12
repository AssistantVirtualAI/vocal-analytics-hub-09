import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId, checkUserOrganizationAccess } from "../_shared/agent-resolver-improved.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[get-calls MAIN] Edge function 'get-calls' called.");

  try {
    const body = await req.json();
    const { 
      limit = 10, 
      offset = 0, 
      sort = 'date', 
      order = 'desc', 
      search = '', 
      customerId = '', 
      agentId: externalAgentIdFromRequest = '', // This is the string ID like 'QNdB45Jpgh06Hr67TzFO'
      startDate = '', 
      endDate = '',
      orgId = '' // Optional organization ID filter
    } = body;

    console.log(`[get-calls MAIN] Request parameters: limit=${limit}, offset=${offset}, sort=${sort}, order=${order}, search='${search}', customerId='${customerId}', externalAgentIdFromRequest='${externalAgentIdFromRequest}', startDate='${startDate}', endDate='${endDate}', orgId='${orgId}'`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[get-calls MAIN] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let agentUUIDForQuery: string | null = null;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[get-calls MAIN] No authorization header provided");
      return new Response(
        JSON.stringify({ error: { message: "Authentication required", code: "UNAUTHORIZED" } }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[get-calls MAIN] Invalid authentication:", userError);
      return new Response(
        JSON.stringify({ error: { message: "Invalid authentication", code: "UNAUTHORIZED" } }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
      
    const isSuperAdmin = !!roleData;
    console.log(`[get-calls MAIN] User ${user.id} is ${isSuperAdmin ? 'a super admin' : 'not a super admin'}`);

    if (externalAgentIdFromRequest) {
      console.log(`[get-calls MAIN] externalAgentIdFromRequest is '${externalAgentIdFromRequest}', attempting to get internal UUID.`);
      agentUUIDForQuery = await getAgentUUIDByExternalId(supabase, externalAgentIdFromRequest);
      console.log(`[get-calls MAIN] Result from getAgentUUIDByExternalId: '${agentUUIDForQuery}'`);

      if (!agentUUIDForQuery) {
        console.warn(`[get-calls MAIN] No agent UUID mapped for externalAgentIdFromRequest '${externalAgentIdFromRequest}'. Returning 200 with empty call list as per design for non-critical missing agent.`);
        return new Response(JSON.stringify({ calls: [], count: 0, message: `No agent found for identifier: ${externalAgentIdFromRequest}` }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Verify user has access to this agent
      if (!isSuperAdmin) {
        const hasAccess = await checkUserOrganizationAccess(supabase, user.id, undefined, agentUUIDForQuery);
        if (!hasAccess) {
          console.error(`[get-calls MAIN] User ${user.id} does not have access to agent ${agentUUIDForQuery}`);
          return new Response(JSON.stringify({ error: { message: "You do not have access to this agent", code: "FORBIDDEN" } }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    if (orgId && !isSuperAdmin) {
      const hasOrgAccess = await checkUserOrganizationAccess(supabase, user.id, orgId);
      if (!hasOrgAccess) {
        console.error(`[get-calls MAIN] User ${user.id} does not have access to organization ${orgId}`);
        return new Response(JSON.stringify({ error: { message: "You do not have access to this organization", code: "FORBIDDEN" } }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let query = supabase.from("calls_view").select("*", { count: "exact" });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (customerId) query = query.eq('customer_id', customerId);
    
    // Apply agent filter if provided
    if (agentUUIDForQuery) {
      console.log(`[get-calls MAIN] Applying filter: query.eq("agent_id", "${agentUUIDForQuery}")`);
      query = query.eq('agent_id', agentUUIDForQuery);
    }
    
    if (!isSuperAdmin) {
      // Get list of organizations the user belongs to
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id);
        
      if (userOrgs && userOrgs.length > 0) {
        const orgIds = userOrgs.map(org => org.organization_id);
        
        // Get list of agent IDs belonging to these organizations
        const { data: orgAgents } = await supabase
          .from('organizations')
          .select('agent_id')
          .in('id', orgIds);
          
        if (orgAgents && orgAgents.length > 0) {
          const agentIds = orgAgents
            .map(org => org.agent_id)
            .filter(Boolean); // Remove any null/undefined values
            
          if (agentIds.length > 0) {
            // If we already have an agent filter, no need to apply this
            if (!agentUUIDForQuery) {
              console.log(`[get-calls MAIN] Restricting to user's organization agents:`, agentIds);
              query = query.in('agent_id', agentIds);
            }
          } else {
            // User has organization access but no agents are set
            console.log(`[get-calls MAIN] User's organizations have no agents configured`);
            return new Response(JSON.stringify({ calls: [], count: 0 }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // User has no organizations with agents
          console.log(`[get-calls MAIN] User's organizations not found or have no agents`);
          return new Response(JSON.stringify({ calls: [], count: 0 }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // User doesn't belong to any organizations
        console.log(`[get-calls MAIN] User doesn't belong to any organizations`);
        return new Response(JSON.stringify({ calls: [], count: 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (search) query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    
    query = query.order(sort, { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);
    
    console.log("[get-calls MAIN] Executing final query on calls_view.");
    const { data: calls, error: queryError, count: totalCount } = await query;

    if (queryError) {
      console.error("[get-calls MAIN] Database query error occurred on calls_view:", queryError);
      throw queryError;
    }

    console.log(`[get-calls MAIN] Successfully retrieved ${calls?.length || 0} calls. Total count: ${totalCount}`);
    
    const formattedCalls = calls?.map(call => ({
      id: call.id,
      customer_id: call.customer_id || null,
      customer_name: call.customer_name || "Client inconnu",
      agent_id: call.agent_id || null, 
      agent_name: call.agent_name || "Agent inconnu",
      date: call.date || new Date().toISOString(),
      duration: call.duration || 0,
      satisfaction_score: call.satisfaction_score || 0,
      audio_url: call.audio_url || "",
      summary: call.summary || "",
      transcript: call.transcript || "",
      tags: call.tags || []
    })) || [];

    return new Response(JSON.stringify({
      calls: formattedCalls,
      count: totalCount || formattedCalls.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[get-calls MAIN] CATCH BLOCK: Unhandled error:", error);
    let errorStatus = 500;
    if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
      errorStatus = error.status;
    }
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred in get-calls main catch block.",
      message: error.message || "An unexpected error occurred in get-calls main catch block."
    }), {
      status: errorStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
