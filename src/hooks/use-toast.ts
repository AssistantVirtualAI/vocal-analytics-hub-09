
// We're reexporting toast from sonner
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      sonnerToast(props.title || "", {
        description: props.description,
        action: props.action,
        className: props.variant === "destructive" ? "bg-destructive text-destructive-foreground" : "",
      });
    },
    toasts: [] // Maintained for compatibility with old toast component
  };
};

// Direct toast function for simpler usage - renamed to avoid conflicts
export const showToast = (titleOrProps: string | ToastProps, props?: Omit<ToastProps, 'title'>) => {
  if (typeof titleOrProps === 'string') {
    sonnerToast(titleOrProps, props);
  } else {
    sonnerToast(titleOrProps.title || "", {
      description: titleOrProps.description,
      action: titleOrProps.action,
      className: titleOrProps.variant === "destructive" ? "bg-destructive text-destructive-foreground" : "",
    });
  }
};
