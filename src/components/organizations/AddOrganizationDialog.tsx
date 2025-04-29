
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

interface NewOrgData {
  name: string;
  agentId: string;
  description: string;
}

interface AddOrganizationDialogProps {
  onAddOrganization: (newOrg: NewOrgData) => Promise<void>;
}

export const AddOrganizationDialog = ({ onAddOrganization }: AddOrganizationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newOrg, setNewOrg] = useState<NewOrgData>({
    name: '',
    agentId: '',
    description: ''
  });

  const handleAddOrganization = async () => {
    await onAddOrganization(newOrg);
    setIsOpen(false);
    setNewOrg({ name: '', agentId: '', description: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              required
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
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              className="col-span-3"
              value={newOrg.description}
              onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button 
            type="submit" 
            onClick={handleAddOrganization} 
            disabled={!newOrg.name || !newOrg.agentId}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
