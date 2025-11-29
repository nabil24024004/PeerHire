import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  className 
}: StatCardProps) => {
  return (
    <Card 
      className={cn(
        "p-6 card-hover border-border bg-card animate-fade-in-up",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
