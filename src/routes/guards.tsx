
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOrg } from '@/context/OrgContext';

// List of known non-organization routes to exclude from org slug extraction
const NON_ORG_ROUTES = [
  'calls',
  'stats',
  'customers',
  'auth',
  'users',
  'organizations'
];

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
  // Extract orgSlug from the URL pathname instead of useParams
  const location = useLocation();
  const pathSegments = location.pathname.split('/');
  const potentialSlug = pathSegments.length > 1 ? pathSegments[1] : null;
  
  // Only treat it as an org slug if it's not one of our known application routes
  const orgSlug = potentialSlug && !NON_ORG_ROUTES.includes(potentialSlug) ? potentialSlug : null;
  
  const navigate = useNavigate();
  const { currentOrg, loading } = useOrg();
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && !currentOrg && orgSlug) {
      console.log('Organization not found, redirecting to home');
      navigate('/');
    }
  }, [loading, currentOrg, navigate, orgSlug, user, userLoading]);

  if (loading || userLoading) {
    return <LoadingScreen />;
  }

  if (!currentOrg && orgSlug) {
    return null; // This will never render because of the redirect in useEffect
  }

  return <>{children}</>;
};
