
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Check, PenLine, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationSettings() {
  const { organizations, currentOrganization, changeOrganization } = useOrganization();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    agentId: '',
    description: ''
  });
  const { toast } = useToast();

  const handleAddOrganization = () => {
    // In a real app, this would make an API call to add the organization
    toast({
      title: "Fonctionnalité de démonstration",
      description: "Dans une application complète, cette action ajouterait une nouvelle organisation à la base de données.",
    });
    setIsAddDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des organisations</h1>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une organisation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle organisation</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle organisation avec son propre Agent ID ElevenLabs.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nom
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({...newOrg, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agentId" className="text-right">
                    Agent ID
                  </Label>
                  <Input
                    id="agentId"
                    className="col-span-3"
                    value={newOrg.agentId}
                    onChange={(e) => setNewOrg({...newOrg, agentId: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    className="col-span-3"
                    value={newOrg.description}
                    onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" onClick={handleAddOrganization}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className={currentOrganization?.id === org.id ? 'border-primary' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                  <CardDescription className="text-sm">ID: {org.id}</CardDescription>
                </div>
                <Building className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Agent ID:</span> {org.agentId}
                  </div>
                  {org.description && (
                    <div>
                      <span className="font-medium">Description:</span> {org.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Créé le:</span> {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // In a real app, this would open an edit dialog
                    toast({
                      title: "Fonctionnalité de démonstration",
                      description: "Dans une application complète, cette action permettrait de modifier l'organisation.",
                    });
                  }}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                
                {currentOrganization?.id !== org.id ? (
                  <Button 
                    size="sm" 
                    onClick={() => changeOrganization(org.id)}
                  >
                    Sélectionner
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Sélectionnée
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
