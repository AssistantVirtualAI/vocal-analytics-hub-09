import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Verify user access to the requested agent
 */
export async function verifyUserAccess(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseServiceKey: string,
  agentId: string
) {
  // Skip verification in development mode (unsafe, only for development)
  if (Deno.env.get("ENVIRONMENT") === "development") {
    console.log("[verifyUserAccess] Skipping verification in development mode");
    return { success: true };
  }

  // If no auth header, return 401
  if (!authHeader) {
    return {
      success: false,
      error: {
        message: "Missing authorization header",
        code: "UNAUTHORIZED",
        status: 401
      }
    };
  }

  try {
    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("[verifyUserAccess] Invalid token:", error);
      return {
        success: false,
        error: {
          message: "Invalid token",
          code: "INVALID_TOKEN",
          status: 401
        }
      };
    }
    
    // Check if user is super admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (roleData?.role === "admin") {
      console.log(`[verifyUserAccess] User ${user.id} is a super admin`);
      return { success: true };
    }
    
    // Otherwise check if user has access to the organization with this agent
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", agentId);
    
    if (orgError) {
      console.error("[verifyUserAccess] Error checking organization:", orgError);
      return {
        success: false,
        error: {
          message: "Error checking access rights",
          code: "ACCESS_CHECK_ERROR",
          status: 500
        }
      };
    }
    
    // If no organizations use this agent, allow access
    if (!orgData || orgData.length === 0) {
      console.log(`[verifyUserAccess] No organizations found for agent ${agentId}, allowing access`);
      return { success: true };
    }
    
    // Check if user belongs to any of these organizations
    const orgIds = orgData.map(org => org.id);
    const { data: userOrgData, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .in("organization_id", orgIds);
    
    if (userOrgError) {
      console.error("[verifyUserAccess] Error checking user organizations:", userOrgError);
      return {
        success: false,
        error: {
          message: "Error checking access rights",
          code: "ACCESS_CHECK_ERROR",
          status: 500
        }
      };
    }
    
    if (!userOrgData || userOrgData.length === 0) {
      console.log(`[verifyUserAccess] User ${user.id} does not have access to agent ${agentId}`);
      return {
        success: false,
        error: {
          message: "You don't have access to this agent",
          code: "FORBIDDEN",
          status: 403
        }
      };
    }
    
    console.log(`[verifyUserAccess] User ${user.id} has access to agent ${agentId}`);
    return { success: true };
  } catch (error) {
    console.error("[verifyUserAccess] Error verifying user access:", error);
    return {
      success: false,
      error: {
        message: `Error verifying access: ${error instanceof Error ? error.message : "Unknown error"}`,
        code: "AUTH_ERROR",
        status: 500
      }
    };
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, code: string, status: number) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: { message, code } 
    }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
