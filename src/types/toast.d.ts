
import '@/hooks/use-toast';

declare module '@/hooks/use-toast' {
  interface ToastProps {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }
  
  export function toast(
    titleOrProps: string | ToastProps,
    props?: Omit<ToastProps, 'title'>
  ): void;
}
