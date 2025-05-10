
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import { OrganizationProvider } from './context/OrganizationContext';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { AppRoutes } from './routes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <OrgProvider>
            <AppRoutes />
            <Toaster richColors />
          </OrgProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
