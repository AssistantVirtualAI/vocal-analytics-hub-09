
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkUserOrganizationAccess } from "../_shared/agent-resolver/index.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";
import { CallsQueryParams } from "./types.ts";
import { authenticateUser, checkSuperAdminStatus, createUnauthorizedResponse, createForbiddenResponse } from "./auth.ts";
import { processAgentId } from "./agent-service.ts";
import { queryCalls } from "./calls-service.ts";
import { createSuccessResponse, createErrorResponse, createEmptyCallsResponse } from "./response-factory.ts";

/**
 * Main handler for get-calls function
 */
export async function handleGetCalls(req: Request): Promise<Response> {
  logInfo("Edge function 'get-calls' called.");

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

    logInfo(`Request parameters: limit=${limit}, offset=${offset}, sort=${sort}, order=${order}, search='${search}', customerId='${customerId}', externalAgentIdFromRequest='${externalAgentIdFromRequest}', startDate='${startDate}', endDate='${endDate}', orgId='${orgId}'`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      logError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
      return createErrorResponse({ message: 'Server configuration error.' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Authenticate the user
    const user = await authenticateUser(req, supabase);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Check if user is a super admin
    const isSuperAdmin = await checkSuperAdminStatus(supabase, user.id);
    logInfo(`User ${user.id} is ${isSuperAdmin ? 'a super admin' : 'not a super admin'}`);

    // Process agent ID
    const agentUUIDForQuery = await processAgentId(
      supabase, 
      externalAgentIdFromRequest, 
      user.id, 
      isSuperAdmin
    );
    
    if (externalAgentIdFromRequest && !agentUUIDForQuery) {
      logInfo(`No agent UUID mapped for externalAgentIdFromRequest '${externalAgentIdFromRequest}'. Returning 200 with empty call list as per design for non-critical missing agent.`);
      return createEmptyCallsResponse(externalAgentIdFromRequest);
    }

    // Check organization access
    if (orgId && !isSuperAdmin) {
      const hasOrgAccess = await checkUserOrganizationAccess(supabase, user.id, orgId);
      if (!hasOrgAccess) {
        logError(`User ${user.id} does not have access to organization ${orgId}`);
        return createForbiddenResponse("You do not have access to this organization");
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

    return createSuccessResponse(calls, totalCount);

  } catch (error) {
    logError(`CATCH BLOCK: Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    return createErrorResponse(error);
  }
}
