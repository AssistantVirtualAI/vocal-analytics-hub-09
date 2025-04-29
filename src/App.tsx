
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import Dashboard from '@/pages/Dashboard';
import Calls from '@/pages/Calls';
import CallDetails from '@/pages/CallDetails';
import Stats from '@/pages/Stats';
import Customers from '@/pages/Customers';
import NotFound from '@/pages/NotFound';

import { OrganizationProvider } from './context/OrganizationContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import OrganizationSettings from './pages/OrganizationSettings';
import AuthPage from './pages/AuthPage';
import UsersManagement from './pages/UsersManagement';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/calls" element={<RequireAuth><Calls /></RequireAuth>} />
      <Route path="/calls/:id" element={<RequireAuth><CallDetails /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><Stats /></RequireAuth>} />
      <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
      <Route path="/organizations" element={<RequireAuth><OrganizationSettings /></RequireAuth>} />
      <Route path="/users" element={<RequireAdmin><UsersManagement /></RequireAdmin>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <AppRoutes />
          <Toaster />
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
