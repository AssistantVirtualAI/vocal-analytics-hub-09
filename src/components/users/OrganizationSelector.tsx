
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Organization } from '@/types/organization';

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (orgId: string) => void;
}

export const OrganizationSelector = ({ organizations, selectedOrg, onSelectOrg }: OrganizationSelectorProps) => {
  return (
    <Select value={selectedOrg || undefined} onValueChange={onSelectOrg}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sélectionner une organisation" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {organizations.map(org => (
            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
