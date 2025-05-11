
import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "dark";
  intensity?: "low" | "medium" | "high";
  withBorder?: boolean;
  glowEffect?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", intensity = "medium", withBorder = true, glowEffect = false, ...props }, ref) => {
    // Base glass styles
    const glassBase = "backdrop-blur-md relative overflow-hidden";
    
    // Intensity variations
    const intensityMap = {
      low: {
        default: "bg-white/20 dark:bg-slate-900/20",
        highlight: "bg-primary/10 dark:bg-primary/10",
        dark: "bg-slate-900/20 dark:bg-slate-950/20",
      },
      medium: {
        default: "bg-white/40 dark:bg-slate-900/40",
        highlight: "bg-primary/20 dark:bg-primary/20",
        dark: "bg-slate-900/40 dark:bg-slate-950/40",
      },
      high: {
        default: "bg-white/60 dark:bg-slate-900/60",
        highlight: "bg-primary/30 dark:bg-primary/30",
        dark: "bg-slate-900/60 dark:bg-slate-950/60",
      },
    };
    
    // Border variations
    const borderStyles = withBorder 
      ? variant === "highlight"
        ? "border border-primary/30 dark:border-primary/20"
        : "border border-slate-200/30 dark:border-slate-700/30"
      : "";
    
    // Glow effect
    const glowStyles = glowEffect
      ? variant === "highlight" 
        ? "shadow-[0_0_15px_rgba(124,58,237,0.2)] dark:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
        : "shadow-[0_0_15px_rgba(255,255,255,0.1)] dark:shadow-[0_0_15px_rgba(30,41,59,0.3)]"
      : "";
    
    return (
      <div
        ref={ref}
        className={cn(
          glassBase,
          intensityMap[intensity][variant],
          borderStyles,
          glowStyles,
          "rounded-xl",
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
