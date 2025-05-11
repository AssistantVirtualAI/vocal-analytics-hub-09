
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useOrg } from '@/context/OrgContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OrganizationSelector() {
  const { currentOrg, organizations, changeOrganization } = useOrg();
  const [isOpen, setIsOpen] = useState(false);

  const handleOrgChange = (value: string) => {
    changeOrganization(value);
  };

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex items-center justify-between px-2 py-1.5 rounded-md text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span className="font-medium">No organization</span>
        </div>
      </div>
    );
  }
  
  return (
    <Select
      value={currentOrg?.id || ''}
      onValueChange={handleOrgChange}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select organization">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">{currentOrg?.name || 'Select organization'}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
