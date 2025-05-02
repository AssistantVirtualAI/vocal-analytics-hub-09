
// We're reexporting toast from sonner
import { toast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      toast(props.title, {
        description: props.description,
        action: props.action,
      });
    },
    toasts: [] // Maintained for compatibility with old toast component
  };
};

export { toast };
