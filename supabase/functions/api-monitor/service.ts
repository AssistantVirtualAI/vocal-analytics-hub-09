import { ApiRequest, FunctionMetrics } from "./models.ts";

/**
 * Stocke une nouvelle requête API dans le buffer circulaire
 */
export function storeApiRequest(
  apiRequests: ApiRequest[],
  request: ApiRequest,
  maxRequests: number
): void {
  apiRequests.unshift(request);
  
  // Keep only the last maxRequests
  if (apiRequests.length > maxRequests) {
    apiRequests.pop();
  }
}

/**
 * Vérifie si le seuil d'erreurs est dépassé dans la dernière minute
 */
export function checkErrorThreshold(apiRequests: ApiRequest[], threshold: number): boolean {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const recentErrors = apiRequests.filter(req => 
    req.timestamp > oneMinuteAgo && 
    (req.status >= 500 || req.error)
  );
  
  // If error threshold exceeded, trigger an alert
  if (recentErrors.length >= threshold) {
    console.error(`ALERT: ${recentErrors.length} API errors in the last minute!`);
    // In a real system, send an alert via email/SMS/Slack
    return true;
  }
  
  return false;
}

/**
 * Filtre les requêtes en fonction du timeframe spécifié
 */
export function getFilteredRequests(apiRequests: ApiRequest[], timeframe: string): ApiRequest[] {
  let cutoffTime: Date;
  
  switch(timeframe) {
    case '5m':
      cutoffTime = new Date(Date.now() - 5 * 60 * 1000);
      break;
    case '15m':
      cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
      break;
    case '1h':
      cutoffTime = new Date(Date.now() - 60 * 60 * 1000);
      break;
    case '24h':
      cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Default 1h
  }
  
  const cutoffTimeStr = cutoffTime.toISOString();
  return apiRequests.filter(req => req.timestamp > cutoffTimeStr);
}

/**
 * Calcule le percentile 95 des durées
 */
export function calculateP95Duration(requests: ApiRequest[]): number {
  if (requests.length === 0) return 0;
  
  const durations = requests.map(req => req.duration).sort((a, b) => a - b);
  const idx = Math.floor(durations.length * 0.95);
  return durations[idx] || durations[durations.length - 1];
}

/**
 * Groupe les métriques par nom de fonction
 */
export function calculateMetricsByFunction(requests: ApiRequest[]): Record<string, FunctionMetrics> {
  const byFunction: Record<string, FunctionMetrics> = {};
  
  for (const req of requests) {
    if (!byFunction[req.functionName]) {
      byFunction[req.functionName] = {
        totalRequests: 0,
        successRequests: 0,
        clientErrorRequests: 0,
        serverErrorRequests: 0,
        avgDuration: 0
      };
    }
    
    const metrics = byFunction[req.functionName];
    metrics.totalRequests++;
    
    if (req.status >= 200 && req.status < 300) {
      metrics.successRequests++;
    } else if (req.status >= 400 && req.status < 500) {
      metrics.clientErrorRequests++;
    } else if (req.status >= 500) {
      metrics.serverErrorRequests++;
    }
  }
  
  // Calculate average duration for each function
  for (const funcName in byFunction) {
    const metrics = byFunction[funcName];
    const totalDuration = requests
      .filter(req => req.functionName === funcName)
      .reduce((sum, req) => sum + req.duration, 0);
      
    if (metrics.totalRequests > 0) {
      metrics.avgDuration = totalDuration / metrics.totalRequests;
    }
  }
  
  return byFunction;
}
