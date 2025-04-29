
import { BarChart3, Building, Home, LogOut, Phone, Settings, Shield, Users } from 'lucide-react';
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

export function DashboardSidebar() {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { user, signOut, isAdmin } = useAuth();
  
  const menuItems = [
    {
      title: 'Tableau de bord',
      icon: Home,
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
    <Sidebar className="bg-blue-600">
      <SidebarHeader>
        <div className="flex flex-col items-center p-4 space-y-2">
          <img 
            src="/lovable-uploads/3afe405e-fa0b-4618-a5a5-433ff1339c5c.png" 
            alt="Logo" 
            className="h-12 w-auto" 
          />
          <span className="text-xl font-semibold text-white">AI Agent Dashboard</span>
          {currentOrganization && (
            <div className="px-3 py-1 bg-blue-700 rounded-full text-xs text-white mt-1">
              {currentOrganization.name}
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-100">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center ${location.pathname === item.url ? 'text-white font-medium' : 'text-blue-100 hover:text-white'}`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t border-blue-700">
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-blue-800 text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-white">{user.email}</div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-blue-100 hover:text-white hover:bg-blue-700"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
      <div className="absolute top-4 right-2">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
