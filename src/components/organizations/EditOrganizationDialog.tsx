
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Organization } from '@/types/organization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';

interface EditOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onUpdate: (org: Organization) => Promise<void>;
}

export const EditOrganizationDialog = ({ 
  isOpen, 
  onClose, 
  organization, 
  onUpdate 
}: EditOrganizationDialogProps) => {
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);

  useEffect(() => {
    if (organization) {
      setOrgToEdit({...organization});
    }
  }, [organization]);

  const handleUpdateOrganization = async () => {
    if (orgToEdit) {
      // Regenerate slug if name changes
      if (orgToEdit.name !== organization?.name) {
        const newSlug = orgToEdit.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        orgToEdit.slug = newSlug;
      }
      await onUpdate(orgToEdit);
      onClose();
    }
  };

  if (!orgToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'organisation</DialogTitle>
          <DialogDescription>
            Modifiez les détails de l'organisation
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Nom
            </Label>
            <Input
              id="edit-name"
              className="col-span-3"
              value={orgToEdit.name}
              onChange={(e) => setOrgToEdit({...orgToEdit, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-agentId" className="text-right">
              Agent ID
            </Label>
            <Input
              id="edit-agentId"
              className="col-span-3"
              value={orgToEdit.agentId}
              onChange={(e) => setOrgToEdit({...orgToEdit, agentId: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="edit-description"
              className="col-span-3"
              value={orgToEdit.description || ''}
              onChange={(e) => setOrgToEdit({...orgToEdit, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-slug" className="text-right">
              Slug
            </Label>
            <Input
              id="edit-slug"
              className="col-span-3"
              value={orgToEdit.slug}
              onChange={(e) => setOrgToEdit({...orgToEdit, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleUpdateOrganization}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
