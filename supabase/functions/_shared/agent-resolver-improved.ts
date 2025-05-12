
// This file now just re-exports from the refactored modules
// to maintain backward compatibility with existing code
export { 
  getAgentUUIDByExternalId,
  checkUserOrganizationAccess,
  createAgentResolver
} from "./agent-resolver/index.ts";
