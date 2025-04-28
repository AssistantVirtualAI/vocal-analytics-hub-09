
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
import { Link } from 'react-router-dom';

const menuItems = [
  {
    title: 'Dashboard',
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
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-4">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <Phone size={24} />
            <span className="text-xl font-semibold">VoiceAnalytics</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center">
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
        <div className="px-4 py-2 text-sidebar-foreground/80">
          <p className="text-xs">© 2025 VoiceAnalytics</p>
        </div>
      </SidebarFooter>
      <div className="absolute top-4 right-2">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
