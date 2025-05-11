
import { useState, useEffect } from 'react';
import { OrganizationInvitation } from '@/types/invitation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useOrganizationInvitations = (organizationId: string | null) => {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchInvitations(organizationId);
    }
  }, [organizationId]);

  const fetchInvitations = async (orgId: string) => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      // Transform the snake_case database fields to camelCase for our OrganizationInvitation type
      const formattedInvitations: OrganizationInvitation[] = (data || []).map(item => ({
        id: item.id,
        email: item.email,
        token: item.token,
        status: item.status as 'pending' | 'accepted' | 'expired',
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        organizationId: item.organization_id
      }));
      
      setInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .update({ status: 'canceled' })
        .eq('id', invitationId);
        
      if (error) throw error;
      
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      toast({
        title: "Success",
        description: "Invitation canceled successfully"
      });
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive"
      });
    }
  };

  return {
    invitations,
    loading,
    setInvitations,
    fetchInvitations,
    pendingInvitations: invitations,
    cancelInvitation
  };
};
