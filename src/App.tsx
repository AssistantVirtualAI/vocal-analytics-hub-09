
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import Dashboard from '@/pages/Dashboard';
import Calls from '@/pages/Calls';
import CallDetails from '@/pages/CallDetails';
import Stats from '@/pages/Stats';
import Customers from '@/pages/Customers';
import NotFound from '@/pages/NotFound';

import { OrganizationProvider } from './context/OrganizationContext';
import OrganizationSettings from './pages/OrganizationSettings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/calls/:id" element={<CallDetails />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/organizations" element={<OrganizationSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </OrganizationProvider>
    </QueryClientProvider>
  );
}

export default App;
