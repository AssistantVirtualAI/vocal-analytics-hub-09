
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/dashboard/Layout';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="container p-4 sm:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-muted-foreground">
              Vous n'avez pas les droits pour accéder à cette page.
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
};
