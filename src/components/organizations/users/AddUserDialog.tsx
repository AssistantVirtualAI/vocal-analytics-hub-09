
import { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogClose, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface AddUserDialogProps {
  onAddUser: (email: string) => Promise<void>;
}

export const AddUserDialog = ({ onAddUser }: AddUserDialogProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddUser = async () => {
    if (newUserEmail) {
      await onAddUser(newUserEmail);
      setNewUserEmail('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <User className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur à l'organisation</DialogTitle>
          <DialogDescription>
            Entrez l'email de l'utilisateur à ajouter à cette organisation.
            Si l'utilisateur n'est pas encore inscrit, une invitation sera créée.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-4">
            <Label htmlFor="userEmail">Email de l'utilisateur</Label>
            <Input
              id="userEmail"
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
          <Button onClick={handleAddUser}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
