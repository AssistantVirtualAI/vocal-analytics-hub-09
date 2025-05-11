
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NoOrganizationsMessageProps {
  isAdmin: boolean;
  onCreateOrg?: () => void;
}

export const NoOrganizationsMessage: React.FC<NoOrganizationsMessageProps> = ({ 
  isAdmin,
  onCreateOrg 
}) => {
  const navigate = useNavigate();
  
  const handleCreateOrg = () => {
    if (onCreateOrg) {
      onCreateOrg();
    } else {
      navigate('/settings?tab=organization');
    }
  };
  
  return (
    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
      <CardHeader>
        <div className="flex items-center">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          <CardTitle>Aucune organisation</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          </div>
          
          {isAdmin ? (
            <p className="text-muted-foreground mb-4">
              Vous n'appartenez à aucune organisation. En tant qu'administrateur, vous pouvez en créer une nouvelle.
            </p>
          ) : (
            <p className="text-muted-foreground mb-4">
              Vous n'appartenez à aucune organisation. Veuillez contacter un administrateur pour être ajouté à une organisation existante.
            </p>
          )}
        </div>
      </CardContent>
      
      {isAdmin && (
        <CardFooter className="flex justify-center pb-6">
          <Button 
            onClick={handleCreateOrg}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une organisation
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
