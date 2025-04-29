
import { Organization } from '@/types/organization';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Check, PenLine, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OrganizationsListProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  onEdit: (org: Organization) => void;
  onDelete: (orgId: string) => void;
  onSelect: (orgId: string) => void;
}

export const OrganizationsList = ({ 
  organizations, 
  currentOrganization, 
  onEdit, 
  onDelete, 
  onSelect 
}: OrganizationsListProps) => {
  return (
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
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(org)}
              >
                <PenLine className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. L'organisation sera définitivement supprimée 
                      ainsi que toutes les données associées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(org.id)}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {currentOrganization?.id !== org.id ? (
              <Button 
                size="sm" 
                onClick={() => onSelect(org.id)}
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
  );
};
