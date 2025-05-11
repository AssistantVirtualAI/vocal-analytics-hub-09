
import { DashboardLayout } from '@/components/dashboard/Layout';
import { OrganizationSettings as OrganizationSettingsComponent } from '@/components/settings/OrganizationSettings';

export default function OrganizationSettings() {
  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <OrganizationSettingsComponent />
      </div>
    </DashboardLayout>
  );
}
