
import { useCallback } from 'react';
import { Organization } from '@/types/organization';
import { toast } from 'sonner';
import { 
  createOrganization as createNewOrg,
  updateOrganization as updateOrg,
  deleteOrganization as deleteOrg
} from '@/services/organization';

export const useOrganizationOperations = (loadOrganizations: () => Promise<Organization[]>) => {
  const createOrganization = useCallback(async (
    organization: Omit<Organization, 'id' | 'createdAt'>, 
    isAdmin: boolean, 
    userId?: string
  ) => {
    try {
      const newOrgId = await createNewOrg(organization, isAdmin, userId);
      toast("Organisation créée avec succès.");
      await loadOrganizations();
      return newOrgId;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast("Erreur lors de la création de l'organisation: " + error.message);
      throw error;
    }
  }, [loadOrganizations]);

  const updateOrganization = useCallback(async (organization: Organization) => {
    try {
      await updateOrg(organization);
      toast("Organisation mise à jour avec succès.");
      await loadOrganizations();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast("Erreur lors de la mise à jour de l'organisation: " + error.message);
      throw error;
    }
  }, [loadOrganizations]);

  const deleteOrganization = useCallback(async (organizationId: string) => {
    try {
      await deleteOrg(organizationId);
      toast("Organisation supprimée avec succès.");
      await loadOrganizations();
      return true;
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast("Erreur lors de la suppression de l'organisation: " + error.message);
      throw error;
    }
  }, [loadOrganizations]);

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization
  };
};
