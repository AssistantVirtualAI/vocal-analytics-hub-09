
import '@/hooks/use-toast';

declare module '@/hooks/use-toast' {
  export interface ToastProps {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    action?: React.ReactNode;
  }
  
  export function showToast(
    titleOrProps: string | ToastProps,
    props?: Omit<ToastProps, 'title'>
  ): void;
}
