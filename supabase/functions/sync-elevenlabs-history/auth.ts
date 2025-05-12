
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createAgentResolver } from "../_shared/agent-resolver-improved.ts";

/**
 * Verifies the authentication token and checks if the user has access to the specified agent
 */
export async function verifyUserAccess(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseServiceKey: string,
  agentId?: string
): Promise<{success: boolean; userId?: string; error?: {message: string; status: number; code: string}}> {
  // Create Supabase admin client for user verification
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check for auth header
  if (!authHeader) {
    console.error("[verifyUserAccess] No authorization header provided");
    return {
      success: false,
      error: {
        message: "Authorization required",
        code: "UNAUTHORIZED",
        status: 401
      }
    };
  }
  
  // Extract JWT token and get user
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  
  if (userError || !user) {
    console.error("[verifyUserAccess] Invalid authentication:", userError);
    return {
      success: false,
      error: {
        message: "Invalid authentication",
        code: "UNAUTHORIZED",
        status: 401
      }
    };
  }
  
  // If no agent ID is specified, allow access
  if (!agentId) {
    return {
      success: true,
      userId: user.id
    };
  }
  
  // Use the agent resolver to check user access to the agent/organization
  const agentResolver = createAgentResolver(supabaseAdmin);
  
  try {
    // Make sure we're using the checkUserOrganizationAccess method from the resolver object
    const hasAccess = await agentResolver.checkUserOrganizationAccess(
      user.id, 
      undefined, // We'll check based on agent instead of org
      agentId
    );

    if (!hasAccess) {
      console.error(`[verifyUserAccess] User ${user.id} does not have access to agent ${agentId}`);
      return {
        success: false,
        error: {
          message: "You do not have access to this agent",
          code: "FORBIDDEN",
          status: 403
        }
      };
    }
    
    return {
      success: true,
      userId: user.id
    };
  } catch (error) {
    console.error(`[verifyUserAccess] Error checking user access:`, error);
    return {
      success: false,
      error: {
        message: "Error verifying user access",
        code: "SERVER_ERROR",
        status: 500
      }
    };
  }
}

/**
 * Creates a standardized error response with CORS headers
 */
export function createErrorResponse(
  message: string, 
  code: string, 
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        code
      }
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
