
import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from './Sidebar';
import { AIDecoration } from '@/components/ui/ai-decoration';

interface LayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto relative">
          {/* Futuristic AI-themed decorative elements */}
          <AIDecoration 
            variant="circuit" 
            color="primary" 
            size="lg" 
            className="absolute top-0 right-0" 
          />
          <AIDecoration 
            variant="nodes" 
            color="blue" 
            size="lg" 
            className="absolute bottom-0 left-1/4" 
          />
          <AIDecoration 
            variant="waves" 
            color="indigo" 
            size="md" 
            className="absolute top-1/2 left-0" 
          />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
