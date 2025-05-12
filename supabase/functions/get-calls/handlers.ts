
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId, checkUserOrganizationAccess } from "../_shared/agent-resolver-improved.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { CallsQueryParams, CallsResponse, FormattedCall } from "./types.ts";

/**
 * Main handler for get-calls function
 */
export async function handleGetCalls(req: Request): Promise<Response> {
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
      agentId: externalAgentIdFromRequest = '',
      startDate = '', 
      endDate = '',
      orgId = ''
    } = body as CallsQueryParams;

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
    
    // Authenticate the user
    const user = await authenticateUser(req, supabase);
    if (!user) {
      return new Response(
        JSON.stringify({ error: { message: "Authentication required", code: "UNAUTHORIZED" } }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is a super admin
    const isSuperAdmin = await checkSuperAdminStatus(supabase, user.id);
    console.log(`[get-calls MAIN] User ${user.id} is ${isSuperAdmin ? 'a super admin' : 'not a super admin'}`);

    // Process agent ID
    const agentUUIDForQuery = await processAgentId(
      supabase, 
      externalAgentIdFromRequest, 
      user.id, 
      isSuperAdmin
    );
    
    if (externalAgentIdFromRequest && !agentUUIDForQuery) {
      console.warn(`[get-calls MAIN] No agent UUID mapped for externalAgentIdFromRequest '${externalAgentIdFromRequest}'. Returning 200 with empty call list as per design for non-critical missing agent.`);
      return new Response(JSON.stringify({ calls: [], count: 0, message: `No agent found for identifier: ${externalAgentIdFromRequest}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check organization access
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

    // Query calls data
    const { calls, totalCount } = await queryCalls({
      supabase,
      user,
      isSuperAdmin,
      agentUUIDForQuery,
      limit,
      offset,
      sort,
      order,
      search,
      customerId,
      startDate,
      endDate
    });

    return new Response(JSON.stringify({
      calls,
      count: totalCount || calls.length
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
}

/**
 * Authenticate the user from the request
 */
async function authenticateUser(req: Request, supabase: SupabaseClient): Promise<any> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("[get-calls MAIN] No authorization header provided");
    return null;
  }
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    console.error("[get-calls MAIN] Invalid authentication:", userError);
    return null;
  }
  
  return user;
}

/**
 * Check if a user is a super admin
 */
async function checkSuperAdminStatus(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
    
  return !!roleData;
}

/**
 * Process agent ID from request and get internal UUID
 */
async function processAgentId(
  supabase: SupabaseClient, 
  externalAgentId: string, 
  userId: string, 
  isSuperAdmin: boolean
): Promise<string | null> {
  if (!externalAgentId) return null;
  
  console.log(`[get-calls MAIN] externalAgentIdFromRequest is '${externalAgentId}', attempting to get internal UUID.`);
  const agentUUIDForQuery = await getAgentUUIDByExternalId(supabase, externalAgentId);
  console.log(`[get-calls MAIN] Result from getAgentUUIDByExternalId: '${agentUUIDForQuery}'`);

  if (!agentUUIDForQuery) {
    return null;
  }
  
  // Verify user has access to this agent
  if (!isSuperAdmin) {
    const hasAccess = await checkUserOrganizationAccess(supabase, userId, undefined, agentUUIDForQuery);
    if (!hasAccess) {
      console.error(`[get-calls MAIN] User ${userId} does not have access to agent ${agentUUIDForQuery}`);
      return null;
    }
  }
  
  return agentUUIDForQuery;
}

/**
 * Query calls from the database
 */
async function queryCalls({
  supabase,
  user,
  isSuperAdmin,
  agentUUIDForQuery,
  limit,
  offset,
  sort,
  order,
  search,
  customerId,
  startDate,
  endDate
}: {
  supabase: SupabaseClient;
  user: any;
  isSuperAdmin: boolean;
  agentUUIDForQuery: string | null;
  limit: number;
  offset: number;
  sort: string;
  order: string;
  search: string;
  customerId: string;
  startDate: string;
  endDate: string;
}): Promise<{ calls: FormattedCall[], totalCount: number | null }> {
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
          return { calls: [], totalCount: 0 };
        }
      } else {
        // User has no organizations with agents
        console.log(`[get-calls MAIN] User's organizations not found or have no agents`);
        return { calls: [], totalCount: 0 };
      }
    } else {
      // User doesn't belong to any organizations
      console.log(`[get-calls MAIN] User doesn't belong to any organizations`);
      return { calls: [], totalCount: 0 };
    }
  }

  if (search) query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
  
  query = query.order(sort, { ascending: order === 'asc' });
  query = query.range(offset, offset + limit - 1);
  
  console.log("[get-calls MAIN] Executing final query on calls_view.");
  const { data: callsData, error: queryError, count: totalCount } = await query;

  if (queryError) {
    console.error("[get-calls MAIN] Database query error occurred on calls_view:", queryError);
    throw queryError;
  }

  console.log(`[get-calls MAIN] Successfully retrieved ${callsData?.length || 0} calls. Total count: ${totalCount}`);
  
  const formattedCalls = callsData?.map(call => ({
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

  return { calls: formattedCalls, totalCount };
}
