
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: JSX.Element;
}

export function RequireAuth({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export function RequireAdmin({ children }: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function RequireOrgAccess({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkOrganizationAccess() {
      if (!user || !orgSlug) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      try {
        // Check if the user has access to this organization by slug
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', orgSlug)
          .single();

        if (error || !data) {
          console.error('Error checking organization access:', error);
          setHasAccess(false);
          setIsChecking(false);
          return;
        }

        // Check if the user is a member of this organization
        const { data: memberData, error: memberError } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('organization_id', data.id)
          .eq('user_id', user.id)
          .single();

        setHasAccess(!!memberData && !memberError);
      } catch (error) {
        console.error('Error checking organization membership:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkOrganizationAccess();
  }, [user, orgSlug]);

  if (loading || isChecking) {
    return <div className="flex items-center justify-center h-screen">Vérification de l'accès...</div>;
  }

  if (!user) {
    return <Navigate to={`/${orgSlug}/auth`} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}
