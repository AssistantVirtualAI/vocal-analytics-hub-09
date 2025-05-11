
import { lazy } from "react";

// Use lazy loading for all pages to reduce initial bundle size
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const OrgDashboard = lazy(() => import("@/pages/OrgDashboard"));
const Calls = lazy(() => import("@/pages/Calls"));
const CallDetails = lazy(() => import("@/pages/CallDetails"));
const Stats = lazy(() => import("@/pages/Stats"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerDetails = lazy(() => import("@/pages/CustomerDetails"));
const UserSettings = lazy(() => import("@/pages/UserSettings"));
const OrganizationSettings = lazy(() => import("@/pages/OrganizationSettings"));
const OrganizationLanding = lazy(() => import("@/pages/OrganizationLanding"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const UsersManagement = lazy(() => import("@/pages/UsersManagement"));
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
// Add the new ElevenLabs configuration page
const ElevenLabsConfig = lazy(() => import("@/pages/ElevenLabsConfig"));

// Route configuration
export const routes = [
  {
    path: "/",
    element: <Index />,
    requireAuth: true,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    requireAuth: true,
  },
  {
    path: "/:orgSlug/dashboard",
    element: <OrgDashboard />,
    requireAuth: true,
  },
  {
    path: "/calls",
    element: <Calls />,
    requireAuth: true,
  },
  {
    path: "/calls/:callId",
    element: <CallDetails />,
    requireAuth: true,
  },
  {
    path: "/stats",
    element: <Stats />,
    requireAuth: true,
  },
  {
    path: "/customers",
    element: <Customers />,
    requireAuth: true,
  },
  {
    path: "/customers/:customerId",
    element: <CustomerDetails />,
    requireAuth: true,
  },
  {
    path: "/settings",
    element: <UserSettings />,
    requireAuth: true,
  },
  // Add the new route for ElevenLabs configuration
  {
    path: "/elevenlabs-config",
    element: <ElevenLabsConfig />,
    requireAuth: true,
  },
  {
    path: "/organization-settings",
    element: <OrganizationSettings />,
    requireAuth: true,
  },
  {
    path: "/org",
    element: <OrganizationLanding />,
    requireAuth: true,
  },
  {
    path: "/auth",
    element: <AuthPage />,
    requireAuth: false,
  },
  {
    path: "/profile",
    element: <UserProfile />,
    requireAuth: true,
  },
  {
    path: "/users",
    element: <UsersManagement />,
    requireAuth: true,
    requireAdmin: true,
  },
  {
    path: "*",
    element: <NotFound />,
    requireAuth: false,
  },
];
