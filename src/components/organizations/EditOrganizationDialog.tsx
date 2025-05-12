
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Organization } from '@/types/organization';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { OrganizationForm } from '@/components/organizations/settings/OrganizationForm';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateOrganization = async (values: any) => {
    if (!organization) return;
    
    setIsSubmitting(true);
    try {
      // Update slug if name changes
      const updatedOrg: Organization = {
        ...organization,
        name: values.name,
        description: values.description || organization.description,
        agentId: values.agentId,
        slug: values.slug
      };
      
      await onUpdate(updatedOrg);
      onClose();
    } catch (error) {
      console.error("Error updating organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-blue-100/50 dark:border-blue-900/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-ai-violet bg-clip-text text-transparent">
            Modifier l'organisation
          </DialogTitle>
          <DialogDescription>
            Modifiez les détails de <span className="font-medium">{organization.name}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <OrganizationForm 
            onSubmit={handleUpdateOrganization}
            initialData={organization}
            isSubmitting={isSubmitting}
            buttonText="Enregistrer les modifications"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
