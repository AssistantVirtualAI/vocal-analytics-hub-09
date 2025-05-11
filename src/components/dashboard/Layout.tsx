
import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto relative">
          {/* Decorative elements for futuristic UI */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
