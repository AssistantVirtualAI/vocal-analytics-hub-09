
import { Organization } from '@/types/organization';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Check, PenLine, Trash2, Calendar, User } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Card 
          key={org.id} 
          className={`
            relative overflow-hidden transition-all duration-300 hover:shadow-card-hover 
            ${currentOrganization?.id === org.id 
              ? 'border-primary/70 dark:border-primary/70 shadow-card-glow' 
              : 'border-border/40 hover:border-primary/30 dark:border-border/30'
            }
            backdrop-blur-sm bg-white/80 dark:bg-slate-900/80
          `}
        >
          {/* Decorative elements */}
          <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-ai-blue/5 rounded-full blur-lg"></div>
          
          {currentOrganization?.id === org.id && (
            <div className="absolute top-0 right-0">
              <Badge 
                variant="outline" 
                className="m-2 border-primary bg-primary/10 text-primary font-medium"
              >
                Sélectionnée
              </Badge>
            </div>
          )}
          
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1 z-10">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-ai-violet bg-clip-text text-transparent">
                {org.name}
              </CardTitle>
              <CardDescription className="text-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center text-muted-foreground">
                        ID: {org.id.substring(0, 8)}...
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{org.id}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardDescription>
            </div>
            <div className="p-2 rounded-full bg-primary/10 border border-primary/20 z-10">
              <Building className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-ai-blue/10">
                  <User className="h-3.5 w-3.5 text-ai-blue" />
                </span>
                <span className="font-medium">Agent ID:</span> 
                <span className="text-muted-foreground truncate">{org.agentId || 'Non défini'}</span>
              </div>
              {org.description && (
                <div className="px-2 py-2 bg-secondary/50 dark:bg-secondary/20 rounded-md text-sm italic">
                  "{org.description}"
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-ai-green/10">
                  <Calendar className="h-3.5 w-3.5 text-ai-green" />
                </span>
                <span className="font-medium">Créé le:</span> 
                <span className="text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 border-t border-border/30 mt-2">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(org)}
                className="border-blue-200/70 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <PenLine className="h-3.5 w-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
                Modifier
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200/70 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5 text-red-500 dark:text-red-400" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-border/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. L'organisation sera définitivement supprimée 
                      ainsi que toutes les données associées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border border-border/40">Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(org.id)}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
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
                className="bg-gradient-to-r from-primary/90 to-ai-blue/90 hover:from-primary hover:to-ai-blue"
              >
                Sélectionner
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled className="opacity-75">
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Sélectionnée
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
