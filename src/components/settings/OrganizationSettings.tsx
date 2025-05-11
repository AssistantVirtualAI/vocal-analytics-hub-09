
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
import { DataWrapper } from '@/components/dashboard/DataWrapper';
import { Loader2 } from 'lucide-react';

export function OrganizationSettings() {
  const { 
    currentOrganization, 
    organizations,
    isLoading,
    error,
    loadOrganizations,
    updateOrganization,
    userHasAdminAccessToCurrentOrg,
    users,
    addUser,
    removeUser,
    updateUser,
    deleteOrganization,
    createOrganization,
    changeOrganization
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

  // Create a handler function that converts the newOrg object to individual parameters
  const handleAddOrganization = async (newOrg: { name: string; agentId: string; description: string; }) => {
    await createOrganization(newOrg.name, newOrg.description, newOrg.agentId);
  };

  return (
    <div className="space-y-6">
      <AIHeader 
        title="Paramètres de l'organisation"
        description="Gérez les paramètres et les membres de votre organisation"
      />

      <DataWrapper isLoading={isLoading} error={error} refetch={loadOrganizations}>
        <OrganizationManagementSection
          organizations={organizations}
          currentOrganization={currentOrganization}
          isAdmin={userHasAdminAccessToCurrentOrg}
          onAddOrganization={handleAddOrganization}
          onUpdateOrganization={updateOrganization}
          onDeleteOrganization={deleteOrganization}
          onSelectOrganization={changeOrganization}
          error={error}
        />
      </DataWrapper>

      {currentOrganization && (
        <>
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle>Détails de l'organisation</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
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
                  <Label htmlFor="agent-id">ID d'agent ElevenLabs</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="agent-id" 
                      value={agentId} 
                      onChange={(e) => setAgentId(e.target.value)} 
                      disabled={!userHasAdminAccessToCurrentOrg}
                      className="bg-white/60 dark:bg-slate-800/60"
                    />
                  </div>
                </div>
              </CardContent>
              {userHasAdminAccessToCurrentOrg && (
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Enregistrer les modifications
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>

          <OrganizationUserManagementSection 
            currentOrganization={currentOrganization}
            users={users}
            addUserToOrganization={addUser}
            removeUserFromOrganization={removeUser}
            updateUserRole={updateUser}
          />
        </>
      )}
    </div>
  );
}
