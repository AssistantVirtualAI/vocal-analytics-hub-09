
import React from 'react';
import { RequireAuth, RequireAdmin } from './guards';

// Page imports
import Dashboard from '@/pages/Dashboard';
import Calls from '@/pages/Calls';
import CallDetails from '@/pages/CallDetails';
import Stats from '@/pages/Stats';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import NotFound from '@/pages/NotFound';
import OrganizationSettings from '@/pages/OrganizationSettings';
import AuthPage from '@/pages/AuthPage';
import UsersManagement from '@/pages/UsersManagement';

// Route configuration
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: "/auth",
    element: <AuthPage />
  },
  {
    path: "/",
    element: <RequireAuth><Dashboard /></RequireAuth>
  },
  {
    path: "/calls",
    element: <RequireAuth><Calls /></RequireAuth>
  },
  {
    path: "/calls/:id",
    element: <RequireAuth><CallDetails /></RequireAuth>
  },
  {
    path: "/stats",
    element: <RequireAuth><Stats /></RequireAuth>
  },
  {
    path: "/customers",
    element: <RequireAuth><Customers /></RequireAuth>
  },
  {
    path: "/customers/:id",
    element: <RequireAuth><CustomerDetails /></RequireAuth>
  },
  {
    path: "/organizations",
    element: <RequireAuth><OrganizationSettings /></RequireAuth>
  },
  {
    path: "/users",
    element: <RequireAdmin><UsersManagement /></RequireAdmin>
  },
  {
    path: "*",
    element: <NotFound />
  }
];
