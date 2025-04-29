
import { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogClose, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

interface AddUserDialogProps {
  onAddUser: (email: string) => Promise<void>;
  loading: boolean;
}

export const AddUserDialog = ({ onAddUser, loading }: AddUserDialogProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddUser = async () => {
    await onAddUser(newUserEmail);
    setNewUserEmail('');
    setAddDialogOpen(false);
  };

  return (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur à l'organisation</DialogTitle>
          <DialogDescription>
            Entrez l'email de l'utilisateur que vous souhaitez ajouter à cette organisation.
            
            Si l'utilisateur n'existe pas encore, une invitation sera envoyée.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="email@exemple.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleAddUser} disabled={loading}>
            {loading ? 'Ajout en cours...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
