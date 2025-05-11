
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useOrganization } from '@/context/organization/OrganizationProvider';
import { OrganizationForm } from '@/components/organizations/settings/OrganizationForm';
import { OrganizationManagementSection } from '@/components/organizations/settings/OrganizationManagementSection';
import { OrganizationUserManagementSection } from '@/components/organizations/settings/OrganizationUserManagementSection';
import { AIHeader } from '@/components/dashboard/AIHeader';

export function OrganizationSettings() {
  const { 
    currentOrganization, 
    updateOrganization,
    userHasAdminAccessToCurrentOrg
  } = useOrganization();

  const [name, setName] = useState(currentOrganization?.name || '');
  const [description, setDescription] = useState(currentOrganization?.description || '');
  const [agentId, setAgentId] = useState(currentOrganization?.agentId || '');

  useEffect(() => {
    if (currentOrganization) {
      setName(currentOrganization.name || '');
      setDescription(currentOrganization.description || '');
      setAgentId(currentOrganization.agentId || '');
    }
  }, [currentOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentOrganization) {
      const updatedOrganization = {
        ...currentOrganization,
        name,
        description,
        agentId
      };
      
      await updateOrganization(updatedOrganization);
    }
  };

  return (
    <div className="space-y-6">
      <AIHeader 
        title="Organization Settings"
        description="Manage your organization's settings and members"
      />

      {currentOrganization && (
        <>
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    disabled={!userHasAdminAccessToCurrentOrg}
                    className="bg-white/60 dark:bg-slate-800/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    disabled={!userHasAdminAccessToCurrentOrg}
                    className="bg-white/60 dark:bg-slate-800/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-id">ElevenLabs Agent ID</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="agent-id" 
                      value={agentId} 
                      onChange={(e) => setAgentId(e.target.value)} 
                      disabled={!userHasAdminAccessToCurrentOrg}
                      className="bg-white/60 dark:bg-slate-800/60"
                    />
                    {/* Agent ID help information could be added here */}
                  </div>
                </div>
              </CardContent>
              {userHasAdminAccessToCurrentOrg && (
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>

          <OrganizationUserManagementSection />
        </>
      )}
    </div>
  );
}
