
import React from 'react';
import { RequireAuth, RequireAdmin, RequireOrgAccess } from './guards';

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
import OrganizationLanding from '@/pages/OrganizationLanding';
import OrgDashboard from '@/pages/OrgDashboard';
import UserProfile from '@/pages/UserProfile';
import UserSettings from '@/pages/UserSettings';

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
    path: "/profile",
    element: <RequireAuth><UserProfile /></RequireAuth>
  },
  {
    path: "/settings",
    element: <RequireAuth><UserSettings /></RequireAuth>
  },
  // New organization-specific routes
  {
    path: "/:orgSlug",
    element: <OrganizationLanding />
  },
  {
    path: "/:orgSlug/dashboard",
    element: <RequireOrgAccess><OrgDashboard /></RequireOrgAccess>
  },
  {
    path: "*",
    element: <NotFound />
  }
];
