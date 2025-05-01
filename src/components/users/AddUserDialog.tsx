
import { useState } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogClose, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddUserDialogProps {
  onAddUser: (email: string) => Promise<void>;
  loading?: boolean;
}

export const AddUserDialog = ({ onAddUser, loading = false }: AddUserDialogProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserEmail.includes('@')) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    setError(null);
    setLocalLoading(true);
    
    try {
      await onAddUser(newUserEmail);
      setNewUserEmail('');
      setAddDialogOpen(false);
    } catch (err: any) {
      // Error is handled by the service via toast, we just keep the dialog open
      console.error("Error in AddUserDialog:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

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
            
            Si l'utilisateur n'existe pas encore, une invitation sera envoyée par Supabase.
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
              onChange={(e) => {
                setNewUserEmail(e.target.value);
                setError(null);
              }}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleAddUser} disabled={isLoading}>
            {isLoading ? 'Ajout en cours...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
