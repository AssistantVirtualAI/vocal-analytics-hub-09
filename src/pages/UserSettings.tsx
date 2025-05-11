
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSettings } from '@/components/settings/OrganizationSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationsSettings } from '@/components/settings/NotificationsSettings';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, User, Shield, Bell } from 'lucide-react';
import { AIHeader } from '@/components/dashboard/AIHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { AIDecoration } from '@/components/ui/ai-decoration';

export default function UserSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Get the tab from the URL or default to "organization"
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'organization';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/settings?tab=${value}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Futuristic AI-themed decorative elements */}
        <AIDecoration 
          variant="circuit" 
          color="primary" 
          size="lg" 
          className="absolute top-0 right-1/4" 
        />
        <AIDecoration 
          variant="nodes" 
          color="indigo" 
          size="lg" 
          className="absolute bottom-1/3 left-0" 
        />
        <AIDecoration 
          variant="waves" 
          color="blue" 
          size="md" 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2" 
        />
        
        <AIHeader 
          title="Paramètres" 
          description="Personnalisez votre espace et gérez vos organisations" 
          className="mb-6"
        />

        <GlassCard variant="default" withBorder={true} className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-xl mb-6 bg-white/20 backdrop-blur-md border border-slate-200/30 dark:border-slate-700/30 dark:bg-slate-900/20">
              <TabsTrigger value="organization" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-primary">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Organisation</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-primary">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-primary">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-primary">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="border-none p-0 animate-fade-in">
              <OrganizationSettings />
            </TabsContent>

            <TabsContent value="profile" className="border-none p-0 animate-fade-in">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="security" className="border-none p-0 animate-fade-in">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="notifications" className="border-none p-0 animate-fade-in">
              <NotificationsSettings />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
