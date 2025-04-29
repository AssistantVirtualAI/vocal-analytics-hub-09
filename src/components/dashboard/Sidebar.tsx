
import { BarChart3, Home, Phone, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';

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
];

export function DashboardSidebar() {
  const location = useLocation();
  
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
        <div className="px-4 py-2 text-blue-100">
          <p className="text-xs">© 2025 AI Agent Dashboard</p>
        </div>
      </SidebarFooter>
      <div className="absolute top-4 right-2">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
