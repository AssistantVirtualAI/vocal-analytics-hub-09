import {
  BarChart2,
  Building2,
  LayoutDashboard,
  Phone,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationSelector } from "@/components/dashboard/OrganizationSelector";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useMobile } from "@/hooks/useMobile";
import { useNavigate, useLocation } from "react-router-dom";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setMobileOpen } = useMobile();
  const { currentOrg } = useOrg();
  const { user } = useAuth();

  // Handle navigation click
  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Check if a path is active
  const isActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  return (
    <nav className="w-full h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <OrganizationSelector />
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        <Button
          variant={isActive(["/", "/dashboard"]) ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick("/")}
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Tableau de bord
        </Button>

        {currentOrg && (
          <Button
            variant={isActive([`/${currentOrg.slug}/dashboard`]) ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleNavClick(`/${currentOrg.slug}/dashboard`)}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {currentOrg.name}
          </Button>
        )}

        <Button
          variant={isActive(["/calls"]) ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick("/calls")}
        >
          <Phone className="h-4 w-4 mr-2" />
          Appels
        </Button>

        <Button
          variant={isActive(["/stats"]) ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick("/stats")}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Statistiques
        </Button>

        <Button
          variant={isActive(["/customers"]) ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick("/customers")}
        >
          <Users className="h-4 w-4 mr-2" />
          Clients
        </Button>
        
        {/* Add the new ElevenLabs configuration link */}
        <Button
          variant={isActive(["/elevenlabs-config"]) ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleNavClick("/elevenlabs-config")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Config ElevenLabs
        </Button>
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavClick("/settings")}
        >
          <User className="h-4 w-4 mr-2" />
          {user?.email ? user.email.split("@")[0] : "Mon compte"}
        </Button>
      </div>
    </nav>
  );
}
