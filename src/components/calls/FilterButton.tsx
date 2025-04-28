
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const FilterButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex">
          <Filter className="mr-2 h-4 w-4" />
          Filtrer
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Tous les appels</DropdownMenuItem>
        <DropdownMenuItem>Appels récents</DropdownMenuItem>
        <DropdownMenuItem>Haute satisfaction</DropdownMenuItem>
        <DropdownMenuItem>Basse satisfaction</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
