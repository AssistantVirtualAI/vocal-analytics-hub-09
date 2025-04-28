
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface FilterButtonProps {
  onToggle: () => void;
}

export function FilterButton({ onToggle }: FilterButtonProps) {
  return (
    <Button variant="outline" className="w-full sm:w-auto" onClick={onToggle}>
      <Filter className="mr-2 h-4 w-4" />
      <span>Filtres</span>
    </Button>
  );
}
