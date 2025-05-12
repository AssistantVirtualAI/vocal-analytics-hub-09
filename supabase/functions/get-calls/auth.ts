
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";

/**
 * Authenticate the user from the request
 * @param req Request object
 * @param supabase Supabase client
 * @returns User object or null if authentication fails
 */
export async function authenticateUser(req: Request, supabase: SupabaseClient): Promise<any> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    logError("No authorization header provided");
    return null;
  }
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    logError(`Invalid authentication: ${userError?.message || "No user found"}`);
    return null;
  }
  
  return user;
}

/**
 * Check if a user is a super admin
 * @param supabase Supabase client
 * @param userId User ID
 * @returns Boolean indicating if user is super admin
 */
export async function checkSuperAdminStatus(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
    
  return !!roleData;
}

/**
 * Create an unauthorized response
 * @returns Response object with 401 status
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: { message: "Authentication required", code: "UNAUTHORIZED" } }),
    {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create a forbidden response
 * @param message Custom message for the error
 * @returns Response object with 403 status
 */
export function createForbiddenResponse(message: string = "You do not have access to this resource"): Response {
  return new Response(
    JSON.stringify({ error: { message, code: "FORBIDDEN" } }),
    {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
