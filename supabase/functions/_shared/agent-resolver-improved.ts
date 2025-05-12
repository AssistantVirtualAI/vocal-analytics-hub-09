
// This file is kept for backwards compatibility
// It re-exports everything from the refactored agent-resolver module
import { 
  getAgentUUIDByExternalId, 
  checkUserOrganizationAccess, 
  createAgentResolver 
} from "./agent-resolver/index.ts";

export {
  getAgentUUIDByExternalId,
  checkUserOrganizationAccess,
  createAgentResolver
};
