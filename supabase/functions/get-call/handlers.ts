
import { createErrorResponse, createSuccessResponse, reportApiMetrics } from "../_shared/index.ts";
import { createServiceClient } from "../_shared/agent-resolver.ts";
import { CallRequest, CallResponse } from "./models.ts";
import { retrieveCall } from "./service.ts";

/**
 * Gère la requête pour obtenir les détails d'un appel
 */
export async function handleGetCall(req: Request): Promise<Response> {
  const startTime = Date.now();
  let callId: string;

  try {
    // Extraire l'ID de l'appel de la requête
    const { callId: requestCallId } = await req.json() as CallRequest;
    callId = requestCallId;

    if (!callId) {
      await reportApiMetrics("get-call", startTime, 400, "Missing call ID");
      return createErrorResponse({
        status: 400,
        message: 'ID d\'appel requis',
        code: 'MISSING_PARAMETER'
      });
    }

    const supabase = createServiceClient();
    const call = await retrieveCall(supabase, callId);

    if (!call) {
      await reportApiMetrics("get-call", startTime, 404, "Call not found");
      return createErrorResponse({
        status: 404,
        message: 'Appel non trouvé',
        code: 'NOT_FOUND'
      });
    }

    // Signaler le succès de l'appel API
    await reportApiMetrics("get-call", startTime, 200);

    return createSuccessResponse(call);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in get-call handler:', error);
    
    await reportApiMetrics("get-call", startTime, 500, errorMessage);
    
    return createErrorResponse({
      status: 500,
      message: 'Erreur lors de la récupération des détails de l\'appel',
      code: 'SERVER_ERROR',
      details: errorMessage
    });
  }
}
