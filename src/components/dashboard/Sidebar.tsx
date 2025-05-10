
import { BarChart3, Building, Home, LogOut, Phone, Settings, Shield, Users, Database, CircuitBoard, UserRound } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { useOrganization } from '@/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardSidebar() {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { user, signOut, isAdmin } = useAuth();
  
  const menuItems = [
    {
      title: 'Tableau de bord',
      icon: CircuitBoard,
      url: '/',
    },
    {
      title: 'Appels',
      icon: Phone,
      url: '/calls',
    },
    {
      title: 'Clients',
      icon: Users,
      url: '/customers',
    },
    {
      title: 'Statistiques',
      icon: BarChart3,
      url: '/stats',
    },
    {
      title: 'Organisations',
      icon: Building,
      url: '/organizations',
    }
  ];

  // Add users management for admins
  if (isAdmin) {
    menuItems.push({
      title: 'Gestion des utilisateurs',
      icon: Shield,
      url: '/users',
    });
  }
  
  return (
    <Sidebar className="bg-gradient-to-b from-blue-900 to-indigo-900 border-r border-blue-700/30">
      <SidebarHeader>
        <div className="flex flex-col items-center p-4 space-y-2">
          <div className="relative">
            <img 
              src="/lovable-uploads/3afe405e-fa0b-4618-a5a5-433ff1339c5c.png" 
              alt="Logo" 
              className="h-14 w-auto z-10 relative" 
            />
            <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur-md z-0"></div>
          </div>
          <span className="text-xl font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-100">AI Agent Dashboard</span>
          {currentOrganization && (
            <div className="px-3 py-1 bg-blue-800/50 border border-blue-700/50 backdrop-blur-sm rounded-full text-xs text-blue-100 mt-1 flex items-center">
              <Database className="h-3 w-3 mr-1 text-blue-300" />
              {currentOrganization.name}
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-200/70 font-medium">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center transition-all duration-200 ${
                        location.pathname === item.url 
                          ? 'text-white font-medium bg-blue-700/30 border-l-2 border-blue-400 pl-3' 
                          : 'text-blue-200/80 hover:text-white hover:bg-blue-800/30 hover:border-l-2 hover:border-blue-500/50'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 mr-2 ${
                        location.pathname === item.url 
                          ? 'text-blue-200' 
                          : 'text-blue-300/70'
                      }`} />
                      <span>{item.title}</span>
                      {location.pathname === item.url && (
                        <div className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-300"></div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t border-blue-700/30 bg-blue-900/30 backdrop-blur-sm">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-blue-800/30 rounded-md text-blue-100">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 ring-2 ring-blue-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-lg">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <div className="opacity-70">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 8.5L10.5 4L9.5 3L6 6.5L2.5 3L1.5 4L6 8.5Z" fill="currentColor" />
                    </svg>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <UserRound className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-500 flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarFooter>
      <div className="absolute top-4 right-2">
        <SidebarTrigger className="text-blue-200 hover:text-white" />
      </div>
    </Sidebar>
  );
}
