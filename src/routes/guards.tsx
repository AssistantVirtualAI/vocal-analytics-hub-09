import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOrg } from '@/context/OrgContext';

export const AuthRouteGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export const PrivateRouteGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// Fix the problematic part where the deep type instantiation occurs
export const OrgRouteGuard = ({ children }: { children: ReactNode }) => {
  // Use simple type annotation for useParams to avoid excessive type instantiation
  const params = useParams<{ orgSlug?: string }>();
  const navigate = useNavigate();
  const { currentOrg, loading } = useOrg();
  const { user, isLoading: userLoading } = useAuth();

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
