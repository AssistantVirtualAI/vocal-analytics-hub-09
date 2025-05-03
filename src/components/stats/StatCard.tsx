
import { LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  isLoading?: boolean;
}

const trendVariants = cva("text-xs", {
  variants: {
    trend: {
      positive: "text-green-500",
      negative: "text-red-500",
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: {
    trend: "neutral",
  },
});

export function StatCard({ title, value, icon: Icon, trend, className, isLoading = false }: StatCardProps) {
  // Determine trend direction
  const trendDirection = trend ? (trend.value > 0 ? "positive" : trend.value < 0 ? "negative" : "neutral") : "neutral";

  return (
    <div className={cn("p-6 rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>

      <div className="pt-2">
        <div className="text-2xl font-bold">{value}</div>
        
        {trend && !isLoading && (
          <p className={trendVariants({ trend: trendDirection })}>
            {trend.value > 0 && '+'}{trend.value} {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
