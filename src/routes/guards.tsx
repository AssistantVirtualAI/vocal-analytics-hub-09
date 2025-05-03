
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOrg } from '@/context/OrgContext';

// Renamed from AuthRouteGuard to RequireAuth for consistent naming in routes config
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// Route guard for authentication pages (renamed from AuthRouteGuard)
export const AuthRouteGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// Route guard for admin-only pages
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        navigate('/');
        return;
      }
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// Route guard for organization access
export const RequireOrgAccess = ({ children }: { children: ReactNode }) => {
  // Use simple type annotation for useParams to avoid excessive type instantiation
  const params = useParams<{ orgSlug?: string }>();
  const navigate = useNavigate();
  const { currentOrg, loading } = useOrg();
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && !currentOrg && params.orgSlug) {
      console.log('Organization not found, redirecting to home');
      navigate('/');
    }
  }, [loading, currentOrg, navigate, params.orgSlug, user, userLoading]);

  if (loading || userLoading) {
    return <LoadingScreen />;
  }

  if (!currentOrg && params.orgSlug) {
    return null; // This will never render because of the redirect in useEffect
  }

  return <>{children}</>;
};
