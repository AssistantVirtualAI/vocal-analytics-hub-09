
import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StatsError } from '@/components/stats/StatsError';
import { useOrgDashboardStats } from '@/hooks/useOrgDashboardStats';

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const {
    callStats,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh,
    formatDuration
  } = useOrgDashboardStats(orgSlug);

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />

        {hasError ? (
          <StatsError onRetry={handleRefresh} />
        ) : (
          <DashboardStats
            callStats={callStats}
            isLoading={isLoading}
            formatDuration={formatDuration}
          />
        )}
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Tableau de bord de l'organisation: {orgSlug}
          </h2>
          <p>
            Bienvenue sur le tableau de bord spécifique à votre organisation.
            Ce tableau affiche uniquement les données relatives à votre organisation.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
