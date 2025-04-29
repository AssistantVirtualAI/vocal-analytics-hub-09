
import { useState, useEffect } from 'react';
import { OrganizationInvitation } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationInvitations = (organizationId: string | null) => {
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);

  const fetchPendingInvitations = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      const formattedInvitations: OrganizationInvitation[] = (data || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        organizationId: invite.organization_id,
        status: invite.status as 'pending' | 'accepted' | 'rejected',
        createdAt: invite.created_at
      }));
      
      setPendingInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      
      if (organizationId) {
        await fetchPendingInvitations(organizationId);
      }
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPendingInvitations(organizationId);
    }
  }, [organizationId]);

  return {
    pendingInvitations,
    fetchPendingInvitations,
    cancelInvitation
  };
};
